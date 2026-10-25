-- ==============================================================================
-- SISTEMA DE GESTIÓN DE CRÉDITOS PARA UNA ENTIDAD BANCARIA
-- ARCHIVO: 02_seed_mysql.sql
-- DATOS INICIALES Y SEMILLA DE PRUEBA (DESARROLLO Y DEMOSTRACIÓN)
-- ==============================================================================

USE `creditos_db`;

-- Contraseña común para todos los usuarios: Bancario2026!
-- Hash BCrypt estándar: $2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2

-- 1. USUARIOS DEL SISTEMA (Sección 16.2 RBAC, D02, P01, P14)
INSERT INTO `usuario` (`id_usuario`, `nombre_completo`, `login`, `clave_hash`, `rol`, `limite_atribucion`, `activo`, `intentos_fallidos`) VALUES
(1, 'Carlos Mendoza', 'cmendoza', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'JEFE', 70000.00, 1, 0),
(2, 'Ana Torrez', 'atorrez', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'OFICIAL', 0.00, 1, 0),
(3, 'Luis Rojas', 'lrojas', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'ANALISTA', 0.00, 1, 0),
(4, 'Cajero de Prueba', 'cajero1', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'CAJERO', 0.00, 1, 0),
(5, 'Gerente de Prueba', 'gerente1', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'GERENTE', 500000.00, 1, 0),
(6, 'Administrador del Sistema', 'admin', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'ADMINISTRADOR', 0.00, 1, 0)
ON DUPLICATE KEY UPDATE `nombre_completo` = VALUES(`nombre_completo`);

-- 2. CLIENTES DE PRUEBA (P10, P02, D13)
INSERT INTO `cliente` (`id_cliente`, `ci`, `nombres`, `apellidos`, `telefono`, `direccion`, `ingresos_mensuales`, `fecha_registro`) VALUES
(1, '4587231', 'María Elena', 'Quispe Mamani', '70012345', 'Sopocachi, Av. 20 de Octubre #452, La Paz', 6500.00, '2025-09-10'),
(2, '3498210', 'Juan Carlos', 'Mamani', '71122334', 'Miraflores, Calle Díaz Romero #120, La Paz', 4000.00, '2025-09-11'),
(3, '5928104', 'Rosa', 'Condori', '72233445', 'San Pedro, Calle Nicolás Acosta #89, La Paz', 3500.00, '2025-09-12'),
(4, '4839201 LP', 'Carlos', 'Mamani Quispe', '73344556', 'Zona Sur, Calacoto Calle 15, La Paz', 6500.00, '2026-09-01')
ON DUPLICATE KEY UPDATE `nombres` = VALUES(`nombres`);

-- 3. SOLICITUDES DE CRÉDITO
-- Solicitud 101: María Elena Quispe (Lista para aprobar por el Jefe, Evaluación Favorable previa)
INSERT INTO `solicitud_credito` (`id_solicitud`, `id_cliente`, `numero_solicitud`, `fecha_solicitud`, `monto_solicitado`, `plazo_meses`, `tipo_credito`, `destino`, `estado`, `documentacion_completa`) VALUES
(101, 1, 'SOL-101', '2025-09-15', 30000.00, 12, 'CONSUMO', 'Capital de trabajo para negocio comercial', 'EN_EVALUACION', 1),
(102, 2, 'SOL-102', '2025-09-16', 12000.00, 6, 'CONSUMO', 'Gastos personales y salud', 'REGISTRADA', 1),
(103, 3, 'SOL-103', '2025-09-18', 8500.00, 12, 'CONSUMO', 'Mejora y refacción de vivienda', 'REGISTRADA', 1),
(501, 4, 'SOL-2026-0501', '2026-09-15', 35000.00, 24, 'CONSUMO', 'Compra de vehículo familiar', 'APROBADA', 1)
ON DUPLICATE KEY UPDATE `estado` = VALUES(`estado`);

-- 4. GARANTÍAS (P12)
INSERT INTO `garantia` (`id_garantia`, `id_solicitud`, `id_credito`, `tipo`, `descripcion`, `valor_tasacion`, `cobertura_porcentaje`, `estado`) VALUES
(101, 101, NULL, 'Prendaria', 'Vehículo particular Toyota Corolla Mod. 2018 (Placa 1234ABC)', 45000.00, 150.00, 'VIGENTE'),
(401, 501, NULL, 'VEHICULAR', 'Toyota Hilux 2019 (Placa 5678XYZ)', 50000.00, 142.86, 'CUSTODIA')
ON DUPLICATE KEY UPDATE `estado` = VALUES(`estado`);

-- 5. EVALUACIONES CREDITICIAS (P13, D13)
INSERT INTO `evaluacion_credito` (`id_evaluacion`, `id_solicitud`, `fecha_evaluacion`, `ingresos`, `gastos`, `capacidad_pago`, `ratio_dti`, `score_buro`, `referencia_buro`, `nivel_riesgo`, `resultado`, `dictamen`) VALUES
(101, 101, '2025-09-17', 6500.00, 3200.00, 3300.00, 38.00, 750, 'R04571', 'MEDIO', 'FAVORABLE', 'Se recomienda aprobación conforme a capacidad de pago favorable (excedente Bs 3.300) y garantía suficiente (cobertura 150%).'),
(301, 501, '2026-09-20', 6500.00, 4300.00, 2200.00, 32.00, 780, 'R-D13-780', 'BAJO', 'FAVORABLE', 'Evaluación favorable con bajo riesgo según buró score 780 y relación DTI 32%.')
ON DUPLICATE KEY UPDATE `resultado` = VALUES(`resultado`);

-- 6. CRÉDITO FORMALIZADO (D13 - CRE-2026-089)
INSERT INTO `credito` (`id_credito`, `id_solicitud`, `numero_credito`, `monto_aprobado`, `tasa_interes`, `tasa_mora`, `sistema_amortizacion`, `plazo_meses`, `fecha_desembolso`, `saldo_capital`, `interes_acumulado`, `mora_acumulada`, `estado`) VALUES
(801, 501, 'CRE-2026-089', 35000.00, 11.50, 18.00, 'FRANCES', 24, '2026-10-01', 33600.00, 0.00, 0.00, 'VIGENTE')
ON DUPLICATE KEY UPDATE `estado` = VALUES(`estado`);

-- Asociar garantía 401 al crédito formalizado 801
UPDATE `garantia` SET `id_credito` = 801 WHERE `id_garantia` = 401;

-- 7. CONTRATO LEGAL (D13 - CTR-89-2026)
INSERT INTO `contrato` (`id_contrato`, `id_credito`, `numero_contrato`, `fecha_firma`, `notaria_registro`, `estado`) VALUES
(201, 801, 'CTR-89-2026', '2026-10-01', 'Notaría de Fe Pública N° 45 LP', 'FIRMADO')
ON DUPLICATE KEY UPDATE `estado` = VALUES(`estado`);

-- 8. CUOTAS DEL CRONOGRAMA FRANCÉS (D13)
INSERT INTO `cuota` (`id_cuota`, `id_credito`, `numero_cuota`, `fecha_vencimiento`, `capital`, `interes_comp`, `interes_mora`, `monto`, `saldo_pendiente`, `dias_mora`, `estado`) VALUES
(1001, 801, 1, '2026-11-01', 1400.00, 250.00, 50.00, 1700.00, 0.00, 0, 'PAGADA'),
(1002, 801, 2, '2026-12-01', 1415.00, 235.00, 0.00, 1650.00, 1650.00, 0, 'PENDIENTE'),
(1003, 801, 3, '2027-01-01', 1428.56, 221.44, 0.00, 1650.00, 1650.00, 0, 'PENDIENTE')
ON DUPLICATE KEY UPDATE `estado` = VALUES(`estado`);

-- 9. PAGO EN VENTANILLA (D13, D14 - REC-4401)
INSERT INTO `pago` (`id_pago`, `id_cuota`, `fecha_pago`, `monto`, `monto_mora`, `monto_interes`, `monto_capital`, `forma_pago`, `numero_recibo`) VALUES
(701, 1001, '2026-11-05', 1700.00, 50.00, 250.00, 1400.00, 'EFECTIVO', 'REC-4401')
ON DUPLICATE KEY UPDATE `numero_recibo` = VALUES(`numero_recibo`);

-- 10. EVENTOS INICIALES DE AUDITORÍA
INSERT INTO `auditoria` (`id_usuario`, `fecha_hora`, `ip_origen`, `operacion`, `entidad`, `id_entidad`, `resultado`, `detalles`) VALUES
(6, NOW(), '127.0.0.1', 'INICIALIZACION_SISTEMA', 'SISTEMA', '1', 'EXITOSO', 'Carga inicial de datos semilla para demostración académica UMSA INF-241.');
