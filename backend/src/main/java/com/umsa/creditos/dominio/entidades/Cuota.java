package com.umsa.creditos.dominio.entidades;

import com.umsa.creditos.dominio.enums.EstadoCuota;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad CUOTA. Fuente: sección 14.1 y D02.
 * RF11, RF13, RF14 – CU10, CU12, CU13.
 * Composición: Credito (1) → Cuota (1..*).
 */
@Entity
@Table(name = "cuota")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
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

    /** Porción de capital de esta cuota. */
    @Column(name = "capital", nullable = false, precision = 12, scale = 2)
    private BigDecimal capital;

    /** Interés compensatorio de esta cuota. */
    @Column(name = "interes_comp", nullable = false, precision = 12, scale = 2)
    private BigDecimal interesComp;

    /** Interés moratorio acumulado (calculado diariamente en CU13). */
    @Column(name = "interes_mora", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal interesMora = BigDecimal.ZERO;

    /** Monto total de la cuota = capital + interés compensatorio. */
    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    /** Saldo pendiente de pago de esta cuota. */
    @Column(name = "saldo_pendiente", nullable = false, precision = 12, scale = 2)
    private BigDecimal saldoPendiente;

    /** Días de atraso contados desde fecha_vencimiento. */
    @Column(name = "dias_mora", nullable = false)
    @Builder.Default
    private Integer diasMora = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 15)
    @Builder.Default
    private EstadoCuota estado = EstadoCuota.PENDIENTE;

    @OneToMany(mappedBy = "cuota", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Pago> pagos = new ArrayList<>();
}
