package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.EstadoCredito;
import com.umsa.creditos.dominio.enums.SistemaAmort;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad CREDITO. Fuente: sección 14.1 y D02.
 * RF08–RF14 – CU07–CU13.
 * Se crea al aprobar la solicitud (CU07). Relación 1:1 con SolicitudCredito.
 */
@Entity
@Table(name = "credito", indexes = {
        @Index(name = "idx_credito_numero", columnList = "numero_credito", unique = true)
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class Credito {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "credito_seq")
    @SequenceGenerator(name = "credito_seq", sequenceName = "credito_seq", allocationSize = 1)
    @Column(name = "id_credito")
    private Long idCredito;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false, unique = true)
    private SolicitudCredito solicitud;

    /** Número único de crédito. Formato: CR-YYYY-NNNNN */
    @Column(name = "numero_credito", nullable = false, unique = true, length = 30)
    private String numeroCredito;

    @Column(name = "monto_aprobado", nullable = false, precision = 14, scale = 2)
    private BigDecimal montoAprobado;

    /** Tasa de interés anual compensatoria en % (e.g., 12.00). */
    @Column(name = "tasa_interes", nullable = false, precision = 5, scale = 2)
    private BigDecimal tasaInteres;

    /** Tasa moratoria anual en % (usada para calcular mora diaria, sección 13.5). */
    @Column(name = "tasa_mora", nullable = false, precision = 5, scale = 2)
    private BigDecimal tasaMora;

    @Enumerated(EnumType.STRING)
    @Column(name = "sistema_amortizacion", nullable = false, length = 10)
    @Builder.Default
    private SistemaAmort sistemaAmortizacion = SistemaAmort.FRANCES;

    @Column(name = "plazo_meses", nullable = false)
    private Integer plazoMeses;

    @Column(name = "fecha_desembolso")
    private LocalDate fechaDesembolso;

    /** Saldo de capital pendiente. Nunca negativo (RN14, CA19). */
    @Column(name = "saldo_capital", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal saldoCapital = BigDecimal.ZERO;

    /** Mora acumulada pendiente de pago. */
    @Column(name = "mora_acumulada", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal moraAcumulada = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 25)
    @Builder.Default
    private EstadoCredito estado = EstadoCredito.APROBADO;

    @OneToOne(mappedBy = "credito", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Contrato contrato;

    @OneToMany(mappedBy = "credito", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Cuota> cuotas = new ArrayList<>();

    @OneToMany(mappedBy = "credito", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Garantia> garantias = new ArrayList<>();
}
