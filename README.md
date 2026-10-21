# SISTEMA DE GESTION DE CREDITOS PARA UNA ENTIDAD BANCARIA

**Universidad Mayor de San Andres (UMSA)**  
**Facultad de Ciencias Puras y Naturales - Carrera de Informatica**  
**Materia:** INF-241 Analisis y Diseno de Sistemas I (Paralelo "B")  
**Docente:** M. Sc. Patricia Sonia Trino Camacho  
**Fecha:** Octubre 2026  

---

## 1. Descripcion General del Proyecto

El Sistema de Gestion de Creditos Bancarios es una solucion de software transaccional disenada para automatizar, controlar y auditar el ciclo de colocacion de creditos de una entidad de intermediacion financiera, en concordancia con las disposiciones de la Autoridad de Supervision del Sistema Financiero (ASFI) de Bolivia y la Ley N° 393 de Servicios Financieros.

El sistema comprende las siguientes etapas operativas:
1. **Admision y Prospeccion:** Registro y mantenimiento de clientes con validacion de documento de identidad (CI).
2. **Originacion:** Formulacion de solicitudes de credito (Consumo, Vehicular, Vivienda y Microcredito) con calculo en tiempo real de la cuota mensual.
3. **Analisis y Riesgos:** Consulta automatizada a Buro de Riesgos simulado ASFI (Score crediticio), evaluacion de capacidad de pago con ratio de endeudamiento (DTI <= 40%) y registro de garantias con cobertura minima reglamentaria (>= 120%).
4. **Aprobacion Colegiada:** Reglas de atribucion operativa por jerarquia (Jefe de Creditos hasta Bs 70.000,00; montos superiores canalizados a Gerencia), emision correlativa de contrato legal y calculo de cronograma de pagos mediante el Sistema Frances con ajuste al centavo en la cuota final.
5. **Desembolso e Integracion:** Formalizacion y acreditacion de fondos mediante enlace transaccional al Core Bancario.
6. **Cobranza y Caja:** Cobro de cuotas en ventanilla aplicando la cascada contable estricta (1° Mora -> 2° Interes Compensatorio -> 3° Capital), emision de comprobante correlativo fiscal (REC) y devengamiento diario de interes penal por mora.
7. **Monitoreo y Auditoria:** Generacion de pistas de auditoria inmutables, control de acceso basado en roles (RBAC) y reporte de indicadores ejecutivos de cartera y morosidad.

---

## 2. Metodologias y Estandares de Ingenieria

### A. Metodologia de Programacion: Tradicional (en Cascada / Waterfall)
El ciclo de vida del software sigue una secuencia ordenada y formal:
1. **Fase de Requisitos:** Especificacion formal de 16 Requerimientos Funcionales (RF01 - RF16), 6 Requerimientos No Funcionales (RNF01 - RNF06) y 12 Reglas de Negocio (RN01 - RN12).
2. **Fase de Diseno:** Modelado relacional en Tercera Forma Normal (3FN), diagramas de estado para solicitudes y creditos, diseno de endpoints RESTful bajo convención JSON y definicion de interfaces de usuario ergonomicas con diseno responsivo.
3. **Fase de Implementacion:** Arquitectura desacoplada en 3 capas (Configuracion, Middlewares, Servicios y Rutas en Node.js; Componentes funcionales en React 19 con TypeScript).
4. **Fase de Pruebas y Verificacion:** Ejecucion de pruebas de integracion end-to-end de los 15 casos de uso y matriz de trazabilidad de requisitos (RTM) al 100%.
5. **Fase de Despliegue y Mantenimiento:** Variables de entorno parametrizadas, scripts SQL de base de datos y modo de fallback en memoria.

### B. Metodologia del Proyecto: Metodologia Aplicada
Investigacion aplicada y contextualizada orientada a resolver problemas reales de intermediacion crediticia en cooperativas y entidades financieras medianas de Bolivia, aplicando matematica financiera, normas contables bancarias y seguridad informatica.

### C. Estandares de Programacion: Variables Definidas de Manera Intuitiva
Se erradicaron nombres ambiguos o abreviaturas cripticas, adoptando identificadores auto-descriptivos tanto en backend como frontend:
- Backend: `montoSolicitado`, `plazoMeses`, `tasaInteresAnual`, `tasaInteresMensual`, `cuotaMensualEstimada`, `capacidadPago`, `ingresosMensualesDeclarados`, `egresosMensualesDeclarados`, `relacionCuotaIngreso`, `valorComercialGarantia`, `porcentajeCoberturaGarantia`, `saldoCapitalPendiente`, `moraCalculadaPorDia`.
- Frontend: `filtroTexto`, `solicitudSeleccionada`, `cuotaParaPagar`, `modalRegistroAbierto`, `desglosePago`, `sesionUsuarioActiva`.

---

## 3. Arquitectura y Stack Tecnologico

- **Frontend:** React 19, TypeScript, Vite, Lucide React, CSS modular con estilo de cabecera flotante, navegacion fluida y responsividad adaptativa desde 375px hasta pantallas 4K.
- **Backend:** Node.js, Express, JSON Web Tokens (JWT), BCrypt, arquitectura por capas con servicios de dominio desacoplados.
- **Base de Datos:** MySQL 8.x / MariaDB (10 tablas InnoDB en UTF-8 con claves foraneas e indices), complementado con mecanismo de resiliencia automatica en memoria para evaluacion inmediata.

---

## 4. Matriz de Usuarios y Credenciales de Prueba

Todos los usuarios de prueba comparten la contrasena estandar: **Bancario2026!**

| Rol RBAC | Usuario (Login) | Funcionario | Modulos Autorizados y Atribuciones |
| :--- | :--- | :--- | :--- |
| **OFICIAL** | `atorrez` | Alvaro Torrez | Registro y edicion de clientes, creacion de solicitudes de credito. |
| **ANALISTA** | `lrojas` | Laura Rojas | Consulta a Buro ASFI, evaluacion financiera (DTI), registro de garantias. |
| **JEFE** | `cmendoza` | Carlos Mendoza | Aprobacion colegiada (hasta Bs 70.000), rechazo, desembolsos y reportes. |
| **CAJERO** | `cajero1` | Mario Fernandez | Consulta de cartera, cobro de cuotas en ventanilla y emision de recibos. |
| **GERENTE** | `gerente1` | Sofia Valdivia | Aprobacion de creditos de monto mayor (> Bs 70.000) y reportes gerenciales. |
| **ADMINISTRADOR** | `admin` | Administrador General | Gestion de usuarios, desbloqueo de operadores y auditoria forense inmutable. |

---

## 5. Pasos para Correr el Proyecto en Local

### Prerrequisitos
- **Node.js:** Version 18.x o superior instalada (verificar con `node -v`).
- **NPM:** Incluido con Node.js (verificar con `npm -v`).
- **MySQL / XAMPP:** Opcional para persistencia fisica en disco. Si MySQL no se encuentra activo, el backend inicia de forma transparente con su capa de persistencia en memoria.

---

### Paso 1: Clonar el Repositorio
Abra su terminal o consola de comandos y clone el proyecto:
```bash
git clone https://github.com/MigXploit/sistema-gestion-creditos.git
cd sistema-gestion-creditos
```

---

### Paso 2: Base de Datos MySQL (Opcional si cuenta con XAMPP)
Si desea persistir los datos en un servidor MySQL local:
1. Inicie el servicio **MySQL** desde el Panel de Control de XAMPP o su gestor de base de datos.
2. Cree la base de datos y cargue las tablas y datos iniciales ejecutando los scripts SQL incluidos en el repositorio:
   - Archivo 1: `database/mysql/01_schema_mysql.sql` (Estructura de 10 tablas e indices).
   - Archivo 2: `database/mysql/02_seed_mysql.sql` (Usuarios del sistema y datos bancarios de prueba).
3. Puede ejecutarlos directamente desde phpMyAdmin (`http://localhost/phpmyadmin`) o desde la consola de MySQL:
```bash
mysql -u root -p < database/mysql/01_schema_mysql.sql
mysql -u root -p < database/mysql/02_seed_mysql.sql
```
*Nota: Si omite este paso, el sistema funcionara normalmente utilizando su motor transaccional dual en memoria.*

---

### Paso 3: Instalacion y Puesta en Marcha del Backend
Abra una terminal dedicada para el servidor backend:
```bash
cd backend
npm install
npm start
```
El servidor backend iniciara en el puerto 8080:
```
http://localhost:8080/api
```

Para ejecutar la suite de pruebas de integracion end-to-end (16 fases de verificacion):
```bash
npm test
```

---

### Paso 4: Instalacion y Puesta en Marcha del Frontend
Abra una segunda terminal dedicada para la aplicacion cliente:
```bash
cd frontend
npm install
npm run dev
```
La aplicacion web se compilara e iniciara en el servidor de desarrollo de Vite:
```
http://localhost:5173
```

---

### Paso 5: Ingreso y Uso del Sistema
1. Abra su navegador web (Chrome, Edge o Firefox) e ingrese a la direccion:
   `http://localhost:5173`
2. En la pantalla de bienvenida, ingrese las credenciales de prueba segun el rol que desee evaluar. Por ejemplo:
   - Usuario: `cmendoza`
   - Contrasena: `Bancario2026!`
3. Se desplegara la interfaz correspondiente al perfil del funcionario, con la barra de navegacion flotante, el indicador de tiempo de sesion (15 minutos) y las acciones permitidas segun la matriz RBAC.

---

## 6. Matriz de Cobertura de Requisitos (RTM)

| Requisito | Caso de Uso | Descripcion Tecnica | Estado |
| :--- | :--- | :--- | :---: |
| **RF01** | CU01 | Registro de clientes con validacion de unicidad de CI. | Implementado (100%) |
| **RF02** | CU01 | Edicion y actualizacion de datos sociodemograficos del cliente. | Implementado (100%) |
| **RF03** | CU02 | Registro de solicitud de credito y calculo de cuota mensual estimada. | Implementado (100%) |
| **RF04** | CU03 | Simulacion de consulta a Buro de Informacion Crediticia (ASFI). | Implementado (100%) |
| **RF05** | CU04 | Evaluacion financiera con calculo de ratio de endeudamiento (DTI <= 40%). | Implementado (100%) |
| **RF06** | CU05 | Emision de dictamen de evaluacion de riesgo (Aprobado, Observado, Rechazado). | Implementado (100%) |
| **RF07** | CU06 | Registro y valoracion de garantias (Personal, Hipotecaria, Prendaria >= 120%). | Implementado (100%) |
| **RF08** | CU07 | Aprobacion de credito y verificacion de limites de atribucion (<= 70.000 Bs). | Implementado (100%) |
| **RF09** | CU08 | Registro de rechazo fundamentado de solicitudes con causal obligatoria. | Implementado (100%) |
| **RF10** | CU09 | Generacion automatica de contrato de credito con numeracion correlativa. | Implementado (100%) |
| **RF11** | CU10 | Generacion de cronograma de amortizacion frances con ajuste de centavos. | Implementado (100%) |
| **RF12** | CU11 | Desembolso de credito mediante integracion con Core Bancario. | Implementado (100%) |
| **RF13** | CU12 | Cobro de cuotas en ventanilla con cascada (Mora -> Interes -> Capital). | Implementado (100%) |
| **RF14** | CU13 | Emision de recibos de pago con numeracion fiscal REC-XXXXX. | Implementado (100%) |
| **RF15** | CU14 | Reportes de cartera, mora, indice de morosidad y colocaciones. | Implementado (100%) |
| **RF16** | CU15 | Autenticacion RBAC, JWT de 15 min y bloqueo tras 5 intentos fallidos. | Implementado (100%) |

---

## 7. Medidas de Seguridad Implementadas

- **Autenticacion:** JSON Web Tokens (JWT) firmados con clave secreta y caducidad estricta de 15 minutos de inactividad (RNF01).
- **Proteccion contra Fuerza Bruta:** Bloqueo preventivo de cuenta por 30 minutos al registrarse 5 intentos fallidos consecutivos de acceso.
- **Almacenamiento Seguro de Credenciales:** Cifrado de contrasenas mediante el algoritmo BCrypt con factor de costo 10.
- **Control de Acceso Basado en Roles (RBAC):** Middleware que intercepta y convalida autorizaciones a nivel de ruta y recurso.
- **Auditoria Forense Inmutable:** Registro exhaustivo de direccion IP de origen, identificador de usuario, operacion efectuada, entidad impactada y marca de tiempo ISO 8601 para toda transaccion de escritura (RNF06 / RN12).

---

## 8. Estructura del Repositorio

```
sistema-gestion-creditos/
|-- backend/                     # Servidor de API REST en Node.js + Express
|   |-- src/
|   |   |-- config/              # Variables de entorno y politicas crediticias
|   |   |-- middleware/          # Autenticacion JWT, autorizacion RBAC y errores
|   |   |-- rutas/               # Definicion de endpoints RESTful
|   |   |-- servicios/           # Logica de negocio financiero y contable
|   |   `-- servidor.js          # Punto de entrada de la aplicacion backend
|   |-- test-integracion.js      # Suite de pruebas automatizadas de integracion
|   `-- package.json
|-- database/                    # Scripts de base de datos relacional MySQL
|   `-- mysql/
|       |-- 01_schema_mysql.sql  # DDL: Creacion de 10 tablas, indices y restricciones
|       `-- 02_seed_mysql.sql    # DML: Semilla de datos bancarios y usuarios iniciales
|-- frontend/                    # Cliente web en React 19 + TypeScript + Vite
|   |-- src/
|   |   |-- components/          # Vistas operativas por rol y modales de negocio
|   |   |-- services/            # Cliente HTTP tipado con TypeScript
|   |   |-- types/               # Definiciones de tipos e interfaces bancarias
|   |   |-- App.tsx              # Componente principal y despacho de vistas
|   |   `-- index.css            # Estilos de cabecera flotante, tema oscuro y layout
|   |-- public/
|   |   `-- favicon.svg          # Isotipo de GitHub en vector SVG
|   `-- package.json
|-- docs/                        # Manuales y documentacion metodologica formal
|   `-- MANUAL_SISTEMA_Y_METODOLOGIA.md
`-- README.md                    # Guia de presentacion y ejecucion en local
```
