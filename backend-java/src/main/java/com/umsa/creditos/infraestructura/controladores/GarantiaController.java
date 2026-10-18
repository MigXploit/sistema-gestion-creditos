package com.umsa.creditos.infraestructura.controladores;

import com.umsa.creditos.aplicacion.dtos.GarantiaRegistroDto;
import com.umsa.creditos.aplicacion.dtos.GarantiaResponseDto;
import com.umsa.creditos.aplicacion.servicios.GarantiaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/garantias")
public class GarantiaController {

    private final GarantiaService garantiaService;

    public GarantiaController(GarantiaService garantiaService) {
        this.garantiaService = garantiaService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OFICIAL', 'ADMINISTRADOR')")
    public ResponseEntity<GarantiaResponseDto> registrarGarantia(@RequestBody GarantiaRegistroDto dto,
                                                                 Authentication authentication,
                                                                 HttpServletRequest request) {
        String username = authentication != null ? authentication.getName() : "ANONYMOUS";
        String ip = request.getRemoteAddr();
        GarantiaResponseDto response = garantiaService.registrarGarantia(dto, username, ip);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/solicitud/{idSolicitud}")
    @PreAuthorize("hasAnyRole('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'ADMINISTRADOR')")
    public ResponseEntity<List<GarantiaResponseDto>> listarPorSolicitud(@PathVariable("idSolicitud") Long idSolicitud) {
        return ResponseEntity.ok(garantiaService.listarPorSolicitud(idSolicitud));
    }

    @GetMapping("/credito/{idCredito}")
    @PreAuthorize("hasAnyRole('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'ADMINISTRADOR')")
    public ResponseEntity<List<GarantiaResponseDto>> listarPorCredito(@PathVariable("idCredito") Long idCredito) {
        return ResponseEntity.ok(garantiaService.listarPorCredito(idCredito));
    }
}
