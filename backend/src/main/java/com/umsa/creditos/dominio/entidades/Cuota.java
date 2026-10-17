package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.EstadoCuota;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad CUOTA. Fuente: sección 14.1 y D02.
 * RF11, RF13, RF14 – CU10, CU12, CU13.
 */
@Entity
@Table(name = "cuota")
public class Cuota {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cuota_seq")
    @SequenceGenerator(name = "cuota_seq", sequenceName = "cuota_seq", allocationSize = 1)
    @Column(name = "id_cuota")
    private Long idCuota;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_credito", nullable = false)
    private Credito credito;

    @Column(name = "numero_cuota", nullable = false)
    private Integer numeroCuota;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(name = "capital", nullable = false, precision = 12, scale = 2)
    private BigDecimal capital;

    @Column(name = "interes_comp", nullable = false, precision = 12, scale = 2)
    private BigDecimal interesComp;

    @Column(name = "interes_mora", nullable = false, precision = 12, scale = 2)
    private BigDecimal interesMora = BigDecimal.ZERO;

    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "saldo_pendiente", nullable = false, precision = 12, scale = 2)
    private BigDecimal saldoPendiente;

    @Column(name = "dias_mora", nullable = false)
    private Integer diasMora = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 15)
    private EstadoCuota estado = EstadoCuota.PENDIENTE;

    @OneToMany(mappedBy = "cuota", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Pago> pagos = new ArrayList<>();

    public Cuota() {}

    public Long getIdCuota() { return idCuota; }
    public void setIdCuota(Long idCuota) { this.idCuota = idCuota; }

    public Credito getCredito() { return credito; }
    public void setCredito(Credito credito) { this.credito = credito; }

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

    public List<Pago> getPagos() { return pagos; }
    public void setPagos(List<Pago> pagos) { this.pagos = pagos; }
}
