# 📋 Resumen de Cambios — Versión 2 (`version2`)
## Sistema de Gestión de Créditos Bancario · UMSA INF-241

Este documento detalla todas las modificaciones, correcciones de errores, nuevas funcionalidades y documentación incorporadas en la rama **`version2`** en comparación con la rama principal (**`main`**).

---

## 📌 Resumen General de Mejoras

| Módulo | Tipo de Cambio | Descripción Resumida |
|---|---|---|
| **Seguridad & Autenticación** | Corrección / Mejora | Alerta clara con conteo de intentos restantes ante clave incorrecta (RNF01) sin recarga indeseada de página. |
| **Padrón de Clientes** | Corrección / Regla CA02 | Detección preventiva en tiempo real y banner explícito si un CI ya existe en el sistema sin duplicar ni reescribir. |
| **Garantías y Archivos** | Corrección / Rendimiento | Soporte para adjuntos de hasta 50MB (Express) y 64MB (MySQL `max_allowed_packet` y columna `documentos_adjuntos`). |
| **Exportación PDF (Jefe)** | Nueva Funcionalidad | Descarga de **Cronograma de Pagos PDF** y **Contrato Legal PDF** con identidad formal bancaria UMSA. |
| **Documentación** | Nueva Documentación | Creación de la guía maestra integral para defensa oral docente: `docs/DEMO_EN_VIVO.md`. |

---

## 🛠️ 1. Cambios en el Backend

### 1.1. Servidor y Middlewares (`backend/src/servidor.js`)
* **Ampliación de límite de carga:** Se modificó la configuración de `express.json()` y `express.urlencoded()` aumentando el límite predeterminado de 100 KB a **`50mb`**.
* **Impacto:** Permite adjuntar sin fallos documentos, peritajes, fotos de inmuebles o boletas de garantía codificadas en Base64.

### 1.2. Base de Datos & Configuración (`backend/src/config/baseDeDatos.js`)
* **Configuración automática de paquetes MySQL:** Se añadió la directiva `SET GLOBAL max_allowed_packet = 67108864;` (64 MB) en la inicialización de la conexión.
* **Actualización del esquema relacional en MySQL:**
  * Tabla `cliente`: Se agregó la columna `email VARCHAR(120) NULL` conforme al esquema `01_schema_mysql.sql`.
  * Tabla `garantia`: Se agregó la columna `documentos_adjuntos LONGTEXT NULL` para soportar la persistencia de los archivos adjuntos.

### 1.3. Servicio de Clientes (`backend/src/servicios/clienteService.js`)
* **Identificación explícita de clientes existentes (CA02):** Tanto en modo memoria como en MySQL, cuando un CI ya existe en el padrón, el servicio retorna la entidad con la propiedad `yaExistia: true`.
* **Impacto:** Permite que la capa de presentación notifique de forma precisa que se aplicó la regla CA02 de recuperación de ficha en lugar de un nuevo registro.

### 1.4. Servicio de Usuarios & Seguridad (`backend/src/servicios/usuarioService.js`)
* **Mensaje de credenciales enriquecido:** Al ingresar una contraseña errónea, el error emitido ahora calcula y detalla dinámicamente:
  `Credenciales inválidas (contraseña incorrecta). Intento X de 5 (RNF01). Le quedan Y intento(s) antes del bloqueo temporal de 30 minutos.`
* **Restablecimiento de contadores:** Se limpiaron los bloqueos residuales de pruebas para dejar el entorno 100% operativo.

---

## 💻 2. Cambios en el Frontend

### 2.1. Cliente de Conexión API (`frontend/src/services/api.ts`)
* **Corrección crítica de recarga en 401:** Se ajustó el interceptor de peticiones para que en `/auth/login` **no ejecute `window.location.reload()`**, permitiendo que el componente `LoginScreen` capture la respuesta JSON y muestre la alerta de error con los intentos restantes.

### 2.2. Pantalla de Acceso (`frontend/src/components/LoginScreen.tsx`)
* **Diseño de alerta de seguridad:** Se incorporó el icono `AlertTriangle` de `lucide-react` y un contenedor con borde, fondo rojizo translúcido y tipografía destacada para exhibir el mensaje de intentos restantes y bloqueo preventivo (RNF01).

### 2.3. Gestión de Clientes (`frontend/src/components/ClientesView.tsx`)
* **Alerta en tiempo real dentro del modal:** Si el operador escribe un CI que ya figura en la lista de clientes, se despliega una tarjeta de aviso instantáneo informando a qué cliente pertenece.
* **Banner de notificación en la vista principal:** Tras enviar el formulario, si el cliente ya existía, se muestra un banner ámbar (`alert-warning`) confirmando que se preservó la información original conforme a la regla CA02.

### 2.4. Servicio de Generación de PDFs (`frontend/src/services/pdfService.ts`)
* Se resolvieron las dependencias y tipos de TypeScript (`declarations.d.ts`) para `jspdf` y `jspdf-autotable`.
* **Nuevo método `emitirCronogramaPDF`:**
  * Genera el plan de pagos bajo el Sistema Francés con membrete formal UMSA (`#4c1d95`), cuadro del cliente, tabla completa de cuotas (capital creciente, interés decreciente, cuota constante y saldo final ajustado), totales acumulados y firmas oficiales.
* **Nuevo método `emitirContratoPDF`:**
  * Genera el instrumento legal privado con comparecientes, 6 cláusulas contractuales bancarias completas y bloques de firma para el Deudor Titular, Jefe de Créditos y Notaría de Fe Pública.

### 2.5. Modales de Contrato y Cronograma (`ContratoModal.tsx`, `CronogramaModal.tsx`)
* Se añadieron botones institucionales con icono `Download`:
  * **`Descargar Cronograma PDF (P05)`** en el modal de cronograma.
  * **`Descargar Contrato PDF (P03)`** en el modal de contrato formal.

---

## 📚 3. Documentación Agregada

### 3.1. Guía Maestra de Demostración en Vivo (`docs/DEMO_EN_VIVO.md`)
* Documento exhaustivo de 310 líneas diseñado específicamente para la defensa oral académica ante el docente (INF-241).
* Contiene:
  * Matriz de usuarios, roles y contraseña universal (`Bancario2026!`).
  * Cronograma sugerido de exposición (12 a 15 minutos).
  * Flujo demostrativo detallado paso a paso desde el Login hasta la Auditoría Inmutable.
  * Datos exactos de prueba para tipear en vivo.
  * Fórmulas matemáticas aplicadas (Amortización francesa, DTI $\le 40\%$, Cobertura $\ge 120\%$).
  * Banco de preguntas técnicas difíciles del docente con sus respuestas fundamentadas.
  * Cheat Sheet de 3 minutos para defensa rápida.

---

## 🌿 4. Estado de la Rama Git

* **Rama:** `version2`
* **Estado:** Todos los archivos están confirmados en el historial local listos para subir cuando el usuario lo autorice.
* **Nota de seguridad:** No se ha ejecutado `git push` a ningún repositorio remoto, respetando la instrucción explícita del usuario.
