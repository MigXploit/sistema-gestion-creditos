package com.umsa.creditos.infraestructura.controladores;

import com.umsa.creditos.aplicacion.dtos.EvaluacionFinancieraDto;
import com.umsa.creditos.aplicacion.dtos.EvaluacionResponseDto;
import com.umsa.creditos.aplicacion.dtos.ResultadoBuroDto;
import com.umsa.creditos.aplicacion.puertos.BuroRiesgoPort;
import com.umsa.creditos.aplicacion.servicios.EvaluacionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/evaluaciones")
public class EvaluacionController {

    private final EvaluacionService evaluacionService;
    private final BuroRiesgoPort buroRiesgoPort;

    public EvaluacionController(EvaluacionService evaluacionService, BuroRiesgoPort buroRiesgoPort) {
        this.evaluacionService = evaluacionService;
        this.buroRiesgoPort = buroRiesgoPort;
    }

    @PostMapping("/solicitud/{id}/consultar-buro")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMINISTRADOR')")
    public ResponseEntity<ResultadoBuroDto> consultarBuro(@PathVariable("id") Long id,
                                                          Authentication authentication,
                                                          HttpServletRequest request) {
        String username = authentication != null ? authentication.getName() : "ANONYMOUS";
        String ip = request.getRemoteAddr();
        ResultadoBuroDto resultado = evaluacionService.consultarHistorialBuro(id, username, ip);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/solicitud/{id}/calcular-capacidad")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMINISTRADOR')")
    public ResponseEntity<EvaluacionResponseDto> calcularCapacidad(@PathVariable("id") Long id,
                                                                   @RequestBody Map<String, BigDecimal> body) {
        BigDecimal ingresos = body.get("ingresos");
        BigDecimal gastos = body.get("gastos");
        BigDecimal deudas = body.get("deudasVigentes");
        EvaluacionResponseDto resp = evaluacionService.calcularCapacidadYRatios(id, ingresos, gastos, deudas);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/dictamen")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMINISTRADOR')")
    public ResponseEntity<EvaluacionResponseDto> emitirDictamen(@RequestBody EvaluacionFinancieraDto dto,
                                                                Authentication authentication,
                                                                HttpServletRequest request) {
        String username = authentication != null ? authentication.getName() : "ANONYMOUS";
        String ip = request.getRemoteAddr();
        EvaluacionResponseDto resp = evaluacionService.emitirDictamen(dto, username, ip);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/solicitud/{id}")
    @PreAuthorize("hasAnyRole('ANALISTA', 'JEFE', 'GERENTE', 'ADMINISTRADOR')")
    public ResponseEntity<EvaluacionResponseDto> buscarPorSolicitud(@PathVariable("id") Long id) {
        return evaluacionService.buscarPorSolicitud(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/simulador/config")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMINISTRADOR')")
    public ResponseEntity<Map<String, String>> configurarSimulador(@RequestBody Map<String, Boolean> config) {
        boolean fallo = Boolean.TRUE.equals(config.get("forzarFallo"));
        boolean parcial = Boolean.TRUE.equals(config.get("forzarParcial"));
        buroRiesgoPort.configurarModoSimulador(fallo, parcial);
        return ResponseEntity.ok(Map.of("mensaje", "Configuración del simulador de Buró actualizada exitosamente."));
    }
}
