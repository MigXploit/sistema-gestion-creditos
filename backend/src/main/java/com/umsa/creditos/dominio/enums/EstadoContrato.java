package com.umsa.creditos.dominio.enums;

/**
 * Estado de un contrato crediticio.
 * Fuente: D02 (no enumera valores). Decisión D2: valores definidos por el grupo.
 */
public enum EstadoContrato {
    PENDIENTE_FIRMA,  // Contrato generado, esperando firma notarial
    FIRMADO,          // Contrato firmado; habilita el desembolso (RN10)
    ANULADO           // Contrato anulado
}
