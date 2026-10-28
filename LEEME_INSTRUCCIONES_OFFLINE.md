# Guía de Ejecución Local y Offline · Sistema de Créditos Bancarios
**Universidad Mayor de San Andrés · Facultad de Ciencias Puras y Naturales · Carrera de Informática**  
**Materia:** INF-241 Análisis y Diseño de Sistemas I  

---

## 🚀 Inicio Rápido con 1 Solo Clic (100% Offline)

El sistema ha sido empaquetado para que **no requieras conexión a Internet** ni comandos complicados.

### Paso 1: Iniciar MySQL
- Abre tu panel de control de **XAMPP** y dale clic en **Start** en el módulo **MySQL** (puerto `3306`).
- *(Si ya está corriendo como servicio de Windows, el lanzador lo detectará automáticamente).*

### Paso 2: Ejecutar el Sistema
- Haz doble clic en el archivo:
  ```
  INICIAR_SISTEMA_OFFLINE.bat
  ```
- **¿Qué hace este script?:**
  1. Verifica que MySQL esté activo en `localhost:3306`.
  2. Inicia el servidor bancario Express (`node src/servidor.js`), el cual sirve **la API REST y la aplicación web compilada** conjuntamente en el puerto `8080`.
  3. Abre automáticamente tu navegador predeterminado en:
     👉 **`http://localhost:8080`**

---

## 👥 Cuentas de Acceso de los Integrantes del Grupo

Todos los usuarios tienen la contraseña predeterminada:  
🔑 **Contraseña universal:** `Bancario2026!`

| Rol Bancario | Nombre del Integrante | Usuario (Login) | Función en la Demostración |
| :--- | :--- | :--- | :--- |
| **Jefe de Créditos** | Miguel Angel Bustillos Choque | `mbustillos` | Aprobación de créditos hasta Bs 70.000 (CA13) |
| **Oficial de Crédito** | Saúl Walter Callisaya Sumi | `scallisaya` | Registro de solicitudes (P11), clientes (P10) y garantías (P12) |
| **Analista de Riesgos** | Ranulfo Antonio Rojas Guachalla | `rrojas` | Consulta Buró ASFI, DTI y dictamen financiero (P13) |
| **Cajero de Ventanilla** | Royer Marcos Patty Mamani | `rpatty` | Cobranzas en cascada, pago flexible y facturas PDF (P08) |
| **Gerente General** | Alex Arturo Jamachi Condori | `ajamachi` | Aprobación por escalamiento (> Bs 70.000) y reportes (P09) |
| **Administrador** | Ramiro Flores | `admin` | Gestión de usuarios (P14), límites y auditoría inmutable |

> **Nota:** En la pantalla de inicio de sesión (`http://localhost:8080`) tienes botones de **Acceso Rápido** para ingresar con 1 solo clic como cualquiera de los integrantes sin escribir credenciales manualmente.

---

## 💡 Demostración de Casos Clave para el Docente

### 1. Cliente en Mora (Demostración de Control de Mora e Imputación en Cascada):
- Ingresa como **Cajero** (`rpatty`).
- En la lista izquierda de créditos, busca y selecciona:
  - Cliente: **Gonzalo Quispe Ticona** (CI: `7182934 LP`)
  - Crédito: **`CRE-2026-MORA`** (Código: `CR202600002`).
- Observarás las cuotas en estado **`VENCIDA`** con intereses de mora devengados al 18% anual.
- Haz clic en **"Cobrar"** para mostrar la prelación legal estricta (1° Mora → 2° Interés → 3° Capital) y emite la factura en PDF.
- Haz clic en **"Flexibilidad"** para mostrar la prórroga de 30 días o acumulación justificada.

### 2. Escalamiento de Atribución (Jefe a Gerente):
- Ingresa como **Oficial** (`scallisaya`) y crea una solicitud de Bs 85.000 (supera el límite de Bs 70.000).
- Ingresa como **Analista** (`rrojas`) y emite dictamen favorable.
- Ingresa como **Jefe** (`mbustillos`): el sistema **bloquea la aprobación directa** y despliega el botón para **Derivar a Gerencia General**.
- Ingresa como **Gerente** (`ajamachi`): autoriza la operación en base al informe técnico.

### 3. Descarga de Contrato Legal y Cronograma en PDF:
- En cualquier solicitud formalizada, abre el modal de **Contrato** para descargarlo en PDF formal con cláusulas y sellos institucionales UMSA/ASFI.
- Abre el modal de **Cronograma** para descargar el plan de pagos bajo el Sistema Francés en PDF.

---

## 🔄 Restaurar la Base de Datos Limpia

Si durante tus prácticas deseas volver a dejar la base de datos limpia tal como al inicio:
- Haz doble clic en:
  ```
  REINICIAR_BASE_DATOS_LIMPIA.bat
  ```
- Este comando volverá a ejecutar el esquema normalizado (`01_schema_mysql.sql`) y los datos semilla iniciales (`02_seed_mysql.sql`).

---

## 🛠️ Modo Desarrollo (Hot-Reload)

Si deseas hacer cambios en el código React con recarga en vivo:
- Haz doble clic en:
  ```
  INICIAR_MODO_DESARROLLO.bat
  ```
- Iniciará el backend en el puerto `8080` y Vite dev server en `http://localhost:5173`.
