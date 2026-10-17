package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.EstadoGarantia;
import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Entidad GARANTIA. Fuente: sección 14.1, D02, P12, CA10.
 */
@Entity
@Table(name = "garantia")
public class Garantia {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "garantia_seq")
    @SequenceGenerator(name = "garantia_seq", sequenceName = "garantia_seq", allocationSize = 1)
    @Column(name = "id_garantia")
    private Long idGarantia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false)
    private SolicitudCredito solicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_credito")
    private Credito credito;

    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;

    @Column(name = "descripcion", nullable = false, length = 250)
    private String descripcion;

    @Column(name = "valor_tasacion", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorTasacion;

    @Column(name = "cobertura_porcentaje", precision = 6, scale = 2)
    private BigDecimal coberturaPorcentaje;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoGarantia estado = EstadoGarantia.VIGENTE;

    public Garantia() {}

    public Long getIdGarantia() { return idGarantia; }
    public void setIdGarantia(Long idGarantia) { this.idGarantia = idGarantia; }

    public SolicitudCredito getSolicitud() { return solicitud; }
    public void setSolicitud(SolicitudCredito solicitud) { this.solicitud = solicitud; }

    public Credito getCredito() { return credito; }
    public void setCredito(Credito credito) { this.credito = credito; }

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
