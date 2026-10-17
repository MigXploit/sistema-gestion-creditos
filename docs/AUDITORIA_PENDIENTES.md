# Auditoría de Pendientes – Sistema de Gestión de Créditos
## UMSA – Análisis y Diseño de Sistemas I
**Fecha de auditoría:** 2026-10-17  
**Rama auditada:** `main` (commit `0dd9dce`)

---

## 1. Estado de Requisitos Funcionales (RF01 – RF16)

| RF | Descripción | Estado | Evidencia |
|---|---|---|---|
| RF01 | Registrar cliente | COMPLETO | ClienteService.registrarCliente · POST /api/clientes · CA01-CA02 pasan |
| RF02 | Editar cliente | COMPLETO | ClienteService.actualizarCliente · PUT /api/clientes/{id} · CA03 pasa |
| RF03 | Registrar solicitud de crédito | COMPLETO | SolicitudService.registrarSolicitud · POST /api/solicitudes · CA04-CA05 pasan |
| RF04 | Consultar historial crediticio (Buró) | COMPLETO | EvaluacionService.consultarBuro + BuroRiesgoSimulatorAdapter · CA06-CA07 pasan |
| RF05 | Evaluar capacidad de pago | COMPLETO | EvaluacionService.calcularCapacidadPago · formula DTI sección 13.5 · CA08 pasa |
| RF06 | Evaluar riesgo y emitir dictamen | COMPLETO | EvaluacionService.emitirDictamen · enum ResultadoEvaluacion (FAVORABLE/DESFAVORABLE) · CA09 pasa |
| RF07 | Registrar garantía | COMPLETO | GarantiaService.registrarGarantia · POST /api/solicitudes/{id}/garantias · CA10 pasa |
| RF08 | Aprobar crédito | COMPLETO | CreditoService.aprobarCredito · límite Bs 70.000 · cronograma atómico · CA11-CA13 pasan |
| RF09 | Rechazar crédito | COMPLETO | CreditoService.rechazarCredito · POST /api/solicitudes/{id}/rechazar · CA14 pasa |
| RF10 | Generar contrato | COMPLETO | CreditoService.generarContrato · POST /api/creditos/{id}/contrato · CA15 pasa |
| RF11 | Generar cronograma de pagos | COMPLETO | AmortizacionService (francés) · POST /api/creditos/{id}/cronograma · CA16 pasa |
| RF12 | Desembolsar crédito | PARCIAL | Endpoint POST /api/creditos/{id}/desembolsar implementado; pantalla P08 PENDIENTE BLOQUE 3 |
| RF13 | Registrar pago de cuota | PENDIENTE B3 | PagoService y POST /api/pagos no implementados; CA19-CA21 pendientes |
| RF14 | Controlar mora | PENDIENTE B3 | Job de mora no implementado; CA22 pendiente |
| RF15 | Generar reportes | PENDIENTE B3 | Servicio reportes no implementado; CA23 pendiente |
| RF16 | Administrar usuarios | COMPLETO | UsuarioService · POST/PUT /api/usuarios · CA24-CA25 pasan |

---

## 2. Estado de Criterios de Aceptación Funcionales (CA01 – CA25)

| CA | Estado | Test |
|---|---|---|
| CA01 | PASA | Bloque2CasosDeUsoIntegrationTest.test_CA01 |
| CA02 | PASA | test_CA02_CIDuplicadaError |
| CA03 | PASA | test_CA03_ActualizarCliente |
| CA04 | PASA | test_CA04_RegistrarSolicitudValida |
| CA05 | PASA | test_CA05_SolicitudDocumentacionIncompleta |
| CA06 | PASA | test_CA06_ConsultarBuroExitoso |
| CA07 | PASA | test_CA07_BuroFallo |
| CA08 | PASA | test_CA08_CapacidadPago |
| CA09 | PASA | test_CA09_EmitirDictamen |
| CA10 | PASA | test_CA10_RegistrarGarantia |
| CA11 | PASA | test_CA11_AprobarCredito |
| CA12 | PASA | test_CA12_EstadoSolicitudAprobada |
| CA13 | PASA | test_CA13_LimiteAtribucion |
| CA14 | PASA | test_CA14_RechazarCredito |
| CA15 | PASA | test_CA15_GenerarContrato |
| CA16 | PASA | AmortizacionServiceTest + test_CA16_CronogramaPagos |
| CA17 | PENDIENTE B3 | Sin test automatizado |
| CA18 | PENDIENTE B3 | Sin test automatizado |
| CA19 | PENDIENTE B3 | Sin test automatizado |
| CA20 | PENDIENTE B3 | Sin test automatizado |
| CA21 | PENDIENTE B3 | Sin test automatizado |
| CA22 | PENDIENTE B3 | Sin test automatizado |
| CA23 | PENDIENTE B3 | Sin test automatizado |
| CA24 | PASA | AuthIntegrationTest |
| CA25 | PASA | AuthIntegrationTest |

---

## 3. Estado de Pantallas (P01 – P14)

| Pantalla | Estado | Componente |
|---|---|---|
| P01 Login | COMPLETO | LoginScreen.tsx |
| P02 Lista solicitudes | COMPLETO | SolicitudesView.tsx |
| P03 Contrato | COMPLETO | ContratoModal.tsx |
| P04 Aprobar | COMPLETO | AprobarModal.tsx |
| P05 Cronograma | COMPLETO | CronogramaModal.tsx |
| P06 Rechazar | COMPLETO | RechazarModal.tsx |
| P07 Lista créditos activos | PENDIENTE B3 | No implementada |
| P08 Desembolso | PENDIENTE B3 | No implementada |
| P09 Registro pagos (Caja) | PENDIENTE B3 | No implementada |
| P10 Clientes | COMPLETO | ClientesView.tsx |
| P11 Registrar solicitud | COMPLETO | SolicitudRegistroModal.tsx |
| P12 Garantías | COMPLETO | GarantiasModal.tsx |
| P13 Evaluación y dictamen | COMPLETO | EvaluacionModal.tsx |
| P14 Gestión usuarios | COMPLETO | UsuariosView.tsx |

---

## 4. Ítems Pendientes para Bloque 3

| ID | Ítem | RF/CU | CA |
|---|---|---|---|
| B3-01 | PagoService + POST /api/pagos | RF13/CU12 | CA19-CA21 |
| B3-02 | Job mora (@Scheduled) | RF14/CU13 | CA22 |
| B3-03 | Servicio reportes + GET /api/reportes/* | RF15/CU14 | CA23 |
| B3-04 | Pantalla P07 créditos activos | RF08 | CA11 |
| B3-05 | Pantalla P08 desembolso | RF12/CU11 | CA17-CA18 |
| B3-06 | Pantalla P09 registro pagos | RF13 | CA19-CA21 |
| B3-07 | Tests automáticos CA17-CA23 | RF12-RF15 | CA17-CA23 |
| B3-08 | Configurar TLS 1.3 en producción | RNF02 | CANF09 |

---

## 5. Desviaciones y Supuestos Registrados

| ID | Tipo | Descripción | Estado |
|---|---|---|---|
| DEC-01 | DESVIACIÓN APROBADA | H2 solo tests; PostgreSQL 16 en dev/prod | ACTIVO |
| DEC-02 | APROBADO | GARANTIA.id_solicitud NOT NULL + id_credito nullable | APROBADO |
| DEC-03 | PENDIENTE | Primer vencimiento = fecha aprobación + n meses | PENDIENTE GRUPO |
| DEC-04 | APROBADO | Límite atribución Jefe = Bs 70.000 | APROBADO |
| PAR-NEG-02 | SUPUESTO | Límites monto/plazo por producto no definidos en informe | PENDIENTE GRUPO |
| DOC-01 | DESVIACIÓN | documentacion_completa (booleano único) en SolicitudCredito | PENDIENTE GRUPO |

*Generado 2026-10-17. Actualizar antes de cada entrega.*
