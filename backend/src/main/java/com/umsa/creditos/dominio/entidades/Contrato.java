package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.EstadoContrato;
import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Entidad CONTRATO. Fuente: sección 14.1 y D02.
 * RF10 – CU09.
 */
@Entity
@Table(name = "contrato", indexes = {
        @Index(name = "idx_contrato_numero", columnList = "numero_contrato", unique = true)
})
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "contrato_seq")
    @SequenceGenerator(name = "contrato_seq", sequenceName = "contrato_seq", allocationSize = 1)
    @Column(name = "id_contrato")
    private Long idContrato;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_credito", nullable = false, unique = true)
    private Credito credito;

    @Column(name = "numero_contrato", nullable = false, unique = true, length = 30)
    private String numeroContrato;

    @Column(name = "fecha_firma")
    private LocalDate fechaFirma;

    @Column(name = "notaria_registro", length = 150)
    private String notariaRegistro;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoContrato estado = EstadoContrato.PENDIENTE_FIRMA;

    public Contrato() {}

    public Long getIdContrato() { return idContrato; }
    public void setIdContrato(Long idContrato) { this.idContrato = idContrato; }

    public Credito getCredito() { return credito; }
    public void setCredito(Credito credito) { this.credito = credito; }

    public String getNumeroContrato() { return numeroContrato; }
    public void setNumeroContrato(String numeroContrato) { this.numeroContrato = numeroContrato; }

    public LocalDate getFechaFirma() { return fechaFirma; }
    public void setFechaFirma(LocalDate fechaFirma) { this.fechaFirma = fechaFirma; }

    public String getNotariaRegistro() { return notariaRegistro; }
    public void setNotariaRegistro(String notariaRegistro) { this.notariaRegistro = notariaRegistro; }

    public EstadoContrato getEstado() { return estado; }
    public void setEstado(EstadoContrato estado) { this.estado = estado; }
}
