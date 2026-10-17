package com.umsa.creditos.dominio.enums;

/**
 * Estados del crédito activo. Fuente: D02, D08.
 * Flujo: APROBADO → DESEMBOLSADO → VIGENTE ⇄ EN_MORA → CANCELADO / EJECUCION_GARANTIA
 * EJECUCION_GARANTIA se activa cuando mora > 90 días (decisión del grupo, Apéndice A4).
 */
public enum EstadoCredito {
    APROBADO,
    DESEMBOLSADO,
    VIGENTE,
    EN_MORA,
    CANCELADO,
    EJECUCION_GARANTIA
}
