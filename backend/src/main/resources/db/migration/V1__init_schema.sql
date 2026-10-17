-- ==============================================================================
-- SISTEMA DE GESTIÓN DE CRÉDITOS BANCARIO (UMSA - Análisis y Diseño I)
-- V1__init_schema.sql: Esquema inicial de Base de Datos PostgreSQL
-- Fuente de verdad: docs/Sistema_Gestion_Creditos_Base.md (Sección 14.1 y D02)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECUENCIAS
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS cliente_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS solicitud_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS evaluacion_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS credito_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS garantia_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS contrato_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS cuota_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS pago_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS usuario_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS auditoria_seq START WITH 1 INCREMENT BY 1;

-- ------------------------------------------------------------------------------
-- 2. TABLAS
-- ------------------------------------------------------------------------------

-- TABLA: CLIENTE (Sección 14.1, D02)
CREATE TABLE IF NOT EXISTS cliente (
    id_cliente BIGINT NOT NULL DEFAULT nextval('cliente_seq') PRIMARY KEY,
    ci VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(250),
    ingresos_mensuales NUMERIC(12, 2) NOT NULL,
    fecha_registro DATE NOT NULL
);

-- TABLA: USUARIO (Sección 14.1, D02, 16.2)
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario BIGINT NOT NULL DEFAULT nextval('usuario_seq') PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    login VARCHAR(50) NOT NULL UNIQUE,
    clave_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    limite_atribucion NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMP
);

-- TABLA: SOLICITUD_CREDITO (Sección 14.1, D02, P06, CA05)
CREATE TABLE IF NOT EXISTS solicitud_credito (
    id_solicitud BIGINT NOT NULL DEFAULT nextval('solicitud_seq') PRIMARY KEY,
    id_cliente BIGINT NOT NULL REFERENCES cliente(id_cliente),
    numero_solicitud VARCHAR(30) NOT NULL UNIQUE,
    fecha_solicitud DATE NOT NULL,
    monto_solicitado NUMERIC(14, 2) NOT NULL,
    plazo_meses INTEGER NOT NULL,
    tipo_credito VARCHAR(20) NOT NULL,
    destino VARCHAR(200) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADA',
    motivo_rechazo VARCHAR(500),
    documentacion_completa BOOLEAN NOT NULL DEFAULT FALSE
);

-- TABLA: EVALUACION_CREDITO (Sección 14.1, D02, P13, CA09)
CREATE TABLE IF NOT EXISTS evaluacion_credito (
    id_evaluacion BIGINT NOT NULL DEFAULT nextval('evaluacion_seq') PRIMARY KEY,
    id_solicitud BIGINT NOT NULL UNIQUE REFERENCES solicitud_credito(id_solicitud),
    fecha_evaluacion DATE NOT NULL,
    ingresos NUMERIC(12, 2) NOT NULL,
    gastos NUMERIC(12, 2) NOT NULL,
    capacidad_pago NUMERIC(12, 2) NOT NULL,
    ratio_dti NUMERIC(5, 2),
    score_buro INTEGER,
    referencia_buro VARCHAR(50),
    nivel_riesgo VARCHAR(10),
    resultado VARCHAR(20) NOT NULL,
    dictamen VARCHAR(1000)
);

-- TABLA: CREDITO (Sección 14.1, D02, D08)
CREATE TABLE IF NOT EXISTS credito (
    id_credito BIGINT NOT NULL DEFAULT nextval('credito_seq') PRIMARY KEY,
    id_solicitud BIGINT NOT NULL UNIQUE REFERENCES solicitud_credito(id_solicitud),
    numero_credito VARCHAR(30) NOT NULL UNIQUE,
    monto_aprobado NUMERIC(14, 2) NOT NULL,
    tasa_interes NUMERIC(5, 2) NOT NULL,
    tasa_mora NUMERIC(5, 2) NOT NULL,
    sistema_amortizacion VARCHAR(10) NOT NULL DEFAULT 'FRANCES',
    plazo_meses INTEGER NOT NULL,
    fecha_desembolso DATE,
    saldo_capital NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    interes_acumulado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    mora_acumulada NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(25) NOT NULL DEFAULT 'APROBADO'
);

-- TABLA: GARANTIA (Sección 14.1, D02, CA10, P12)
-- Justificación: id_credito nullable e id_solicitud FK para cubrir CU06 y CU07
CREATE TABLE IF NOT EXISTS garantia (
    id_garantia BIGINT NOT NULL DEFAULT nextval('garantia_seq') PRIMARY KEY,
    id_solicitud BIGINT NOT NULL REFERENCES solicitud_credito(id_solicitud),
    id_credito BIGINT REFERENCES credito(id_credito),
    tipo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(250) NOT NULL,
    valor_tasacion NUMERIC(14, 2) NOT NULL,
    cobertura_porcentaje NUMERIC(6, 2),
    estado VARCHAR(20) NOT NULL DEFAULT 'VIGENTE'
);

-- TABLA: CONTRATO (Sección 14.1, D02, CU09, CA15)
CREATE TABLE IF NOT EXISTS contrato (
    id_contrato BIGINT NOT NULL DEFAULT nextval('contrato_seq') PRIMARY KEY,
    id_credito BIGINT NOT NULL UNIQUE REFERENCES credito(id_credito),
    numero_contrato VARCHAR(30) NOT NULL UNIQUE,
    fecha_firma DATE,
    notaria_registro VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE_FIRMA'
);

-- TABLA: CUOTA (Sección 14.1, D02, CU10, CA16)
CREATE TABLE IF NOT EXISTS cuota (
    id_cuota BIGINT NOT NULL DEFAULT nextval('cuota_seq') PRIMARY KEY,
    id_credito BIGINT NOT NULL REFERENCES credito(id_credito),
    numero_cuota INTEGER NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    capital NUMERIC(12, 2) NOT NULL,
    interes_comp NUMERIC(12, 2) NOT NULL,
    interes_mora NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto NUMERIC(12, 2) NOT NULL,
    saldo_pendiente NUMERIC(12, 2) NOT NULL,
    dias_mora INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE'
);

-- TABLA: PAGO (Sección 14.1, D02, CU12, CA19)
CREATE TABLE IF NOT EXISTS pago (
    id_pago BIGINT NOT NULL DEFAULT nextval('pago_seq') PRIMARY KEY,
    id_cuota BIGINT NOT NULL REFERENCES cuota(id_cuota),
    fecha_pago DATE NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    monto_mora NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_interes NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_capital NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    forma_pago VARCHAR(15) NOT NULL,
    numero_recibo VARCHAR(30) NOT NULL UNIQUE
);

-- TABLA: AUDITORIA (Sección 14.1, D02, RNF06, RN12)
CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria BIGINT NOT NULL DEFAULT nextval('auditoria_seq') PRIMARY KEY,
    id_usuario BIGINT REFERENCES usuario(id_usuario),
    fecha_hora TIMESTAMP NOT NULL,
    ip_origen VARCHAR(45),
    operacion VARCHAR(50) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    id_entidad VARCHAR(50),
    resultado VARCHAR(100) NOT NULL,
    detalles VARCHAR(1000)
);

-- ------------------------------------------------------------------------------
-- 3. ÍNDICES ADICIONALES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cliente_ci ON cliente(ci);
CREATE INDEX IF NOT EXISTS idx_usuario_login ON usuario(login);
CREATE INDEX IF NOT EXISTS idx_solicitud_numero ON solicitud_credito(numero_solicitud);
CREATE INDEX IF NOT EXISTS idx_credito_numero ON credito(numero_credito);
CREATE INDEX IF NOT EXISTS idx_pago_recibo ON pago(numero_recibo);
CREATE INDEX IF NOT EXISTS idx_contrato_numero ON contrato(numero_contrato);
CREATE INDEX IF NOT EXISTS idx_cuota_credito ON cuota(id_credito);
CREATE INDEX IF NOT EXISTS idx_garantia_solicitud ON garantia(id_solicitud);
CREATE INDEX IF NOT EXISTS idx_garantia_credito ON garantia(id_credito);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(id_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha_hora);
