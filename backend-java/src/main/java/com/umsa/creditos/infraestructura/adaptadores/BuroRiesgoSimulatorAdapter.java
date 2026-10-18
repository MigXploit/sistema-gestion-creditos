package com.umsa.creditos.infraestructura.adaptadores;

import com.umsa.creditos.aplicacion.dtos.ResultadoBuroDto;
import com.umsa.creditos.aplicacion.puertos.BuroRiesgoPort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Adaptador simulador para el servicio externo de Buró de Crédito.
 * Fuente: CU03, RNF09, RN08, RN09, CA06, CA07, D13.
 */
@Component
public class BuroRiesgoSimulatorAdapter implements BuroRiesgoPort {

    private boolean forzarFallo = false;
    private boolean forzarRespuestaParcial = false;

    @Override
    public ResultadoBuroDto consultarHistorial(String ci, BigDecimal montoSolicitado) {
        if (forzarFallo) {
            return new ResultadoBuroDto(
                    null,
                    null,
                    null,
                    BigDecimal.ZERO,
                    LocalDateTime.now(),
                    false,
                    false,
                    "Error de conexión con el Buró de Riesgo externo (Timeout 30s excedido)."
            );
        }

        if (forzarRespuestaParcial) {
            return new ResultadoBuroDto(
                    "REF-INC-" + ci,
                    "DATOS_INCOMPLETOS",
                    null,
                    BigDecimal.ZERO,
                    LocalDateTime.now(),
                    false,
                    true,
                    "El Buró de Riesgo devolvió datos parciales: score no disponible."
            );
        }

        // Simulación estándar con datos del informe base (referencia R04571, score 780, SIN MORA)
        String ref = (ci != null && ci.contains("4587231")) ? "R04571" : "R" + String.format("%05d", (int)(Math.random() * 90000 + 10000));
        int score = 780; // DEL INFORME (D13 y P13)
        String historial = "SIN MORA"; // DEL INFORME (P13)
        BigDecimal deudas = BigDecimal.ZERO; // Sin mora vigente

        return new ResultadoBuroDto(
                ref,
                historial,
                score,
                deudas,
                LocalDateTime.now(),
                true,
                false,
                "Consulta ejecutada con éxito. Historial crediticio verificado."
        );
    }

    @Override
    public void configurarModoSimulador(boolean forzarFallo, boolean forzarRespuestaParcial) {
        this.forzarFallo = forzarFallo;
        this.forzarRespuestaParcial = forzarRespuestaParcial;
    }
}
