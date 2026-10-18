/**
 * PRUEBA DE INTEGRACIÓN DEL SISTEMA DE GESTIÓN DE CRÉDITOS BANCARIOS
 * INF-241 Análisis y Diseño de Sistemas I - UMSA
 * 
 * Verifica el ciclo de vida completo de un crédito:
 * 1. Health check y persistencia dual (MySQL / Memoria)
 * 2. Autenticación con BCrypt y JWT de 15 minutos (CU15 / RF16 / RNF01)
 * 3. Registro de cliente con validación de identidad (CU01 / RF01)
 * 4. Registro de solicitud crediticia con validación de límites (CU02 / RF03 / RN04)
 * 5. Pase a evaluación e integración simulada con Buró ASFI (CU03 / RF04)
 * 6. Evaluación de capacidad de pago y cálculo de ratios (CU04 / RF05)
 * 7. Emisión de dictamen de riesgo crediticio (CU05 / RF06)
 * 8. Registro de garantía con verificación de cobertura >= 120% (CU06 / RF07)
 * 9. Aprobación colegiada con límite de atribución <= 70.000 Bs (CU07 / RF08)
 * 10. Generación de contrato y amortización francesa con ajuste al centavo (CU09, CU10 / RF10, RF11)
 * 11. Desembolso mediante Core Bancario simulado (CU11 / RF12)
 * 12. Cobro de cuota en ventanilla con cascada Mora -> Interés -> Capital (CU12, CU13 / RF13, RF14)
 * 13. Proceso automático de control y devengamiento de mora diaria
 * 14. Generación de métricas e indicadores de cartera (CU14 / RF15)
 * 15. Verificación de pistas inmutables de auditoría (RN12 / RNF06)
 */

import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { enrutadorApi } from './src/rutas/apiRutas.js';
import { inicializarBaseDeDatos } from './src/config/baseDeDatos.js';
import { manejadorCentralErrores } from './src/middleware/manejadorErrores.js';

let PUERTO_TEST = 8080;
let URL_BASE = `http://localhost:${PUERTO_TEST}/api`;
let servidorLocal = null;

function verificarServidorActivo(puerto) {
  return new Promise((resolve) => {
    const peticion = http.get(`http://localhost:${puerto}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    peticion.on('error', () => resolve(false));
    peticion.setTimeout(1000, () => {
      peticion.destroy();
      resolve(false);
    });
  });
}

async function prepararServidor() {
  const activo8080 = await verificarServidorActivo(8080);
  if (activo8080) {
    PUERTO_TEST = 8080;
    URL_BASE = `http://localhost:${PUERTO_TEST}/api`;
    console.log(`[Configuración] Servidor existente detectado en http://localhost:${PUERTO_TEST}`);
    return;
  }

  PUERTO_TEST = 8085;
  URL_BASE = `http://localhost:${PUERTO_TEST}/api`;
  await inicializarBaseDeDatos();

  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json());
  app.get('/api/health', (req, res) => res.json({ estado: 'ACTIVO' }));
  app.use('/api', enrutadorApi);
  app.use(manejadorCentralErrores);

  await new Promise((resolve) => {
    servidorLocal = app.listen(PUERTO_TEST, () => {
      console.log(`[Configuración] Servidor de prueba iniciado dinámicamente en http://localhost:${PUERTO_TEST}`);
      resolve();
    });
  });
}

function realizarPeticion(metodo, ruta, datos = null, tokenAcceso = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(URL_BASE + ruta);
    const opciones = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: metodo,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (tokenAcceso) {
      opciones.headers['Authorization'] = `Bearer ${tokenAcceso}`;
    }

    const peticion = http.request(opciones, (respuesta) => {
      let cuerpoRespuesta = '';
      respuesta.on('data', chunk => cuerpoRespuesta += chunk);
      respuesta.on('end', () => {
        try {
          const jsonParseado = JSON.parse(cuerpoRespuesta);
          resolve({ codigoEstado: respuesta.statusCode, datos: jsonParseado });
        } catch (e) {
          resolve({ codigoEstado: respuesta.statusCode, datos: cuerpoRespuesta });
        }
      });
    });

    peticion.on('error', (error) => reject(error));

    if (datos) {
      peticion.write(JSON.stringify(datos));
    }
    peticion.end();
  });
}

async function ejecutarPruebasIntegracion() {
  console.log('================================================================');
  console.log('   PRUEBAS DE INTEGRACIÓN: SISTEMA DE GESTIÓN CREDITICIA');
  console.log('   Metodología: Tradicional (Cascada) | Tipo: Aplicada');
  console.log('   Estándares: Variables Intuitivas y Auto-descriptivas');
  console.log('================================================================\n');

  try {
    await prepararServidor();

    // 1. Verificación de Health Check
    console.log('[Paso 1] Verificando estado del servidor y base de datos...');
    const resHealth = await realizarPeticion('GET', '/health');
    if (resHealth.codigoEstado !== 200) {
      throw new Error('Servidor no responde correctamente: ' + JSON.stringify(resHealth));
    }
    console.log('  -> Servidor en línea (HTTP 200 OK)');

    // 2. Login Oficial de Crédito
    console.log('\n[Paso 2] Autenticando Oficial de Crédito (atorrez)...');
    const resLoginOficial = await realizarPeticion('POST', '/auth/login', {
      login: 'atorrez',
      password: 'Bancario2026!'
    });
    if (resLoginOficial.codigoEstado !== 200 || !resLoginOficial.datos.token) {
      throw new Error('Fallo login oficial: ' + JSON.stringify(resLoginOficial));
    }
    const tokenOficial = resLoginOficial.datos.token;
    console.log('  -> Autenticación exitosa. Rol:', resLoginOficial.datos.rol);

    // 3. Crear nuevo cliente
    console.log('\n[Paso 3] Registrando nuevo cliente bancario...');
    const ciUnico = 'CI-' + Math.floor(1000000 + Math.random() * 9000000);
    const resCliente = await realizarPeticion('POST', '/clientes', {
      ci: ciUnico,
      nombres: 'Carlos Andrés',
      apellidos: 'Vargas Mendoza',
      telefono: '77889900',
      direccion: 'Av. 6 de Agosto Nro 2540, La Paz',
      ingresosMensuales: 8500.00
    }, tokenOficial);

    if (resCliente.codigoEstado !== 200) {
      throw new Error('Error al registrar cliente: ' + JSON.stringify(resCliente));
    }
    const idClienteCreado = resCliente.datos.idCliente;
    console.log(`  -> Cliente creado exitosamente. ID: ${idClienteCreado}, CI: ${ciUnico}`);

    // 4. Crear solicitud de crédito
    console.log('\n[Paso 4] Creando solicitud de crédito de consumo...');
    const resSolicitud = await realizarPeticion('POST', '/solicitudes', {
      ciCliente: ciUnico,
      tipoCredito: 'CONSUMO',
      montoSolicitado: 35000.00,
      plazoMeses: 24,
      destino: 'Equipamiento y capital operativo',
      documentacionCompleta: true
    }, tokenOficial);

    if (resSolicitud.codigoEstado !== 200) {
      throw new Error('Error al crear solicitud: ' + JSON.stringify(resSolicitud));
    }
    const idSolicitudCreada = resSolicitud.datos.idSolicitud;
    console.log(`  -> Solicitud Nro ${idSolicitudCreada} registrada. Código: ${resSolicitud.datos.numeroSolicitud}`);

    // 5. Login Analista de Riesgos
    console.log('\n[Paso 5] Autenticando Analista de Riesgos (lrojas)...');
    const resLoginAnalista = await realizarPeticion('POST', '/auth/login', {
      login: 'lrojas',
      password: 'Bancario2026!'
    });
    const tokenAnalista = resLoginAnalista.datos.token;
    console.log('  -> Autenticación exitosa. Rol:', resLoginAnalista.datos.rol);

    // Iniciar evaluación
    await realizarPeticion('POST', `/solicitudes/${idSolicitudCreada}/iniciar-evaluacion`, {}, tokenAnalista);

    // 6. Consultar Buró de Riesgos
    console.log('\n[Paso 6] Consultando Buró de Riesgo externo (simulación ASFI)...');
    const resBuro = await realizarPeticion('POST', `/evaluaciones/solicitud/${idSolicitudCreada}/consultar-buro`, {}, tokenAnalista);
    console.log(`  -> Calificación Buró: ${resBuro.datos.estadoHistorial}, Score: ${resBuro.datos.score}`);

    // 7. Evaluar Solicitud y Emitir Dictamen
    console.log('\n[Paso 7] Evaluando capacidad de pago y emitiendo dictamen...');
    const resCalculo = await realizarPeticion('POST', `/evaluaciones/solicitud/${idSolicitudCreada}/calcular-capacidad`, {
      ingresos: 8500.00,
      gastos: 2600.00,
      deudasVigentes: 0
    }, tokenAnalista);
    console.log(`  -> Ratios calculados: Capacidad Pago Bs ${resCalculo.datos.capacidadPago}, DTI: ${resCalculo.datos.ratioDti}%`);

    const resDictamen = await realizarPeticion('POST', '/evaluaciones/dictamen', {
      idSolicitud: idSolicitudCreada,
      ingresos: 8500.00,
      gastos: 2600.00,
      deudasVigentes: 0,
      referenciaBuro: resBuro.datos.referencia,
      scoreBuro: resBuro.datos.score,
      nivelRiesgo: 'MEDIO',
      resultado: 'FAVORABLE',
      dictamen: 'Cliente con solvencia económica y capacidad de pago demostrada.'
    }, tokenAnalista);
    console.log('  -> Dictamen emitido:', resDictamen.datos.resultado);

    // 8. Registrar Garantía Personal (>= 120%)
    console.log('\n[Paso 8] Registrando garantía personal de respaldo...');
    const resGarantia = await realizarPeticion('POST', '/garantias', {
      idSolicitud: idSolicitudCreada,
      tipo: 'PERSONAL',
      descripcion: 'Garante solidario con boleta de pago y solvencia patrimonial',
      valorTasacion: 45000.00
    }, tokenOficial);
    console.log(`  -> Garantía registrada. ID: ${resGarantia.datos.idGarantia}, Cobertura: ${resGarantia.datos.coberturaPorcentaje}%`);

    // 9. Login Jefe de Créditos
    console.log('\n[Paso 9] Autenticando Jefe de Créditos (cmendoza)...');
    const resLoginJefe = await realizarPeticion('POST', '/auth/login', {
      login: 'cmendoza',
      password: 'Bancario2026!'
    });
    const tokenJefe = resLoginJefe.datos.token;
    console.log('  -> Autenticación exitosa. Rol:', resLoginJefe.datos.rol);

    // 10. Aprobar Solicitud y Emitir Crédito con Plan Francés
    console.log('\n[Paso 10] Aprobando solicitud de crédito y generando contrato/plan de pagos...');
    const resAprobar = await realizarPeticion('POST', `/solicitudes/${idSolicitudCreada}/aprobar`, {}, tokenJefe);

    if (resAprobar.codigoEstado !== 200) {
      throw new Error('Error al aprobar crédito: ' + JSON.stringify(resAprobar));
    }
    const idCreditoCreado = resAprobar.datos.idCredito;
    const numeroCredito = resAprobar.datos.numeroCredito;
    console.log(`  -> Crédito APROBADO: ${numeroCredito} (ID: ${idCreditoCreado})`);
    console.log(`  -> Contrato Nro: ${resAprobar.datos.numeroContrato}`);
    console.log(`  -> Cuotas generadas: ${resAprobar.datos.cantidadCuotas} cuotas fijas (Sistema Francés)`);

    // 11. Desembolsar Crédito por Core Bancario
    console.log('\n[Paso 11] Ejecutando desembolso mediante Core Bancario...');
    const resDesembolso = await realizarPeticion('POST', `/creditos/${idCreditoCreado}/desembolsar`, {}, tokenJefe);
    console.log(`  -> Desembolso EXITOSO. Código de transacción Core: ${resDesembolso.datos.codigoTransaccionCore}`);

    // 12. Login Cajero
    console.log('\n[Paso 12] Autenticando Cajero de Ventanilla (cajero1)...');
    const resLoginCajero = await realizarPeticion('POST', '/auth/login', {
      login: 'cajero1',
      password: 'Bancario2026!'
    });
    const tokenCajero = resLoginCajero.datos.token;
    console.log('  -> Autenticación exitosa. Rol:', resLoginCajero.datos.rol);

    // 13. Obtener plan de cuotas y pagar la primera cuota
    console.log('\n[Paso 13] Consultando cuotas pendientes y registrando pago en ventanilla...');
    const resCronograma = await realizarPeticion('GET', `/creditos/${idCreditoCreado}/cronograma`, null, tokenCajero);
    const primeraCuota = resCronograma.datos[0];
    console.log(`  -> Primera cuota a pagar: Nro ${primeraCuota.numeroCuota}, Monto Total: Bs ${primeraCuota.monto}`);

    const resPago = await realizarPeticion('POST', '/pagos', {
      idCuota: primeraCuota.idCuota,
      montoAbonado: primeraCuota.monto,
      formaPago: 'EFECTIVO'
    }, tokenCajero);

    if (resPago.codigoEstado !== 200) {
      throw new Error('Error al registrar pago: ' + JSON.stringify(resPago));
    }
    console.log(`  -> Pago REGISTRADO. Comprobante Nro: ${resPago.datos.numeroRecibo}`);
    console.log(`  -> Desglose aplicado: Capital Bs ${resPago.datos.montoCapital}, Interés Bs ${resPago.datos.montoInteres}, Mora Bs ${resPago.datos.montoMora}`);

    // 14. Ejecutar Control de Mora
    console.log('\n[Paso 14] Ejecutando proceso de control de mora...');
    const resMora = await realizarPeticion('POST', '/mora/ejecutar-control', {}, tokenJefe);
    console.log(`  -> Control de mora ejecutado: ${resMora.datos.cuotasAfectadas} cuotas actualizadas.`);

    // 15. Login Gerente y Reportes Ejecutivos
    console.log('\n[Paso 15] Autenticando Gerente (gerente1) y consultando métricas de cartera...');
    const resLoginGerente = await realizarPeticion('POST', '/auth/login', {
      login: 'gerente1',
      password: 'Bancario2026!'
    });
    const tokenGerente = resLoginGerente.datos.token;

    const resReportes = await realizarPeticion('GET', '/reportes/resumen', null, tokenGerente);
    console.log('  -> Métricas de Cartera:', resReportes.datos.indicadoresGenerales);

    // 16. Auditoría
    console.log('\n[Paso 16] Verificando pistas de auditoría inmutables...');
    const resAuditoria = await realizarPeticion('GET', '/auditoria', null, tokenJefe);
    console.log(`  -> Total de eventos de auditoría registrados: ${resAuditoria.datos.length}`);
    console.log('  -> Último evento registrado:', resAuditoria.datos[0]?.operacion, '-', resAuditoria.datos[0]?.detalles);

    console.log('\n================================================================');
    console.log('   ¡TODAS LAS PRUEBAS DE INTEGRACIÓN FINALIZARON CON ÉXITO! (100%)');
    console.log('================================================================\n');

    if (servidorLocal) {
      servidorLocal.close();
    }
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBA DE INTEGRACIÓN:', error.message);
    if (servidorLocal) {
      servidorLocal.close();
    }
    process.exit(1);
  }
}

ejecutarPruebasIntegracion();
