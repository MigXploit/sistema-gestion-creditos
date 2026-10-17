package com.umsa.creditos.dominio.entidades;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad CLIENTE. Fuente: sección 14.1 y D02.
 * RF01, RF02 – CU01
 */
@Entity
@Table(name = "cliente", indexes = {
        @Index(name = "idx_cliente_ci", columnList = "ci", unique = true)
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cliente_seq")
    @SequenceGenerator(name = "cliente_seq", sequenceName = "cliente_seq", allocationSize = 1)
    @Column(name = "id_cliente")
    private Long idCliente;

    /** CI único del cliente (RN01, CA01). */
    @Column(name = "ci", nullable = false, unique = true, length = 20)
    private String ci;

    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "direccion", length = 250)
    private String direccion;

    /** Ingresos mensuales en Bs. Usados en evaluación DTI (RF05, sección 13.5). */
    @Column(name = "ingresos_mensuales", nullable = false, precision = 12, scale = 2)
    private BigDecimal ingresosMensuales;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDate fechaRegistro;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SolicitudCredito> solicitudes = new ArrayList<>();
}
