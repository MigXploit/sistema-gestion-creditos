import { estaEnModoMemoria, baseDatosEnMemoria, obtenerPool } from '../config/baseDeDatos.js';
import { LIMITES_POR_PRODUCTO_CREDITICIO, ESTADOS_SOLICITUD } from '../config/reglasNegocio.js';
import { auditoriaService } from './auditoriaService.js';
import { ReglaNegocioError } from '../middleware/manejadorErrores.js';

/**
 * Servicio para Gestión de Solicitudes de Crédito (CU02 / RF03 / P11 / P02).
 * Reglas: RN01, RN02, RN03, RN04, RN12.
 * Criterios: CA04, CA05.
 */
export const solicitudService = {
    /**
     * CU02 / CA04: Registro de solicitud crediticia con validación estricta de límites de producto.
     */
    async registrarSolicitud(datosSolicitud, usernameOperador, ipOrigen) {
        const { ciCliente, montoSolicitado, plazoMeses, tipoCredito, destino, documentacionCompleta } = datosSolicitud;

        if (!ciCliente || !ciCliente.trim()) {
            throw new ReglaNegocioError('El CI del cliente solicitante es obligatorio.');
        }
        const monto = parseFloat(montoSolicitado);
        if (isNaN(monto) || monto <= 0) {
            throw new ReglaNegocioError('El monto solicitado debe ser mayor a cero (CA05).');
        }
        const plazo = parseInt(plazoMeses, 10);
        if (isNaN(plazo) || plazo <= 0) {
            throw new ReglaNegocioError('El plazo en meses debe ser mayor a cero (CA05).');
        }
        if (!tipoCredito || !LIMITES_POR_PRODUCTO_CREDITICIO[tipoCredito]) {
            throw new ReglaNegocioError(`Tipo de crédito inválido o no soportado: ${tipoCredito}`);
        }
        if (!destino || !destino.trim()) {
            throw new ReglaNegocioError('El destino del crédito es obligatorio.');
        }

        // RN04: Validar límites de producto
        const reglaProducto = LIMITES_POR_PRODUCTO_CREDITICIO[tipoCredito];
        if (monto < reglaProducto.montoMinimoBs || monto > reglaProducto.montoMaximoBs) {
            throw new ReglaNegocioError(
                `${reglaProducto.nombre}: El monto debe situarse entre Bs ${reglaProducto.montoMinimoBs.toLocaleString()} y Bs ${reglaProducto.montoMaximoBs.toLocaleString()} (RN04).`
            );
        }
        if (plazo < reglaProducto.plazoMinimoMeses || plazo > reglaProducto.plazoMaximoMeses) {
            throw new ReglaNegocioError(
                `${reglaProducto.nombre}: El plazo debe situarse entre ${reglaProducto.plazoMinimoMeses} y ${reglaProducto.plazoMaximoMeses} meses (RN04).`
            );
        }

        const fechaSolicitudHoy = new Date().toISOString().split('T')[0];
        const anioActual = new Date().getFullYear();

        if (estaEnModoMemoria()) {
            const cliente = baseDatosEnMemoria.clientes.find(c => c.ci === ciCliente.trim());
            if (!cliente) {
                throw new ReglaNegocioError(`No existe un cliente registrado con el CI: ${ciCliente}`);
            }

            const nuevoIdSolicitud = baseDatosEnMemoria.contadores.idSolicitud++;
            const numeroSolicitud = `SOL-${anioActual}-${String(nuevoIdSolicitud).padStart(5, '0')}`;

            const nuevaSolicitud = {
                id_solicitud: nuevoIdSolicitud,
                id_cliente: cliente.id_cliente,
                numero_solicitud: numeroSolicitud,
                fecha_solicitud: fechaSolicitudHoy,
                monto_solicitado: monto,
                plazo_meses: plazo,
                tipo_credito: tipoCredito,
                destino: destino.trim(),
                estado: ESTADOS_SOLICITUD.REGISTRADA,
                motivo_rechazo: null,
                documentacion_completa: Boolean(documentacionCompleta) ? 1 : 0,
            };

            baseDatosEnMemoria.solicitudes.push(nuevaSolicitud);

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'REGISTRAR_SOLICITUD',
                entidad: 'SOLICITUD_CREDITO',
                idEntidad: nuevoIdSolicitud,
                resultado: 'EXITOSO',
                detalles: `Registro de solicitud ${numeroSolicitud} para cliente CI: ${cliente.ci} por Bs ${monto} a ${plazo} meses (${tipoCredito})`,
                ipOrigen: ipOrigen,
            });

            return this.buscarPorId(nuevoIdSolicitud);
        }

        const pool = obtenerPool();
        const [clientes] = await pool.query('SELECT * FROM cliente WHERE ci = ?', [ciCliente.trim()]);
        if (clientes.length === 0) {
            throw new ReglaNegocioError(`No existe un cliente registrado con el CI: ${ciCliente}`);
        }
        const cliente = clientes[0];

        const [conteo] = await pool.query('SELECT COUNT(*) AS total FROM solicitud_credito');
        const total = conteo[0].total + 1;
        const numeroSolicitud = `SOL-${anioActual}-${String(total).padStart(5, '0')}`;

        const [resultadoInsert] = await pool.query(
            `INSERT INTO solicitud_credito (id_cliente, numero_solicitud, fecha_solicitud, monto_solicitado, plazo_meses, tipo_credito, destino, estado, documentacion_completa)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [cliente.id_cliente, numeroSolicitud, fechaSolicitudHoy, monto, plazo, tipoCredito, destino.trim(), ESTADOS_SOLICITUD.REGISTRADA, Boolean(documentacionCompleta) ? 1 : 0]
        );

        const nuevoId = resultadoInsert.insertId;

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'REGISTRAR_SOLICITUD',
            entidad: 'SOLICITUD_CREDITO',
            idEntidad: nuevoId,
            resultado: 'EXITOSO',
            detalles: `Registro de solicitud ${numeroSolicitud} para cliente CI: ${cliente.ci} por Bs ${monto} a ${plazo} meses (${tipoCredito})`,
            ipOrigen: ipOrigen,
        });

        return this.buscarPorId(nuevoId);
    },

    /**
     * RN03: Una solicitud solo pasa a EN_EVALUACION si su documentación obligatoria está completa (CA05).
     */
    async iniciarEvaluacion(idSolicitud, usernameOperador, ipOrigen) {
        const id = parseInt(idSolicitud, 10);

        if (estaEnModoMemoria()) {
            const solicitud = baseDatosEnMemoria.solicitudes.find(s => s.id_solicitud === id);
            if (!solicitud) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);

            if (solicitud.estado !== ESTADOS_SOLICITUD.REGISTRADA) {
                throw new ReglaNegocioError(`Solo se pueden pasar a evaluación solicitudes en estado REGISTRADA. Estado actual: ${solicitud.estado}`);
            }

            if (!solicitud.documentacion_completa) {
                throw new ReglaNegocioError('No se puede iniciar la evaluación: la documentación obligatoria del cliente se encuentra incompleta (RN03 / CA05).');
            }

            solicitud.estado = ESTADOS_SOLICITUD.EN_EVALUACION;

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'INICIAR_EVALUACION',
                entidad: 'SOLICITUD_CREDITO',
                idEntidad: id,
                resultado: 'EXITOSO',
                detalles: `Solicitud ${solicitud.numero_solicitud} pasa a estado EN_EVALUACION`,
                ipOrigen: ipOrigen,
            });

            return this.buscarPorId(id);
        }

        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT * FROM solicitud_credito WHERE id_solicitud = ?', [id]);
        if (filas.length === 0) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
        const solicitud = filas[0];

        if (solicitud.estado !== ESTADOS_SOLICITUD.REGISTRADA) {
            throw new ReglaNegocioError(`Solo se pueden pasar a evaluación solicitudes en estado REGISTRADA. Estado actual: ${solicitud.estado}`);
        }

        if (!solicitud.documentacion_completa) {
            throw new ReglaNegocioError('No se puede iniciar la evaluación: la documentación obligatoria del cliente se encuentra incompleta (RN03 / CA05).');
        }

        await pool.query('UPDATE solicitud_credito SET estado = ? WHERE id_solicitud = ?', [ESTADOS_SOLICITUD.EN_EVALUACION, id]);

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'INICIAR_EVALUACION',
            entidad: 'SOLICITUD_CREDITO',
            idEntidad: id,
            resultado: 'EXITOSO',
            detalles: `Solicitud ${solicitud.numero_solicitud} pasa a estado EN_EVALUACION`,
            ipOrigen: ipOrigen,
        });

        return this.buscarPorId(id);
    },

    /**
     * Derivar solicitud a Gerencia cuando excede límite de atribución (Jefe > Bs 70.000).
     */
    async derivarAGerencia(idSolicitud, datosDerivacion, usernameOperador, ipOrigen) {
        const id = parseInt(idSolicitud, 10);
        const motivo = datosDerivacion?.motivo || 'Monto fuera de atribución del Jefe de Créditos (> Bs 70.000). Se deriva a Gerencia para revisión de dictamen y aprobación colegiada.';

        if (estaEnModoMemoria()) {
            const solicitud = baseDatosEnMemoria.solicitudes.find(s => s.id_solicitud === id);
            if (!solicitud) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
            if (solicitud.estado !== ESTADOS_SOLICITUD.EN_EVALUACION) {
                throw new ReglaNegocioError(`Solo se pueden derivar a Gerencia solicitudes en estado EN_EVALUACION. Estado actual: ${solicitud.estado}`);
            }
            solicitud.estado = ESTADOS_SOLICITUD.DERIVADA_A_GERENCIA;

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'DERIVAR_A_GERENCIA',
                entidad: 'SOLICITUD_CREDITO',
                idEntidad: id,
                resultado: 'EXITOSO',
                detalles: `Solicitud ${solicitud.numero_solicitud} derivada a Gerencia por ${usernameOperador}. Motivo: ${motivo}`,
                ipOrigen: ipOrigen,
            });

            return this.buscarPorId(id);
        }

        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT * FROM solicitud_credito WHERE id_solicitud = ?', [id]);
        if (filas.length === 0) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
        const solicitud = filas[0];

        if (solicitud.estado !== ESTADOS_SOLICITUD.EN_EVALUACION) {
            throw new ReglaNegocioError(`Solo se pueden derivar a Gerencia solicitudes en estado EN_EVALUACION. Estado actual: ${solicitud.estado}`);
        }

        await pool.query('UPDATE solicitud_credito SET estado = ? WHERE id_solicitud = ?', [ESTADOS_SOLICITUD.DERIVADA_A_GERENCIA, id]);

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'DERIVAR_A_GERENCIA',
            entidad: 'SOLICITUD_CREDITO',
            idEntidad: id,
            resultado: 'EXITOSO',
            detalles: `Solicitud ${solicitud.numero_solicitud} derivada a Gerencia por ${usernameOperador}. Motivo: ${motivo}`,
            ipOrigen: ipOrigen,
        });

        return this.buscarPorId(id);
    },

    async listarTodas(filtroEstado) {
        if (estaEnModoMemoria()) {
            let lista = baseDatosEnMemoria.solicitudes;
            if (filtroEstado && filtroEstado !== 'TODOS') {
                lista = lista.filter(s => s.estado === filtroEstado);
            }
            return lista.map(s => this.formatearSolicitudMemoria(s));
        }

        const pool = obtenerPool();
        let querySql = `
            SELECT s.*, c.ci AS ciCliente, c.email AS emailCliente, CONCAT(c.nombres, ' ', c.apellidos) AS nombreCompletoCliente,
                   e.resultado AS resultadoEvaluacion, e.id_evaluacion,
                   cr.id_credito, cr.numero_credito
            FROM solicitud_credito s
            JOIN cliente c ON s.id_cliente = c.id_cliente
            LEFT JOIN evaluacion_credito e ON s.id_solicitud = e.id_solicitud
            LEFT JOIN credito cr ON s.id_solicitud = cr.id_solicitud
        `;
        const params = [];
        if (filtroEstado && filtroEstado !== 'TODOS') {
            querySql += ' WHERE s.estado = ?';
            params.push(filtroEstado);
        }
        querySql += ' ORDER BY s.fecha_solicitud DESC, s.id_solicitud DESC';

        const [filas] = await pool.query(querySql, params);
        return filas.map(this.mapearASolicitudDto);
    },

    async buscarPorId(idSolicitud) {
        const id = parseInt(idSolicitud, 10);
        if (estaEnModoMemoria()) {
            const s = baseDatosEnMemoria.solicitudes.find(item => item.id_solicitud === id);
            if (!s) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
            return this.formatearSolicitudMemoria(s);
        }

        const pool = obtenerPool();
        const [filas] = await pool.query(
            `SELECT s.*, c.ci AS ciCliente, c.email AS emailCliente, CONCAT(c.nombres, ' ', c.apellidos) AS nombreCompletoCliente,
                    e.resultado AS resultadoEvaluacion, e.id_evaluacion,
                    cr.id_credito, cr.numero_credito
             FROM solicitud_credito s
             JOIN cliente c ON s.id_cliente = c.id_cliente
             LEFT JOIN evaluacion_credito e ON s.id_solicitud = e.id_solicitud
             LEFT JOIN credito cr ON s.id_solicitud = cr.id_solicitud
             WHERE s.id_solicitud = ?`,
            [id]
        );
        if (filas.length === 0) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${id}`);
        return this.mapearASolicitudDto(filas[0]);
    },

    formatearSolicitudMemoria(s) {
        const cliente = baseDatosEnMemoria.clientes.find(c => c.id_cliente === s.id_cliente) || {};
        const evaluacion = baseDatosEnMemoria.evaluaciones.find(e => e.id_solicitud === s.id_solicitud);
        const credito = baseDatosEnMemoria.creditos.find(cr => cr.id_solicitud === s.id_solicitud);

        return {
            idSolicitud: s.id_solicitud,
            numeroSolicitud: s.numero_solicitud,
            fechaSolicitud: s.fecha_solicitud,
            idCliente: s.id_cliente,
            ciCliente: cliente.ci || '',
            emailCliente: cliente.email || undefined,
            nombreCompletoCliente: cliente.nombres ? `${cliente.nombres} ${cliente.apellidos}` : '',
            montoSolicitado: parseFloat(s.monto_solicitado || s.montoSolicitado),
            plazoMeses: s.plazo_meses || s.plazoMeses,
            tipoCredito: s.tipo_credito || s.tipoCredito,
            destino: s.destino,
            estado: s.estado,
            motivoRechazo: s.motivo_rechazo || undefined,
            documentacionCompleta: Boolean(s.documentacion_completa),
            tieneEvaluacion: Boolean(evaluacion),
            resultadoEvaluacion: evaluacion ? evaluacion.resultado : undefined,
            idCredito: credito ? credito.id_credito : undefined,
            numeroCredito: credito ? credito.numero_credito : undefined,
        };
    },

    mapearASolicitudDto(fila) {
        return {
            idSolicitud: fila.id_solicitud,
            numeroSolicitud: fila.numero_solicitud,
            fechaSolicitud: fila.fecha_solicitud instanceof Date
                ? fila.fecha_solicitud.toISOString().split('T')[0]
                : String(fila.fecha_solicitud).split('T')[0],
            idCliente: fila.id_cliente,
            ciCliente: fila.ciCliente,
            emailCliente: fila.emailCliente || undefined,
            nombreCompletoCliente: fila.nombreCompletoCliente,
            montoSolicitado: parseFloat(fila.monto_solicitado),
            plazoMeses: fila.plazo_meses,
            tipoCredito: fila.tipo_credito,
            destino: fila.destino,
            estado: fila.estado,
            motivoRechazo: fila.motivo_rechazo || undefined,
            documentacionCompleta: Boolean(fila.documentacion_completa),
            tieneEvaluacion: Boolean(fila.id_evaluacion),
            resultadoEvaluacion: fila.resultadoEvaluacion || undefined,
            idCredito: fila.id_credito || undefined,
            numeroCredito: fila.numero_credito || undefined,
        };
    }
};
