package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.EstadoCredito;
import com.umsa.creditos.dominio.enums.SistemaAmort;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad CREDITO. Fuente: sección 14.1 y D02.
 * RF08–RF14 – CU07–CU13.
 */
@Entity
@Table(name = "credito", indexes = {
        @Index(name = "idx_credito_numero", columnList = "numero_credito", unique = true)
})
public class Credito {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "credito_seq")
    @SequenceGenerator(name = "credito_seq", sequenceName = "credito_seq", allocationSize = 1)
    @Column(name = "id_credito")
    private Long idCredito;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false, unique = true)
    private SolicitudCredito solicitud;

    @Column(name = "numero_credito", nullable = false, unique = true, length = 30)
    private String numeroCredito;

    @Column(name = "monto_aprobado", nullable = false, precision = 14, scale = 2)
    private BigDecimal montoAprobado;

    @Column(name = "tasa_interes", nullable = false, precision = 5, scale = 2)
    private BigDecimal tasaInteres;

    @Column(name = "tasa_mora", nullable = false, precision = 5, scale = 2)
    private BigDecimal tasaMora;

    @Enumerated(EnumType.STRING)
    @Column(name = "sistema_amortizacion", nullable = false, length = 10)
    private SistemaAmort sistemaAmortizacion = SistemaAmort.FRANCES;

    @Column(name = "plazo_meses", nullable = false)
    private Integer plazoMeses;

    @Column(name = "fecha_desembolso")
    private LocalDate fechaDesembolso;

    @Column(name = "saldo_capital", nullable = false, precision = 14, scale = 2)
    private BigDecimal saldoCapital = BigDecimal.ZERO;

    @Column(name = "interes_acumulado", nullable = false, precision = 12, scale = 2)
    private BigDecimal interesAcumulado = BigDecimal.ZERO;

    @Column(name = "mora_acumulada", nullable = false, precision = 12, scale = 2)
    private BigDecimal moraAcumulada = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 25)
    private EstadoCredito estado = EstadoCredito.APROBADO;

    @OneToOne(mappedBy = "credito", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Contrato contrato;

    @OneToMany(mappedBy = "credito", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Cuota> cuotas = new ArrayList<>();

    @OneToMany(mappedBy = "credito", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Garantia> garantias = new ArrayList<>();

    public Credito() {}

    public Long getIdCredito() { return idCredito; }
    public void setIdCredito(Long idCredito) { this.idCredito = idCredito; }

    public SolicitudCredito getSolicitud() { return solicitud; }
    public void setSolicitud(SolicitudCredito solicitud) { this.solicitud = solicitud; }

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

    public BigDecimal getInteresAcumulado() { return interesAcumulado; }
    public void setInteresAcumulado(BigDecimal interesAcumulado) { this.interesAcumulado = interesAcumulado; }

    public BigDecimal getMoraAcumulada() { return moraAcumulada; }
    public void setMoraAcumulada(BigDecimal moraAcumulada) { this.moraAcumulada = moraAcumulada; }

    public EstadoCredito getEstado() { return estado; }
    public void setEstado(EstadoCredito estado) { this.estado = estado; }

    public Contrato getContrato() { return contrato; }
    public void setContrato(Contrato contrato) { this.contrato = contrato; }

    public List<Cuota> getCuotas() { return cuotas; }
    public void setCuotas(List<Cuota> cuotas) { this.cuotas = cuotas; }

    public List<Garantia> getGarantias() { return garantias; }
    public void setGarantias(List<Garantia> garantias) { this.garantias = garantias; }
}
