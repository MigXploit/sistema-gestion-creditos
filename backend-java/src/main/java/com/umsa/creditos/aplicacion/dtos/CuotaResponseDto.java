package com.umsa.creditos.aplicacion.dtos;

import com.umsa.creditos.dominio.enums.EstadoCuota;
import java.math.BigDecimal;
import java.time.LocalDate;

public class CuotaResponseDto {
    private Long idCuota;
    private Integer numeroCuota;
    private LocalDate fechaVencimiento;
    private BigDecimal capital;
    private BigDecimal interesComp;
    private BigDecimal interesMora;
    private BigDecimal monto;
    private BigDecimal saldoPendiente;
    private Integer diasMora;
    private EstadoCuota estado;

    public CuotaResponseDto() {}

    public Long getIdCuota() { return idCuota; }
    public void setIdCuota(Long idCuota) { this.idCuota = idCuota; }
    public Integer getNumeroCuota() { return numeroCuota; }
    public void setNumeroCuota(Integer numeroCuota) { this.numeroCuota = numeroCuota; }
    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(LocalDate fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }
    public BigDecimal getCapital() { return capital; }
    public void setCapital(BigDecimal capital) { this.capital = capital; }
    public BigDecimal getInteresComp() { return interesComp; }
    public void setInteresComp(BigDecimal interesComp) { this.interesComp = interesComp; }
    public BigDecimal getInteresMora() { return interesMora; }
    public void setInteresMora(BigDecimal interesMora) { this.interesMora = interesMora; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public BigDecimal getSaldoPendiente() { return saldoPendiente; }
    public void setSaldoPendiente(BigDecimal saldoPendiente) { this.saldoPendiente = saldoPendiente; }
    public Integer getDiasMora() { return diasMora; }
    public void setDiasMora(Integer diasMora) { this.diasMora = diasMora; }
    public EstadoCuota getEstado() { return estado; }
    public void setEstado(EstadoCuota estado) { this.estado = estado; }
}
