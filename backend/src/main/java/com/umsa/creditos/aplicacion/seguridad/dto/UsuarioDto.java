package com.umsa.creditos.aplicacion.seguridad.dto;

import com.umsa.creditos.dominio.enums.RolUsuario;
import java.math.BigDecimal;

public class UsuarioDto {
    private Long idUsuario;
    private String nombreCompleto;
    private String login;
    private String password;
    private RolUsuario rol;
    private BigDecimal limiteAtribucion;
    private Boolean activo;

    public UsuarioDto() {}

    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public RolUsuario getRol() { return rol; }
    public void setRol(RolUsuario rol) { this.rol = rol; }

    public BigDecimal getLimiteAtribucion() { return limiteAtribucion; }
    public void setLimiteAtribucion(BigDecimal limiteAtribucion) { this.limiteAtribucion = limiteAtribucion; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
