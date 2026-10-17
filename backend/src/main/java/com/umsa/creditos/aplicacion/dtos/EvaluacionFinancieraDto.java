package com.umsa.creditos.aplicacion.dtos;

import com.umsa.creditos.dominio.enums.NivelRiesgo;
import com.umsa.creditos.dominio.enums.ResultadoEvaluacion;
import java.math.BigDecimal;

public class EvaluacionFinancieraDto {
    private Long idSolicitud;
    private BigDecimal ingresos;
    private BigDecimal gastos;
    private Integer scoreBuro;
    private String referenciaBuro;
    private BigDecimal deudasVigentes = BigDecimal.ZERO;
    private NivelRiesgo nivelRiesgo;
    private ResultadoEvaluacion resultado;
    private String dictamen;

    public EvaluacionFinancieraDto() {}

    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }
    public BigDecimal getIngresos() { return ingresos; }
    public void setIngresos(BigDecimal ingresos) { this.ingresos = ingresos; }
    public BigDecimal getGastos() { return gastos; }
    public void setGastos(BigDecimal gastos) { this.gastos = gastos; }
    public Integer getScoreBuro() { return scoreBuro; }
    public void setScoreBuro(Integer scoreBuro) { this.scoreBuro = scoreBuro; }
    public String getReferenciaBuro() { return referenciaBuro; }
    public void setReferenciaBuro(String referenciaBuro) { this.referenciaBuro = referenciaBuro; }
    public BigDecimal getDeudasVigentes() { return deudasVigentes; }
    public void setDeudasVigentes(BigDecimal deudasVigentes) { this.deudasVigentes = deudasVigentes; }
    public NivelRiesgo getNivelRiesgo() { return nivelRiesgo; }
    public void setNivelRiesgo(NivelRiesgo nivelRiesgo) { this.nivelRiesgo = nivelRiesgo; }
    public ResultadoEvaluacion getResultado() { return resultado; }
    public void setResultado(ResultadoEvaluacion resultado) { this.resultado = resultado; }
    public String getDictamen() { return dictamen; }
    public void setDictamen(String dictamen) { this.dictamen = dictamen; }
}
