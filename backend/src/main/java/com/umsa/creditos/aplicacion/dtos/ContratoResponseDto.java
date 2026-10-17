package com.umsa.creditos.aplicacion.dtos;

import com.umsa.creditos.dominio.enums.EstadoContrato;
import java.time.LocalDate;

public class ContratoResponseDto {
    private Long idContrato;
    private Long idCredito;
    private String numeroContrato;
    private LocalDate fechaFirma;
    private String notariaRegistro;
    private EstadoContrato estado;

    public ContratoResponseDto() {}

    public Long getIdContrato() { return idContrato; }
    public void setIdContrato(Long idContrato) { this.idContrato = idContrato; }
    public Long getIdCredito() { return idCredito; }
    public void setIdCredito(Long idCredito) { this.idCredito = idCredito; }
    public String getNumeroContrato() { return numeroContrato; }
    public void setNumeroContrato(String numeroContrato) { this.numeroContrato = numeroContrato; }
    public LocalDate getFechaFirma() { return fechaFirma; }
    public void setFechaFirma(LocalDate fechaFirma) { this.fechaFirma = fechaFirma; }
    public String getNotariaRegistro() { return notariaRegistro; }
    public void setNotariaRegistro(String notariaRegistro) { this.notariaRegistro = notariaRegistro; }
    public EstadoContrato getEstado() { return estado; }
    public void setEstado(EstadoContrato estado) { this.estado = estado; }
}
