import { estaEnModoMemoria, baseDatosEnMemoria, obtenerPool } from '../config/baseDeDatos.js';

/**
 * Servicio de Auditoría Inmutable (RN12, RNF06).
 * Registra eventos sensibles sin posibilidad de modificación ni borrado.
 */
export const auditoriaService = {
    /**
     * Registra un evento de auditoría en la base de datos
     */
    async registrarEvento({ idUsuario, username, ipOrigen, operacion, entidad, idEntidad, resultado, detalles }) {
        const fechaHoraActual = new Date();
        const ip = ipOrigen || '127.0.0.1';

        try {
            if (estaEnModoMemoria()) {
                const nuevoId = baseDatosEnMemoria.contadores.idAuditoria++;
                baseDatosEnMemoria.auditoria.unshift({
                    id_auditoria: nuevoId,
                    id_usuario: idUsuario || null,
                    fecha_hora: fechaHoraActual.toISOString().replace('T', ' ').substring(0, 19),
                    ip_origen: ip,
                    operacion: operacion || 'OPERACION',
                    entidad: entidad || 'SISTEMA',
                    id_entidad: idEntidad ? String(idEntidad) : null,
                    resultado: resultado || 'EXITOSO',
                    detalles: detalles || '',
                });
                return;
            }

            const pool = obtenerPool();
            if (pool) {
                await pool.query(
                    `INSERT INTO auditoria (id_usuario, fecha_hora, ip_origen, operacion, entidad, id_entidad, resultado, detalles)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [idUsuario || null, fechaHoraActual, ip, operacion, entidad, idEntidad ? String(idEntidad) : null, resultado, detalles]
                );
            }
        } catch (error) {
            console.error('⚠️ [Auditoría] Error al asentar traza inmutable:', error.message);
        }
    },

    /**
     * Lista las últimas 50 trazas de auditoría registradas
     */
    async listarRecientes() {
        if (estaEnModoMemoria()) {
            return baseDatosEnMemoria.auditoria.slice(0, 50).map(a => ({
                idAuditoria: a.id_auditoria,
                idUsuario: a.id_usuario,
                fechaHora: a.fecha_hora,
                ipOrigen: a.ip_origen,
                operacion: a.operacion,
                entidad: a.entidad,
                idEntidad: a.id_entidad,
                resultado: a.resultado,
                detalles: a.detalles,
            }));
        }

        const pool = obtenerPool();
        const [filas] = await pool.query(
            `SELECT id_auditoria AS idAuditoria, id_usuario AS idUsuario, fecha_hora AS fechaHora,
                    ip_origen AS ipOrigen, operacion, entidad, id_entidad AS idEntidad,
                    resultado, detalles
             FROM auditoria
             ORDER BY fecha_hora DESC
             LIMIT 50`
        );
        return filas;
    }
};
