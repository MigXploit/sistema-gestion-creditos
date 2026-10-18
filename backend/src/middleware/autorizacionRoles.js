/**
 * Middleware para autorización RBAC según la matriz de seguridad bancaria (Sección 16.2).
 * Verifica que el rol del usuario autenticado coincida con los roles autorizados.
 */
export function requerirRoles(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                exito: false,
                error: 'NoAutenticado',
                mensaje: 'Se requiere iniciar sesión antes de validar permisos (RNF01).',
            });
        }

        const rolUsuario = req.usuario.rol;
        const tienePermiso = rolesPermitidos.includes(rolUsuario);

        if (!tienePermiso) {
            return res.status(403).json({
                exito: false,
                error: 'AccesoDenegado',
                mensaje: `Operación no autorizada: Su rol '${rolUsuario}' no tiene privilegios para acceder a este recurso. Roles requeridos: ${rolesPermitidos.join(', ')}.`,
            });
        }

        next();
    };
}
