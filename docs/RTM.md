# Matriz de Trazabilidad de Requisitos (RTM)
## Sistema de Gestión de Créditos Bancario - UMSA

Fuente de verdad: `docs/Sistema_Gestion_Creditos_Base.md`.

---

## 1. Registro de Desviaciones y Decisiones de Arquitectura

| ID | Tema | Decisión / Desviación | Justificación / Fuente | Estado |
|---|---|---|---|---|
| DEC-01 | Entorno BD Pruebas | PostgreSQL 16 es el motor principal obligatorio en producción/desarrollo (D10, D11). H2 en memoria se permite exclusivamente para ejecución de pruebas automatizadas aisladas. | Desviación autorizada para agilidad en testing unitario/integración sin mockear JPA. | ACTIVO |
| DEC-02 | Modelo Garantía | `GARANTIA.id_credito` nullable + adición de `GARANTIA.id_solicitud BIGINT NOT NULL` (FK a `SOLICITUD_CREDITO`). | CA10 ("asociada a la solicitud y al crédito cuando exista") y P12. Resuelve contradicción CU06 vs CU07. | APROBADO |
| DEC-03 | Primer Vencimiento Cronograma | Cuota $n$ vence $n$ meses después de una fecha de referencia, conservando el día del mes. Provisionalmente concentrado en la fecha de aprobación en un método configurable. | P05 (vencimientos el mismo día mensual) y CA16. Decisión final del grupo/docente pendiente. | PENDIENTE |
| DEC-04 | Límite Atribución Jefe | Límite en Bs 70.000. Montos superiores se bloquean y derivan a nivel superior (Comité no modelado). | Sección 13.5 (Límites de atribución), CU07 y CA13. | APROBADO |
| DEC-05 | Autenticación y Bloqueo | Bloqueo al 5.° intento fallido consecutivo; sesión expira a los 15 minutos (JWT). | Sección 16.2 y RNF01. | APROBADO |
| DEC-06 | Rol Cliente | Cliente no inicia sesión en el sistema. | Apéndice B, B4. | APROBADO |

---

## 2. Matriz Principal de Trazabilidad (RF01 - RF16)

| RF | Caso de Uso | Reglas de Negocio | Entidad / Clase | Endpoint REST | Pantalla | Tablas BD | Criterios Aceptación | Estado |
|---|---|---|---|---|---|---|---|---|
| **RF01** | CU01 (Registrar cliente) | RN12 | `Cliente` | `POST /api/clientes` | P10 | `CLIENTE`, `AUDITORIA` | CA01, CA02 | PENDIENTE |
| **RF02** | CU01 (Actualizar cliente) | RN12 | `Cliente` | `PUT /api/clientes/{id}` | P10 | `CLIENTE`, `AUDITORIA` | CA03 | PENDIENTE |
| **RF03** | CU02 (Registrar solicitud) | RN01, RN02 | `SolicitudCredito` | `POST /api/solicitudes` | P11 | `SOLICITUD_CREDITO`, `AUDITORIA` | CA04, CA05 | PENDIENTE |
| **RF04** | CU03 (Consultar historial) | RN14 | `EvaluacionCredito` | `POST /api/evaluaciones/consultar-buro` | P13 | `EVALUACION_CREDITO` | CA06, CA07 | PENDIENTE |
| **RF05** | CU04 (Evaluar capacidad) | RN03 | `EvaluacionCredito` | `POST /api/evaluaciones/calcular-capacidad` | P13 | `EVALUACION_CREDITO` | CA08 | PENDIENTE |
| **RF06** | CU05 (Evaluar riesgo) | RN03, RN14 | `EvaluacionCredito` | `POST /api/evaluaciones/dictamen` | P13 | `EVALUACION_CREDITO` | CA09 | PENDIENTE |
| **RF07** | CU06 (Registrar garantía) | RN13 | `Garantia` | `POST /api/solicitudes/{id}/garantias` | P12 | `GARANTIA` | CA10 | PENDIENTE |
| **RF08** | CU07 (Aprobar crédito) | RN02, RN03, RN04, RN12 | `Credito`, `SolicitudCredito` | `POST /api/solicitudes/{id}/aprobar` | P02, P04 | `SOLICITUD_CREDITO`, `CREDITO`, `AUDITORIA` | CA11, CA12, CA13 | PENDIENTE |
| **RF09** | CU08 (Rechazar crédito) | RN02, RN11, RN12 | `SolicitudCredito` | `POST /api/solicitudes/{id}/rechazar` | P06 | `SOLICITUD_CREDITO`, `AUDITORIA` | CA14 | PENDIENTE |
| **RF10** | CU09 (Generar contrato) | RN05 | `Contrato` | `POST /api/creditos/{id}/contrato` | P03 | `CONTRATO` | CA15 | PENDIENTE |
| **RF11** | CU10 (Generar cronograma) | RN06, RN07 | `Cuota` | `POST /api/creditos/{id}/cronograma` | P05 | `CUOTA` | CA16 | PENDIENTE |
| **RF12** | CU11 (Desembolsar crédito) | RN05, RN06, RN12 | `Credito` | `POST /api/creditos/{id}/desembolsar` | Desembolso (Pendiente) | `CREDITO`, `AUDITORIA` | CA17, CA18 | PENDIENTE |
| **RF13** | CU12 (Registrar pago) | RN07, RN08, RN10 | `Pago`, `Cuota`, `Credito` | `POST /api/pagos` | Caja (Pendiente) | `PAGO`, `CUOTA`, `CREDITO` | CA19, CA20, CA21 | PENDIENTE |
| **RF14** | CU13 (Controlar mora) | RN09, RN12 | `Cuota`, `Credito` | `POST /api/mora/ejecutar-control` | Automático / Job | `CUOTA`, `CREDITO`, `AUDITORIA` | CA22 | PENDIENTE |
| **RF15** | CU14 (Generar reportes) | — | Reportes Service | `GET /api/reportes/*` | Reportes (Pendiente) | Lectura sobre todas | CA23 | PENDIENTE |
| **RF16** | CU15 (Administrar usuarios) | RN12 | `Usuario`, `UsuarioService` | `GET/POST /api/usuarios`, `PUT /api/usuarios/{id}/estado` | P14 (`UsuariosView`) | `USUARIO`, `AUDITORIA` | CA24, CA25 | COMPLETO (`AuthIntegrationTest`) |

---

## 3. Matriz de Requisitos No Funcionales y Seguridad (RNF / Fase 2)

| Requisito / Tema | Especificación | Implementación | Pantalla | Pruebas | Estado |
|---|---|---|---|---|---|
| **RNF01 (Autenticación)** | Login con JWT, contraseñas encriptadas con BCrypt | `AuthService`, `JwtTokenProvider`, `SecurityConfig` | P01 (`LoginScreen`) | `AuthIntegrationTest.testLoginExitosoJefeCarlosMendoza`, `PasswordHashGeneratorTest` | COMPLETO |
| **RNF01 (Control de Bloqueo)** | Bloqueo al 5.° intento fallido consecutivo durante 30 min | `AuthService.login` (conteo de `intentos_fallidos`) | P01 | `AuthIntegrationTest.testLoginCredencialesInvalidas` | COMPLETO |
| **RNF01 / RNF06 (Sesión)** | Expiración de token a los 15 minutos de inactividad | `jwt.expiration-ms=900000` (15 min) en backend y timer en frontend | Frontend `Layout` | Configurado en `application.yml` | COMPLETO |
| **RBAC (Matriz 16.2)** | Acceso a endpoints restringido por roles (`@PreAuthorize`) | Spring Security `hasAnyRole` / `hasRole` | Menú lateral dinámico | `AuthIntegrationTest.testControlAccesoRbacAdminVsOficial` (403 vs 200) | COMPLETO |
| **RN12 (Auditoría Inmutable)** | Registro de eventos críticos en tabla `AUDITORIA` (solo INSERT) | `AuditoriaService.registrarEvento`, `AuditoriaController` | `AuditoriaView` | Verificado en tests de autenticación y creación de usuario | COMPLETO |

