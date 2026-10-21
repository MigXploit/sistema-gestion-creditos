import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { configuracionEntorno } from './variablesEntorno.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let poolConexiones = null;

// Objeto vacío mantenido por compatibilidad de importación
export const baseDatosEnMemoria = { contadores: {} };

/**
 * Conecta y configura la base de datos MySQL estricta.
 */
export async function inicializarBaseDeDatos() {
    const config = configuracionEntorno.baseDeDatos;

    try {
        // Intentar conectar a MySQL directamente
        const conexionInicial = await mysql.createConnection({
            host: config.servidorHost,
            port: config.puerto,
            user: config.usuario,
            password: config.contrasenia,
            connectTimeout: 2000,
        });

        // Crear base de datos si no existe
        await conexionInicial.query(`CREATE DATABASE IF NOT EXISTS \`${config.nombreBaseDatos}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await conexionInicial.end();

        // Crear pool de conexiones a la base de datos
        poolConexiones = mysql.createPool({
            host: config.servidorHost,
            port: config.puerto,
            user: config.usuario,
            password: config.contrasenia,
            database: config.nombreBaseDatos,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        // Ejecutar esquema inicial si no existen las tablas
        const [tablas] = await poolConexiones.query(`SHOW TABLES LIKE 'usuario'`);
        if (tablas.length === 0) {
            console.log('⚡ [MySQL] Creando tablas iniciales en creditos_db...');
            const rutaEsquema = path.resolve(__dirname, '../../../database/mysql/01_schema_mysql.sql');
            const rutaSemilla = path.resolve(__dirname, '../../../database/mysql/02_seed_mysql.sql');

            if (fs.existsSync(rutaEsquema)) {
                const sqlEsquema = fs.readFileSync(rutaEsquema, 'utf8');
                const sentencias = sqlEsquema.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
                for (const sql of sentencias) {
                    try { await poolConexiones.query(sql); } catch (e) { /* continuar */ }
                }
            }

            if (fs.existsSync(rutaSemilla)) {
                const sqlSemilla = fs.readFileSync(rutaSemilla, 'utf8');
                const sentenciasSemilla = sqlSemilla.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
                for (const sql of sentenciasSemilla) {
                    try { await poolConexiones.query(sql); } catch (e) { /* continuar */ }
                }
            }
        }

        console.log(`✅ [Base de Datos] Conectado exitosamente a MySQL (${config.servidorHost}:${config.puerto}/${config.nombreBaseDatos})`);
        return { conectadoMySQL: true };

    } catch (error) {
        console.error(`❌ [Base de Datos] Error de conexión a la base de datos MySQL (${config.servidorHost}:${config.puerto}/${config.nombreBaseDatos}):`, error.message);
        throw error;
    }
}

/**
 * Retorna siempre false ya que el sistema opera exclusivamente con la base de datos MySQL funcional.
 */
export function estaEnModoMemoria() {
    return false;
}

/**
 * Obtiene el pool de conexiones a MySQL
 */
export function obtenerPool() {
    return poolConexiones;
}
