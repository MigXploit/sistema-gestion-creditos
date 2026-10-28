import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { configuracionEntorno } from './config/variablesEntorno.js';
import { inicializarBaseDeDatos } from './config/baseDeDatos.js';
import { enrutadorApi } from './rutas/apiRutas.js';
import { manejadorCentralErrores } from './middleware/manejadorErrores.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Medidas de Seguridad HTTP y cabeceras de protección bancaria
app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Configuración de Middlewares globales
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Límite de carga para contratos firmados y documentos de garantía en Base64 (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Endpoint de verificación de salud del backend
app.get('/api/health', (req, res) => {
    res.json({
        estado: 'ACTIVO',
        servicio: 'Sistema de Gestión de Créditos Bancario - Backend Node.js',
        materia: 'UMSA INF-241 Análisis y Diseño de Sistemas I',
        horaServidor: new Date().toISOString(),
    });
});

// Enrutador principal de la API REST
app.use('/api', enrutadorApi);

// Servir interfaz gráfica web compilada (frontend/dist) para ejecución autónoma local
const rutaFrontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(rutaFrontendDist)) {
    app.use(express.static(rutaFrontendDist));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(rutaFrontendDist, 'index.html'));
    });
}

// Manejador centralizado de errores
app.use(manejadorCentralErrores);

// Iniciar servidor tras conectar la base de datos
const PUERTO = configuracionEntorno.puertoServidor;

async function iniciarServidor() {
    console.log('🚀 Iniciando Sistema de Gestión de Créditos Bancario (Node.js + MySQL)...');
    await inicializarBaseDeDatos();

    app.listen(PUERTO, () => {
        console.log(`================================================================`);
        console.log(`🏦 SERVIDOR BANCARIO ACTIVO EN: http://localhost:${PUERTO}/api`);
        console.log(`📋 API Health Check:         http://localhost:${PUERTO}/api/health`);
        console.log(`🛡️  Seguridad:               JWT Bearer (15 min timeout, RBAC)`);
        console.log(`📚 Universidad:              UMSA - Informática (INF-241)`);
        console.log(`================================================================`);
    });
}

iniciarServidor();

export default app;
