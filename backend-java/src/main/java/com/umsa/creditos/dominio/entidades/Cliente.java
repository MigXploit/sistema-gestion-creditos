package com.umsa.creditos.dominio.entidades;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad CLIENTE. Fuente: sección 14.1 y D02.
 * RF01, RF02 – CU01.
 */
@Entity
@Table(name = "cliente", indexes = {
        @Index(name = "idx_cliente_ci", columnList = "ci", unique = true)
})
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cliente_seq")
    @SequenceGenerator(name = "cliente_seq", sequenceName = "cliente_seq", allocationSize = 1)
    @Column(name = "id_cliente")
    private Long idCliente;

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

    @Column(name = "ingresos_mensuales", nullable = false, precision = 12, scale = 2)
    private BigDecimal ingresosMensuales;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDate fechaRegistro;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<SolicitudCredito> solicitudes = new ArrayList<>();

    public Cliente() {}

    public Cliente(Long idCliente, String ci, String nombres, String apellidos, String telefono, String direccion, BigDecimal ingresosMensuales, LocalDate fechaRegistro) {
        this.idCliente = idCliente;
        this.ci = ci;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.telefono = telefono;
        this.direccion = direccion;
        this.ingresosMensuales = ingresosMensuales;
        this.fechaRegistro = fechaRegistro;
        this.solicitudes = new ArrayList<>();
    }

    public Long getIdCliente() { return idCliente; }
    public void setIdCliente(Long idCliente) { this.idCliente = idCliente; }

    public String getCi() { return ci; }
    public void setCi(String ci) { this.ci = ci; }

    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }

    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public BigDecimal getIngresosMensuales() { return ingresosMensuales; }
    public void setIngresosMensuales(BigDecimal ingresosMensuales) { this.ingresosMensuales = ingresosMensuales; }

    public LocalDate getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDate fechaRegistro) { this.fechaRegistro = fechaRegistro; }

    public List<SolicitudCredito> getSolicitudes() { return solicitudes; }
    public void setSolicitudes(List<SolicitudCredito> solicitudes) { this.solicitudes = solicitudes; }
}
