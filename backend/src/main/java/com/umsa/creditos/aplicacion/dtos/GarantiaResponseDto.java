package com.umsa.creditos.aplicacion.dtos;

import com.umsa.creditos.dominio.enums.EstadoGarantia;
import java.math.BigDecimal;

public class GarantiaResponseDto {
    private Long idGarantia;
    private Long idSolicitud;
    private Long idCredito;
    private String tipo;
    private String descripcion;
    private BigDecimal valorTasacion;
    private BigDecimal coberturaPorcentaje;
    private EstadoGarantia estado;

    public GarantiaResponseDto() {}

    public Long getIdGarantia() { return idGarantia; }
    public void setIdGarantia(Long idGarantia) { this.idGarantia = idGarantia; }
    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }
    public Long getIdCredito() { return idCredito; }
    public void setIdCredito(Long idCredito) { this.idCredito = idCredito; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public BigDecimal getValorTasacion() { return valorTasacion; }
    public void setValorTasacion(BigDecimal valorTasacion) { this.valorTasacion = valorTasacion; }
    public BigDecimal getCoberturaPorcentaje() { return coberturaPorcentaje; }
    public void setCoberturaPorcentaje(BigDecimal coberturaPorcentaje) { this.coberturaPorcentaje = coberturaPorcentaje; }
    public EstadoGarantia getEstado() { return estado; }
    public void setEstado(EstadoGarantia estado) { this.estado = estado; }
}
