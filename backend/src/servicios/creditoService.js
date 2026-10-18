import { estaEnModoMemoria, baseDatosEnMemoria, obtenerPool } from '../config/baseDeDatos.js';
import { amortizacionService } from './amortizacionService.js';
import { auditoriaService } from './auditoriaService.js';
import { ReglaNegocioError } from '../middleware/manejadorErrores.js';
import { ESTADOS_SOLICITUD, ESTADOS_CREDITO, ESTADOS_CONTRATO, UMBRALES_FINANCIEROS_EVALUACION } from '../config/reglasNegocio.js';

/**
 * Servicio de Decisión, Formalización y Control de Créditos (CU07, CU08, CU09, CU10).
 * RF08, RF09, RF10, RF11.
 * Criterios: CA11, CA12, CA13, CA14, CA15, CA16.
 */
export const creditoService = {
    /**
     * CU07 / RF08: Aprobar crédito.
     * Criterios:
     * - CA11: Solo si la evaluación es FAVORABLE.
     * - CA12: Transaccional: aprueba solicitud, crea crédito, genera contrato y cronograma, vincula garantías.
     * - CA13: Valida límite de atribución (Bs 70.000 para Jefe). Si excede -> bloquear, auditar y no alterar datos.
     */
    async aprobarCredito(idSolicitud, datosAprobacion, usernameOperador, ipOrigen) {
        const id = parseInt(idSolicitud, 10);
        const anioActual = new Date().getFullYear();

        if (estaEnModoMemoria()) {
            const solicitud = baseDatosEnMemoria.solicitudes.find(s => s.id_solicitud === id);
            if (!solicitud) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);

            if (solicitud.estado !== ESTADOS_SOLICITUD.EN_EVALUACION) {
                throw new ReglaNegocioError(`Solo se pueden aprobar solicitudes en estado EN_EVALUACION. Estado actual: ${solicitud.estado}`);
            }

            // CA11: Validación estricta de evaluación previa FAVORABLE
            const evaluacion = baseDatosEnMemoria.evaluaciones.find(e => e.id_solicitud === id);
            if (!evaluacion) {
                throw new ReglaNegocioError('Bloqueo de Aprobación: No existe una evaluación registrada para esta solicitud (CA11).');
            }
            if (evaluacion.resultado !== 'FAVORABLE') {
                throw new ReglaNegocioError(
                    `Bloqueo de Aprobación: La evaluación crediticia tiene dictamen ${evaluacion.resultado}. Solo se permite aprobar solicitudes con evaluación FAVORABLE (CA11).`
                );
            }

            // CA13: Validación de límite de atribución (Bs 70.000 para Jefe de Créditos)
            const usuarioOperador = baseDatosEnMemoria.usuarios.find(u => u.login === usernameOperador);
            const limiteAtribucion = usuarioOperador ? parseFloat(usuarioOperador.limite_atribucion) : UMBRALES_FINANCIEROS_EVALUACION.limiteAtribucionJefeCreditosBs;
            const montoSolicitado = parseFloat(solicitud.monto_solicitado || solicitud.montoSolicitado);

            if (limiteAtribucion > 0 && montoSolicitado > limiteAtribucion) {
                await auditoriaService.registrarEvento({
                    username: usernameOperador,
                    operacion: 'INTENTO_APROBACION_EXCEDE_ATRIBUCION',
                    entidad: 'SOLICITUD_CREDITO',
                    idEntidad: id,
                    resultado: 'BLOQUEADO',
                    detalles: `Intento de aprobación bloqueado: Monto solicitado (Bs ${montoSolicitado}) excede el límite de atribución del Jefe (Bs ${limiteAtribucion}). Requiere derivar a Comité de Créditos (CA13).`,
                    ipOrigen: ipOrigen,
                });
                throw new ReglaNegocioError(
                    `Monto fuera de atribución: El monto solicitado de Bs ${montoSolicitado.toLocaleString()} supera su límite de aprobación de Bs ${limiteAtribucion.toLocaleString()}. Debe derivar el trámite al Comité de Créditos (CA13).`
                );
            }

            // TRANSACCIONAL: Actualizar solicitud a APROBADA
            solicitud.estado = ESTADOS_SOLICITUD.APROBADA;

            // Crear Crédito
            const nuevoIdCredito = baseDatosEnMemoria.contadores.idCredito++;
            const numeroCredito = `CR${anioActual}${String(nuevoIdCredito).padStart(5, '0')}`;
            const plazo = parseInt(solicitud.plazo_meses || solicitud.plazoMeses, 10);
            const tasaInteres = 12.00; // P05 referencia
            const tasaMora = 18.00;

            const nuevoCredito = {
                id_credito: nuevoIdCredito,
                id_solicitud: id,
                numero_credito: numeroCredito,
                monto_aprobado: montoSolicitado,
                tasa_interes: tasaInteres,
                tasa_mora: tasaMora,
                sistema_amortizacion: 'FRANCES',
                plazo_meses: plazo,
                fecha_desembolso: null,
                saldo_capital: montoSolicitado,
                interes_acumulado: 0.00,
                mora_acumulada: 0.00,
                estado: ESTADOS_CREDITO.APROBADO,
            };
            baseDatosEnMemoria.creditos.push(nuevoCredito);

            // Generar Contrato (CU09 / CA15)
            const nuevoIdContrato = baseDatosEnMemoria.contadores.idContrato++;
            const numeroContrato = `CT${anioActual}${String(nuevoIdContrato).padStart(5, '0')}`;
            const nuevoContrato = {
                id_contrato: nuevoIdContrato,
                id_credito: nuevoIdCredito,
                numero_contrato: numeroContrato,
                fecha_firma: null,
                notaria_registro: 'Notaría de Fe Pública (Pendiente)',
                estado: ESTADOS_CONTRATO.PENDIENTE_FIRMA,
            };
            baseDatosEnMemoria.contratos.push(nuevoContrato);

            // Generar Cronograma Francés (CU10 / CA16)
            const cuotasGeneradas = amortizacionService.generarCronogramaFrances(montoSolicitado, plazo, tasaInteres, new Date());
            for (const cuota of cuotasGeneradas) {
                const nuevoIdCuota = baseDatosEnMemoria.contadores.idCuota++;
                baseDatosEnMemoria.cuotas.push({
                    id_cuota: nuevoIdCuota,
                    id_credito: nuevoIdCredito,
                    ...cuota,
                });
            }

            // Vincular garantías al crédito
            baseDatosEnMemoria.garantias
                .filter(g => g.id_solicitud === id)
                .forEach(g => { g.id_credito = nuevoIdCredito; });

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'APROBAR_CREDITO',
                entidad: 'CREDITO',
                idEntidad: nuevoIdCredito,
                resultado: 'EXITOSO',
                detalles: `Crédito ${numeroCredito} aprobado exitosamente para solicitud ${solicitud.numero_solicitud} por Bs ${montoSolicitado}. Contrato ${numeroContrato} y cronograma generados.`,
                ipOrigen: ipOrigen,
            });

            return {
                idCredito: nuevoIdCredito,
                idSolicitud: id,
                numeroCredito: numeroCredito,
                montoAprobado: montoSolicitado,
                tasaInteres: tasaInteres,
                tasaMora: tasaMora,
                sistemaAmortizacion: 'FRANCES',
                plazoMeses: plazo,
                saldoCapital: montoSolicitado,
                estado: ESTADOS_CREDITO.APROBADO,
                numeroContrato: numeroContrato,
                idContrato: nuevoIdContrato,
                cantidadCuotas: cuotasGeneradas.length,
            };
        }

        const pool = obtenerPool();
        const [solicitudes] = await pool.query('SELECT * FROM solicitud_credito WHERE id_solicitud = ?', [id]);
        if (solicitudes.length === 0) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
        const solicitud = solicitudes[0];

        if (solicitud.estado !== ESTADOS_SOLICITUD.EN_EVALUACION) {
            throw new ReglaNegocioError(`Solo se pueden aprobar solicitudes en estado EN_EVALUACION. Estado actual: ${solicitud.estado}`);
        }

        const [evaluaciones] = await pool.query('SELECT * FROM evaluacion_credito WHERE id_solicitud = ?', [id]);
        if (evaluaciones.length === 0) {
            throw new ReglaNegocioError('Bloqueo de Aprobación: No existe una evaluación registrada para esta solicitud (CA11).');
        }
        if (evaluaciones[0].resultado !== 'FAVORABLE') {
            throw new ReglaNegocioError(
                `Bloqueo de Aprobación: La evaluación crediticia tiene dictamen ${evaluaciones[0].resultado}. Solo se permite aprobar solicitudes con evaluación FAVORABLE (CA11).`
            );
        }

        const [usuarios] = await pool.query('SELECT * FROM usuario WHERE login = ?', [usernameOperador]);
        const limiteAtribucion = usuarios.length > 0 ? parseFloat(usuarios[0].limite_atribucion) : UMBRALES_FINANCIEROS_EVALUACION.limiteAtribucionJefeCreditosBs;
        const montoSolicitado = parseFloat(solicitud.monto_solicitado);

        if (limiteAtribucion > 0 && montoSolicitado > limiteAtribucion) {
            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'INTENTO_APROBACION_EXCEDE_ATRIBUCION',
                entidad: 'SOLICITUD_CREDITO',
                idEntidad: id,
                resultado: 'BLOQUEADO',
                detalles: `Intento de aprobación bloqueado: Monto solicitado (Bs ${montoSolicitado}) excede el límite de atribución del Jefe (Bs ${limiteAtribucion}). Requiere derivar a Comité de Créditos (CA13).`,
                ipOrigen: ipOrigen,
            });
            throw new ReglaNegocioError(
                `Monto fuera de atribución: El monto solicitado de Bs ${montoSolicitado.toLocaleString()} supera su límite de aprobación de Bs ${limiteAtribucion.toLocaleString()}. Debe derivar el trámite al Comité de Créditos (CA13).`
            );
        }

        // TRANSACCIÓN MySQL
        const conexionTransaccional = await pool.getConnection();
        try {
            await conexionTransaccional.beginTransaction();

            // 1. Solicitud -> APROBADA
            await conexionTransaccional.query('UPDATE solicitud_credito SET estado = ? WHERE id_solicitud = ?', [ESTADOS_SOLICITUD.APROBADA, id]);

            // 2. Crear Crédito
            const [conteoCr] = await conexionTransaccional.query('SELECT COUNT(*) AS total FROM credito');
            const totalCr = conteoCr[0].total + 1;
            const numeroCredito = `CR${anioActual}${String(totalCr).padStart(5, '0')}`;
            const plazo = parseInt(solicitud.plazo_meses, 10);
            const tasaInteres = 12.00;
            const tasaMora = 18.00;

            const [resCredito] = await conexionTransaccional.query(
                `INSERT INTO credito (id_solicitud, numero_credito, monto_aprobado, tasa_interes, tasa_mora, sistema_amortizacion, plazo_meses, saldo_capital, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, numeroCredito, montoSolicitado, tasaInteres, tasaMora, 'FRANCES', plazo, montoSolicitado, ESTADOS_CREDITO.APROBADO]
            );
            const idCredito = resCredito.insertId;

            // 3. Crear Contrato
            const [conteoCt] = await conexionTransaccional.query('SELECT COUNT(*) AS total FROM contrato');
            const totalCt = conteoCt[0].total + 1;
            const numeroContrato = `CT${anioActual}${String(totalCt).padStart(5, '0')}`;

            const [resContrato] = await conexionTransaccional.query(
                `INSERT INTO contrato (id_credito, numero_contrato, estado) VALUES (?, ?, ?)`,
                [idCredito, numeroContrato, ESTADOS_CONTRATO.PENDIENTE_FIRMA]
            );
            const idContrato = resContrato.insertId;

            // 4. Crear Cuotas
            const cuotas = amortizacionService.generarCronogramaFrances(montoSolicitado, plazo, tasaInteres, new Date());
            for (const c of cuotas) {
                await conexionTransaccional.query(
                    `INSERT INTO cuota (id_credito, numero_cuota, fecha_vencimiento, capital, interes_comp, interes_mora, monto, saldo_pendiente, dias_mora, estado)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [idCredito, c.numeroCuota, c.fechaVencimiento, c.capital, c.interesComp, c.interesMora, c.monto, c.saldoPendiente, c.diasMora, c.estado]
                );
            }

            // 5. Vincular garantías
            await conexionTransaccional.query('UPDATE garantia SET id_credito = ? WHERE id_solicitud = ?', [idCredito, id]);

            await conexionTransaccional.commit();

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'APROBAR_CREDITO',
                entidad: 'CREDITO',
                idEntidad: idCredito,
                resultado: 'EXITOSO',
                detalles: `Crédito ${numeroCredito} aprobado exitosamente para solicitud ${solicitud.numero_solicitud} por Bs ${montoSolicitado}. Contrato ${numeroContrato} y cronograma generados.`,
                ipOrigen: ipOrigen,
            });

            return {
                idCredito: idCredito,
                idSolicitud: id,
                numeroCredito: numeroCredito,
                montoAprobado: montoSolicitado,
                tasaInteres: tasaInteres,
                tasaMora: tasaMora,
                sistemaAmortizacion: 'FRANCES',
                plazoMeses: plazo,
                saldoCapital: montoSolicitado,
                estado: ESTADOS_CREDITO.APROBADO,
                numeroContrato: numeroContrato,
                idContrato: idContrato,
                cantidadCuotas: cuotas.length,
            };
        } catch (error) {
            await conexionTransaccional.rollback();
            throw error;
        } finally {
            conexionTransaccional.release();
        }
    },

    /**
     * CU08 / RF09 / CA14: Rechazar crédito con motivo tipificado obligatorio.
     */
    async rechazarCredito(idSolicitud, datosRechazo, usernameOperador, ipOrigen) {
        const id = parseInt(idSolicitud, 10);
        const motivo = datosRechazo ? datosRechazo.motivo : null;

        if (!motivo || !motivo.trim()) {
            throw new ReglaNegocioError('El motivo de rechazo es obligatorio para formalizar el rechazo (CA14).');
        }

        if (estaEnModoMemoria()) {
            const solicitud = baseDatosEnMemoria.solicitudes.find(s => s.id_solicitud === id);
            if (!solicitud) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);

            solicitud.estado = ESTADOS_SOLICITUD.RECHAZADA;
            solicitud.motivo_rechazo = motivo.trim();

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'RECHAZAR_CREDITO',
                entidad: 'SOLICITUD_CREDITO',
                idEntidad: id,
                resultado: 'EXITOSO',
                detalles: `Solicitud ${solicitud.numero_solicitud} rechazada. Motivo: ${motivo.trim()}`,
                ipOrigen: ipOrigen,
            });

            return {
                idSolicitud: id,
                numeroSolicitud: solicitud.numero_solicitud,
                estado: ESTADOS_SOLICITUD.RECHAZADA,
                motivoRechazo: motivo.trim(),
            };
        }

        const pool = obtenerPool();
        const [solicitudes] = await pool.query('SELECT * FROM solicitud_credito WHERE id_solicitud = ?', [id]);
        if (solicitudes.length === 0) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
        const solicitud = solicitudes[0];

        await pool.query('UPDATE solicitud_credito SET estado = ?, motivo_rechazo = ? WHERE id_solicitud = ?', [ESTADOS_SOLICITUD.RECHAZADA, motivo.trim(), id]);

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'RECHAZAR_CREDITO',
            entidad: 'SOLICITUD_CREDITO',
            idEntidad: id,
            resultado: 'EXITOSO',
            detalles: `Solicitud ${solicitud.numero_solicitud} rechazada. Motivo: ${motivo.trim()}`,
            ipOrigen: ipOrigen,
        });

        return {
            idSolicitud: id,
            numeroSolicitud: solicitud.numero_solicitud,
            estado: ESTADOS_SOLICITUD.RECHAZADA,
            motivoRechazo: motivo.trim(),
        };
    },

    async buscarPorSolicitud(idSolicitud) {
        const id = parseInt(idSolicitud, 10);
        if (estaEnModoMemoria()) {
            const cr = baseDatosEnMemoria.creditos.find(c => c.id_solicitud === id);
            if (!cr) throw new ReglaNegocioError(`No existe crédito formalizado para la solicitud ID: ${id}`);
            const contrato = baseDatosEnMemoria.contratos.find(ct => ct.id_credito === cr.id_credito);
            const totalCuotas = baseDatosEnMemoria.cuotas.filter(cu => cu.id_credito === cr.id_credito).length;

            return {
                idCredito: cr.id_credito,
                idSolicitud: cr.id_solicitud,
                numeroCredito: cr.numero_credito,
                montoAprobado: parseFloat(cr.monto_aprobado),
                tasaInteres: parseFloat(cr.tasa_interes),
                tasaMora: parseFloat(cr.tasa_mora),
                sistemaAmortizacion: cr.sistema_amortizacion,
                plazoMeses: cr.plazo_meses,
                fechaDesembolso: cr.fecha_desembolso || undefined,
                saldoCapital: parseFloat(cr.saldo_capital),
                estado: cr.estado,
                numeroContrato: contrato ? contrato.numero_contrato : undefined,
                idContrato: contrato ? contrato.id_contrato : undefined,
                cantidadCuotas: totalCuotas,
            };
        }

        const pool = obtenerPool();
        const [filas] = await pool.query(
            `SELECT cr.*, ct.numero_contrato, ct.id_contrato,
                    (SELECT COUNT(*) FROM cuota WHERE id_credito = cr.id_credito) AS cantidadCuotas
             FROM credito cr
             LEFT JOIN contrato ct ON cr.id_credito = ct.id_credito
             WHERE cr.id_solicitud = ?`,
            [id]
        );
        if (filas.length === 0) throw new ReglaNegocioError(`No existe crédito formalizado para la solicitud ID: ${id}`);
        const cr = filas[0];

        return {
            idCredito: cr.id_credito,
            idSolicitud: cr.id_solicitud,
            numeroCredito: cr.numero_credito,
            montoAprobado: parseFloat(cr.monto_aprobado),
            tasaInteres: parseFloat(cr.tasa_interes),
            tasaMora: parseFloat(cr.tasa_mora),
            sistemaAmortizacion: cr.sistema_amortizacion,
            plazoMeses: cr.plazo_meses,
            fechaDesembolso: cr.fecha_desembolso ? String(cr.fecha_desembolso).split('T')[0] : undefined,
            saldoCapital: parseFloat(cr.saldo_capital),
            estado: cr.estado,
            numeroContrato: cr.numero_contrato || undefined,
            idContrato: cr.id_contrato || undefined,
            cantidadCuotas: cr.cantidadCuotas || 0,
        };
    },

    async buscarPorId(idCredito) {
        const id = parseInt(idCredito, 10);
        if (estaEnModoMemoria()) {
            const cr = baseDatosEnMemoria.creditos.find(c => c.id_credito === id);
            if (!cr) throw new ReglaNegocioError(`Crédito no encontrado con ID: ${id}`);
            return this.buscarPorSolicitud(cr.id_solicitud);
        }

        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT id_solicitud FROM credito WHERE id_credito = ?', [id]);
        if (filas.length === 0) throw new ReglaNegocioError(`Crédito no encontrado con ID: ${id}`);
        return this.buscarPorSolicitud(filas[0].id_solicitud);
    },

    async listarCronogramaPorCredito(idCredito) {
        const id = parseInt(idCredito, 10);
        if (estaEnModoMemoria()) {
            return baseDatosEnMemoria.cuotas
                .filter(c => c.id_credito === id)
                .sort((a, b) => a.numero_cuota - b.numero_cuota)
                .map(c => ({
                    idCuota: c.id_cuota || c.idCuota,
                    numeroCuota: c.numero_cuota || c.numeroCuota,
                    fechaVencimiento: c.fecha_vencimiento || c.fechaVencimiento,
                    capital: parseFloat(c.capital),
                    interesComp: parseFloat(c.interes_comp !== undefined ? c.interes_comp : c.interesComp),
                    interesMora: parseFloat(c.interes_mora !== undefined ? c.interes_mora : c.interesMora),
                    monto: parseFloat(c.monto),
                    saldoPendiente: parseFloat(c.saldo_pendiente !== undefined ? c.saldo_pendiente : c.saldoPendiente),
                    diasMora: c.dias_mora || c.diasMora || 0,
                    estado: c.estado,
                }));
        }

        const pool = obtenerPool();
        const [filas] = await pool.query(
            `SELECT id_cuota AS idCuota, numero_cuota AS numeroCuota, fecha_vencimiento AS fechaVencimiento,
                    capital, interes_comp AS interesComp, interes_mora AS interesMora,
                    monto, saldo_pendiente AS saldoPendiente, dias_mora AS diasMora, estado
             FROM cuota
             WHERE id_credito = ?
             ORDER BY numero_cuota ASC`,
            [id]
        );
        return filas.map(c => ({
            ...c,
            fechaVencimiento: c.fechaVencimiento instanceof Date ? c.fechaVencimiento.toISOString().split('T')[0] : String(c.fechaVencimiento).split('T')[0],
            capital: parseFloat(c.capital),
            interesComp: parseFloat(c.interesComp),
            interesMora: parseFloat(c.interesMora),
            monto: parseFloat(c.monto),
            saldoPendiente: parseFloat(c.saldoPendiente),
        }));
    },

    async buscarContratoPorCredito(idCredito) {
        const id = parseInt(idCredito, 10);
        if (estaEnModoMemoria()) {
            const ct = baseDatosEnMemoria.contratos.find(c => c.id_credito === id);
            if (!ct) throw new ReglaNegocioError(`No existe contrato formalizado para el crédito ID: ${id}`);
            return {
                idContrato: ct.id_contrato,
                idCredito: ct.id_credito,
                numeroContrato: ct.numero_contrato,
                fechaFirma: ct.fecha_firma || undefined,
                notariaRegistro: ct.notaria_registro || undefined,
                estado: ct.estado,
            };
        }

        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT * FROM contrato WHERE id_credito = ?', [id]);
        if (filas.length === 0) throw new ReglaNegocioError(`No existe contrato formalizado para el crédito ID: ${id}`);
        const ct = filas[0];
        return {
            idContrato: ct.id_contrato,
            idCredito: ct.id_credito,
            numeroContrato: ct.numero_contrato,
            fechaFirma: ct.fecha_firma ? String(ct.fecha_firma).split('T')[0] : undefined,
            notariaRegistro: ct.notaria_registro || undefined,
            estado: ct.estado,
        };
    }
};
