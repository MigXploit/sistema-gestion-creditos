# Guía de Funcionamiento del Sistema
## Sistema de Gestión de Créditos Bancario – UMSA

---

## 1. Arquitectura General

El sistema sigue una arquitectura **hexagonal (Ports & Adapters)** con tres capas principales:

```
Frontend (React + Vite + TypeScript)  -- puerto 5173
        |  HTTP/JSON (JWT Bearer)
Backend (Spring Boot 3.3)             -- puerto 8080
        |  JPA / Flyway
Base de Datos (PostgreSQL 16)         -- puerto 5432
              (H2 en-memoria para tests)
```

### Módulos del Backend

```
com.umsa.creditos
├── dominio/
│   ├── entidades/     # Cliente, SolicitudCredito, EvaluacionCredito,
│   │                  # Credito, Garantia, Cuota, Contrato, Pago, Usuario, Auditoria
│   ├── enums/         # EstadoSolicitud, TipoCredito, ResultadoEvaluacion,
│   │                  # EstadoGarantia, EstadoContrato, RolUsuario
│   └── repositorios/  # Spring Data JPA (10 interfaces)
├── aplicacion/
│   ├── servicios/     # ClienteService, SolicitudService, GarantiaService,
│   │                  # EvaluacionService, AmortizacionService, CreditoService
│   ├── dtos/          # DTOs de entrada/salida para todos los endpoints
│   ├── auditoria/     # AuditoriaService (solo INSERT, inmutable)
│   └── puertos/       # BuroRiesgoPort (interface)
└── infraestructura/
    ├── controladores/ # ClienteController, SolicitudController, GarantiaController,
    │                  # EvaluacionController, CreditoController, AuthController,
    │                  # UsuarioController, AuditoriaController
    ├── adaptadores/   # BuroRiesgoSimulatorAdapter (simulador configurable)
    ├── config/        # SecurityConfig, JwtTokenProvider, BusinessException,
    │                  # DevDataSeeder, BusinessRulesConfig
    └── seguridad/     # JwtAuthFilter, CustomUserDetailsService
```

---

## 2. Cómo Levantar el Sistema

### Prerrequisitos
- Java 17+ (probado con Java 26)
- Node.js 18+
- PostgreSQL 16 instalado y corriendo (para perfil `default`)

### Paso 1: Base de Datos PostgreSQL

```sql
-- Conectarse como superusuario y ejecutar:
CREATE DATABASE creditos_db;
CREATE USER creditos_user WITH PASSWORD 'Bancario2026!';
GRANT ALL PRIVILEGES ON DATABASE creditos_db TO creditos_user;
```

Las migraciones Flyway se ejecutan automáticamente al iniciar el backend.

### Paso 2: Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
# Perfil por defecto: PostgreSQL en localhost:5432
```

Para desarrollo rápido (H2 en-memoria, no requiere PostgreSQL):
```powershell
.\mvnw.cmd spring-boot:run -Dspring.profiles.active=h2
```

### Paso 3: Frontend

```powershell
cd frontend
npm install
npm run dev
# Disponible en http://localhost:5173
```

---

## 3. Usuarios de Prueba (perfil dev/h2)

| Usuario | Contraseña | Rol | Permisos principales |
|---|---|---|---|
| `cmendoza` | `Bancario2026!` | JEFE_CREDITOS | Aprobar hasta Bs 70.000, ver auditoría |
| `atorrez` | `Bancario2026!` | OFICIAL_CREDITOS | Registrar clientes, solicitudes, garantías |
| `lrojas` | `Bancario2026!` | ANALISTA_RIESGOS | Evaluar, emitir dictamen |
| `cajero1` | `Bancario2026!` | CAJERO | (Bloque 3: registro de pagos) |
| `gerente1` | `Bancario2026!` | GERENTE | Vista ampliada, reportes |
| `admin` | `Bancario2026!` | ADMINISTRADOR | Gestión de usuarios |

---

## 4. Flujo de Trabajo Principal (Demo Solicitud 101)

```
[OFICIAL] Login como atorrez
  → Registrar Cliente (P10): CI=12345678, Juan Pérez, ingresos=8000 Bs
  → Registrar Solicitud (P11): tipo=CONSUMO, monto=25000 Bs, plazo=24 meses
  → Registrar Garantía (P12): tipo=HIPOTECARIA, valor=35000 Bs
[ANALISTA] Login como lrojas
  → Abrir Evaluación (P13)
  → Consultar Buró → resultado FAVORABLE
  → Calcular Capacidad de Pago → DTI OK
  → Emitir Dictamen FAVORABLE
[JEFE] Login como cmendoza
  → Ver solicitud en estado EN_EVALUACION → acción Aprobar (P04)
  → Aprobar: se genera Crédito, Contrato (P03) y Cronograma (P05)
  → Ver Cronograma: 24 cuotas mensuales (amortización francesa)
```

---

## 5. Endpoints REST Principales

| Método | Endpoint | Descripción | Rol |
|---|---|---|---|
| POST | `/api/auth/login` | Obtener token JWT | Público |
| GET | `/api/clientes` | Listar clientes | OFICIAL+ |
| POST | `/api/clientes` | Registrar cliente | OFICIAL |
| PUT | `/api/clientes/{id}` | Actualizar cliente | OFICIAL |
| GET | `/api/solicitudes` | Listar solicitudes | OFICIAL+ |
| POST | `/api/solicitudes` | Registrar solicitud | OFICIAL |
| POST | `/api/solicitudes/{id}/garantias` | Registrar garantía | OFICIAL |
| POST | `/api/evaluaciones/consultar-buro` | Consultar Buró | ANALISTA |
| POST | `/api/evaluaciones/calcular-capacidad` | Calcular DTI | ANALISTA |
| POST | `/api/evaluaciones/dictamen` | Emitir dictamen | ANALISTA |
| POST | `/api/solicitudes/{id}/aprobar` | Aprobar crédito | JEFE |
| POST | `/api/solicitudes/{id}/rechazar` | Rechazar solicitud | JEFE/OFICIAL |
| GET | `/api/creditos/{id}/cronograma` | Ver cronograma | OFICIAL+ |
| POST | `/api/creditos/{id}/contrato` | Generar contrato | JEFE |
| GET | `/api/usuarios` | Listar usuarios | ADMIN |
| POST | `/api/usuarios` | Crear usuario | ADMIN |
| PUT | `/api/usuarios/{id}/estado` | Activar/Desactivar | ADMIN |
| GET | `/api/auditoria` | Ver log de auditoría | JEFE/GERENTE |

---

## 6. Fórmula de Amortización Francesa

La cuota mensual se calcula como:

```
Cuota = Monto * (i * (1+i)^n) / ((1+i)^n - 1)
donde: i = tasa_anual / 12 / 100
```

**Ejemplo verificado** (del informe, P05):
- Monto: Bs 30.000 | Plazo: 12 meses | Tasa: 12% anual
- Cuota mensual: **Bs 2.665,46**
- Suma de capital = Bs 30.000,00 (ajuste de redondeo en última cuota)

---

## 7. Seguridad y RBAC

- **JWT**: Token válido 15 minutos. Al expirar, se muestra pantalla de login.
- **Bloqueo**: 5 intentos fallidos consecutivos → cuenta bloqueada 30 minutos.
- **Roles**: ADMINISTRADOR > JEFE_CREDITOS > GERENTE > OFICIAL_CREDITOS > ANALISTA_RIESGOS > CAJERO
- **Auditoría**: Todos los eventos críticos (login, crear cliente, aprobar crédito, etc.) se registran en tabla `AUDITORIA`. Los registros son de solo inserción (inmutables).

---

## 8. Ejecutar Pruebas Automatizadas

```powershell
cd backend
.\mvnw.cmd test
# Resultado esperado: Tests run: 22, Failures: 0, Errors: 0, Skipped: 0, BUILD SUCCESS
```

| Suite de Tests | Tests | Criterios |
|---|---|---|
| `AmortizacionServiceTest` | 2 | CA16 (fórmula francesa) |
| `AuthIntegrationTest` | 4 | RNF01, RBAC, bloqueo |
| `Bloque2CasosDeUsoIntegrationTest` | 15 | CA01-CA16 |
| `PasswordHashGeneratorTest` | 1 | Generación BCrypt |

---

## 9. Mapa de Carpetas

```
sistema crediticio/
├── backend/
│   ├── src/main/java/com/umsa/creditos/
│   │   ├── dominio/        # Entidades, enums, repositorios
│   │   ├── aplicacion/     # Servicios, DTOs, puertos, auditoría
│   │   └── infraestructura/# Controladores, adaptadores, config, seguridad
│   ├── src/main/resources/
│   │   ├── db/migration/   # V1__init.sql (Flyway – PostgreSQL)
│   │   ├── application.yml             # Perfil PostgreSQL (default)
│   │   └── application-h2.yml          # Perfil H2 (tests)
│   └── src/test/java/      # Suites de tests
├── frontend/
│   ├── src/
│   │   ├── components/     # 14 componentes React (pantallas P01-P14)
│   │   ├── services/api.ts # Cliente HTTP Axios con interceptores JWT
│   │   └── types.ts        # Tipos TypeScript del dominio
│   └── vite.config.ts      # Proxy → backend:8080
└── docs/
    ├── Sistema_Gestion_Creditos_Base.md  # FUENTE DE VERDAD
    ├── RTM.md                            # Matriz de trazabilidad
    ├── DECISIONES_PENDIENTES.md          # Parámetros y supuestos
    ├── AUDITORIA_PENDIENTES.md           # Estado RF/CA/Pantallas
    └── FUNCIONAMIENTO_SISTEMA.md        # Este archivo
```

---

## 10. Parámetros Configurables (application.yml)

| Parámetro | Valor actual | Referencia |
|---|---|---|
| `jwt.expiration-ms` | 900000 (15 min) | RNF01, RNF06 |
| `jwt.secret` | Clave 256-bit dev | RNF02 |
| `business.limite-aprobacion-jefe` | 70000.00 | Sección 13.5, CA13 |
| `business.primer-vencimiento-offset-meses` | 1 (PENDIENTE) | DEC-03 |
| `business.buro-timeout-segundos` | 30 | RNF09, PAR-BUR-02 |
| `buro.modo` | EXITO / FALLO / PARCIAL | RNF09, CA06-CA07 |

---

*Documento de referencia generado el 2026-10-17. Mantener actualizado con cada bloque.*
