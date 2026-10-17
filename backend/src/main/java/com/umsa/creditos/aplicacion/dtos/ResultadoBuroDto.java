package com.umsa.creditos.aplicacion.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ResultadoBuroDto {
    private String referencia;
    private String estadoHistorial; // ej: "SIN MORA", "CON MORA"
    private Integer score;          // ej: 780
    private BigDecimal deudasVigentes;
    private LocalDateTime fechaConsulta;
    private boolean exitoso;
    private boolean parcial;
    private String mensaje;

    public ResultadoBuroDto() {}

    public ResultadoBuroDto(String referencia, String estadoHistorial, Integer score, BigDecimal deudasVigentes, LocalDateTime fechaConsulta, boolean exitoso, boolean parcial, String mensaje) {
        this.referencia = referencia;
        this.estadoHistorial = estadoHistorial;
        this.score = score;
        this.deudasVigentes = deudasVigentes;
        this.fechaConsulta = fechaConsulta;
        this.exitoso = exitoso;
        this.parcial = parcial;
        this.mensaje = mensaje;
    }

    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    public String getEstadoHistorial() { return estadoHistorial; }
    public void setEstadoHistorial(String estadoHistorial) { this.estadoHistorial = estadoHistorial; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public BigDecimal getDeudasVigentes() { return deudasVigentes; }
    public void setDeudasVigentes(BigDecimal deudasVigentes) { this.deudasVigentes = deudasVigentes; }
    public LocalDateTime getFechaConsulta() { return fechaConsulta; }
    public void setFechaConsulta(LocalDateTime fechaConsulta) { this.fechaConsulta = fechaConsulta; }
    public boolean isExitoso() { return exitoso; }
    public void setExitoso(boolean exitoso) { this.exitoso = exitoso; }
    public boolean isParcial() { return parcial; }
    public void setParcial(boolean parcial) { this.parcial = parcial; }
    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
}
