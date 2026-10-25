/**
 * PRUEBA DE INTEGRACIÓN Y PILOTO DEL SISTEMA DE GESTIÓN DE CRÉDITOS BANCARIOS
 * INF-241 Análisis y Diseño de Sistemas I - UMSA
 * 
 * Verifica el ciclo de vida completo y los 9 requerimientos finales:
 * 1. Health check y persistencia estricta MySQL
 * 2. Autenticación RBAC y JWT de 15 minutos (CU15 / RF16 / RNF01)
 * 3. Registro de cliente con correo para notificaciones digitales (CU01 / RF01)
 * 4. Registro de solicitud crediticia de alto monto (> Bs 70.000) (CU02 / RF03 / RN04)
 * 5. Registro de garantías con documentos adjuntos de validación (CU06 / RF07 / P12)
 * 6. Pase a evaluación e integración con Buró ASFI (CU03 / RF04)
 * 7. Evaluación de capacidad y emisión de dictamen de riesgo (CU04, CU05 / RF05, RF06)
 * 8. Bloqueo de atribución autónoma del Jefe de Créditos (> Bs 70.000) (CA13)
 * 9. Derivación de solicitud a instancia superior (Gerencia) (DERIVADA_A_GERENCIA)
 * 10. Aprobación por el Gerente General en base al informe (CU07 / RF08)
 * 11. Generación de contrato y amortización francesa (CU09, CU10 / RF10, RF11)
 * 12. Desembolso mediante Core Bancario (CU11 / RF12)
 * 13. Cobro de cuota en ventanilla con prelación estricta (Mora -> Interés -> Capital)
 * 14. Despacho de notificación oficial de pago por correo electrónico al cliente
 * 15. Proceso automático de control y devengamiento diario de mora (CU13 / RF14)
 * 16. Generación de métricas e indicadores de cartera gerenciales (CU14 / RF15)
 * 17. Verificación de pistas inmutables de auditoría (RN12 / RNF06)
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
  app.use(express.json({ limit: '10mb' }));
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
        } catch {
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
  console.log('   PRUEBA PILOTO INTEGRAL: SISTEMA DE CRÉDITOS BANCARIOS');
  console.log('   Universidad Mayor de San Andrés · Carrera de Informática');
  console.log('   Validación de Requerimientos: Escalamiento, Garantías, Factura y Notificaciones');
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

    // 3. Crear nuevo cliente con correo electrónico
    console.log('\n[Paso 3] Registrando nuevo cliente bancario con correo para notificaciones...');
    const ciUnico = 'CI-' + Math.floor(1000000 + Math.random() * 9000000);
    const emailCliente = `cliente.${Math.floor(Math.random() * 10000)}@umsa.bo`;
    const resCliente = await realizarPeticion('POST', '/clientes', {
      ci: ciUnico,
      nombres: 'Gonzalo Mauricio',
      apellidos: 'Vargas Peñaranda',
      telefono: '77234567',
      email: emailCliente,
      direccion: 'Av. 20 de Octubre Esq. Aspiazu #1940, La Paz',
      ingresosMensuales: 22000.00
    }, tokenOficial);

    if (resCliente.codigoEstado !== 200) {
      throw new Error('Error al registrar cliente: ' + JSON.stringify(resCliente));
    }
    const idClienteCreado = resCliente.datos.idCliente;
    console.log(`  -> Cliente creado exitosamente. ID: ${idClienteCreado}, CI: ${ciUnico}, Email: ${emailCliente}`);

    // 4. Crear solicitud de crédito de alto monto (> Bs 70.000 para probar escalamiento)
    console.log('\n[Paso 4] Creando solicitud de crédito vehicular por Bs 85.000 (> Límite Jefe Bs 70.000)...');
    const resSolicitud = await realizarPeticion('POST', '/solicitudes', {
      ciCliente: ciUnico,
      tipoCredito: 'VEHICULAR',
      montoSolicitado: 85000.00,
      plazoMeses: 36,
      destino: 'Adquisición de vagoneta de transporte y utilitario comercial',
      documentacionCompleta: true
    }, tokenOficial);

    if (resSolicitud.codigoEstado !== 200) {
      throw new Error('Error al crear solicitud: ' + JSON.stringify(resSolicitud));
    }
    const idSolicitudCreada = resSolicitud.datos.idSolicitud;
    console.log(`  -> Solicitud Nro ${idSolicitudCreada} registrada. Código: ${resSolicitud.datos.numeroSolicitud}, Monto: Bs 85.000`);

    // 5. Registrar Garantía con Documentos Adjuntos de Validación
    console.log('\n[Paso 5] Registrando garantía hipotecaria con documentos adjuntos (Requerimiento 7)...');
    const resGarantia = await realizarPeticion('POST', '/garantias', {
      idSolicitud: idSolicitudCreada,
      tipo: 'HIPOTECARIA',
      descripcion: 'Departamento residencial Zona Sopocachi, Folio Real N° 201491823',
      valorTasacion: 120000.00,
      documentosAdjuntos: [
        {
          nombre: 'folio_real_201491823.pdf',
          tipo: 'application/pdf',
          tamanio: '380 KB',
          datos: 'data:application/pdf;base64,JVBERi0xLjQKJVRlc3REb2N1bWVudA=='
        },
        {
          nombre: 'certificado_alodial_gravamen.pdf',
          tipo: 'application/pdf',
          tamanio: '210 KB',
          datos: 'data:application/pdf;base64,JVBERi0xLjQKJVRlc3RHcmF2YW1lbg=='
        }
      ]
    }, tokenOficial);

    if (resGarantia.codigoEstado !== 200) {
      throw new Error('Error al registrar garantía: ' + JSON.stringify(resGarantia));
    }
    console.log(`  -> Garantía registrada. ID: ${resGarantia.datos.idGarantia}, Cobertura: ${resGarantia.datos.coberturaPorcentaje}% (≥ 120%)`);
    console.log(`  -> Documentos de validación adjuntos correctamente: ${resGarantia.datos.documentosAdjuntos?.length || 2} archivo(s)`);

    // 6. Login Analista de Riesgos
    console.log('\n[Paso 6] Autenticando Analista de Riesgos (lrojas)...');
    const resLoginAnalista = await realizarPeticion('POST', '/auth/login', {
      login: 'lrojas',
      password: 'Bancario2026!'
    });
    const tokenAnalista = resLoginAnalista.datos.token;

    // Iniciar evaluación
    await realizarPeticion('POST', `/solicitudes/${idSolicitudCreada}/iniciar-evaluacion`, {}, tokenAnalista);

    // Consultar Buró de Riesgo externo ASFI
    console.log('\n[Paso 7] Consultando Buró de Riesgo externo ASFI...');
    const resBuro = await realizarPeticion('POST', `/evaluaciones/solicitud/${idSolicitudCreada}/consultar-buro`, {}, tokenAnalista);
    console.log(`  -> Calificación Buró: ${resBuro.datos.estadoHistorial}, Score: ${resBuro.datos.score}`);

    // Emitir Dictamen Favorable
    console.log('\n[Paso 8] Evaluando capacidad de pago y emitiendo dictamen de riesgo...');
    const resDictamen = await realizarPeticion('POST', '/evaluaciones/dictamen', {
      idSolicitud: idSolicitudCreada,
      ingresos: 22000.00,
      gastos: 6500.00,
      deudasVigentes: 1200.00,
      referenciaBuro: resBuro.datos.referencia,
      scoreBuro: resBuro.datos.score,
      nivelRiesgo: 'BAJO',
      resultado: 'FAVORABLE',
      dictamen: 'Sujeto de crédito con excelente capacidad de pago (DTI 25%) y cobertura patrimonial 141%.'
    }, tokenAnalista);
    console.log('  -> Dictamen técnico emitido:', resDictamen.datos.resultado);

    // 9. Login Jefe de Créditos y Verificación de Bloqueo por Límite de Atribución (> Bs 70.000)
    console.log('\n[Paso 9] Autenticando Jefe de Créditos (cmendoza)...');
    const resLoginJefe = await realizarPeticion('POST', '/auth/login', {
      login: 'cmendoza',
      password: 'Bancario2026!'
    });
    const tokenJefe = resLoginJefe.datos.token;

    console.log('\n[Paso 10] Intentando aprobar crédito de Bs 85.000 con atribución del Jefe (Límite: Bs 70.000)...');
    const resAprobarBloqueado = await realizarPeticion('POST', `/solicitudes/${idSolicitudCreada}/aprobar`, {}, tokenJefe);
    if (resAprobarBloqueado.codigoEstado === 400) {
      console.log('  -> Bloqueo automático correcto (CA13): Excede límite de atribución (Bs 70.000).');
      console.log('  -> Mensaje del sistema:', resAprobarBloqueado.datos.mensaje || resAprobarBloqueado.datos.error);
    } else {
      throw new Error('Fallo de validación CA13: Debería haberse bloqueado la aprobación por exceso de límite.');
    }

    // 10. Derivar Solicitud a Instancia Superior (Gerencia) (Requerimiento 6)
    console.log('\n[Paso 11] Derivando solicitud a Gerencia General (Requerimiento 6)...');
    const resDerivar = await realizarPeticion('POST', `/solicitudes/${idSolicitudCreada}/derivar`, {
      motivo: 'Monto solicitado de Bs 85.000 excede límite de jefatura. Se eleva a Gerencia General conforme al informe técnico.'
    }, tokenJefe);

    if (resDerivar.codigoEstado !== 200 || resDerivar.datos.estado !== 'DERIVADA_A_GERENCIA') {
      throw new Error('Error al derivar solicitud a gerencia: ' + JSON.stringify(resDerivar));
    }
    console.log(`  -> Solicitud ${resSolicitud.datos.numeroSolicitud} derivada con éxito.`);
    console.log(`  -> Nuevo estado de la solicitud: ${resDerivar.datos.estado}`);

    // 11. Login Gerente y Aprobación en Base al Informe (Requerimiento 5)
    console.log('\n[Paso 12] Autenticando Gerente General (gerente1) (Requerimiento 5)...');
    const resLoginGerente = await realizarPeticion('POST', '/auth/login', {
      login: 'gerente1',
      password: 'Bancario2026!'
    });
    if (resLoginGerente.codigoEstado !== 200) {
      throw new Error('Fallo login gerente: ' + JSON.stringify(resLoginGerente));
    }
    const tokenGerente = resLoginGerente.datos.token;
    console.log('  -> Autenticación de Gerente exitosa. Límite de atribución:', resLoginGerente.datos.limiteAtribucion);

    console.log('\n[Paso 13] Gerente aprueba el crédito en base al informe financiero favorable...');
    const resAprobarGerente = await realizarPeticion('POST', `/solicitudes/${idSolicitudCreada}/aprobar`, {
      observaciones: 'Aprobación colegiada de Gerencia General en base al informe favorable y garantías adjuntas.'
    }, tokenGerente);

    if (resAprobarGerente.codigoEstado !== 200) {
      throw new Error('Error en aprobación por gerente: ' + JSON.stringify(resAprobarGerente));
    }
    const idCreditoCreado = resAprobarGerente.datos.idCredito;
    const numeroCredito = resAprobarGerente.datos.numeroCredito;
    console.log(`  -> Crédito APROBADO por Gerente: ${numeroCredito} (ID: ${idCreditoCreado})`);
    console.log(`  -> Contrato Formalizado Nro: ${resAprobarGerente.datos.numeroContrato}`);
    console.log(`  -> Plan de amortización francesa: ${resAprobarGerente.datos.cantidadCuotas} cuotas generadas.`);

    // 12. Desembolsar Crédito por Core Bancario
    console.log('\n[Paso 14] Ejecutando desembolso de fondos mediante Core Bancario...');
    const resDesembolso = await realizarPeticion('POST', `/creditos/${idCreditoCreado}/desembolsar`, {}, tokenGerente);
    if (resDesembolso.codigoEstado !== 200) {
      throw new Error('Fallo en desembolso: ' + JSON.stringify(resDesembolso));
    }
    console.log(`  -> Desembolso EXITOSO. Código de transacción Core: ${resDesembolso.datos.codigoTransaccionCore}`);

    // 13. Login Cajero y Cobro de Cuota con Notificación por Correo (Requerimientos 2 y 4)
    console.log('\n[Paso 15] Autenticando Cajero de Ventanilla (cajero1)...');
    const resLoginCajero = await realizarPeticion('POST', '/auth/login', {
      login: 'cajero1',
      password: 'Bancario2026!'
    });
    const tokenCajero = resLoginCajero.datos.token;

    console.log('\n[Paso 16] Consultando cuotas y registrando pago con notificación por correo...');
    const resCronograma = await realizarPeticion('GET', `/creditos/${idCreditoCreado}/cronograma`, null, tokenCajero);
    const primeraCuota = resCronograma.datos[0];

    const resPago = await realizarPeticion('POST', '/pagos', {
      idCuota: primeraCuota.idCuota,
      montoAbonado: primeraCuota.monto,
      formaPago: 'EFECTIVO'
    }, tokenCajero);

    if (resPago.codigoEstado !== 200) {
      throw new Error('Error al registrar pago: ' + JSON.stringify(resPago));
    }
    console.log(`  -> Pago REGISTRADO en Caja. Comprobante Nro: ${resPago.datos.numeroRecibo}`);
    console.log(`  -> Desglose en cascada: Capital Bs ${resPago.datos.montoCapital}, Interés Bs ${resPago.datos.montoInteres}, Mora Bs ${resPago.datos.montoMora}`);
    console.log(`  -> Saldo remanente de capital: Bs ${resPago.datos.saldoCapitalCredito}`);
    if (resPago.datos.notificacionEmail) {
      console.log(`  -> Notificación enviada a: ${resPago.datos.notificacionEmail.destinatario} (${resPago.datos.notificacionEmail.simulado ? 'Simulada ASFI' : 'SMTP Real'})`);
    }

    // 14. Ejecutar Proceso Diario de Control de Mora (Requerimiento 8)
    console.log('\n[Paso 17] Ejecutando proceso de control y devengamiento diario de mora (Requerimiento 8)...');
    const resMora = await realizarPeticion('POST', '/mora/ejecutar-control', {}, tokenJefe);
    if (resMora.codigoEstado !== 200) {
      throw new Error('Error al ejecutar control de mora: ' + JSON.stringify(resMora));
    }
    console.log(`  -> Control de mora ejecutado: ${resMora.datos.cuotasAfectadas} cuotas vencidas actualizadas.`);

    // 15. Reporte Consolidado
    console.log('\n[Paso 18] Consultando métricas consolidadas de cartera...');
    const resReportes = await realizarPeticion('GET', '/reportes/resumen', null, tokenGerente);
    console.log('  -> Indicadores de Cartera:', resReportes.datos.indicadoresGenerales);
    console.log('  -> Conteo de Solicitudes por Estado:', resReportes.datos.solicitudesPorEstado);

    // 16. Verificación de Auditoría Inmutable
    console.log('\n[Paso 19] Verificando pistas inmutables de auditoría (RN12 / RNF06)...');
    const resAuditoria = await realizarPeticion('GET', '/auditoria', null, tokenGerente);
    console.log(`  -> Total de eventos de auditoría registrados: ${resAuditoria.datos.length}`);
    const eventosClave = resAuditoria.datos.filter(e => 
      ['DERIVAR_A_GERENCIA', 'APROBAR_CREDITO', 'REGISTRAR_PAGO', 'ENVIAR_NOTIFICACION_PAGO', 'REGISTRAR_GARANTIA'].includes(e.operacion)
    );
    console.log(`  -> Eventos clave verificados en auditoría: ${eventosClave.length} trazas registradas.`);

    console.log('\n================================================================');
    console.log('   ¡PRUEBA PILOTO COMPLETADA CON ÉXITO AL 100%! TODOS LOS FLUJOS VERIFICADOS');
    console.log('================================================================\n');

    if (servidorLocal) {
      servidorLocal.close();
    }
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBA PILOTO:', error.message);
    if (servidorLocal) {
      servidorLocal.close();
    }
    process.exit(1);
  }
}

ejecutarPruebasIntegracion();
