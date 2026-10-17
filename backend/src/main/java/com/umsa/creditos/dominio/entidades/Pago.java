package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.FormaPago;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entidad PAGO. Fuente: sección 14.1 y D02.
 * RF13 – CU12. Prelación: 1° mora, 2° interés, 3° capital (sección 13.5).
 */
@Entity
@Table(name = "pago", indexes = {
        @Index(name = "idx_pago_recibo", columnList = "numero_recibo", unique = true)
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
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

    /** Monto total recibido del cliente. */
    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    /** Porción aplicada a mora (prelación 1°, sección 13.5). */
    @Column(name = "monto_mora", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal montoMora = BigDecimal.ZERO;

    /** Porción aplicada a interés compensatorio (prelación 2°, sección 13.5). */
    @Column(name = "monto_interes", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal montoInteres = BigDecimal.ZERO;

    /** Porción aplicada a capital (prelación 3°, sección 13.5). */
    @Column(name = "monto_capital", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal montoCapital = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pago", nullable = false, length = 15)
    private FormaPago formaPago;

    /** Número de recibo único del comprobante (CA19). */
    @Column(name = "numero_recibo", nullable = false, unique = true, length = 30)
    private String numeroRecibo;
}
