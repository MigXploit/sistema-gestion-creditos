package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.EstadoSolicitud;
import com.umsa.creditos.dominio.enums.TipoCredito;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad SOLICITUD_CREDITO. Fuente: sección 14.1 y D02.
 * RF03 – CU02.
 */
@Entity
@Table(name = "solicitud_credito", indexes = {
        @Index(name = "idx_solicitud_numero", columnList = "numero_solicitud", unique = true)
})
public class SolicitudCredito {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "solicitud_seq")
    @SequenceGenerator(name = "solicitud_seq", sequenceName = "solicitud_seq", allocationSize = 1)
    @Column(name = "id_solicitud")
    private Long idSolicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Cliente cliente;

    @Column(name = "numero_solicitud", nullable = false, unique = true, length = 30)
    private String numeroSolicitud;

    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDate fechaSolicitud;

    @Column(name = "monto_solicitado", nullable = false, precision = 14, scale = 2)
    private BigDecimal montoSolicitado;

    @Column(name = "plazo_meses", nullable = false)
    private Integer plazoMeses;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_credito", nullable = false, length = 20)
    private TipoCredito tipoCredito;

    @Column(name = "destino", nullable = false, length = 200)
    private String destino;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoSolicitud estado = EstadoSolicitud.REGISTRADA;

    @Column(name = "motivo_rechazo", length = 500)
    private String motivoRechazo;

    @Column(name = "documentacion_completa", nullable = false)
    private Boolean documentacionCompleta = false;

    @OneToOne(mappedBy = "solicitud", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private EvaluacionCredito evaluacion;

    @OneToOne(mappedBy = "solicitud", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Credito credito;

    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Garantia> garantias = new ArrayList<>();

    public SolicitudCredito() {}

    public Long getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Long idSolicitud) { this.idSolicitud = idSolicitud; }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

    public String getNumeroSolicitud() { return numeroSolicitud; }
    public void setNumeroSolicitud(String numeroSolicitud) { this.numeroSolicitud = numeroSolicitud; }

    public LocalDate getFechaSolicitud() { return fechaSolicitud; }
    public void setFechaSolicitud(LocalDate fechaSolicitud) { this.fechaSolicitud = fechaSolicitud; }

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

    public EvaluacionCredito getEvaluacion() { return evaluacion; }
    public void setEvaluacion(EvaluacionCredito evaluacion) { this.evaluacion = evaluacion; }

    public Credito getCredito() { return credito; }
    public void setCredito(Credito credito) { this.credito = credito; }

    public List<Garantia> getGarantias() { return garantias; }
    public void setGarantias(List<Garantia> garantias) { this.garantias = garantias; }
}
