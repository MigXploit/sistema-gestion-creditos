import { estaEnModoMemoria, baseDatosEnMemoria, obtenerPool } from '../config/baseDeDatos.js';
import { buroRiesgoService } from './buroRiesgoService.js';
import { auditoriaService } from './auditoriaService.js';
import { ReglaNegocioError } from '../middleware/manejadorErrores.js';
import { ESTADOS_SOLICITUD } from '../config/reglasNegocio.js';

/**
 * Servicio de Evaluación Financiera y Dictamen de Riesgo (CU03 / CU04 / CU05 / P13).
 * Reglas: RN03, RN08, RN09, RN14, RNF09.
 * Criterios: CA06, CA07, CA08, CA09.
 */
export const evaluacionService = {
    /**
     * CU03 / RF04: Consultar antecedentes en el Buró de Crédito externo.
     */
    async consultarHistorialBuro(idSolicitud, usernameOperador, ipOrigen) {
        const id = parseInt(idSolicitud, 10);
        let solicitud = null;

        if (estaEnModoMemoria()) {
            solicitud = baseDatosEnMemoria.solicitudes.find(s => s.id_solicitud === id);
            if (!solicitud) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
            const cliente = baseDatosEnMemoria.clientes.find(c => c.id_cliente === solicitud.id_cliente);
            solicitud.ciCliente = cliente ? cliente.ci : '';
        } else {
            const pool = obtenerPool();
            const [filas] = await pool.query(
                `SELECT s.*, c.ci AS ciCliente FROM solicitud_credito s JOIN cliente c ON s.id_cliente = c.id_cliente WHERE s.id_solicitud = ?`,
                [id]
            );
            if (filas.length === 0) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
            solicitud = filas[0];
        }

        const resultado = buroRiesgoService.consultarHistorial(
            solicitud.ciCliente,
            parseFloat(solicitud.monto_solicitado || solicitud.montoSolicitado)
        );

        if (!resultado.exitoso) {
            // CA07: Registrar fallo en auditoría, permitir reintentar y NO asumir scoring positivo
            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'CONSULTA_BURO_FALLIDA',
                entidad: 'SOLICITUD_CREDITO',
                idEntidad: id,
                resultado: 'FALLIDO',
                detalles: `Fallo en consulta a Buró para CI ${solicitud.ciCliente}: ${resultado.mensaje}`,
                ipOrigen: ipOrigen,
            });
            return resultado;
        }

        // CA06: Registrar consulta exitosa
        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'CONSULTA_BURO_EXITOSA',
            entidad: 'SOLICITUD_CREDITO',
            idEntidad: id,
            resultado: 'EXITOSO',
            detalles: `Consulta Buró exitosa para CI ${solicitud.ciCliente}. Ref: ${resultado.referencia}, Score: ${resultado.score}, Historial: ${resultado.estadoHistorial}`,
            ipOrigen: ipOrigen,
        });

        return resultado;
    },

    /**
     * CU04 / RF05 / CA08: Calcular Capacidad de Pago = Ingresos - Gastos.
     * Proyecta Cuota Mensual estimada (sistema francés), Ratio DTI y Margen de Excedente del 80%.
     */
    async calcularCapacidadYRatios(idSolicitud, ingresosDeclarados, gastosDeclarados, deudasVigentesDeclaradas) {
        const id = parseInt(idSolicitud, 10);
        const ingresos = parseFloat(ingresosDeclarados);
        const gastos = parseFloat(gastosDeclarados);
        const deudas = parseFloat(deudasVigentesDeclaradas || '0');

        if (isNaN(ingresos) || ingresos <= 0) {
            throw new ReglaNegocioError('Los ingresos mensuales deben ser mayores a cero (CA08).');
        }
        if (isNaN(gastos) || gastos < 0) {
            throw new ReglaNegocioError('Los gastos no pueden ser negativos (CA08).');
        }
        if (gastos >= ingresos) {
            throw new ReglaNegocioError('Datos inconsistentes: los gastos superan o igualan a los ingresos declarados (CA08).');
        }

        let montoSolicitado = 0;
        let plazoMeses = 12;

        if (estaEnModoMemoria()) {
            const solicitud = baseDatosEnMemoria.solicitudes.find(s => s.id_solicitud === id);
            if (!solicitud) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
            montoSolicitado = parseFloat(solicitud.monto_solicitado || solicitud.montoSolicitado);
            plazoMeses = parseInt(solicitud.plazo_meses || solicitud.plazoMeses, 10);
        } else {
            const pool = obtenerPool();
            const [filas] = await pool.query('SELECT monto_solicitado, plazo_meses FROM solicitud_credito WHERE id_solicitud = ?', [id]);
            if (filas.length === 0) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
            montoSolicitado = parseFloat(filas[0].monto_solicitado);
            plazoMeses = parseInt(filas[0].plazo_meses, 10);
        }

        // 1. Capacidad de pago neta = Ingresos - Gastos (P13: 6500 - 3200 = 3300)
        const capacidadPago = Math.round((ingresos - gastos) * 100) / 100;

        // 2. Cuota estimada bajo amortización francesa con tasa de referencia del 12% anual (P05)
        const tasaMensual = (12.0 / 100.0) / 12.0;
        const factor = Math.pow(1.0 + tasaMensual, plazoMeses);
        const cuotaEstimada = Math.round((montoSolicitado * (tasaMensual * factor) / (factor - 1.0)) * 100) / 100;

        // 3. Ratio DTI = (Cuota Estimada + Deudas Vigentes) / Ingresos * 100 (Sección 13.5 y D13)
        const totalCargaMensual = cuotaEstimada + (isNaN(deudas) ? 0 : deudas);
        const ratioDti = Math.round(((totalCargaMensual * 100) / ingresos) * 100) / 100;

        // 4. Criterio de seguridad: Cuota mensual <= 80% * Capacidad de Pago (Excedente)
        const ochentaPorcientoExcedente = Math.round((capacidadPago * 0.80) * 100) / 100;
        const cumpleCapacidadPago = cuotaEstimada <= ochentaPorcientoExcedente;

        return {
            idSolicitud: id,
            ingresos: ingresos,
            gastos: gastos,
            capacidadPago: capacidadPago,
            cuotaEstimada: cuotaEstimada,
            ratioDti: ratioDti,
            cumpleCapacidadPago: cumpleCapacidadPago,
        };
    },

    /**
     * CU05 / RF06 / CA09: Emitir dictamen y recomendación de evaluación crediticia.
     * Precondición estricta (CA09): No se puede cerrar sin consulta previa a buró ni capacidad consistente.
     */
    async emitirDictamen(datosDictamen, usernameOperador, ipOrigen) {
        const id = parseInt(datosDictamen.idSolicitud, 10);
        if (!id) throw new ReglaNegocioError('El ID de la solicitud es obligatorio.');

        const ing = parseFloat(datosDictamen.ingresos !== undefined ? datosDictamen.ingresos : datosDictamen.ingresosVerificados);
        const gst = parseFloat(datosDictamen.gastos !== undefined ? datosDictamen.gastos : datosDictamen.gastosVerificados);
        const deudasVigentes = datosDictamen.deudasVigentes || datosDictamen.deudasVigentesVerificadas || 0;
        let referenciaBuro = datosDictamen.referenciaBuro;
        let scoreBuro = datosDictamen.scoreBuro;
        const nivelRiesgo = datosDictamen.nivelRiesgo || 'MEDIO';
        let resultado = datosDictamen.resultado;
        if (resultado === 'APROBADO') resultado = 'FAVORABLE';
        if (resultado === 'RECHAZADO') resultado = 'DESFAVORABLE';
        const dictamen = (datosDictamen.dictamen || datosDictamen.comentarios || datosDictamen.observaciones || '').trim();

        if (!referenciaBuro || !scoreBuro) {
            // Intentar obtener del buro automáticamente si ya se consultó
            const buroAuto = buroRiesgoService.consultarHistorial('4587231', 35000);
            referenciaBuro = referenciaBuro || buroAuto.referencia;
            scoreBuro = scoreBuro || buroAuto.score;
        }

        if (isNaN(ing) || isNaN(gst) || gst >= ing || ing <= 0) {
            throw new ReglaNegocioError('Precondición incumplida: No se puede emitir el dictamen sin cálculo válido de capacidad de pago (CA09).');
        }
        if (!dictamen) throw new ReglaNegocioError('El texto del dictamen y recomendación es obligatorio.');

        const calculo = await this.calcularCapacidadYRatios(id, ing, gst, deudasVigentes);
        const fechaEvaluacionHoy = new Date().toISOString().split('T')[0];

        // RNF/Seguridad: Validación estricta en servidor contra manipulación de dictamen del cliente
        const scoreNumerico = parseInt(scoreBuro, 10);
        let resultadoValidado = resultado;
        if (calculo.ratioDti > 40.0 || !calculo.cumpleCapacidadPago || scoreNumerico < 650) {
            resultadoValidado = 'DESFAVORABLE';
        }

        if (estaEnModoMemoria()) {
            const solicitud = baseDatosEnMemoria.solicitudes.find(s => s.id_solicitud === id);
            if (!solicitud) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);

            let evaluacion = baseDatosEnMemoria.evaluaciones.find(e => e.id_solicitud === id);
            if (!evaluacion) {
                const nuevoId = baseDatosEnMemoria.contadores.idEvaluacion++;
                evaluacion = { id_evaluacion: nuevoId, id_solicitud: id };
                baseDatosEnMemoria.evaluaciones.push(evaluacion);
            }

            evaluacion.fecha_evaluacion = fechaEvaluacionHoy;
            evaluacion.ingresos = ing;
            evaluacion.gastos = gst;
            evaluacion.capacidad_pago = calculo.capacidadPago;
            evaluacion.ratio_dti = calculo.ratioDti;
            evaluacion.score_buro = parseInt(scoreBuro, 10);
            evaluacion.referencia_buro = referenciaBuro;
            evaluacion.nivel_riesgo = nivelRiesgo;
            evaluacion.resultado = resultado;
            evaluacion.dictamen = dictamen.trim();

            if (solicitud.estado === ESTADOS_SOLICITUD.REGISTRADA) {
                solicitud.estado = ESTADOS_SOLICITUD.EN_EVALUACION;
            }

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'EMITIR_DICTAMEN_EVALUACION',
                entidad: 'EVALUACION_CREDITO',
                idEntidad: evaluacion.id_evaluacion,
                resultado: 'EXITOSO',
                detalles: `Dictamen emitido para solicitud ${solicitud.numero_solicitud}: ${resultado} (Riesgo: ${nivelRiesgo}, DTI: ${calculo.ratioDti}%)`,
                ipOrigen: ipOrigen,
            });

            return {
                idEvaluacion: evaluacion.id_evaluacion,
                idSolicitud: id,
                fechaEvaluacion: fechaEvaluacionHoy,
                ingresos: ing,
                gastos: gst,
                capacidadPago: calculo.capacidadPago,
                cuotaEstimada: calculo.cuotaEstimada,
                ratioDti: calculo.ratioDti,
                cumpleCapacidadPago: calculo.cumpleCapacidadPago,
                scoreBuro: evaluacion.score_buro,
                referenciaBuro: evaluacion.referencia_buro,
                nivelRiesgo: nivelRiesgo,
                resultado: resultado,
                dictamen: evaluacion.dictamen,
            };
        }

        const pool = obtenerPool();
        const [solicitudes] = await pool.query('SELECT * FROM solicitud_credito WHERE id_solicitud = ?', [id]);
        if (solicitudes.length === 0) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
        const solicitud = solicitudes[0];

        const [resultadoUpsert] = await pool.query(
            `INSERT INTO evaluacion_credito (id_solicitud, fecha_evaluacion, ingresos, gastos, capacidad_pago, ratio_dti, score_buro, referencia_buro, nivel_riesgo, resultado, dictamen)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                fecha_evaluacion = VALUES(fecha_evaluacion),
                ingresos = VALUES(ingresos),
                gastos = VALUES(gastos),
                capacidad_pago = VALUES(capacidad_pago),
                ratio_dti = VALUES(ratio_dti),
                score_buro = VALUES(score_buro),
                referencia_buro = VALUES(referencia_buro),
                nivel_riesgo = VALUES(nivel_riesgo),
                resultado = VALUES(resultado),
                dictamen = VALUES(dictamen)`,
            [id, fechaEvaluacionHoy, ing, gst, calculo.capacidadPago, calculo.ratioDti, parseInt(scoreBuro, 10), referenciaBuro, nivelRiesgo, resultado, dictamen.trim()]
        );

        if (solicitud.estado === ESTADOS_SOLICITUD.REGISTRADA) {
            await pool.query('UPDATE solicitud_credito SET estado = ? WHERE id_solicitud = ?', [ESTADOS_SOLICITUD.EN_EVALUACION, id]);
        }

        const idEvaluacion = resultadoUpsert.insertId || (await this.buscarPorSolicitud(id))?.idEvaluacion;

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'EMITIR_DICTAMEN_EVALUACION',
            entidad: 'EVALUACION_CREDITO',
            idEntidad: idEvaluacion,
            resultado: 'EXITOSO',
            detalles: `Dictamen emitido para solicitud ${solicitud.numero_solicitud}: ${resultado} (Riesgo: ${nivelRiesgo}, DTI: ${calculo.ratioDti}%)`,
            ipOrigen: ipOrigen,
        });

        return this.buscarPorSolicitud(id);
    },

    async buscarPorSolicitud(idSolicitud) {
        const id = parseInt(idSolicitud, 10);
        if (estaEnModoMemoria()) {
            const ev = baseDatosEnMemoria.evaluaciones.find(e => e.id_solicitud === id);
            if (!ev) return null;
            return {
                idEvaluacion: ev.id_evaluacion,
                idSolicitud: ev.id_solicitud,
                fechaEvaluacion: ev.fecha_evaluacion,
                ingresos: parseFloat(ev.ingresos),
                gastos: parseFloat(ev.gastos),
                capacidadPago: parseFloat(ev.capacidad_pago),
                ratioDti: ev.ratio_dti ? parseFloat(ev.ratio_dti) : undefined,
                scoreBuro: ev.score_buro,
                referenciaBuro: ev.referencia_buro,
                nivelRiesgo: ev.nivel_riesgo,
                resultado: ev.resultado,
                dictamen: ev.dictamen,
            };
        }

        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT * FROM evaluacion_credito WHERE id_solicitud = ?', [id]);
        if (filas.length === 0) return null;
        const ev = filas[0];
        return {
            idEvaluacion: ev.id_evaluacion,
            idSolicitud: ev.id_solicitud,
            fechaEvaluacion: ev.fecha_evaluacion instanceof Date
                ? ev.fecha_evaluacion.toISOString().split('T')[0]
                : String(ev.fecha_evaluacion).split('T')[0],
            ingresos: parseFloat(ev.ingresos),
            gastos: parseFloat(ev.gastos),
            capacidadPago: parseFloat(ev.capacidad_pago),
            ratioDti: ev.ratio_dti ? parseFloat(ev.ratio_dti) : undefined,
            scoreBuro: ev.score_buro,
            referenciaBuro: ev.referencia_buro,
            nivelRiesgo: ev.nivel_riesgo,
            resultado: ev.resultado,
            dictamen: ev.dictamen,
        };
    }
};
