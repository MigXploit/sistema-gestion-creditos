-- ==============================================================================
-- SISTEMA DE GESTIÓN DE CRÉDITOS PARA UNA ENTIDAD BANCARIA
-- UNIVERSIDAD MAYOR DE SAN ANDRÉS (UMSA) - FACULTAD DE CIENCIAS PURAS Y NATURALES
-- MATERIA: ANÁLISIS Y DISEÑO DE SISTEMAS I (INF-241) - PARALELO "B"
-- DOCENTE: M. Sc. PATRICIA SONIA TRINO CAMACHO
-- GRUPO 4: Alex Arturo Jamachi Condori, Miguel Angel Bustillos, Saúl Callisaya, Royer Patty, Ranulfo Rojas
--
-- ARCHIVO: 01_schema_mysql.sql
-- ESQUEMA DE BASE DE DATOS RELACIONAL PARA MYSQL / MARIADB
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `creditos_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `creditos_db`;

-- Desactivar temporalmente revisión de llaves foráneas para orden de tablas
SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABLA: CLIENTE (RF01, RF02, CU01, D02, P10)
DROP TABLE IF EXISTS `cliente`;
CREATE TABLE `cliente` (
    `id_cliente` INT AUTO_INCREMENT PRIMARY KEY,
    `ci` VARCHAR(20) NOT NULL UNIQUE,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidos` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `direccion` VARCHAR(250) NULL,
    `ingresos_mensuales` DECIMAL(12, 2) NOT NULL,
    `fecha_registro` DATE NOT NULL,
    INDEX `idx_cliente_ci` (`ci`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLA: USUARIO (RF16, CU15, RNF01, RBAC Sección 16.2, P14)
DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (
    `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre_completo` VARCHAR(150) NOT NULL,
    `login` VARCHAR(50) NOT NULL UNIQUE,
    `clave_hash` VARCHAR(255) NOT NULL,
    `rol` VARCHAR(20) NOT NULL,
    `limite_atribucion` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `activo` TINYINT(1) NOT NULL DEFAULT 1,
    `intentos_fallidos` INT NOT NULL DEFAULT 0,
    `bloqueado_hasta` DATETIME NULL,
    INDEX `idx_usuario_login` (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLA: SOLICITUD_CREDITO (RF03, CU02, RN01, RN02, RN04, P11, P02)
DROP TABLE IF EXISTS `solicitud_credito`;
CREATE TABLE `solicitud_credito` (
    `id_solicitud` INT AUTO_INCREMENT PRIMARY KEY,
    `id_cliente` INT NOT NULL,
    `numero_solicitud` VARCHAR(30) NOT NULL UNIQUE,
    `fecha_solicitud` DATE NOT NULL,
    `monto_solicitado` DECIMAL(14, 2) NOT NULL,
    `plazo_meses` INT NOT NULL,
    `tipo_credito` VARCHAR(20) NOT NULL,
    `destino` VARCHAR(200) NOT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'REGISTRADA',
    `motivo_rechazo` VARCHAR(500) NULL,
    `documentacion_completa` TINYINT(1) NOT NULL DEFAULT 0,
    INDEX `idx_solicitud_numero` (`numero_solicitud`),
    INDEX `idx_solicitud_cliente` (`id_cliente`),
    CONSTRAINT `fk_solicitud_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABLA: EVALUACION_CREDITO (RF04, RF05, RF06, CU03, CU04, CU05, P13)
DROP TABLE IF EXISTS `evaluacion_credito`;
CREATE TABLE `evaluacion_credito` (
    `id_evaluacion` INT AUTO_INCREMENT PRIMARY KEY,
    `id_solicitud` INT NOT NULL UNIQUE,
    `fecha_evaluacion` DATE NOT NULL,
    `ingresos` DECIMAL(12, 2) NOT NULL,
    `gastos` DECIMAL(12, 2) NOT NULL,
    `capacidad_pago` DECIMAL(12, 2) NOT NULL,
    `ratio_dti` DECIMAL(5, 2) NULL,
    `score_buro` INT NULL,
    `referencia_buro` VARCHAR(50) NULL,
    `nivel_riesgo` VARCHAR(10) NULL,
    `resultado` VARCHAR(20) NOT NULL,
    `dictamen` TEXT NULL,
    CONSTRAINT `fk_evaluacion_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud_credito` (`id_solicitud`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABLA: CREDITO (RF08, CU07, RN10, RN11, P02, D13)
DROP TABLE IF EXISTS `credito`;
CREATE TABLE `credito` (
    `id_credito` INT AUTO_INCREMENT PRIMARY KEY,
    `id_solicitud` INT NOT NULL UNIQUE,
    `numero_credito` VARCHAR(30) NOT NULL UNIQUE,
    `monto_aprobado` DECIMAL(14, 2) NOT NULL,
    `tasa_interes` DECIMAL(5, 2) NOT NULL,
    `tasa_mora` DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
    `sistema_amortizacion` VARCHAR(10) NOT NULL DEFAULT 'FRANCES',
    `plazo_meses` INT NOT NULL,
    `fecha_desembolso` DATE NULL,
    `saldo_capital` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `interes_acumulado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `mora_acumulada` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `estado` VARCHAR(25) NOT NULL DEFAULT 'APROBADO',
    INDEX `idx_credito_numero` (`numero_credito`),
    CONSTRAINT `fk_credito_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud_credito` (`id_solicitud`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABLA: GARANTIA (RF07, CU06, RN12, RN13, P12)
DROP TABLE IF EXISTS `garantia`;
CREATE TABLE `garantia` (
    `id_garantia` INT AUTO_INCREMENT PRIMARY KEY,
    `id_solicitud` INT NOT NULL,
    `id_credito` INT NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(250) NOT NULL,
    `valor_tasacion` DECIMAL(14, 2) NOT NULL,
    `cobertura_porcentaje` DECIMAL(6, 2) NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'VIGENTE',
    INDEX `idx_garantia_solicitud` (`id_solicitud`),
    INDEX `idx_garantia_credito` (`id_credito`),
    CONSTRAINT `fk_garantia_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud_credito` (`id_solicitud`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_garantia_credito` FOREIGN KEY (`id_credito`) REFERENCES `credito` (`id_credito`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABLA: CONTRATO (RF10, CU09, RN05, P03)
DROP TABLE IF EXISTS `contrato`;
CREATE TABLE `contrato` (
    `id_contrato` INT AUTO_INCREMENT PRIMARY KEY,
    `id_credito` INT NOT NULL UNIQUE,
    `numero_contrato` VARCHAR(30) NOT NULL UNIQUE,
    `fecha_firma` DATE NULL,
    `notaria_registro` VARCHAR(150) NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE_FIRMA',
    INDEX `idx_contrato_numero` (`numero_contrato`),
    CONSTRAINT `fk_contrato_credito` FOREIGN KEY (`id_credito`) REFERENCES `credito` (`id_credito`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABLA: CUOTA (RF11, CU10, RN06, RN07, CA16, P05)
DROP TABLE IF EXISTS `cuota`;
CREATE TABLE `cuota` (
    `id_cuota` INT AUTO_INCREMENT PRIMARY KEY,
    `id_credito` INT NOT NULL,
    `numero_cuota` INT NOT NULL,
    `fecha_vencimiento` DATE NOT NULL,
    `capital` DECIMAL(12, 2) NOT NULL,
    `interes_comp` DECIMAL(12, 2) NOT NULL,
    `interes_mora` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `monto` DECIMAL(12, 2) NOT NULL,
    `saldo_pendiente` DECIMAL(12, 2) NOT NULL,
    `dias_mora` INT NOT NULL DEFAULT 0,
    `estado` VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE',
    INDEX `idx_cuota_credito` (`id_credito`),
    CONSTRAINT `fk_cuota_credito` FOREIGN KEY (`id_credito`) REFERENCES `credito` (`id_credito`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABLA: PAGO (RF13, CU12, RN07, RN08, RN10, CA19, P08, D14)
DROP TABLE IF EXISTS `pago`;
CREATE TABLE `pago` (
    `id_pago` INT AUTO_INCREMENT PRIMARY KEY,
    `id_cuota` INT NOT NULL,
    `fecha_pago` DATE NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `monto_mora` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `monto_interes` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `monto_capital` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `forma_pago` VARCHAR(15) NOT NULL DEFAULT 'EFECTIVO',
    `numero_recibo` VARCHAR(30) NOT NULL UNIQUE,
    INDEX `idx_pago_cuota` (`id_cuota`),
    INDEX `idx_pago_recibo` (`numero_recibo`),
    CONSTRAINT `fk_pago_cuota` FOREIGN KEY (`id_cuota`) REFERENCES `cuota` (`id_cuota`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. TABLA: AUDITORIA (RN12, RNF06, Trazabilidad Inmutable)
DROP TABLE IF EXISTS `auditoria`;
CREATE TABLE `auditoria` (
    `id_auditoria` INT AUTO_INCREMENT PRIMARY KEY,
    `id_usuario` INT NULL,
    `fecha_hora` DATETIME NOT NULL,
    `ip_origen` VARCHAR(45) NULL,
    `operacion` VARCHAR(50) NOT NULL,
    `entidad` VARCHAR(50) NOT NULL,
    `id_entidad` VARCHAR(50) NULL,
    `resultado` VARCHAR(100) NOT NULL,
    `detalles` TEXT NULL,
    INDEX `idx_auditoria_usuario` (`id_usuario`),
    INDEX `idx_auditoria_fecha` (`fecha_hora`),
    CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
