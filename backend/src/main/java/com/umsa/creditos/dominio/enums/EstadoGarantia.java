package com.umsa.creditos.dominio.enums;

/**
 * Estado de una garantía registrada.
 * Fuente: D02 (no enumera valores). Decisión D2: valores definidos por el grupo.
 */
public enum EstadoGarantia {
    VIGENTE,     // Garantía activa y en custodia
    LIBERADA,    // Garantía liberada al cancelar el crédito
    EJECUCION    // Garantía en proceso de ejecución judicial (> 90 días mora)
}
