package com.umsa.creditos.aplicacion.dtos;

public class RechazoDto {
    private String motivo;

    public RechazoDto() {}

    public RechazoDto(String motivo) {
        this.motivo = motivo;
    }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
