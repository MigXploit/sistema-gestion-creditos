package com.umsa.creditos.aplicacion.dtos;

public class EditarClienteDto {
    private String telefono;
    private String direccion;

    public EditarClienteDto() {}

    public EditarClienteDto(String telefono, String direccion) {
        this.telefono = telefono;
        this.direccion = direccion;
    }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
}
