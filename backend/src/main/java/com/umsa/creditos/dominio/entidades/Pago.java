package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.FormaPago;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entidad PAGO. Fuente: sección 14.1 y D02.
 * RF13 – CU12.
 */
@Entity
@Table(name = "pago", indexes = {
        @Index(name = "idx_pago_recibo", columnList = "numero_recibo", unique = true)
})
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "pago_seq")
    @SequenceGenerator(name = "pago_seq", sequenceName = "pago_seq", allocationSize = 1)
    @Column(name = "id_pago")
    private Long idPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cuota", nullable = false)
    private Cuota cuota;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDate fechaPago;

    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "monto_mora", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoMora = BigDecimal.ZERO;

    @Column(name = "monto_interes", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoInteres = BigDecimal.ZERO;

    @Column(name = "monto_capital", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoCapital = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pago", nullable = false, length = 15)
    private FormaPago formaPago;

    @Column(name = "numero_recibo", nullable = false, unique = true, length = 30)
    private String numeroRecibo;

    public Pago() {}

    public Long getIdPago() { return idPago; }
    public void setIdPago(Long idPago) { this.idPago = idPago; }

    public Cuota getCuota() { return cuota; }
    public void setCuota(Cuota cuota) { this.cuota = cuota; }

    public LocalDate getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDate fechaPago) { this.fechaPago = fechaPago; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }

    public BigDecimal getMontoMora() { return montoMora; }
    public void setMontoMora(BigDecimal montoMora) { this.montoMora = montoMora; }

    public BigDecimal getMontoInteres() { return montoInteres; }
    public void setMontoInteres(BigDecimal montoInteres) { this.montoInteres = montoInteres; }

    public BigDecimal getMontoCapital() { return montoCapital; }
    public void setMontoCapital(BigDecimal montoCapital) { this.montoCapital = montoCapital; }

    public FormaPago getFormaPago() { return formaPago; }
    public void setFormaPago(FormaPago formaPago) { this.formaPago = formaPago; }

    public String getNumeroRecibo() { return numeroRecibo; }
    public void setNumeroRecibo(String numeroRecibo) { this.numeroRecibo = numeroRecibo; }
}
