import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { configuracionEntorno } from './variablesEntorno.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let poolConexiones = null;
let usarMotorEnMemoria = false;

// Almacén en memoria en caso de que MySQL no esté iniciado aún
export const baseDatosEnMemoria = {
    usuarios: [],
    clientes: [],
    solicitudes: [],
    evaluaciones: [],
    creditos: [],
    garantias: [],
    contratos: [],
    cuotas: [],
    pagos: [],
    auditoria: [],
    contadores: {
        idUsuario: 10,
        idCliente: 10,
        idSolicitud: 600,
        idEvaluacion: 400,
        idCredito: 900,
        idGarantia: 500,
        idContrato: 300,
        idCuota: 2000,
        idPago: 800,
        idAuditoria: 1,
    }
};

/**
 * Inicializa datos iniciales en el almacén de memoria
 */
function inicializarDatosMemoria() {
    // Hash real para Bancario2026!
    const claveComunHash = '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2';

    baseDatosEnMemoria.usuarios = [
        { id_usuario: 1, nombre_completo: 'Carlos Mendoza', login: 'cmendoza', clave_hash: claveComunHash, rol: 'JEFE', limite_atribucion: 70000.00, activo: 1, intentos_fallidos: 0, bloqueado_hasta: null },
        { id_usuario: 2, nombre_completo: 'Ana Torrez', login: 'atorrez', clave_hash: claveComunHash, rol: 'OFICIAL', limite_atribucion: 0.00, activo: 1, intentos_fallidos: 0, bloqueado_hasta: null },
        { id_usuario: 3, nombre_completo: 'Luis Rojas', login: 'lrojas', clave_hash: claveComunHash, rol: 'ANALISTA', limite_atribucion: 0.00, activo: 1, intentos_fallidos: 0, bloqueado_hasta: null },
        { id_usuario: 4, nombre_completo: 'Cajero de Prueba', login: 'cajero1', clave_hash: claveComunHash, rol: 'CAJERO', limite_atribucion: 0.00, activo: 1, intentos_fallidos: 0, bloqueado_hasta: null },
        { id_usuario: 5, nombre_completo: 'Gerente de Prueba', login: 'gerente1', clave_hash: claveComunHash, rol: 'GERENTE', limite_atribucion: 0.00, activo: 1, intentos_fallidos: 0, bloqueado_hasta: null },
        { id_usuario: 6, nombre_completo: 'Administrador del Sistema', login: 'admin', clave_hash: claveComunHash, rol: 'ADMINISTRADOR', limite_atribucion: 0.00, activo: 1, intentos_fallidos: 0, bloqueado_hasta: null },
    ];

    baseDatosEnMemoria.clientes = [
        { id_cliente: 1, ci: '4587231', nombres: 'María Elena', apellidos: 'Quispe Mamani', telefono: '70012345', direccion: 'Sopocachi, Av. 20 de Octubre #452, La Paz', ingresos_mensuales: 6500.00, fecha_registro: '2025-09-10' },
        { id_cliente: 2, ci: '3498210', nombres: 'Juan Carlos', apellidos: 'Mamani', telefono: '71122334', direccion: 'Miraflores, Calle Díaz Romero #120, La Paz', ingresos_mensuales: 4000.00, fecha_registro: '2025-09-11' },
        { id_cliente: 3, ci: '5928104', nombres: 'Rosa', apellidos: 'Condori', telefono: '72233445', direccion: 'San Pedro, Calle Nicolás Acosta #89, La Paz', ingresos_mensuales: 3500.00, fecha_registro: '2025-09-12' },
        { id_cliente: 4, ci: '4839201 LP', nombres: 'Carlos', apellidos: 'Mamani Quispe', telefono: '73344556', direccion: 'Zona Sur, Calacoto Calle 15, La Paz', ingresos_mensuales: 6500.00, fecha_registro: '2026-09-01' },
    ];

    baseDatosEnMemoria.solicitudes = [
        { id_solicitud: 101, id_cliente: 1, numero_solicitud: 'SOL-101', fecha_solicitud: '2025-09-15', montoSolicitado: 30000.00, plazo_meses: 12, tipo_credito: 'CONSUMO', destino: 'Capital de trabajo para negocio comercial', estado: 'EN_EVALUACION', motivo_rechazo: null, documentacion_completa: 1 },
        { id_solicitud: 102, id_cliente: 2, numero_solicitud: 'SOL-102', fecha_solicitud: '2025-09-16', montoSolicitado: 12000.00, plazo_meses: 6, tipo_credito: 'CONSUMO', destino: 'Gastos personales y salud', estado: 'REGISTRADA', motivo_rechazo: null, documentacion_completa: 1 },
        { id_solicitud: 103, id_cliente: 3, numero_solicitud: 'SOL-103', fecha_solicitud: '2025-09-18', montoSolicitado: 8500.00, plazo_meses: 12, tipo_credito: 'CONSUMO', destino: 'Mejora y refacción de vivienda', estado: 'REGISTRADA', motivo_rechazo: null, documentacion_completa: 1 },
        { id_solicitud: 501, id_cliente: 4, numero_solicitud: 'SOL-2026-0501', fecha_solicitud: '2026-09-15', montoSolicitado: 35000.00, plazo_meses: 24, tipo_credito: 'CONSUMO', destino: 'Compra de vehículo familiar', estado: 'APROBADA', motivo_rechazo: null, documentacion_completa: 1 },
    ];

    baseDatosEnMemoria.garantias = [
        { id_garantia: 101, id_solicitud: 101, id_credito: null, tipo: 'Prendaria', descripcion: 'Vehículo particular Toyota Corolla Mod. 2018 (Placa 1234ABC)', valor_tasacion: 45000.00, cobertura_porcentaje: 150.00, estado: 'VIGENTE' },
        { id_garantia: 401, id_solicitud: 501, id_credito: 801, tipo: 'VEHICULAR', descripcion: 'Toyota Hilux 2019 (Placa 5678XYZ)', valor_tasacion: 50000.00, cobertura_porcentaje: 142.86, estado: 'CUSTODIA' },
    ];

    baseDatosEnMemoria.evaluaciones = [
        { id_evaluacion: 101, id_solicitud: 101, fecha_evaluacion: '2025-09-17', ingresos: 6500.00, gastos: 3200.00, capacidad_pago: 3300.00, ratio_dti: 38.00, score_buro: 750, referencia_buro: 'R04571', nivel_riesgo: 'MEDIO', resultado: 'FAVORABLE', dictamen: 'Se recomienda aprobación conforme a capacidad de pago favorable y garantía suficiente.' },
        { id_evaluacion: 301, id_solicitud: 501, fecha_evaluacion: '2026-09-20', ingresos: 6500.00, gastos: 4300.00, capacidad_pago: 2200.00, ratio_dti: 32.00, score_buro: 780, referencia_buro: 'R-D13-780', nivel_riesgo: 'BAJO', resultado: 'FAVORABLE', dictamen: 'Evaluación favorable con bajo riesgo según buró score 780 y DTI 32%.' },
    ];

    baseDatosEnMemoria.creditos = [
        { id_credito: 801, id_solicitud: 501, numero_credito: 'CRE-2026-089', monto_aprobado: 35000.00, tasa_interes: 11.50, tasa_mora: 18.00, sistema_amortizacion: 'FRANCES', plazo_meses: 24, fecha_desembolso: '2026-10-01', saldo_capital: 33600.00, interes_acumulado: 0.00, mora_acumulada: 0.00, estado: 'VIGENTE' },
    ];

    baseDatosEnMemoria.contratos = [
        { id_contrato: 201, id_credito: 801, numero_contrato: 'CTR-89-2026', fecha_firma: '2026-10-01', notaria_registro: 'Notaría de Fe Pública N° 45 LP', estado: 'FIRMADO' },
    ];

    baseDatosEnMemoria.cuotas = [
        { id_cuota: 1001, id_credito: 801, numero_cuota: 1, fecha_vencimiento: '2026-11-01', capital: 1400.00, interes_comp: 250.00, interes_mora: 50.00, monto: 1700.00, saldo_pendiente: 0.00, dias_mora: 0, estado: 'PAGADA' },
        { id_cuota: 1002, id_credito: 801, numero_cuota: 2, fecha_vencimiento: '2026-12-01', capital: 1415.00, interes_comp: 235.00, interes_mora: 0.00, monto: 1650.00, saldo_pendiente: 1650.00, dias_mora: 0, estado: 'PENDIENTE' },
        { id_cuota: 1003, id_credito: 801, numero_cuota: 3, fecha_vencimiento: '2027-01-01', capital: 1428.56, interes_comp: 221.44, interes_mora: 0.00, monto: 1650.00, saldo_pendiente: 1650.00, dias_mora: 0, estado: 'PENDIENTE' },
    ];

    baseDatosEnMemoria.pagos = [
        { id_pago: 701, id_cuota: 1001, fecha_pago: '2026-11-05', monto: 1700.00, monto_mora: 50.00, monto_interes: 250.00, monto_capital: 1400.00, forma_pago: 'EFECTIVO', numero_recibo: 'REC-4401' },
    ];

    baseDatosEnMemoria.auditoria = [
        { id_auditoria: 1, id_usuario: 6, fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 19), ip_origen: '127.0.0.1', operacion: 'INICIALIZACION_SISTEMA', entidad: 'SISTEMA', id_entidad: '1', resultado: 'EXITOSO', detalles: 'Carga inicial del sistema de créditos UMSA INF-241.' },
    ];
}

/**
 * Conecta y configura la base de datos MySQL.
 * Si MySQL no está activo, activa el adaptador en memoria garantizando funcionamiento sin caídas.
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
        usarMotorEnMemoria = false;
        return { conectadoMySQL: true };

    } catch (error) {
        console.warn(`⚠️ [Base de Datos] No se pudo conectar a MySQL (${error.message}).`);
        console.log(`ℹ️ [Base de Datos] Activando motor transaccional en memoria para desarrollo/demo inmediata.`);
        inicializarDatosMemoria();
        usarMotorEnMemoria = true;
        return { conectadoMySQL: false, modoMemoria: true };
    }
}

/**
 * Retorna si el sistema está operando en memoria o en MySQL real
 */
export function estaEnModoMemoria() {
    return usarMotorEnMemoria;
}

/**
 * Obtiene el pool de conexiones a MySQL
 */
export function obtenerPool() {
    return poolConexiones;
}
