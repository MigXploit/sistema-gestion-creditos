package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.NivelRiesgo;
import com.umsa.creditos.dominio.enums.ResultadoEvaluacion;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entidad EVALUACION_CREDITO. Fuente: sección 14.1 y D02.
 * RF04, RF05, RF06 – CU03, CU04, CU05.
 */
@Entity
@Table(name = "evaluacion_credito", indexes = {
        @Index(name = "idx_evaluacion_solicitud", columnList = "id_solicitud", unique = true)
})
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

    @Column(name = "ingresos", nullable = false, precision = 12, scale = 2)
    private BigDecimal ingresos;

    @Column(name = "gastos", nullable = false, precision = 12, scale = 2)
    private BigDecimal gastos;

    @Column(name = "capacidad_pago", nullable = false, precision = 12, scale = 2)
    private BigDecimal capacidadPago;

    @Column(name = "ratio_dti", precision = 5, scale = 2)
    private BigDecimal ratioDti;

    @Column(name = "score_buro")
    private Integer scoreBuro;

    @Column(name = "referencia_buro", length = 50)
    private String referenciaBuro;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_riesgo", length = 10)
    private NivelRiesgo nivelRiesgo;

    @Enumerated(EnumType.STRING)
    @Column(name = "resultado", nullable = false, length = 20)
    private ResultadoEvaluacion resultado;

    @Column(name = "dictamen", length = 1000)
    private String dictamen;

    public EvaluacionCredito() {}

    public Long getIdEvaluacion() { return idEvaluacion; }
    public void setIdEvaluacion(Long idEvaluacion) { this.idEvaluacion = idEvaluacion; }

    public SolicitudCredito getSolicitud() { return solicitud; }
    public void setSolicitud(SolicitudCredito solicitud) { this.solicitud = solicitud; }

    public LocalDate getFechaEvaluacion() { return fechaEvaluacion; }
    public void setFechaEvaluacion(LocalDate fechaEvaluacion) { this.fechaEvaluacion = fechaEvaluacion; }

    public BigDecimal getIngresos() { return ingresos; }
    public void setIngresos(BigDecimal ingresos) { this.ingresos = ingresos; }

    public BigDecimal getGastos() { return gastos; }
    public void setGastos(BigDecimal gastos) { this.gastos = gastos; }

    public BigDecimal getCapacidadPago() { return capacidadPago; }
    public void setCapacidadPago(BigDecimal capacidadPago) { this.capacidadPago = capacidadPago; }

    public BigDecimal getRatioDti() { return ratioDti; }
    public void setRatioDti(BigDecimal ratioDti) { this.ratioDti = ratioDti; }

    public Integer getScoreBuro() { return scoreBuro; }
    public void setScoreBuro(Integer scoreBuro) { this.scoreBuro = scoreBuro; }

    public String getReferenciaBuro() { return referenciaBuro; }
    public void setReferenciaBuro(String referenciaBuro) { this.referenciaBuro = referenciaBuro; }

    public NivelRiesgo getNivelRiesgo() { return nivelRiesgo; }
    public void setNivelRiesgo(NivelRiesgo nivelRiesgo) { this.nivelRiesgo = nivelRiesgo; }

    public ResultadoEvaluacion getResultado() { return resultado; }
    public void setResultado(ResultadoEvaluacion resultado) { this.resultado = resultado; }

    public String getDictamen() { return dictamen; }
    public void setDictamen(String dictamen) { this.dictamen = dictamen; }
}
