package com.umsa.creditos.dominio.enums;

/**
 * Estados de la garantía conforme a las referencias del informe.
 */
public enum EstadoGarantia {
    /** Estado en pantalla P12. DEL INFORME (P12). */
    VIGENTE,

    /** Estado en objeto gar1 de D13. DEL INFORME (D13). */
    CUSTODIA,

    /** Estado resultante de la operación liberar() en D02. DEL INFORME (D02). */
    LIBERADA
}
