/**
 * Clase para excepciones de Reglas de Negocio Bancarias (RN).
 * Permite tipificar errores con mensajes claros y trazables.
 */
export class ReglaNegocioError extends Error {
    constructor(mensaje, codigoEstado = 400) {
        super(mensaje);
        this.name = 'ReglaNegocioError';
        this.codigoEstado = codigoEstado;
    }
}

/**
 * Middleware centralizado de gestión de errores HTTP y de reglas de negocio.
 */
export function manejadorCentralErrores(err, req, res, next) {
    const codigoEstado = err.codigoEstado || (err.name === 'UnauthorizedError' ? 401 : 400);
    const mensajeError = err.message || 'Error interno del servidor en la operación bancaria.';

    console.error(`❌ [Error ${codigoEstado}] ${req.method} ${req.originalUrl}:`, mensajeError);

    res.status(codigoEstado).json({
        exito: false,
        error: err.name || 'ErrorOperacion',
        mensaje: mensajeError,
        fechaHora: new Date().toISOString(),
    });
}
