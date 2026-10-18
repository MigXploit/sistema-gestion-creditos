/**
 * Parámetros y Reglas de Negocio Bancarias (UMSA INF-241)
 * Fuente: docs/Sistema_Gestion_Creditos_Base.md y docs/DECISIONES_PENDIENTES.md
 * Estándares: Variables y constantes definidas con nombres intuitivos y comprensibles.
 */

export const LIMITES_POR_PRODUCTO_CREDITICIO = {
    CONSUMO: {
        nombre: 'Crédito de Consumo',
        montoMinimoBs: 1000.00,
        montoMaximoBs: 70000.00,
        plazoMinimoMeses: 6,
        plazoMaximoMeses: 60,
        tasaInteresAnualSugerida: 12.00,
    },
    VEHICULAR: {
        nombre: 'Crédito Vehicular',
        montoMinimoBs: 5000.00,
        montoMaximoBs: 200000.00,
        plazoMinimoMeses: 12,
        plazoMaximoMeses: 72,
        tasaInteresAnualSugerida: 11.50,
    },
    VIVIENDA: {
        nombre: 'Crédito de Vivienda',
        montoMinimoBs: 20000.00,
        montoMaximoBs: 500000.00,
        plazoMinimoMeses: 36,
        plazoMaximoMeses: 240,
        tasaInteresAnualSugerida: 8.50,
    },
    MICROCREDITO: {
        nombre: 'Microcrédito Productivo',
        montoMinimoBs: 500.00,
        montoMaximoBs: 50000.00,
        plazoMinimoMeses: 3,
        plazoMaximoMeses: 36,
        tasaInteresAnualSugerida: 14.00,
    }
};

export const UMBRALES_FINANCIEROS_EVALUACION = {
    // Relación Deuda-Ingreso máxima aceptable (Sección 13.5 y D13)
    ratioDtiMaximoAceptable: 40.00,

    // Margen de seguridad sobre excedente: Cuota mensual <= 80% * (Ingresos - Gastos)
    porcentajeMaximoExcedenteParaCuota: 0.80,

    // Cobertura mínima esperada de garantías reales (Valor tasación / Monto solicitado >= 120%)
    porcentajeCoberturaMinimaGarantia: 120.00,

    // Límite de atribución autónoma del Jefe de Créditos en Bolivianos (CA13)
    limiteAtribucionJefeCreditosBs: 70000.00,
};

export const ROLES_USUARIO_SISTEMA = {
    OFICIAL: 'OFICIAL',
    ANALISTA: 'ANALISTA',
    JEFE: 'JEFE',
    CAJERO: 'CAJERO',
    GERENTE: 'GERENTE',
    ADMINISTRADOR: 'ADMINISTRADOR',
};

export const ESTADOS_SOLICITUD = {
    REGISTRADA: 'REGISTRADA',
    EN_EVALUACION: 'EN_EVALUACION',
    APROBADA: 'APROBADA',
    RECHAZADA: 'RECHAZADA',
};

export const ESTADOS_CREDITO = {
    APROBADO: 'APROBADO',
    DESEMBOLSADO: 'DESEMBOLSADO',
    VIGENTE: 'VIGENTE',
    EN_MORA: 'EN_MORA',
    CANCELADO: 'CANCELADO',
};

export const ESTADOS_CUOTA = {
    PENDIENTE: 'PENDIENTE',
    VENCIDA: 'VENCIDA',
    PAGADA: 'PAGADA',
};

export const ESTADOS_CONTRATO = {
    PENDIENTE_FIRMA: 'PENDIENTE_FIRMA',
    FIRMADO: 'FIRMADO',
};

export const ESTADOS_GARANTIA = {
    VIGENTE: 'VIGENTE',
    CUSTODIA: 'CUSTODIA',
    LIBERADA: 'LIBERADA',
};
