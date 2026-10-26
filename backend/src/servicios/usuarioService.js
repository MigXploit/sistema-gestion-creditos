import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { estaEnModoMemoria, baseDatosEnMemoria, obtenerPool } from '../config/baseDeDatos.js';
import { configuracionEntorno } from '../config/variablesEntorno.js';
import { auditoriaService } from './auditoriaService.js';
import { ReglaNegocioError } from '../middleware/manejadorErrores.js';

/**
 * Servicio de Autenticación, Control de Bloqueos y Administración de Usuarios (CU15 / RF16 / RNF01 / P14).
 * Criterios: CA24, CA25.
 */
export const usuarioService = {
    /**
     * RNF01: Autenticación con BCrypt, bloqueo al 5to intento fallido y token JWT (15 min expiración).
     */
    async autenticar(login, contrasenia, ipOrigen) {
        if (!login || !contrasenia) {
            throw new ReglaNegocioError('Credenciales incompletas: Ingrese su usuario y contraseña.', 401);
        }

        const loginLimpio = login.trim();
        let usuario = null;

        if (estaEnModoMemoria()) {
            usuario = baseDatosEnMemoria.usuarios.find(u => u.login === loginLimpio);
        } else {
            const pool = obtenerPool();
            const [filas] = await pool.query('SELECT * FROM usuario WHERE login = ?', [loginLimpio]);
            if (filas.length > 0) usuario = filas[0];
        }

        if (!usuario) {
            throw new ReglaNegocioError('Credenciales inválidas (Usuario o contraseña incorrectos).', 401);
        }

        // Validar si el usuario está activo
        if (!usuario.activo) {
            await auditoriaService.registrarEvento({
                idUsuario: usuario.id_usuario,
                username: usuario.login,
                operacion: 'LOGIN',
                entidad: 'USUARIO',
                idEntidad: usuario.login,
                resultado: 'DENEGADO',
                detalles: 'Intento de acceso denegado: El usuario se encuentra inactivo.',
                ipOrigen: ipOrigen,
            });
            throw new ReglaNegocioError('El usuario se encuentra inactivo. Comuníquese con el administrador.', 401);
        }

        const ahora = new Date();

        // Control de bloqueo temporal por intentos fallidos (RNF01, Sección 16.2)
        if (usuario.bloqueado_hasta) {
            const fechaBloqueo = new Date(usuario.bloqueado_hasta);
            if (fechaBloqueo > ahora) {
                await auditoriaService.registrarEvento({
                    idUsuario: usuario.id_usuario,
                    username: usuario.login,
                    operacion: 'LOGIN',
                    entidad: 'BLOQUEADO',
                    idEntidad: usuario.login,
                    resultado: 'DENEGADO',
                    detalles: 'Cuenta temporalmente bloqueada por superar 5 intentos fallidos.',
                    ipOrigen: ipOrigen,
                });
                throw new ReglaNegocioError('Cuenta bloqueada temporalmente por superar 5 intentos fallidos. Intente más tarde (RNF01).', 401);
            } else {
                // Periodo de bloqueo cumplido, restablecer
                usuario.bloqueado_hasta = null;
                usuario.intentos_fallidos = 0;
            }
        }

        // Verificar contraseña con BCrypt
        const coincideContrasenia = bcrypt.compareSync(contrasenia, usuario.clave_hash);

        if (!coincideContrasenia) {
            const intentos = (usuario.intentos_fallidos || 0) + 1;
            usuario.intentos_fallidos = intentos;

            if (intentos >= configuracionEntorno.reglasBancarias.maximoIntentosFallidos) {
                const bloqueo = new Date(ahora.getTime() + configuracionEntorno.reglasBancarias.minutosBloqueoCuenta * 60000);
                usuario.bloqueado_hasta = bloqueo.toISOString().replace('T', ' ').substring(0, 19);

                if (!estaEnModoMemoria()) {
                    const pool = obtenerPool();
                    await pool.query('UPDATE usuario SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id_usuario = ?', [intentos, bloqueo, usuario.id_usuario]);
                }

                await auditoriaService.registrarEvento({
                    idUsuario: usuario.id_usuario,
                    username: usuario.login,
                    operacion: 'LOGIN',
                    entidad: 'USUARIO',
                    idEntidad: usuario.login,
                    resultado: 'BLOQUEO_CUENTA',
                    detalles: 'Bloqueado por exceder 5 intentos fallidos consecutivos durante 30 min (RNF01).',
                    ipOrigen: ipOrigen,
                });

                throw new ReglaNegocioError('Cuenta bloqueada por exceder 5 intentos fallidos consecutivos durante 30 minutos (RNF01).', 401);
            }

            if (!estaEnModoMemoria()) {
                const pool = obtenerPool();
                await pool.query('UPDATE usuario SET intentos_fallidos = ? WHERE id_usuario = ?', [intentos, usuario.id_usuario]);
            }

            await auditoriaService.registrarEvento({
                idUsuario: usuario.id_usuario,
                username: usuario.login,
                operacion: 'LOGIN',
                entidad: 'USUARIO',
                idEntidad: usuario.login,
                resultado: 'FALLIDO',
                detalles: `Intento de autenticación fallido ${intentos} de 5`,
                ipOrigen: ipOrigen,
            });

            const restantes = Math.max(0, 5 - intentos);
            throw new ReglaNegocioError(`Credenciales inválidas (contraseña incorrecta). Intento ${intentos} de 5 (RNF01). Le quedan ${restantes} intento(s) antes del bloqueo temporal de 30 minutos.`, 401);
        }

        // Login exitoso: restablecer intentos fallidos
        usuario.intentos_fallidos = 0;
        usuario.bloqueado_hasta = null;
        if (!estaEnModoMemoria()) {
            const pool = obtenerPool();
            await pool.query('UPDATE usuario SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id_usuario = ?', [usuario.id_usuario]);
        }

        // Generar token JWT con 15 minutos de vigencia (RNF01)
        const token = jwt.sign(
            {
                idUsuario: usuario.id_usuario,
                login: usuario.login,
                nombreCompleto: usuario.nombre_completo,
                rol: usuario.rol,
                limiteAtribucion: parseFloat(usuario.limite_atribucion || 0),
            },
            configuracionEntorno.seguridadJwt.secretoFirma,
            { expiresIn: configuracionEntorno.seguridadJwt.tiempoExpiracion }
        );

        await auditoriaService.registrarEvento({
            idUsuario: usuario.id_usuario,
            username: usuario.login,
            operacion: 'LOGIN',
            entidad: 'USUARIO',
            idEntidad: usuario.login,
            resultado: 'EXITOSO',
            detalles: 'Sesión iniciada exitosamente con token JWT (15 min vigencia).',
            ipOrigen: ipOrigen,
        });

        return {
            token: token,
            tipo: 'Bearer',
            login: usuario.login,
            nombreCompleto: usuario.nombre_completo,
            rol: usuario.rol,
            limiteAtribucion: parseFloat(usuario.limite_atribucion || 0),
        };
    },

    async listarTodos() {
        if (estaEnModoMemoria()) {
            return baseDatosEnMemoria.usuarios.map(u => ({
                idUsuario: u.id_usuario,
                nombreCompleto: u.nombre_completo,
                login: u.login,
                rol: u.rol,
                limiteAtribucion: parseFloat(u.limite_atribucion || 0),
                activo: Boolean(u.activo),
            }));
        }

        const pool = obtenerPool();
        const [filas] = await pool.query(
            `SELECT id_usuario AS idUsuario, nombre_completo AS nombreCompleto, login, rol,
                    limite_atribucion AS limiteAtribucion, activo
             FROM usuario ORDER BY id_usuario ASC`
        );
        return filas.map(u => ({
            ...u,
            limiteAtribucion: parseFloat(u.limiteAtribucion),
            activo: Boolean(u.activo),
        }));
    },

    async crearUsuario(datosUsuario, usernameOperador, ipOrigen) {
        const { nombreCompleto, login, password, rol, limiteAtribucion } = datosUsuario;

        if (!nombreCompleto || !nombreCompleto.trim()) throw new ReglaNegocioError('El nombre completo es obligatorio.');
        if (!login || !login.trim()) throw new ReglaNegocioError('El login es obligatorio.');
        if (!password || password.length < 6) throw new ReglaNegocioError('La contraseña debe tener al menos 6 caracteres.');
        if (!rol) throw new ReglaNegocioError('El rol es obligatorio.');

        const claveHash = bcrypt.hashSync(password, 10);
        const limite = parseFloat(limiteAtribucion || (rol === 'JEFE' ? 70000 : (rol === 'GERENTE' ? 500000 : 0)));

        if (estaEnModoMemoria()) {
            const existente = baseDatosEnMemoria.usuarios.find(u => u.login === login.trim());
            if (existente) throw new ReglaNegocioError(`Ya existe un usuario con el login '${login.trim()}' (CA24).`);

            const nuevoId = baseDatosEnMemoria.contadores.idUsuario++;
            const nuevoUsuario = {
                id_usuario: nuevoId,
                nombre_completo: nombreCompleto.trim(),
                login: login.trim(),
                clave_hash: claveHash,
                rol: rol,
                limite_atribucion: limite,
                activo: 1,
                intentos_fallidos: 0,
                bloqueado_hasta: null,
            };
            baseDatosEnMemoria.usuarios.push(nuevoUsuario);

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'CREAR_USUARIO',
                entidad: 'USUARIO',
                idEntidad: nuevoId,
                resultado: 'EXITOSO',
                detalles: `Creación de usuario: ${login.trim()} con rol: ${rol}`,
                ipOrigen: ipOrigen,
            });

            return {
                idUsuario: nuevoId,
                nombreCompleto: nuevoUsuario.nombre_completo,
                login: nuevoUsuario.login,
                rol: nuevoUsuario.rol,
                limiteAtribucion: limite,
                activo: true,
            };
        }

        const pool = obtenerPool();
        const [existentes] = await pool.query('SELECT * FROM usuario WHERE login = ?', [login.trim()]);
        if (existentes.length > 0) throw new ReglaNegocioError(`Ya existe un usuario con el login '${login.trim()}' (CA24).`);

        const [resultadoInsert] = await pool.query(
            `INSERT INTO usuario (nombre_completo, login, clave_hash, rol, limite_atribucion, activo, intentos_fallidos)
             VALUES (?, ?, ?, ?, ?, 1, 0)`,
            [nombreCompleto.trim(), login.trim(), claveHash, rol, limite]
        );

        const nuevoId = resultadoInsert.insertId;

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'CREAR_USUARIO',
            entidad: 'USUARIO',
            idEntidad: nuevoId,
            resultado: 'EXITOSO',
            detalles: `Creación de usuario: ${login.trim()} con rol: ${rol}`,
            ipOrigen: ipOrigen,
        });

        return {
            idUsuario: nuevoId,
            nombreCompleto: nombreCompleto.trim(),
            login: login.trim(),
            rol: rol,
            limiteAtribucion: limite,
            activo: true,
        };
    },

    async cambiarEstado(idUsuario, activo, usernameOperador, ipOrigen) {
        const id = parseInt(idUsuario, 10);
        const nuevoEstado = Boolean(activo);

        if (estaEnModoMemoria()) {
            const usuario = baseDatosEnMemoria.usuarios.find(u => u.id_usuario === id);
            if (!usuario) throw new ReglaNegocioError(`Usuario no encontrado con ID: ${id}`);
            usuario.activo = nuevoEstado ? 1 : 0;

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'CAMBIAR_ESTADO_USUARIO',
                entidad: 'USUARIO',
                idEntidad: id,
                resultado: 'EXITOSO',
                detalles: `Usuario ${usuario.login} cambiado a estado: ${nuevoEstado ? 'ACTIVO' : 'INACTIVO'}`,
                ipOrigen: ipOrigen,
            });

            return {
                idUsuario: id,
                nombreCompleto: usuario.nombre_completo,
                login: usuario.login,
                rol: usuario.rol,
                limiteAtribucion: parseFloat(usuario.limite_atribucion || 0),
                activo: nuevoEstado,
            };
        }

        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT * FROM usuario WHERE id_usuario = ?', [id]);
        if (filas.length === 0) throw new ReglaNegocioError(`Usuario no encontrado con ID: ${id}`);
        const usuario = filas[0];

        await pool.query('UPDATE usuario SET activo = ? WHERE id_usuario = ?', [nuevoEstado ? 1 : 0, id]);

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'CAMBIAR_ESTADO_USUARIO',
            entidad: 'USUARIO',
            idEntidad: id,
            resultado: 'EXITOSO',
            detalles: `Usuario ${usuario.login} cambiado a estado: ${nuevoEstado ? 'ACTIVO' : 'INACTIVO'}`,
            ipOrigen: ipOrigen,
        });

        return {
            idUsuario: id,
            nombreCompleto: usuario.nombre_completo,
            login: usuario.login,
            rol: usuario.rol,
            limiteAtribucion: parseFloat(usuario.limite_atribucion || 0),
            activo: nuevoEstado,
        };
    }
};
