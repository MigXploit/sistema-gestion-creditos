package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.Dictamen;
import com.umsa.creditos.dominio.enums.NivelRiesgo;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entidad EVALUACION_CREDITO. Fuente: sección 14.1 y D02.
 * RF04, RF05, RF06 – CU03, CU04, CU05.
 * Relación 1:1 con SolicitudCredito.
 */
@Entity
@Table(name = "evaluacion_credito", indexes = {
        @Index(name = "idx_evaluacion_solicitud", columnList = "id_solicitud", unique = true)
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class EvaluacionCredito {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "evaluacion_seq")
    @SequenceGenerator(name = "evaluacion_seq", sequenceName = "evaluacion_seq", allocationSize = 1)
    @Column(name = "id_evaluacion")
    private Long idEvaluacion;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false, unique = true)
    private SolicitudCredito solicitud;

    @Column(name = "fecha_evaluacion", nullable = false)
    private LocalDate fechaEvaluacion;

    /** Ingresos verificados en la evaluación (pueden diferir de los declarados). */
    @Column(name = "ingresos", nullable = false, precision = 12, scale = 2)
    private BigDecimal ingresos;

    /** Gastos fijos mensuales del cliente. */
    @Column(name = "gastos", nullable = false, precision = 12, scale = 2)
    private BigDecimal gastos;

    /** Excedente neto = ingresos - gastos (sección 13.5). */
    @Column(name = "capacidad_pago", nullable = false, precision = 12, scale = 2)
    private BigDecimal capacidadPago;

    /** DTI = (cuota + deudas) / ingresos × 100. Debe ser ≤ 40% (sección 13.5). */
    @Column(name = "ratio_dti", precision = 5, scale = 2)
    private BigDecimal ratioDti;

    /** Score del buró de riesgo (CU03, RF04). */
    @Column(name = "score_buro")
    private Integer scoreBuro;

    /** Referencia de la consulta al buró (P13). */
    @Column(name = "referencia_buro", length = 50)
    private String referenciaBuro;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_riesgo", length = 10)
    private NivelRiesgo nivelRiesgo;

    /** Dictamen final de la evaluación (D7: enum FAVORABLE/DESFAVORABLE). */
    @Enumerated(EnumType.STRING)
    @Column(name = "dictamen", length = 20)
    private Dictamen dictamen;

    /** Observaciones textuales adicionales del analista. */
    @Column(name = "observaciones", length = 1000)
    private String observaciones;
}
