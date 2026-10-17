package com.umsa.creditos.aplicacion.dtos;

public class AprobacionDto {
    private String observaciones;

    public AprobacionDto() {}

    public AprobacionDto(String observaciones) {
        this.observaciones = observaciones;
    }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
