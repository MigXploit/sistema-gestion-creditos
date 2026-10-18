package com.umsa.creditos.aplicacion.dtos;

import java.math.BigDecimal;

public class GarantiaRegistroDto {
    private Long idSolicitud;
    private String tipo;
    private String descripcion;
    private BigDecimal valorTasacion;

    public GarantiaRegistroDto() {}

    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public BigDecimal getValorTasacion() { return valorTasacion; }
    public void setValorTasacion(BigDecimal valorTasacion) { this.valorTasacion = valorTasacion; }
}
