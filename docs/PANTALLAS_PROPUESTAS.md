# Propuesta de Pantallas No Diseñadas en el Documento Base
## Sistema de Gestión de Créditos Bancario - UMSA

Este documento detalla el diseño propuesto para las 5 pantallas que no contaban con wireframe en la guía original (P01–P13). Cada propuesta se basa **exclusivamente** en:
- El flujo del Caso de Uso correspondiente (CU01, CU11, CU12, CU14, CU15).
- Los diagramas de secuencia D04 (Desembolso) y D05 (Pago con prelación contable).
- Los atributos y operaciones de las clases de D02.
- La matriz de control de acceso RBAC de la sección 16.2.
- Los Criterios de Aceptación CA17 a CA25.
- El molde visual estándar de las pantallas P01 a P13 (barra lateral de navegación por rol, cabecera con usuario y rol, breadcrumb y tablas/formularios estructurados).

---

## 1. P07: Desembolsos (CU11 - RF12 - Oficial de Crédito)

### 1.1 Contexto y Flujo
- **Actor:** Oficial de Crédito (RBAC: Sí a Desembolso).
- **Ruta:** Desembolsos / Registrar desembolso.
- **Precondiciones (CA17, RN05, RN06):** Crédito en estado APROBADO, con contrato en estado FIRMADO y cronograma de cuotas generado.
- **Interacción externa (D04):** Llamada mTLS al Core Bancario (`transferirFondos`), retorno de número de referencia bancaria y confirmación.

### 1.2 Estructura y Campos

| # | Elemento en Pantalla | Clase y Atributo de Origen | Traza a CU / RF / CA | Datos no definidos en el informe |
|---|---|---|---|---|
| 1 | Selector de Crédito Aprobado | `Credito.id_credito`, `Credito.numero_credito` | CU11 paso 1, RF12 | Ninguno (filtra créditos en estado APROBADO). |
| 2 | Datos del Crédito (Solo lectura) | `Credito.monto_aprobado`, `Credito.plazo_meses`, `Credito.tasa_interes`, `Credito.sistema_amortizacion` | CU11, D02 | Ninguno. |
| 3 | Datos del Cliente (Solo lectura) | `Cliente.ci`, `Cliente.nombres`, `Cliente.apellidos` | CU11, D02 | Ninguno. |
| 4 | Verificación Previa (Checklist visual) | `Contrato.estado == FIRMADO` y `Cuota.count > 0` | CU11 paso 3, CA17 | Ninguno. |
| 5 | Cuenta de Abono / Destino | Parámetro de integración Core Bancario (D04: `cuentaDestino`) | D04 mensaje 7 | El informe no tiene campo `numero_cuenta` en CLIENTE; se propone campo de texto manual de 16 dígitos para el simulador de Core. |
| 6 | Botón "Ejecutar Desembolso" | `Credito.desembolsar()`, llamada al Core Bancario | CU11 paso 5, CA17 | Ninguno. |
| 7 | Modal / Boleta de Confirmación | Generación de boleta con referencia bancaria y pase a `VIGENTE` | D04 mensaje 11, CA17 | Ninguno. |

---

## 2. P08: Caja / Registrar Pago (CU12 - RF13 - Cajero)

### 2.1 Contexto y Flujo
- **Actor:** Cajero (RBAC: Sí a Pagos).
- **Ruta:** Caja / Registrar pago.
- **Precondiciones (CA19, RN07, RN08):** Crédito en estado VIGENTE o EN_MORA con cuotas pendientes.
- **Regla central (13.5, D05, D07, RN08):** Prelación contable de imputación obligatoria:
  1.° Mora acumulada $\rightarrow$ 2.° Interés compensatorio $\rightarrow$ 3.° Capital vivo.

### 2.2 Estructura y Campos

| # | Elemento en Pantalla | Clase y Atributo de Origen | Traza a CU / RF / CA | Datos no definidos en el informe |
|---|---|---|---|---|
| 1 | Búsqueda por Código de Crédito o CI | `Credito.numero_credito` o `Cliente.ci` | CU12 paso 1, D05, D07 | Ninguno. |
| 2 | Detalle Exigible (Solo lectura) | `Cuota.numero_cuota`, `Cuota.fecha_vencimiento`, `Cuota.capital`, `Cuota.interes_comp`, `Cuota.interes_mora`, `Cuota.saldo_pendiente` | D05 mensaje 3, D07 | Muestra la cuota más antigua pendiente (D07 paso B). |
| 3 | Monto Recibido del Cliente | `Pago.monto` (debe ser $> 0$ y $\le$ saldo exigible total) | CU12 paso 2, D07, CA19, CA20 | Ninguno. |
| 4 | Forma de Pago (Selector) | Enum `FormaPago`: `EFECTIVO`, `TRANSFERENCIA`, `DEBITO` | D02, `Pago.forma_pago` | Ninguno. |
| 5 | Desglose Previsto en Cascada | Visualización en vivo: cuánto va a mora, cuánto a interés y cuánto a capital | Sección 13.5, D05 | Cálculo reactivo en pantalla. |
| 6 | Botón "Procesar Cobro" | `Pago.imputarPrelacion()`, `Credito.amortizarCapital()` | CU12 paso 3, CA19 | Ninguno. |
| 7 | Emisión de Comprobante / Recibo | `Pago.numero_recibo` (único: `REC-NNNN`) | `Pago.emitirComprobante()`, CA19 | Ninguno. |

---

## 3. P09: Reportes Regulatorios y de Cartera (CU14 - RF15 - Gerente / Jefe)

### 3.1 Contexto y Flujo
- **Actor:** Gerente (RBAC: Sí) y Jefe de Créditos (RBAC: Consulta).
- **Ruta:** Reportes / Centro de reportes.
- **Objetivo (CA23, RNF05):** Consultas analíticas de solo lectura sobre créditos, cuotas, pagos y mora, con filtros de fecha y estado.

### 3.2 Estructura y Campos

| # | Elemento en Pantalla | Clase y Atributo de Origen | Traza a CU / RF / CA | Datos no definidos en el informe |
|---|---|---|---|---|
| 1 | Tipo de Reporte (Pestañas / Selector) | 1. Cartera General, 2. Colocaciones por Período, 3. Cartera en Mora, 4. Recaudaciones | CU14 paso 1, CA23 | Tipos derivados de la descripción de CU14 y CA23. |
| 2 | Filtros de Fecha | Rango `fecha_inicio` y `fecha_fin` | CU14 paso 2, CA23 | Ninguno. |
| 3 | Filtro por Estado | Enum `EstadoCredito` (`VIGENTE`, `EN_MORA`, `CANCELADO`, `APROBADO`) | D02, CA23 | Ninguno. |
| 4 | Indicadores Clave (KPI Cards) | Total Cartera (Bs), Total Saldo Capital, Tasa de Mora Global (%), Total Créditos Activos | CU14 paso 3, CA23 | Cálculos agregados estándar (SUM, COUNT, AVG). |
| 5 | Tabla de Resultados Detallada | Columnas: N° Crédito, Cliente, Monto Aprobado, Saldo Capital, Mora Acumulada, Días Mora, Estado | CA23 | Ninguno. |
| 6 | Botón "Exportar" (CSV / Imprimir) | Vista de impresión / exportación tabular | CU14 | Ninguno. |

---

## 4. P14: Usuarios y Roles (CU15 - RF16 - Administrador)

### 4.1 Contexto y Flujo
- **Actor:** Administrador (RBAC: Sí a Usuarios, No a operaciones crediticias).
- **Ruta:** Administración / Usuarios y roles.
- **Objetivo (CA24, RN20, RNF01):** Crear, activar, desactivar y gestionar límites de funcionarios bancarios.

### 4.2 Estructura y Campos

| # | Elemento en Pantalla | Clase y Atributo de Origen | Traza a CU / RF / CA | Datos no definidos en el informe |
|---|---|---|---|---|
| 1 | Tabla de Usuarios Existentes | `Usuario.id_usuario`, `nombre_completo`, `login`, `rol`, `limite_atribucion`, `activo` | CU15 paso 1, D02 | Ninguno. |
| 2 | Botón "Nuevo Usuario" (Abre Modal) | Operación de registro | CU15, CA24 | Ninguno. |
| 3 | Campo: Nombre Completo \* | `Usuario.nombre_completo VARCHAR(150)` | D02, 14.1 | Ninguno. |
| 4 | Campo: Login de Acceso \* | `Usuario.login VARCHAR(50) UNIQUE` | D02, 14.1, CA24 | Valida unicidad. |
| 5 | Campo: Rol del Usuario \* | Enum `RolUsuario` (`OFICIAL`, `ANALISTA`, `JEFE`, `CAJERO`, `ADMINISTRADOR`, `GERENTE`) | D02, 16.2 | Ninguno. |
| 6 | Campo: Límite de Atribución (Bs) | `Usuario.limite_atribucion` (por defecto 0.00; 70.000 para Jefe) | 13.5, 14.1 | Habilitado solo si el rol admite atribución. |
| 7 | Campo: Contraseña Inicial \* | `Usuario.clave_hash` (se hashea con BCrypt en backend) | RNF01, CA24 | Ninguno. |
| 8 | Switch: Estado Activo / Inactivo | `Usuario.activo BOOLEAN` | RN20, CA24 | Ninguno. |
| 9 | Acciones en Tabla | Botón Activar/Desactivar, Botón Resetear Intentos Fallidos | RN20, RNF01 | Ninguno. |

---

## 5. P15: Editar Cliente (RF02 - Flujo alterno de CU01 - Oficial de Crédito)

### 5.1 Contexto y Flujo
- **Actor:** Oficial de Crédito.
- **Ruta:** Clientes / Detalle / Editar.
- **Objetivo (CA03, RN12):** Modificar datos de contacto (teléfono y dirección). El CI es de solo lectura y no editable; cualquier cambio se audita con valor anterior y nuevo en `AUDITORIA`.

### 5.2 Estructura y Campos

| # | Elemento en Pantalla | Clase y Atributo de Origen | Traza a CU / RF / CA | Datos no definidos en el informe |
|---|---|---|---|---|
| 1 | Campo CI (Solo lectura, bloqueado) | `Cliente.ci` | CA03: "el CI no es editable" | Ninguno. |
| 2 | Nombres y Apellidos (Solo lectura) | `Cliente.nombres`, `Cliente.apellidos` | CA03 | Ninguno. |
| 3 | Teléfono \* | `Cliente.telefono` | CA03: "modifica teléfono o dirección" | Ninguno. |
| 4 | Dirección \* | `Cliente.direccion` | CA03: "modifica teléfono o dirección" | Ninguno. |
| 5 | Ingresos Mensuales (Solo lectura) | `Cliente.ingresos_mensuales` | RF01, RF05 | Solo modificable previa justificación patrimonial. |
| 6 | Botón "Guardar Cambios" | `Cliente.actualizar()`, genera registro en `AUDITORIA` | CA03, RN12 | Ninguno. |

---
*Nota: Estas 5 pantallas se implementarán en la interfaz bajo el estado "PROPUESTA, pendiente de aprobación del grupo" en `docs/RTM.md`.*
