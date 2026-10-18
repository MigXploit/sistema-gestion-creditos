package com.umsa.creditos.aplicacion.seguridad.dto;

import java.math.BigDecimal;

public class LoginResponse {
    private String token;
    private String tipo = "Bearer";
    private String login;
    private String nombreCompleto;
    private String rol;
    private BigDecimal limiteAtribucion;

    public LoginResponse() {}

    public LoginResponse(String token, String login, String nombreCompleto, String rol, BigDecimal limiteAtribucion) {
        this.token = token;
        this.tipo = "Bearer";
        this.login = login;
        this.nombreCompleto = nombreCompleto;
        this.rol = rol;
        this.limiteAtribucion = limiteAtribucion;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public BigDecimal getLimiteAtribucion() { return limiteAtribucion; }
    public void setLimiteAtribucion(BigDecimal limiteAtribucion) { this.limiteAtribucion = limiteAtribucion; }
}
