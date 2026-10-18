package com.umsa.creditos.aplicacion.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ClienteDto {
    private Long idCliente;
    private String ci;
    private String nombres;
    private String apellidos;
    private String telefono;
    private String direccion;
    private BigDecimal ingresosMensuales;
    private LocalDate fechaRegistro;

    public ClienteDto() {}

    public ClienteDto(Long idCliente, String ci, String nombres, String apellidos, String telefono, String direccion, BigDecimal ingresosMensuales, LocalDate fechaRegistro) {
        this.idCliente = idCliente;
        this.ci = ci;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.telefono = telefono;
        this.direccion = direccion;
        this.ingresosMensuales = ingresosMensuales;
        this.fechaRegistro = fechaRegistro;
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
}
