import { estaEnModoMemoria, baseDatosEnMemoria, obtenerPool } from '../config/baseDeDatos.js';
import { auditoriaService } from './auditoriaService.js';
import { ReglaNegocioError } from '../middleware/manejadorErrores.js';
import { ESTADOS_GARANTIA } from '../config/reglasNegocio.js';

/**
 * Servicio de Garantías Reales y Personales (CU06 / RF07 / CA10 / P12).
 */
export const garantiaService = {
    /**
     * CA10: Registra la garantía asociada a la solicitud en trámite.
     * Valida tipo, descripción, valor > 0 y calcula la cobertura porcentual.
     */
    async registrarGarantia(datosGarantia, usernameOperador, ipOrigen) {
        const idSolicitud = datosGarantia.idSolicitud;
        const tipo = datosGarantia.tipo || datosGarantia.tipoGarantia;
        const descripcion = datosGarantia.descripcion;
        const valorTasacion = datosGarantia.valorTasacion !== undefined ? datosGarantia.valorTasacion : datosGarantia.valorEstimado;
        const idSol = parseInt(idSolicitud, 10);
        const valor = parseFloat(valorTasacion);

        if (!idSol) throw new ReglaNegocioError('El ID de la solicitud es obligatorio para registrar la garantía (CA10).');
        if (!tipo || !tipo.trim()) throw new ReglaNegocioError('El tipo de garantía es obligatorio (CA10).');
        if (!descripcion || !descripcion.trim()) throw new ReglaNegocioError('La descripción de la garantía es obligatoria (CA10).');
        if (isNaN(valor) || valor <= 0) throw new ReglaNegocioError('El valor de tasación pericial debe ser mayor a cero (CA10).');

        let montoSolicitado = 0;
        let numeroSolicitud = '';

        if (estaEnModoMemoria()) {
            const solicitud = baseDatosEnMemoria.solicitudes.find(s => s.id_solicitud === idSol);
            if (!solicitud) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${idSol}`);
            montoSolicitado = parseFloat(solicitud.monto_solicitado || solicitud.montoSolicitado);
            numeroSolicitud = solicitud.numero_solicitud;

            // Cobertura = (Valor Tasación / Monto Solicitado) * 100
            const cobertura = montoSolicitado > 0 ? Math.round(((valor * 100) / montoSolicitado) * 100) / 100 : 0;

            const nuevoId = baseDatosEnMemoria.contadores.idGarantia++;
            const nuevaGarantia = {
                id_garantia: nuevoId,
                id_solicitud: idSol,
                id_credito: null,
                tipo: tipo.trim(),
                descripcion: descripcion.trim(),
                valor_tasacion: valor,
                cobertura_porcentaje: cobertura,
                estado: ESTADOS_GARANTIA.VIGENTE,
            };

            baseDatosEnMemoria.garantias.push(nuevaGarantia);

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'REGISTRAR_GARANTIA',
                entidad: 'GARANTIA',
                idEntidad: nuevoId,
                resultado: 'EXITOSO',
                detalles: `Garantía tipo: ${tipo} registrada para solicitud ${numeroSolicitud} por valor Bs ${valor} (Cobertura: ${cobertura}%)`,
                ipOrigen: ipOrigen,
            });

            return this.mapearAGarantiaDto(nuevaGarantia);
        }

        const pool = obtenerPool();
        const [solicitudes] = await pool.query('SELECT monto_solicitado, numero_solicitud FROM solicitud_credito WHERE id_solicitud = ?', [idSol]);
        if (solicitudes.length === 0) throw new ReglaNegocioError(`Solicitud no encontrada con ID: ${idSol}`);

        montoSolicitado = parseFloat(solicitudes[0].monto_solicitado);
        numeroSolicitud = solicitudes[0].numero_solicitud;

        const cobertura = montoSolicitado > 0 ? Math.round(((valor * 100) / montoSolicitado) * 100) / 100 : 0;

        const [resultadoInsert] = await pool.query(
            `INSERT INTO garantia (id_solicitud, tipo, descripcion, valor_tasacion, cobertura_porcentaje, estado)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [idSol, tipo.trim(), descripcion.trim(), valor, cobertura, ESTADOS_GARANTIA.VIGENTE]
        );

        const nuevoId = resultadoInsert.insertId;

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'REGISTRAR_GARANTIA',
            entidad: 'GARANTIA',
            idEntidad: nuevoId,
            resultado: 'EXITOSO',
            detalles: `Garantía tipo: ${tipo} registrada para solicitud ${numeroSolicitud} por valor Bs ${valor} (Cobertura: ${cobertura}%)`,
            ipOrigen: ipOrigen,
        });

        return {
            idGarantia: nuevoId,
            idSolicitud: idSol,
            tipo: tipo.trim(),
            descripcion: descripcion.trim(),
            valorTasacion: valor,
            coberturaPorcentaje: cobertura,
            estado: ESTADOS_GARANTIA.VIGENTE,
        };
    },

    async listarPorSolicitud(idSolicitud) {
        const id = parseInt(idSolicitud, 10);
        if (estaEnModoMemoria()) {
            return baseDatosEnMemoria.garantias
                .filter(g => g.id_solicitud === id)
                .map(this.mapearAGarantiaDto);
        }
        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT * FROM garantia WHERE id_solicitud = ?', [id]);
        return filas.map(this.mapearAGarantiaDto);
    },

    async listarPorCredito(idCredito) {
        const id = parseInt(idCredito, 10);
        if (estaEnModoMemoria()) {
            return baseDatosEnMemoria.garantias
                .filter(g => g.id_credito === id)
                .map(this.mapearAGarantiaDto);
        }
        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT * FROM garantia WHERE id_credito = ?', [id]);
        return filas.map(this.mapearAGarantiaDto);
    },

    mapearAGarantiaDto(g) {
        return {
            idGarantia: g.id_garantia,
            idSolicitud: g.id_solicitud,
            idCredito: g.id_credito || undefined,
            tipo: g.tipo,
            descripcion: g.descripcion,
            valorTasacion: parseFloat(g.valor_tasacion),
            coberturaPorcentaje: g.cobertura_porcentaje ? parseFloat(g.cobertura_porcentaje) : 0,
            estado: g.estado,
        };
    }
};
