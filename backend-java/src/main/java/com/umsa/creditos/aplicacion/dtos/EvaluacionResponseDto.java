package com.umsa.creditos.aplicacion.dtos;

import com.umsa.creditos.dominio.enums.NivelRiesgo;
import com.umsa.creditos.dominio.enums.ResultadoEvaluacion;
import java.math.BigDecimal;
import java.time.LocalDate;

public class EvaluacionResponseDto {
    private Long idEvaluacion;
    private Long idSolicitud;
    private LocalDate fechaEvaluacion;
    private BigDecimal ingresos;
    private BigDecimal gastos;
    private BigDecimal capacidadPago;
    private BigDecimal ratioDti;
    private Integer scoreBuro;
    private String referenciaBuro;
    private NivelRiesgo nivelRiesgo;
    private ResultadoEvaluacion resultado;
    private String dictamen;
    private BigDecimal cuotaEstimada;
    private Boolean cumpleCapacidadPago;

    public EvaluacionResponseDto() {}

    public Long getIdEvaluacion() { return idEvaluacion; }
    public void setIdEvaluacion(Long idEvaluacion) { this.idEvaluacion = idEvaluacion; }
    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }
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
    public BigDecimal getCuotaEstimada() { return cuotaEstimada; }
    public void setCuotaEstimada(BigDecimal cuotaEstimada) { this.cuotaEstimada = cuotaEstimada; }
    public Boolean getCumpleCapacidadPago() { return cumpleCapacidadPago; }
    public void setCumpleCapacidadPago(Boolean cumpleCapacidadPago) { this.cumpleCapacidadPago = cumpleCapacidadPago; }
}
