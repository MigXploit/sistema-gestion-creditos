package com.umsa.creditos.aplicacion.dtos;

import com.umsa.creditos.dominio.enums.EstadoCredito;
import com.umsa.creditos.dominio.enums.SistemaAmort;
import java.math.BigDecimal;
import java.time.LocalDate;

public class CreditoResponseDto {
    private Long idCredito;
    private Long idSolicitud;
    private String numeroCredito;
    private BigDecimal montoAprobado;
    private BigDecimal tasaInteres;
    private BigDecimal tasaMora;
    private SistemaAmort sistemaAmortizacion;
    private Integer plazoMeses;
    private LocalDate fechaDesembolso;
    private BigDecimal saldoCapital;
    private EstadoCredito estado;
    private String numeroContrato;
    private Long idContrato;
    private Integer cantidadCuotas;

    public CreditoResponseDto() {}

    public Long getIdCredito() { return idCredito; }
    public void setIdCredito(Long idCredito) { this.idCredito = idCredito; }
    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }
    public String getNumeroCredito() { return numeroCredito; }
    public void setNumeroCredito(String numeroCredito) { this.numeroCredito = numeroCredito; }
    public BigDecimal getMontoAprobado() { return montoAprobado; }
    public void setMontoAprobado(BigDecimal montoAprobado) { this.montoAprobado = montoAprobado; }
    public BigDecimal getTasaInteres() { return tasaInteres; }
    public void setTasaInteres(BigDecimal tasaInteres) { this.tasaInteres = tasaInteres; }
    public BigDecimal getTasaMora() { return tasaMora; }
    public void setTasaMora(BigDecimal tasaMora) { this.tasaMora = tasaMora; }
    public SistemaAmort getSistemaAmortizacion() { return sistemaAmortizacion; }
    public void setSistemaAmortizacion(SistemaAmort sistemaAmortizacion) { this.sistemaAmortizacion = sistemaAmortizacion; }
    public Integer getPlazoMeses() { return plazoMeses; }
    public void setPlazoMeses(Integer plazoMeses) { this.plazoMeses = plazoMeses; }
    public LocalDate getFechaDesembolso() { return fechaDesembolso; }
    public void setFechaDesembolso(LocalDate fechaDesembolso) { this.fechaDesembolso = fechaDesembolso; }
    public BigDecimal getSaldoCapital() { return saldoCapital; }
    public void setSaldoCapital(BigDecimal saldoCapital) { this.saldoCapital = saldoCapital; }
    public EstadoCredito getEstado() { return estado; }
    public void setEstado(EstadoCredito estado) { this.estado = estado; }
    public String getNumeroContrato() { return numeroContrato; }
    public void setNumeroContrato(String numeroContrato) { this.numeroContrato = numeroContrato; }
    public Long getIdContrato() { return idContrato; }
    public void setIdContrato(Long idContrato) { this.idContrato = idContrato; }
    public Integer getCantidadCuotas() { return cantidadCuotas; }
    public void setCantidadCuotas(Integer cantidadCuotas) { this.cantidadCuotas = cantidadCuotas; }
}
