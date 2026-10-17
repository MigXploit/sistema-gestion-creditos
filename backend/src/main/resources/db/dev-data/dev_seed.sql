-- ==============================================================================
-- SISTEMA DE GESTIÓN DE CRÉDITOS BANCARIO (UMSA - Análisis y Diseño I)
-- dev_seed.sql: Datos Semilla para Desarrollo y Pruebas
-- Exclusivo para entorno de desarrollo / demos académicas.
-- Contraseña común de desarrollo para todos los usuarios: Bancario2026!
-- Hash BCrypt real verificado por prueba unitaria:
-- $2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USUARIOS DEL SISTEMA (Sección 16.2 Matriz RBAC, D02, P01, P10, P13)
-- ------------------------------------------------------------------------------

-- Carlos Mendoza: Jefe de Créditos (D02, P01, P02, límite 70.000 Bs según 13.5)
INSERT INTO usuario (id_usuario, nombre_completo, login, clave_hash, rol, limite_atribucion, activo, intentos_fallidos)
VALUES (1, 'Carlos Mendoza', 'cmendoza', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'JEFE', 70000.00, TRUE, 0)
ON CONFLICT (login) DO NOTHING;

-- Ana Torrez: Oficial de Crédito (P10, límite 0 Bs según 13.5) - Login atorrez [SUPUESTO]
INSERT INTO usuario (id_usuario, nombre_completo, login, clave_hash, rol, limite_atribucion, activo, intentos_fallidos)
VALUES (2, 'Ana Torrez', 'atorrez', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'OFICIAL', 0.00, TRUE, 0)
ON CONFLICT (login) DO NOTHING;

-- Luis Rojas: Analista de Crédito (P13, límite 0 Bs según 13.5) - Login lrojas [SUPUESTO]
INSERT INTO usuario (id_usuario, nombre_completo, login, clave_hash, rol, limite_atribucion, activo, intentos_fallidos)
VALUES (3, 'Luis Rojas', 'lrojas', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'ANALISTA', 0.00, TRUE, 0)
ON CONFLICT (login) DO NOTHING;

-- Cajero de prueba: Rol CAJERO (Sección 16.2) - Nombre y login [SUPUESTO]
INSERT INTO usuario (id_usuario, nombre_completo, login, clave_hash, rol, limite_atribucion, activo, intentos_fallidos)
VALUES (4, 'Cajero de prueba', 'cajero1', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'CAJERO', 0.00, TRUE, 0)
ON CONFLICT (login) DO NOTHING;

-- Gerente de prueba: Rol GERENTE (Sección 16.2) - Nombre y login [SUPUESTO]
INSERT INTO usuario (id_usuario, nombre_completo, login, clave_hash, rol, limite_atribucion, activo, intentos_fallidos)
VALUES (5, 'Gerente de prueba', 'gerente1', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'GERENTE', 0.00, TRUE, 0)
ON CONFLICT (login) DO NOTHING;

-- Administrador de prueba: Rol ADMINISTRADOR (Sección 16.2, CU15) - Nombre y login [SUPUESTO]
INSERT INTO usuario (id_usuario, nombre_completo, login, clave_hash, rol, limite_atribucion, activo, intentos_fallidos)
VALUES (6, 'Administrador de prueba', 'admin', '$2a$10$fuwKKF7MN3xord0A.RUop.WCKpp2PxsAQQSz3vB.8XbT1quSTw/U2', 'ADMINISTRADOR', 0.00, TRUE, 0)
ON CONFLICT (login) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 2. CONJUNTO A (GUÍA - Para demo de CU07 Aprobación y pantallas P02/P03/P10/P11/P12/P13)
-- ------------------------------------------------------------------------------

-- Cliente 1: María Elena Quispe Mamani (P10)
INSERT INTO cliente (id_cliente, ci, nombres, apellidos, telefono, direccion, ingresos_mensuales, fecha_registro)
VALUES (1, '4587231', 'María Elena', 'Quispe Mamani', '70012345', 'Sopocachi, La Paz', 6500.00, '2025-09-10')
ON CONFLICT (ci) DO NOTHING;

-- Cliente 2: Juan Carlos Mamani (P02 fila 102) [Datos CI/ingresos SUPUESTO por no figurar en P02]
INSERT INTO cliente (id_cliente, ci, nombres, apellidos, telefono, direccion, ingresos_mensuales, fecha_registro)
VALUES (2, '3498210', 'Juan Carlos', 'Mamani', '71122334', 'Miraflores, La Paz', 4000.00, '2025-09-11')
ON CONFLICT (ci) DO NOTHING;

-- Cliente 3: Rosa Condori (P02 fila 103) [Datos CI/ingresos SUPUESTO por no figurar en P02]
INSERT INTO cliente (id_cliente, ci, nombres, apellidos, telefono, direccion, ingresos_mensuales, fecha_registro)
VALUES (3, '5928104', 'Rosa', 'Condori', '72233445', 'San Pedro, La Paz', 3500.00, '2025-09-12')
ON CONFLICT (ci) DO NOTHING;

-- Solicitud 101: María Elena Quispe (P02, P11, P12, P13)
INSERT INTO solicitud_credito (id_solicitud, id_cliente, numero_solicitud, fecha_solicitud, monto_solicitado, plazo_meses, tipo_credito, destino, estado, documentacion_completa)
VALUES (101, 1, 'SOL-101', '2025-09-15', 30000.00, 12, 'CONSUMO', 'Capital de trabajo', 'EN_EVALUACION', TRUE)
ON CONFLICT (numero_solicitud) DO NOTHING;

-- Garantía de la solicitud 101 (P12): Vehículo 1234ABC, tasación 45.000 Bs, cobertura 150%, VIGENTE
INSERT INTO garantia (id_garantia, id_solicitud, id_credito, tipo, descripcion, valor_tasacion, cobertura_porcentaje, estado)
VALUES (101, 101, NULL, 'Prendaria', 'Vehículo 1234ABC', 45000.00, 150.00, 'VIGENTE')
ON CONFLICT (id_garantia) DO NOTHING;

-- Evaluación de la solicitud 101 (P13): FAVORABLE, Ingresos 6500, Gastos 3200, Capacidad 3300, Riesgo MEDIO, Ref R04571
INSERT INTO evaluacion_credito (id_evaluacion, id_solicitud, fecha_evaluacion, ingresos, gastos, capacidad_pago, ratio_dti, score_buro, referencia_buro, nivel_riesgo, resultado, dictamen)
VALUES (101, 101, '2025-09-17', 6500.00, 3200.00, 3300.00, 38.00, 750, 'R04571', 'MEDIO', 'FAVORABLE', 'Se recomienda aprobación conforme a capacidad de pago favorable y garantía suficiente.')
ON CONFLICT (id_solicitud) DO NOTHING;

-- Solicitud 102: Juan Carlos Mamani (P02 fila 102 - Sin evaluación, tratada en bandeja como pendiente)
INSERT INTO solicitud_credito (id_solicitud, id_cliente, numero_solicitud, fecha_solicitud, monto_solicitado, plazo_meses, tipo_credito, destino, estado, documentacion_completa)
VALUES (102, 2, 'SOL-102', '2025-09-16', 12000.00, 6, 'CONSUMO', 'Gastos personales', 'EN_EVALUACION', TRUE)
ON CONFLICT (numero_solicitud) DO NOTHING;

-- Solicitud 103: Rosa Condori (P02 fila 103 - Sin evaluación, tratada en bandeja como pendiente)
INSERT INTO solicitud_credito (id_solicitud, id_cliente, numero_solicitud, fecha_solicitud, monto_solicitado, plazo_meses, tipo_credito, destino, estado, documentacion_completa)
VALUES (103, 3, 'SOL-103', '2025-09-18', 8500.00, 12, 'CONSUMO', 'Mejora de vivienda', 'EN_EVALUACION', TRUE)
ON CONFLICT (numero_solicitud) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 3. CONJUNTO B (D13 - Para demo de pagos y mora)
-- ------------------------------------------------------------------------------

-- Cliente c1 (D13): Carlos Mamani Quispe, CI '4839201 LP', Ingresos 6500 (tel y dir NULL [DEL INFORME])
INSERT INTO cliente (id_cliente, ci, nombres, apellidos, telefono, direccion, ingresos_mensuales, fecha_registro)
VALUES (101, '4839201 LP', 'Carlos', 'Mamani Quispe', NULL, NULL, 6500.00, '2026-09-01')
ON CONFLICT (ci) DO NOTHING;

-- Solicitud sol1 (D13): id 501, SOL-2026-0501, CONSUMO, 35000.00, 24 meses, APROBADA
INSERT INTO solicitud_credito (id_solicitud, id_cliente, numero_solicitud, fecha_solicitud, monto_solicitado, plazo_meses, tipo_credito, destino, estado, documentacion_completa)
VALUES (501, 101, 'SOL-2026-0501', '2026-09-15', 35000.00, 24, 'CONSUMO', 'Compra de vehículo', 'APROBADA', TRUE)
ON CONFLICT (numero_solicitud) DO NOTHING;

-- Evaluación ev1 (D13): Capacidad 2200.00, DTI 0.32 (32%), Score buró 780, Nivel BAJO, FAVORABLE
-- NOTA DE CONTRADICCIÓN D13: Imagen muestra DTI 0.32 y score 780; texto del informe indica 25.38% y score 810. Se aplican los valores de la imagen.
-- Gastos = 4300.00 [DERIVADO: Ingresos 6500 - Capacidad 2200]
INSERT INTO evaluacion_credito (id_evaluacion, id_solicitud, fecha_evaluacion, ingresos, gastos, capacidad_pago, ratio_dti, score_buro, referencia_buro, nivel_riesgo, resultado, dictamen)
VALUES (301, 501, '2026-09-20', 6500.00, 4300.00, 2200.00, 32.00, 780, 'R-D13-780', 'BAJO', 'FAVORABLE', 'Evaluación favorable con bajo riesgo según buró score 780.')
ON CONFLICT (id_solicitud) DO NOTHING;

-- Crédito cr1 (D13): id 801, CRE-2026-089, 35000.00, tasa 11.5%, FRANCES, saldo_capital 33600.00, VIGENTE
-- Tasa mora = 18.00% [PENDIENTE / SUPUESTO por no figurar en D13]
INSERT INTO credito (id_credito, id_solicitud, numero_credito, monto_aprobado, tasa_interes, tasa_mora, sistema_amortizacion, plazo_meses, fecha_desembolso, saldo_capital, interes_acumulado, mora_acumulada, estado)
VALUES (801, 501, 'CRE-2026-089', 35000.00, 11.50, 18.00, 'FRANCES', 24, '2026-10-01', 33600.00, 0.00, 0.00, 'VIGENTE')
ON CONFLICT (numero_credito) DO NOTHING;

-- Garantía gar1 (D13): id 401, VEHICULAR 'Toyota Hilux 2019', tasación 50000.00, cobertura 142.86%, CUSTODIA
INSERT INTO garantia (id_garantia, id_solicitud, id_credito, tipo, descripcion, valor_tasacion, cobertura_porcentaje, estado)
VALUES (401, 501, 801, 'VEHICULAR', 'Toyota Hilux 2019', 50000.00, 142.86, 'CUSTODIA')
ON CONFLICT (id_garantia) DO NOTHING;

-- Contrato ctr1 (D13): id 201, CTR-89-2026, fecha 2026-10-01, Notaría 45 LP, FIRMADO
INSERT INTO contrato (id_contrato, id_credito, numero_contrato, fecha_firma, notaria_registro, estado)
VALUES (201, 801, 'CTR-89-2026', '2026-10-01', 'Notaría 45 LP', 'FIRMADO')
ON CONFLICT (numero_contrato) DO NOTHING;

-- Cuota ct1 (D13): id 1001, Nº 1, capital 1400.00, interés 250.00, mora 50.00, monto 1700.00, saldo 0.00, PAGADA
INSERT INTO cuota (id_cuota, id_credito, numero_cuota, fecha_vencimiento, capital, interes_comp, interes_mora, monto, saldo_pendiente, dias_mora, estado)
VALUES (1001, 801, 1, '2026-11-01', 1400.00, 250.00, 50.00, 1700.00, 0.00, 0, 'PAGADA')
ON CONFLICT (id_cuota) DO NOTHING;

-- Cuota ct2 (D13): id 1002, Nº 2, capital 1415.00, interés 235.00, mora 0.00, monto 1650.00, saldo 1650.00, PENDIENTE
INSERT INTO cuota (id_cuota, id_credito, numero_cuota, fecha_vencimiento, capital, interes_comp, interes_mora, monto, saldo_pendiente, dias_mora, estado)
VALUES (1002, 801, 2, '2026-12-01', 1415.00, 235.00, 0.00, 1650.00, 1650.00, 0, 'PENDIENTE')
ON CONFLICT (id_cuota) DO NOTHING;

-- Pago pg1 (D13): id 701, cuota 1001, fecha 2026-11-05, monto 1700.00 (mora 50, interés 250, capital 1400), EFECTIVO, recibo REC-4401
INSERT INTO pago (id_pago, id_cuota, fecha_pago, monto, monto_mora, monto_interes, monto_capital, forma_pago, numero_recibo)
VALUES (701, 1001, '2026-11-05', 1700.00, 50.00, 250.00, 1400.00, 'EFECTIVO', 'REC-4401')
ON CONFLICT (numero_recibo) DO NOTHING;

-- Actualización de secuencias tras inserciones con ID explícito
SELECT setval('usuario_seq', (SELECT COALESCE(MAX(id_usuario), 1) FROM usuario));
SELECT setval('cliente_seq', (SELECT COALESCE(MAX(id_cliente), 1) FROM cliente));
SELECT setval('solicitud_seq', (SELECT COALESCE(MAX(id_solicitud), 1) FROM solicitud_credito));
SELECT setval('evaluacion_seq', (SELECT COALESCE(MAX(id_evaluacion), 1) FROM evaluacion_credito));
SELECT setval('credito_seq', (SELECT COALESCE(MAX(id_credito), 1) FROM credito));
SELECT setval('garantia_seq', (SELECT COALESCE(MAX(id_garantia), 1) FROM garantia));
SELECT setval('contrato_seq', (SELECT COALESCE(MAX(id_contrato), 1) FROM contrato));
SELECT setval('cuota_seq', (SELECT COALESCE(MAX(id_cuota), 1) FROM cuota));
SELECT setval('pago_seq', (SELECT COALESCE(MAX(id_pago), 1) FROM pago));
