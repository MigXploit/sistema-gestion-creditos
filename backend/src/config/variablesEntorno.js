import dotenv from 'dotenv';
dotenv.config();

/**
 * Variables de entorno y configuración general del sistema.
 * Estándares: Nombres descriptivos e intuitivos según el dominio bancario.
 */
export const configuracionEntorno = {
    puertoServidor: parseInt(process.env.PORT || '8080', 10),
    ambiente: process.env.NODE_ENV || 'development',

    baseDeDatos: {
        servidorHost: process.env.DB_HOST || 'localhost',
        puerto: parseInt(process.env.DB_PORT || '3306', 10),
        usuario: process.env.DB_USER || 'root',
        contrasenia: process.env.DB_PASSWORD || '',
        nombreBaseDatos: process.env.DB_NAME || 'creditos_db',
    },

    seguridadJwt: {
        secretoFirma: process.env.JWT_SECRET || 'Bancario2026_UMSA_INF241_ClaveSecretaSuperSegura!',
        tiempoExpiracion: process.env.JWT_EXPIRES_IN || '15m',
    },

    reglasBancarias: {
        limiteAtribucionJefeBs: parseFloat(process.env.LIMITE_ATRIBUCION_JEFE || '70000.00'),
        tasaInteresAnualPorDefecto: parseFloat(process.env.TASA_INTERES_ANUAL_DEFECTO || '12.00'),
        tasaMoraAnualPorDefecto: parseFloat(process.env.TASA_MORA_ANUAL_DEFECTO || '18.00'),
        maximoIntentosFallidos: parseInt(process.env.MAX_INTENTOS_FALLIDOS || '5', 10),
        minutosBloqueoCuenta: parseInt(process.env.MINUTOS_BLOQUEO_CUENTA || '30', 10),
    }
};
