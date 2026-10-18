package com.umsa.creditos.aplicacion.dtos;

import com.umsa.creditos.dominio.enums.EstadoSolicitud;
import com.umsa.creditos.dominio.enums.TipoCredito;
import java.math.BigDecimal;
import java.time.LocalDate;

public class SolicitudResponseDto {
    private Long idSolicitud;
    private String numeroSolicitud;
    private LocalDate fechaSolicitud;
    private Long idCliente;
    private String ciCliente;
    private String nombreCompletoCliente;
    private BigDecimal montoSolicitado;
    private Integer plazoMeses;
    private TipoCredito tipoCredito;
    private String destino;
    private EstadoSolicitud estado;
    private String motivoRechazo;
    private Boolean documentacionCompleta;
    private Boolean tieneEvaluacion;
    private String resultadoEvaluacion;
    private Long idCredito;
    private String numeroCredito;

    public SolicitudResponseDto() {}

    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }
    public String getNumeroSolicitud() { return numeroSolicitud; }
    public void setNumeroSolicitud(String numeroSolicitud) { this.numeroSolicitud = numeroSolicitud; }
    public LocalDate getFechaSolicitud() { return fechaSolicitud; }
    public void setFechaSolicitud(LocalDate fechaSolicitud) { this.fechaSolicitud = fechaSolicitud; }
    public Long getIdCliente() { return idCliente; }
    public void setIdCliente(Long idCliente) { this.idCliente = idCliente; }
    public String getCiCliente() { return ciCliente; }
    public void setCiCliente(String ciCliente) { this.ciCliente = ciCliente; }
    public String getNombreCompletoCliente() { return nombreCompletoCliente; }
    public void setNombreCompletoCliente(String nombreCompletoCliente) { this.nombreCompletoCliente = nombreCompletoCliente; }
    public BigDecimal getMontoSolicitado() { return montoSolicitado; }
    public void setMontoSolicitado(BigDecimal montoSolicitado) { this.montoSolicitado = montoSolicitado; }
    public Integer getPlazoMeses() { return plazoMeses; }
    public void setPlazoMeses(Integer plazoMeses) { this.plazoMeses = plazoMeses; }
    public TipoCredito getTipoCredito() { return tipoCredito; }
    public void setTipoCredito(TipoCredito tipoCredito) { this.tipoCredito = tipoCredito; }
    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }
    public EstadoSolicitud getEstado() { return estado; }
    public void setEstado(EstadoSolicitud estado) { this.estado = estado; }
    public String getMotivoRechazo() { return motivoRechazo; }
    public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }
    public Boolean getDocumentacionCompleta() { return documentacionCompleta; }
    public void setDocumentacionCompleta(Boolean documentacionCompleta) { this.documentacionCompleta = documentacionCompleta; }
    public Boolean getTieneEvaluacion() { return tieneEvaluacion; }
    public void setTieneEvaluacion(Boolean tieneEvaluacion) { this.tieneEvaluacion = tieneEvaluacion; }
    public String getResultadoEvaluacion() { return resultadoEvaluacion; }
    public void setResultadoEvaluacion(String resultadoEvaluacion) { this.resultadoEvaluacion = resultadoEvaluacion; }
    public Long getIdCredito() { return idCredito; }
    public void setIdCredito(Long idCredito) { this.idCredito = idCredito; }
    public String getNumeroCredito() { return numeroCredito; }
    public void setNumeroCredito(String numeroCredito) { this.numeroCredito = numeroCredito; }
}
