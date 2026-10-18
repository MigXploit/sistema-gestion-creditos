package com.umsa.creditos.dominio.enums;

/**
 * Estados de una solicitud de crédito. Fuente: D02, D09.
 * Flujo: REGISTRADA → EN_EVALUACION → APROBADA / RECHAZADA
 */
public enum EstadoSolicitud {
    REGISTRADA,
    EN_EVALUACION,
    APROBADA,
    RECHAZADA
}
