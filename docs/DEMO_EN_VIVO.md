# 🏦 Guía Maestra de Demostración en Vivo
## Sistema de Gestión de Créditos Bancario · UMSA · INF-241
### Análisis y Diseño de Sistemas I — Semestre II/2026

> **Objetivo de este documento:** Proveer un guion técnico y operacional exacto, paso a paso, para realizar la defensa oral y demostración en vivo del sistema ante el docente evaluador, asegurando la demostración fluida de todos los requerimientos funcionales (RF), casos de uso (CU), criterios de aceptación (CA) y normativas ASFI.

---

## 📌 1. Ficha Rápida del Sistema y Accesos

| Elemento | URL / Acceso | Observaciones |
|---|---|---|
| **Frontend Web** | [http://localhost:5173](http://localhost:5173) | React + Vite + TypeScript (17 componentes) |
| **Backend REST API** | [http://localhost:8080/api](http://localhost:8080/api) | Arquitectura Hexagonal, JWT, Node.js / Spring |
| **Health Check API** | [http://localhost:8080/api/health](http://localhost:8080/api/health) | Verificación de estado del servidor |
| **Base de Datos** | `creditos_db` (Puerto 3306 / 5432) | Integridad referencial, tablas inmutables |
| **Contraseña Universal** | `Bancario2026!` | Válida para todos los usuarios del sistema |

### 👥 Matriz de Usuarios y Roles para la Demo

| Usuario | Contraseña | Rol en Sistema | Funciones Clave en la Demostración |
|---|---|---|---|
| `atorrez` | `Bancario2026!` | **OFICIAL_CREDITOS** | Registro de clientes, solicitudes y garantías (P10, P11, P12) |
| `lrojas` | `Bancario2026!` | **ANALISTA_RIESGOS** | Buró de crédito, cálculo DTI, dictamen técnico (P13) |
| `cmendoza` | `Bancario2026!` | **JEFE_CREDITOS** | Aprobación (hasta Bs 70.000), contratos, cronogramas (P03, P04, P05) |
| `cajero1` | `Bancario2026!` | **CAJERO** | Ventanilla de caja, cobro de cuotas, recibos de pago (P06, P07) |
| `gerente1` | `Bancario2026!` | **GERENTE** | Dashboard gerencial, reportes de cartera y mora (P08) |
| `admin` | `Bancario2026!` | **ADMINISTRADOR** | Gestión de usuarios, roles, visor de auditoría inmutable (P09, P14) |

---

## ⏱️ 2. Línea de Tiempo de la Demostración (12 a 15 Minutos)

```
[00:00 - 01:30] Presentación, Arquitectura Hexagonal y Login con RBAC
[01:30 - 04:00] FASE 1: Alta de Cliente y Validación de Integridad (OFICIAL)
[04:00 - 06:30] FASE 2: Creación de Solicitud y Registro de Garantías (OFICIAL)
[06:30 - 09:00] FASE 3: Evaluación de Riesgo, Buró y Capacidad de Pago (ANALISTA)
[09:00 - 11:00] FASE 4: Comité de Créditos, Aprobación y Cronograma Francés (JEFE)
[11:00 - 13:00] FASE 5: Desembolso Core Bancario y Cobro de Cuota en Caja (CAJERO)
[13:00 - 15:00] FASE 6: Reportes Gerenciales, Auditoría Inmutable y Preguntas
```

---

## 🚀 3. Flujo Demostrativo Paso a Paso (End-to-End)

### PASO 0: Inicio y Demostración de Seguridad (RNF01, RNF02)
1. Abrir el navegador en `http://localhost:5173`.
2. **Prueba de Seguridad (Credenciales Inválidas - RNF01):**
   - Escribir usuario: `atorrez` y contraseña errónea: `PasswordIncorrecto123`.
   - Clic en **Ingresar**.
   - *Verificar en pantalla:* El sistema muestra una alerta roja destacada con icono de advertencia indicando el conteo regresivo de intentos:
     > `Credenciales inválidas (contraseña incorrecta). Intento 1 de 5 (RNF01). Le quedan 4 intento(s) antes del bloqueo temporal de 30 minutos.`
   - *Comentario al Docente:* *"Demostramos el cumplimiento estricto del requisito de seguridad RNF01: control de autenticación con bloqueo preventivo de cuenta ante 5 intentos fallidos consecutivos."*
3. **Inicio de Sesión Exitoso:**
   - Ingresar con:
     - **Usuario:** `atorrez`
     - **Contraseña:** `Bancario2026!`
   - *Verificar en pantalla:* Se accede al Dashboard con el perfil y menú exclusivo de **Oficial de Créditos**.

---

### PASO 1: Registro de Cliente y Reglas de Negocio (P10 / RF01 / RN01 / CA02)
> **Rol Activo:** `atorrez` (Oficial de Créditos)  
> **Menú:** Clientes → **Nuevo Cliente**

1. Clic en el botón **"+ Registrar Nuevo Cliente"**.
2. **Datos exactos a ingresar para la prueba:**
   - **Cédula de Identidad (CI):** `8945123` (o cualquier CI único)
   - **Nombres:** `Mariela Patricia`
   - **Apellidos:** `Flores Mamani`
   - **Teléfono / Celular:** `71589632`
   - **Dirección Domiciliaria:** `Av. Arce N° 2450, Sopocachi, La Paz`
   - **Ingresos Mensuales Certificados (Bs):** `6500.00`
3. Clic en **"Guardar Cliente"**.
4. *Verificar en pantalla:* Mensaje verde de éxito: `✅ Cliente Mariela Patricia Flores Mamani (CI: 8945123) registrado exitosamente en el sistema (CA01).`
5. **Demostración de Integridad y Recuperación sin Duplicar (Criterio CA02):**
   - Clic nuevamente en **"+ Registrar Nuevo Cliente"**.
   - Escribir en CI el mismo número ya existente: `8945123`.
   - *Verificar en el modal:* Aparece una alerta preventiva en tiempo real indicando: `Aviso de Unicidad (CA02): Este CI ya pertenece a Mariela Patricia Flores Mamani. Al guardar se conservará la ficha existente sin crear duplicados.`
   - Completar cualquier nombre y hacer clic en **"Guardar Cliente"**.
   - *Verificar en pantalla:* Se despliega el banner ámbar de advertencia normativa:
     > `⚠️ Validación de Unicidad (CA02): El cliente con CI 8945123 ya se encontraba registrado en el sistema a nombre de "Mariela Patricia Flores Mamani". Se recuperó su ficha original sin duplicar ni reescribir datos.`
   - *Comentario al Docente:* *"Demostramos el criterio de aceptación CA02: ante intentos de registro duplicado, el sistema no rechaza con caída de servidor ni sobreescribe al cliente original; preserva la integridad del padrón y notifica al operador."*

---

### PASO 2: Registro de Solicitud de Crédito (P11 / RF03 / RN03)
> **Rol Activo:** `atorrez` (Oficial de Créditos)  
> **Menú:** Solicitudes → **"+ Nueva Solicitud"**

1. En el modal emergente de Solicitud:
   - **Buscar Cliente:** Escribir el CI `8945123` y hacer clic en **"Buscar"**.
   - El sistema carga automáticamente: *Mariela Patricia Flores Mamani · Ingresos: Bs 6.500,00*.
2. **Completar las condiciones del préstamo:**
   - **Tipo de Crédito:** `CONSUMO` (tasa de interés anual regulada: 12%).
   - **Monto Solicitado (Bs):** `30000.00` (Treinta mil bolivianos).
   - **Plazo (Meses):** `12` meses.
   - **Destino del Crédito:** `Adquisición de equipamiento de computación y mejoras de oficina`.
3. **Checklist Documental Obligatorio (RN03 / CA05):**
   - Marcar los 4 requisitos normativos:
     - [x] Fotocopia de Cédula de Identidad vigente
     - [x] Factura de servicios básicos (Luz/Agua - Verificación Domicilio)
     - [x] Boletas de pago / Respaldo de ingresos últimos 3 meses
     - [x] Documentación legal de respaldo de garantías
4. Clic en **"Crear Solicitud"**.
5. *Verificar en pantalla:* La solicitud aparece registrada en la grilla con:
   - **Código:** `SOL-2026-XXXXX`
   - **Cliente:** Mariela Patricia Flores Mamani
   - **Monto:** Bs 30.000,00
   - **Estado Inicial:** `REGISTRADA`

---

### PASO 3: Registro de Garantías y Verificación de Cobertura (P12 / RF05 / RN04)
> **Rol Activo:** `atorrez` (Oficial de Créditos)  
> **Acción en la tabla de Solicitudes:** Botón **"Garantías"** en la fila de la solicitud creada.

1. Se abre el modal **"Gestión de Garantías (P12)"**.
2. **Ingresar los datos de la garantía:**
   - **Tipo de Garantía:** `HIPOTECARIA` (o `PRENDARIA`)
   - **Descripción Detallada:** `Inmueble residencial ubicado en Sopocachi Alto, Folio Real N° 2.01.0.99.12345`
   - **Valor Tasado / Comercial (Bs):** `45000.00`
3. Clic en **"Agregar Garantía"**.
4. *Verificar el cálculo automático de cobertura:*
   $$\text{Cobertura} = \frac{\text{Valor Garantía}}{\text{Monto Solicitado}} \times 100 = \frac{45.000}{30.000} \times 100 = 150\%$$
   - *Verificar en pantalla:* Badge verde indicando **"Cobertura: 150.00% (Cumple cobertura mínima exigida ≥ 120%)"**.
   - Cerrar el modal.

---

### PASO 4: Evaluación de Riesgo y Capacidad de Pago (P13 / RF06 / CA06)
> **Cambio de Usuario:** Cerrar sesión (`atorrez`) e iniciar sesión como **`lrojas`** (Analista de Riesgos).  
> **Contraseña:** `Bancario2026!`  
> **Menú:** Solicitudes → Ubicar la solicitud de Mariela Flores → Clic en **"Evaluar"**.

1. Se abre el modal **"Evaluación Crediticia y Buró (P13)"**.
2. **Acción 1: Consulta al Buró de Información Crediticia (RNF09):**
   - Clic en el botón **"Consultar Buró de Crédito"**.
   - El sistema conecta con el adaptador simulador (INFOCRED/ASFI).
   - *Resultado en pantalla:* Score: `780 / 850`, Calificación: `A - Óptimo`, Deudas morosas externas: `Bs 0,00`.
3. **Acción 2: Cálculo Matemático de Capacidad de Pago (DTI):**
   - Clic en **"Calcular Capacidad de Pago (DTI)"**.
   - **Fórmula de Amortización Francesa aplicada:**
     $$\text{Cuota} = M \times \frac{i \cdot (1+i)^n}{(1+i)^n - 1}$$
     - $M = 30.000\text{ Bs}$
     - $i = \frac{12\%}{12} = 1\% = 0.01\text{ mensual}$
     - $n = 12\text{ meses}$
     - **Cuota mensual calculada:** **Bs 2.665,46**
   - **Cálculo del Indicador DTI (Debt-to-Income):**
     $$\text{DTI} = \frac{\text{Cuota}}{\text{Ingresos Mensuales}} \times 100 = \frac{2.665,46}{6.500,00} \times 100 = 41.00\%$$
     *(En caso de registrar ingresos de Bs 8.000, DTI = 33.31% ≤ 40%)*.
   - El sistema valida si el DTI está dentro del umbral prudencial ASFI ($\le 40\%$).
4. **Acción 3: Emisión de Dictamen Técnico:**
   - Seleccionar **Resultado:** `FAVORABLE`.
   - **Observaciones:** `Cliente con excelente récord en buró de información crediticia, ingresos estables debidamente verificados y garantía hipotecaria con cobertura de 150%. Se recomienda aprobación.`
   - Clic en **"Guardar Dictamen"**.
5. *Verificar en pantalla (tal como se ve en la tabla):*
   - En la columna **ESTADO**: permanece en **`EN_EVALUACION`** (estado oficial en base de datos mientras espera resolución de aprobación/rechazo).
   - En la columna **EVALUACIÓN**: aparece el badge verde **`FAVORABLE`**.
   - En **ACCIONES DISPONIBLES**: el botón cambia a **`VER DICTAMEN (P13)`**, indicando que la evaluación técnica fue completada exitosamente.

---

### PASO 5: Comité de Créditos, Aprobación y Generación de Contrato (P04, P03, P05)
> **Cambio de Usuario:** Cerrar sesión (`lrojas`) e iniciar sesión como **`cmendoza`** (Jefe de Créditos).  
> **Contraseña:** `Bancario2026!`  
> **Menú:** Solicitudes → Ubicar la solicitud evaluada.

1. **Verificación de Atribución (Regla de Negocio CA13):**
   - Clic en el botón **"Aprobar"** en la solicitud.
   - Se abre el modal **"Aprobación de Crédito (P04)"**.
   - *Verificar en pantalla:*
     - Límite de aprobación del Jefe de Créditos: **Bs 70.000,00**.
     - Monto de la solicitud: **Bs 30.000,00**.
     - Mensaje informativo: `El monto solicitado (Bs 30.000,00) está dentro de su límite de atribución (Bs 70.000,00).`
   - *Comentario al Docente:* *"Si el monto superase los Bs 70.000, el sistema bloquearía el botón y exigiría escalamiento al Comité Directivo / Gerencia General."*
2. **Aprobar el Crédito:**
   - Seleccionar Resolución: `APROBADO`.
   - Fundamentación: `Aprobado en cumplimiento de políticas crediticias institucionales y dictamen favorable de riesgos.`
   - Clic en **"Confirmar Aprobación"**.
3. **Artefactos Generados Automáticamente por el Sistema:**
   - Se genera el **N° de Crédito:** `CRE-2026-XXXX`
   - Se genera el **N° de Contrato:** `CT-2026-XXXX`
   - El estado cambia a **`APROBADA`**.
4. **Verificación y Descarga del Contrato Formal (P03):**
   - Clic en **"Ver Contrato (P03)"** en la fila de la solicitud aprobada.
   - *Verificar en pantalla:* Se despliega el documento contractual privado con cláusulas legales, partes intervinientes y notaría.
   - Clic en el botón **"Descargar Contrato PDF (P03)"**:
     - *Verificar documento generado:* Se descarga automáticamente el PDF formal bancario con encabezado institucional UMSA (`#4c1d95`), cuadro de comparecientes, 6 cláusulas completas y firmas del Deudor, Jefe de Créditos y Notaría.
5. **Verificación y Descarga del Cronograma de Pagos (P05):**
   - Clic en **"Cronograma (P05)"**.
   - *Verificar en pantalla:* Tabla con las **12 cuotas mensuales**:
     - Número de cuota (1 a 12).
     - Fechas de vencimiento mensuales sucesivas.
     - Cuota fija mensual constante: **Bs 2.665,46**.
     - Desglose exacto: Capital creciente + Interés decreciente.
     - Saldo deudor decreciente hasta llegar a **Bs 0,00**.
     - Ajuste de redondeo de centavos aplicado en la cuota 12 (conforme a norma bancaria CA16).
   - Clic en el botón **"Descargar Cronograma PDF (P05)"**:
     - *Verificar documento generado:* Se descarga el cronograma en PDF con diseño formal, tabla completa de amortización, totales acumulados y firmas reglamentarias.

---

### PASO 6: Desembolso a través del Core Bancario (CU11 / P14 / RF12)
> **Rol Activo:** `cmendoza` (Jefe) o `atorrez` (Oficial)  
> **Menú:** Módulo de **Desembolsos**

1. Ingresar a la pestaña **"Desembolsos"**.
2. Ubicar el crédito aprobado de Mariela Patricia Flores.
3. Clic en **"Desembolsar Fondos"**.
4. Confirmar en el cuadro de diálogo de seguridad bancaria.
5. *Verificar en pantalla:*
   - El sistema emite la orden al Core Bancario.
   - Mensaje de confirmación: `¡Desembolso exitoso! Código de Transacción Core: TX-CORE-XXXXXXXX`.
   - El crédito pasa al estado activo: **`VIGENTE` / `DESEMBOLSADO`**.

---

### PASO 7: Ventanilla de Caja y Cobro de Cuotas (P06, P07 / RF13 / CA19)
> **Cambio de Usuario:** Iniciar sesión como **`cajero1`** (Cajero de Ventanilla).  
> **Contraseña:** `Bancario2026!`  
> **Menú:** **Caja de Pagos**

1. En la vista de Caja de Pagos:
   - Buscar el crédito por CI: `8945123` o seleccionar de la lista de créditos vigentes.
2. Clic en el crédito para cargar su estado actual.
   - Se muestra el resumen financiero: Monto total, saldo adeudado, próximas cuotas.
3. **Proceso de Cobro de la Cuota 1:**
   - Seleccionar la **Cuota 1** (Estado: `PENDIENTE`).
   - Monto exigible: **Bs 2.665,46**.
   - **Forma de Pago:** Seleccionar `EFECTIVO` (o `TRANSFERENCIA BANCARIA`).
   - Clic en el botón **"Procesar Pago de Cuota"**.
4. **Verificación de Emisión de Recibo Oficial (P07):**
   - Se despliega el **Recibo Oficial de Caja**:
     - N° de Recibo correlativo único.
     - Datos del cliente, CI y N° de Crédito.
     - Desglose contable: Capital pagado, Interés corriente, Interés penal/mora (Bs 0,00).
     - Código QR de autenticidad fiscal y firma digital de ventanilla.
     - Botón para **"Descargar Comprobante PDF"**.
5. *Verificar actualización del cronograma:*
   - La Cuota 1 cambia inmediatamente a badge verde **`PAGADA`**.
   - El saldo total deudor del cliente disminuye automáticamente en el monto de capital amortizado.

---

### PASO 8: Monitoreo Gerencial y Auditoría Inmutable (P08, P09 / RF15, RNF07)
> **Cambio de Usuario:** Iniciar sesión como **`admin`** o **`gerente1`**.  
> **Contraseña:** `Bancario2026!`

1. **Dashboard y Reportes de Cartera (P08 - Rol GERENTE):**
   - Ir a la pestaña **"Reportes"**.
   - *Verificar en pantalla:*
     - Monto total colocado en cartera.
     - Saldo de cartera vigente.
     - Tasa de morosidad y créditos en mora vs. al día.
     - Gráfico de distribución por tipo de crédito (`CONSUMO`, `COMERCIAL`, `VIVIENDA`).
2. **Pistas de Auditoría Inmutable (P09 - Rol ADMINISTRADOR):**
   - Ir a la pestaña **"Auditoría"**.
   - *Verificar en pantalla:* Registro cronológico completo de la sesión que acabamos de realizar:
     - `LOGIN_SUCCESS` (atorrez, lrojas, cmendoza, cajero1)
     - `CREAR_CLIENTE` (CI 8945123)
     - `CREAR_SOLICITUD` (SOL-2026-XXXX)
     - `REGISTRAR_GARANTIA` (Garantía Hipotecaria Bs 45.000)
     - `EVALUAR_SOLICITUD` (Dictamen FAVORABLE)
     - `APROBAR_CREDITO` (CRE-2026-XXXX)
     - `DESEMBOLSAR_CREDITO` (TX-CORE)
     - `PAGO_CUOTA` (Recibo emitido)
   - *Comentario al Docente:* *"Demostramos el cumplimiento estricto de la circular ASFI sobre gobernanza de datos y trazabilidad: la tabla de auditoría opera exclusivamente bajo operaciones INSERT (Append-Only), impidiendo cualquier UPDATE o DELETE incluso por el administrador."*

---

## 🎓 4. Banco de Preguntas y Respuestas para la Defensa Docente

### P1: ¿Por qué se utilizó el Sistema Francés y cómo garantizan la exactitud contable en la última cuota?
> **Respuesta:**  
> *"El sistema francés se caracteriza por cuotas periódicas fijas compuestas por una amortización de capital creciente y un interés decreciente sobre saldo deudor de acuerdo a la fórmula $C = M \cdot \frac{i(1+i)^n}{(1+i)^n - 1}$. Para garantizar exactitud contable frente a los decimales y centavos (requisito CA16), el sistema calcula el redondeo comercial a 2 decimales en cada cuota y en la última cuota ($n$) ajusta la fracción de capital exactamente a $\text{Saldo}_{n-1}$, asegurando que el saldo final al vencimiento sea exactamente Bs 0,00 sin sobrantes ni faltantes."*

### P2: ¿Cómo cumple el sistema con la normativa ASFI respecto al sobreendeudamiento?
> **Respuesta:**  
> *"Mediante la regla de validación DTI (Debt-to-Income / Relación Cuota-Ingreso). Antes de emitir dictamen, el motor evalúa que la cuota calculada no comprometa más del 40% de los ingresos netos verificables del cliente. Adicionalmente, el adaptador de buró de crédito consulta si el cliente tiene deudas vigentes o castigadas en otras entidades financieras del sistema nacional."*

### P3: ¿Qué pasa si el Jefe de Créditos intenta aprobar una solicitud de Bs 150.000?
> **Respuesta:**  
> *"El sistema implementa la regla de negocio CA13 de Límites de Atribución Parametrizables. El Jefe de Créditos tiene un tope de Bs 70.000. Al intentar aprobar un monto superior, el backend rechaza la transacción con un error de dominio `LimiteAtribucionExcedidoException` y el frontend bloquea la opción indicando que requiere la aprobación colegiada del Comité de Créditos / Directorio."*

### P4: ¿Por qué la arquitectura elegida es Hexagonal (Ports & Adapters)?
> **Respuesta:**  
> *"Para garantizar que la lógica de negocio (entidades bancarias, cálculos financieros de amortización, validaciones de mora) permanezca completamente desacoplada de la infraestructura externa. Por ejemplo, el servicio de Buró de Crédito se diseñó como un puerto (`BuroRiesgoPort`), lo que permite que en desarrollo funcione con un simulador local configurable y en producción se conecte al servicio real de INFOCRED o ASFI sin modificar una sola línea de lógica de negocio."*

### P5: ¿Cómo manejan la seguridad de tokens JWT y la concurrencia de sesiones?
> **Respuesta:**  
> *"El token JWT se emite firmado con algoritmo HMAC-SHA256 con tiempo de vida restringido a 15 minutos (RNF06). Toda petición viaja en la cabecera `Authorization: Bearer <token>`. El backend valida en cada llamada la firma, vigencia y rol del usuario mediante filtros de seguridad. Si el token expira o es manipulado, se retorna HTTP 401 Unauthorized y la UI redirige al login."*

---

## 📋 5. Cheat Sheet Resumido para el Presentador (3 Minutos)

Si el docente pide una defensa rápida o express, seguir este orden estricto:

| Minuto | Pantalla | Usuario | Qué hacer | Qué decir |
|---|---|---|---|---|
| **01** | `P10 / Clientes` | `atorrez` | Registrar cliente y probar CI repetido | *"Demostramos alta y restricción de unicidad RN01."* |
| **02** | `P11, P12, P13` | `atorrez` / `lrojas` | Crear solicitud Bs 30.000, garantía 150% y buró | *"Verificamos checklist documental, cobertura y DTI ≤ 40%."* |
| **03** | `P04, P05, P06` | `cmendoza` / `cajero1` | Aprobar crédito, mostrar cronograma francés y cobrar cuota | *"Se aplica amortización francesa, atribución ≤ 70k, desembolso y emisión de recibo contable."* |

---
*Documento preparado y verificado para la demostración en vivo del Sistema de Gestión de Créditos Bancario.*
