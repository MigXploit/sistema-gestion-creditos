import jwt from 'jsonwebtoken';
import { configuracionEntorno } from '../config/variablesEntorno.js';
import { ReglaNegocioError } from './manejadorErrores.js';

/**
 * Middleware para validar el token JWT y autenticar la sesión del funcionario bancario.
 * Cumple con RNF01 (Sesión máxima de 15 minutos de inactividad).
 */
export function autenticarTokenJwt(req, res, next) {
    const cabeceraAutorizacion = req.headers['authorization'];
    const token = cabeceraAutorizacion && cabeceraAutorizacion.startsWith('Bearer ')
        ? cabeceraAutorizacion.split(' ')[1]
        : null;

    if (!token) {
        return res.status(401).json({
            exito: false,
            error: 'NoAutenticado',
            mensaje: 'Acceso no autorizado: Debe iniciar sesión para realizar esta operación bancaria.',
        });
    }

    try {
        const cargaUtil = jwt.verify(token, configuracionEntorno.seguridadJwt.secretoFirma);
        req.usuario = {
            idUsuario: cargaUtil.idUsuario,
            login: cargaUtil.login,
            nombreCompleto: cargaUtil.nombreCompleto,
            rol: cargaUtil.rol,
            limiteAtribucion: cargaUtil.limiteAtribucion,
        };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                exito: false,
                error: 'TokenExpirado',
                mensaje: 'Su sesión ha expirado por inactividad (15 min). Por favor ingrese sus credenciales nuevamente (RNF01).',
            });
        }
        return res.status(401).json({
            exito: false,
            error: 'TokenInvalido',
            mensaje: 'Token de autenticación bancario inválido o corrupto.',
        });
    }
}
