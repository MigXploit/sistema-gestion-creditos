package com.umsa.creditos.aplicacion.puertos;

import com.umsa.creditos.aplicacion.dtos.ResultadoBuroDto;
import java.math.BigDecimal;

/**
 * Puerto de interfaz para consulta al Buró de Riesgo externo.
 * RNF09: Integración de interfaces externas con timeout y tolerancia a fallos.
 */
public interface BuroRiesgoPort {
    ResultadoBuroDto consultarHistorial(String ci, BigDecimal montoSolicitado);
    void configurarModoSimulador(boolean forzarFallo, boolean forzarRespuestaParcial);
}
