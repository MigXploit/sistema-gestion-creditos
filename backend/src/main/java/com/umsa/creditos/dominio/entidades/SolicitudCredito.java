package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.EstadoSolicitud;
import com.umsa.creditos.dominio.enums.TipoCredito;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entidad SOLICITUD_CREDITO. Fuente: sección 14.1 y D02.
 * RF03 – CU02. Estado inicial REGISTRADA.
 * Campo motivo_rechazo agregado por decisión D6 (requerido por P06 y CU08).
 */
@Entity
@Table(name = "solicitud_credito", indexes = {
        @Index(name = "idx_solicitud_numero", columnList = "numero_solicitud", unique = true)
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class SolicitudCredito {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "solicitud_seq")
    @SequenceGenerator(name = "solicitud_seq", sequenceName = "solicitud_seq", allocationSize = 1)
    @Column(name = "id_solicitud")
    private Long idSolicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Cliente cliente;

    /** Número de solicitud único. Formato: SOL-YYYY-NNNN */
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
    @Builder.Default
    private EstadoSolicitud estado = EstadoSolicitud.REGISTRADA;

    /** Motivo de rechazo obligatorio al rechazar (CU08, CA14). Decisión D6. */
    @Column(name = "motivo_rechazo", length = 500)
    private String motivoRechazo;

    /** Documentación presentada (checklist como texto JSON o CSV de claves). */
    @Column(name = "documentacion", length = 500)
    private String documentacion;

    @OneToOne(mappedBy = "solicitud", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private EvaluacionCredito evaluacion;

    @OneToOne(mappedBy = "solicitud", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Credito credito;
}
