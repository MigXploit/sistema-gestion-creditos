package com.umsa.creditos.aplicacion.dtos;

import com.umsa.creditos.dominio.enums.TipoCredito;
import java.math.BigDecimal;

public class SolicitudRegistroDto {
    private String ciCliente;
    private BigDecimal montoSolicitado;
    private Integer plazoMeses;
    private TipoCredito tipoCredito;
    private String destino;
    private Boolean documentacionCompleta = false;

    public SolicitudRegistroDto() {}

    public String getCiCliente() { return ciCliente; }
    public void setCiCliente(String ciCliente) { this.ciCliente = ciCliente; }
    public BigDecimal getMontoSolicitado() { return montoSolicitado; }
    public void setMontoSolicitado(BigDecimal montoSolicitado) { this.montoSolicitado = montoSolicitado; }
    public Integer getPlazoMeses() { return plazoMeses; }
    public void setPlazoMeses(Integer plazoMeses) { this.plazoMeses = plazoMeses; }
    public TipoCredito getTipoCredito() { return tipoCredito; }
    public void setTipoCredito(TipoCredito tipoCredito) { this.tipoCredito = tipoCredito; }
    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }
    public Boolean getDocumentacionCompleta() { return documentacionCompleta; }
    public void setDocumentacionCompleta(Boolean documentacionCompleta) { this.documentacionCompleta = documentacionCompleta; }
}
