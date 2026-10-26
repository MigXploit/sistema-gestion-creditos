import { Router } from 'express';
import { autenticarTokenJwt } from '../middleware/autenticacionJwt.js';
import { requerirRoles } from '../middleware/autorizacionRoles.js';
import { usuarioService } from '../servicios/usuarioService.js';
import { clienteService } from '../servicios/clienteService.js';
import { solicitudService } from '../servicios/solicitudService.js';
import { evaluacionService } from '../servicios/evaluacionService.js';
import { buroRiesgoService } from '../servicios/buroRiesgoService.js';
import { garantiaService } from '../servicios/garantiaService.js';
import { creditoService } from '../servicios/creditoService.js';
import { pagoService } from '../servicios/pagoService.js';
import { reporteService } from '../servicios/reporteService.js';
import { auditoriaService } from '../servicios/auditoriaService.js';

export const enrutadorApi = Router();

// ==============================================================================
// 1. AUTENTICACIÓN (RNF01 / P01)
// ==============================================================================
enrutadorApi.post('/auth/login', async (req, res, next) => {
    try {
        const login = req.body.login || req.body.username || req.body.nombreUsuario;
        const password = req.body.password || req.body.contrasenia || req.body.clave;
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await usuarioService.autenticar(login, password, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/auth/me', autenticarTokenJwt, async (req, res) => {
    res.json(req.usuario);
});

// ==============================================================================
// 2. CLIENTES (CU01 / RF01 / RF02 / P10)
// ==============================================================================
enrutadorApi.post('/clientes', autenticarTokenJwt, requerirRoles('OFICIAL', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await clienteService.registrarCliente(req.body, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.put('/clientes/:id', autenticarTokenJwt, requerirRoles('OFICIAL', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await clienteService.editarCliente(req.params.id, req.body, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/clientes', autenticarTokenJwt, requerirRoles('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'CAJERO', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await clienteService.listarTodos();
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/clientes/:id', autenticarTokenJwt, requerirRoles('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'CAJERO', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await clienteService.buscarPorId(req.params.id);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/clientes/ci/:ci', autenticarTokenJwt, requerirRoles('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'CAJERO', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await clienteService.buscarPorCi(req.params.ci);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// ==============================================================================
// 3. SOLICITUDES DE CRÉDITO (CU02 / RF03 / P11 / P02)
// ==============================================================================
enrutadorApi.post('/solicitudes', autenticarTokenJwt, requerirRoles('OFICIAL', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await solicitudService.registrarSolicitud(req.body, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.post('/solicitudes/:id/iniciar-evaluacion', autenticarTokenJwt, requerirRoles('ANALISTA', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await solicitudService.iniciarEvaluacion(req.params.id, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/solicitudes', autenticarTokenJwt, requerirRoles('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'CAJERO', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const estadoFiltro = req.query.estado;
        const respuesta = await solicitudService.listarTodas(estadoFiltro);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/solicitudes/:id', autenticarTokenJwt, requerirRoles('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'CAJERO', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await solicitudService.buscarPorId(req.params.id);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// Derivar a instancia superior (Gerente) cuando excede atribución
enrutadorApi.post('/solicitudes/:id/derivar', autenticarTokenJwt, requerirRoles('JEFE', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await solicitudService.derivarAGerencia(req.params.id, req.body || {}, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// CU07: Aprobar crédito (Jefe, Gerente o Administrador)
enrutadorApi.post('/solicitudes/:id/aprobar', autenticarTokenJwt, requerirRoles('JEFE', 'GERENTE', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await creditoService.aprobarCredito(req.params.id, req.body || {}, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// CU08: Rechazar crédito (Jefe, Gerente o Administrador)
enrutadorApi.post('/solicitudes/:id/rechazar', autenticarTokenJwt, requerirRoles('JEFE', 'GERENTE', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await creditoService.rechazarCredito(req.params.id, req.body || {}, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// ==============================================================================
// 4. GARANTÍAS (CU06 / RF07 / P12)
// ==============================================================================
enrutadorApi.post('/garantias', autenticarTokenJwt, requerirRoles('OFICIAL', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await garantiaService.registrarGarantia(req.body, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/garantias/solicitud/:id', autenticarTokenJwt, requerirRoles('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await garantiaService.listarPorSolicitud(req.params.id);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/garantias/credito/:id', autenticarTokenJwt, requerirRoles('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await garantiaService.listarPorCredito(req.params.id);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// ==============================================================================
// 5. EVALUACIÓN FINANCIERA & BURÓ (CU03 / CU04 / CU05 / P13)
// ==============================================================================
enrutadorApi.post('/evaluaciones/solicitud/:id/consultar-buro', autenticarTokenJwt, requerirRoles('ANALISTA', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await evaluacionService.consultarHistorialBuro(req.params.id, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.post('/evaluaciones/solicitud/:id/calcular-capacidad', autenticarTokenJwt, requerirRoles('ANALISTA', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const { ingresos, gastos, deudasVigentes } = req.body;
        const respuesta = await evaluacionService.calcularCapacidadYRatios(req.params.id, ingresos, gastos, deudasVigentes);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.post('/evaluaciones/dictamen', autenticarTokenJwt, requerirRoles('ANALISTA', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await evaluacionService.emitirDictamen(req.body, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/evaluaciones/solicitud/:id', autenticarTokenJwt, requerirRoles('ANALISTA', 'JEFE', 'GERENTE', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await evaluacionService.buscarPorSolicitud(req.params.id);
        if (!respuesta) return res.status(204).send();
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.post('/evaluaciones/simulador/config', autenticarTokenJwt, requerirRoles('ANALISTA', 'ADMINISTRADOR'), async (req, res) => {
    const { forzarFallo, forzarParcial } = req.body;
    buroRiesgoService.configurarModo(forzarFallo, forzarParcial);
    res.json({ mensaje: 'Configuración del simulador de Buró actualizada exitosamente.' });
});

// ==============================================================================
// 6. CRÉDITOS, CONTRATO Y CRONOGRAMA (CU07 / CU09 / CU10 / CU11 / P03, P05)
// ==============================================================================
enrutadorApi.get('/creditos/:id', autenticarTokenJwt, requerirRoles('JEFE', 'OFICIAL', 'ANALISTA', 'GERENTE', 'CAJERO', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await creditoService.buscarPorId(req.params.id);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/creditos/solicitud/:id', autenticarTokenJwt, requerirRoles('JEFE', 'OFICIAL', 'ANALISTA', 'GERENTE', 'CAJERO', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await creditoService.buscarPorSolicitud(req.params.id);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/creditos/:id/cronograma', autenticarTokenJwt, requerirRoles('JEFE', 'OFICIAL', 'ANALISTA', 'GERENTE', 'CAJERO', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await creditoService.listarCronogramaPorCredito(req.params.id);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.get('/creditos/:id/contrato', autenticarTokenJwt, requerirRoles('JEFE', 'OFICIAL', 'ANALISTA', 'GERENTE', 'CAJERO', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await creditoService.buscarContratoPorCredito(req.params.id);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// CU09: Actualizar contrato legal (FIRMADO / PENDIENTE_FIRMA) y adjuntar documento
enrutadorApi.put('/creditos/:id/contrato', autenticarTokenJwt, requerirRoles('OFICIAL', 'JEFE', 'GERENTE', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await creditoService.actualizarContratoFirmado(req.params.id, req.body, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// CU11: Desembolsar crédito
enrutadorApi.post('/creditos/:id/desembolsar', autenticarTokenJwt, requerirRoles('OFICIAL', 'JEFE', 'GERENTE', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await pagoService.desembolsarCredito(req.params.id, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// ==============================================================================
// 7. CAJA / PAGOS Y CONTROL DE MORA (CU12 / CU13 / RF13 / RF14 / P08)
// ==============================================================================
enrutadorApi.post('/pagos', autenticarTokenJwt, requerirRoles('CAJERO', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await pagoService.registrarPagoCuota(req.body, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// CU12 / ASFI: Justificación de Pago Flexible / Prórroga / Acumulación
enrutadorApi.post('/pagos/flexibilidad', autenticarTokenJwt, requerirRoles('CAJERO', 'OFICIAL', 'JEFE', 'GERENTE', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await pagoService.justificarPagoFlexible(req.body, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.post('/mora/ejecutar-control', autenticarTokenJwt, requerirRoles('ADMINISTRADOR', 'JEFE', 'GERENTE', 'CAJERO'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await pagoService.ejecutarControlMora(req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// ==============================================================================
// 8. REPORTES GERENCIALES (CU14 / RF15)
// ==============================================================================
enrutadorApi.get('/reportes/resumen', autenticarTokenJwt, requerirRoles('GERENTE', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await reporteService.obtenerResumenCartera();
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// ==============================================================================
// 9. USUARIOS Y ROLES (CU15 / RF16 / P14)
// ==============================================================================
enrutadorApi.get('/usuarios', autenticarTokenJwt, requerirRoles('ADMINISTRADOR'), async (req, res, next) => {
    try {
        const respuesta = await usuarioService.listarTodos();
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.post('/usuarios', autenticarTokenJwt, requerirRoles('ADMINISTRADOR'), async (req, res, next) => {
    try {
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await usuarioService.crearUsuario(req.body, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

enrutadorApi.patch('/usuarios/:id/estado', autenticarTokenJwt, requerirRoles('ADMINISTRADOR'), async (req, res, next) => {
    try {
        const { activo } = req.body;
        const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const respuesta = await usuarioService.cambiarEstado(req.params.id, activo, req.usuario.login, ipOrigen);
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});

// ==============================================================================
// 10. AUDITORÍA (RN12 / RNF06)
// ==============================================================================
enrutadorApi.get('/auditoria', autenticarTokenJwt, requerirRoles('ADMINISTRADOR', 'JEFE', 'GERENTE'), async (req, res, next) => {
    try {
        const respuesta = await auditoriaService.listarRecientes();
        res.json(respuesta);
    } catch (error) {
        next(error);
    }
});
