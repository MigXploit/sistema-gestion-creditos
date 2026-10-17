# Registro de Decisiones y Parámetros Pendientes de Definición
## Sistema de Gestión de Créditos Bancario - UMSA

Este documento consolida todos los parámetros, suposiciones ("SUPUESTO") y reglas de negocio pendientes de confirmación definitiva por el grupo de trabajo y docente ("PENDIENTE"), garantizando que ninguna decisión técnica quede opaca ni sin trazabilidad.

---

### 1. Parámetros Técnicos y No Funcionales (RNF)

| Código | Parámetro | Valor Implementado / Supuesto | Referencia en Documento Base | Estado |
|---|---|---|---|---|
| PAR-RNF-01 | Disponibilidad del sistema | 99,0 % de disponibilidad anual | RNF04 (frente a mención contradictoria de 99,5 % en RNF06) | PENDIENTE (Confirmación grupo) |
| PAR-RNF-02 | Cifrado en tránsito | TLS 1.3 | RNF02 y Sección 16.2 (frente a mención de TLS 1.2 en RNF07) | PENDIENTE (Confirmación grupo) |
| PAR-RNF-03 | Tiempo de inactividad de sesión | 15 minutos (900.000 ms) | RNF01, RNF06 y Sección 16.2 | APROBADO |
| PAR-RNF-04 | Umbral de bloqueo por intentos fallidos | 5 intentos consecutivos | Sección 16.2 | APROBADO |
| PAR-RNF-05 | Límite de atribución de aprobación Jefe | Bs 70.000,00 | Sección 13.5 y CA13 | APROBADO |

---

### 2. Parámetros de Negocio y Originación (CU01, CU02, CU06)

| Código | Parámetro | Valor Implementado / Supuesto | Justificación / Fuente | Estado |
|---|---|---|---|---|
| PAR-NEG-01 | Tasa anual de referencia para créditos | 12,00 % anual | Ejemplo explícito de P05 (30.000 Bs a 12 meses, 12 % anual). Configurable por tipo de crédito. | PENDIENTE (Configurable) |
| PAR-NEG-02 | Límites de monto y plazo por producto (RN04) | Consumo: Min 1.000, Max 70.000, Plazo 6 a 60 meses.<br>Comercial: Min 5.000, Max 200.000, Plazo 12 a 120 meses.<br>Vivienda: Min 20.000, Max 500.000, Plazo 36 a 240 meses. | No definidos numéricamente en el informe base. Implementados como constantes configurables. | PENDIENTE (Confirmación grupo) |
| PAR-NEG-03 | Cobertura mínima de garantía (CU06) | 120,00 % (Valor Tasación / Monto Solicitado) | Sección 13.5. Se calcula y muestra en pantalla P12. No bloquea la aprobación por defecto. | PENDIENTE (Validar si debe ser bloqueante) |
| PAR-NEG-04 | Formato de número de contrato | `CT20250001` | Formato tomado del ejemplo de la guía (frente a CTR-89-2026 de D13). | SUPUESTO |
| PAR-NEG-05 | Formato de número de crédito | `CR20250001` | Formato de la guía (frente a CRE-2026-089 de D13). | SUPUESTO |
| PAR-NEG-06 | Formato de número de solicitud | `SOL-2025-00101` / `SOL-2026-0501` | Formatos observados en guía y D13. Generación secuencial automática. | APROBADO |
| PAR-NEG-07 | Fecha del primer vencimiento del cronograma (CU10) | Conserva el mismo día de cada mes a partir de la fecha de aprobación ($n$ meses después). | P05 y CA16. Concentrado en una función de cálculo parametrizable. | PENDIENTE (Confirmación grupo) |

---

### 3. Parámetros del Buró de Crédito y Evaluación (CU03, CU04, CU05)

| Código | Parámetro | Valor Implementado / Supuesto | Justificación / Fuente | Estado |
|---|---|---|---|---|
| PAR-BUR-01 | Vigencia máxima de consulta a Buró | 30 días calendario | Regla RN09. Consultas con más de 30 días requieren nueva llamada. | APROBADO |
| PAR-BUR-02 | Timeout de consulta al servicio de Buró | 30 segundos | RNF09 (rendimiento e interfaces externas). | APROBADO |
| PAR-BUR-03 | Umbral de ratio DTI | Referencia del 40 % o DTI observado de 0.32 (32 %) en D13. | Sección 13.5 y D13. Se calcula como `(Cuota estimada + Deudas vigentes) / Ingresos * 100`. | PENDIENTE |
| PAR-BUR-04 | Criterio de capacidad de pago | Cuota estimada $\le 80\ \% \times$ Excedente Neto (Ingresos - Gastos). | Sección 13.5 y P13. Se calcula y visualiza en P13. | PENDIENTE |
