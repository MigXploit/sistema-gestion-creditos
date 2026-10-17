package com.umsa.creditos.dominio.enums;

/**
 * Estados del contrato conforme a las referencias del informe.
 */
public enum EstadoContrato {
    /** Generado y esperando suscripción notarial. SUPUESTO (CU09: "listo para firma"). */
    PENDIENTE_FIRMA,

    /** Contrato legalmente firmado y suscrito. DEL INFORME (D13, ctr1). */
    FIRMADO,

    /** Contrato anulado tras no formalización o rescisión. DEL INFORME (D02: operación anular()). */
    ANULADO
}
