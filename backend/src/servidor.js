import express from 'express';
import cors from 'cors';
import { configuracionEntorno } from './config/variablesEntorno.js';
import { inicializarBaseDeDatos } from './config/baseDeDatos.js';
import { enrutadorApi } from './rutas/apiRutas.js';
import { manejadorCentralErrores } from './middleware/manejadorErrores.js';

const app = express();

// Configuración de Middlewares globales
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

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
