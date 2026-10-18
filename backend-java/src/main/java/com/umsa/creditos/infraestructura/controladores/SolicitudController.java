package com.umsa.creditos.infraestructura.controladores;

import com.umsa.creditos.aplicacion.dtos.AprobacionDto;
import com.umsa.creditos.aplicacion.dtos.CreditoResponseDto;
import com.umsa.creditos.aplicacion.dtos.RechazoDto;
import com.umsa.creditos.aplicacion.dtos.SolicitudRegistroDto;
import com.umsa.creditos.aplicacion.dtos.SolicitudResponseDto;
import com.umsa.creditos.aplicacion.servicios.CreditoService;
import com.umsa.creditos.aplicacion.servicios.SolicitudService;
import com.umsa.creditos.dominio.enums.EstadoSolicitud;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/solicitudes")
public class SolicitudController {

    private final SolicitudService solicitudService;
    private final CreditoService creditoService;

    public SolicitudController(SolicitudService solicitudService, CreditoService creditoService) {
        this.solicitudService = solicitudService;
        this.creditoService = creditoService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OFICIAL', 'ADMINISTRADOR')")
    public ResponseEntity<SolicitudResponseDto> registrarSolicitud(@RequestBody SolicitudRegistroDto dto,
                                                                   Authentication authentication,
                                                                   HttpServletRequest request) {
        String username = authentication != null ? authentication.getName() : "ANONYMOUS";
        String ip = request.getRemoteAddr();
        SolicitudResponseDto response = solicitudService.registrarSolicitud(dto, username, ip);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/iniciar-evaluacion")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMINISTRADOR')")
    public ResponseEntity<SolicitudResponseDto> iniciarEvaluacion(@PathVariable("id") Long id,
                                                                  Authentication authentication,
                                                                  HttpServletRequest request) {
        String username = authentication != null ? authentication.getName() : "ANONYMOUS";
        String ip = request.getRemoteAddr();
        SolicitudResponseDto response = solicitudService.iniciarEvaluacion(id, username, ip);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'ADMINISTRADOR')")
    public ResponseEntity<List<SolicitudResponseDto>> listarSolicitudes(
            @RequestParam(value = "estado", required = false) EstadoSolicitud estado) {
        if (estado != null) {
            return ResponseEntity.ok(solicitudService.listarPorEstado(estado));
        }
        return ResponseEntity.ok(solicitudService.listarTodas());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'ADMINISTRADOR')")
    public ResponseEntity<SolicitudResponseDto> buscarPorId(@PathVariable("id") Long id) {
        return ResponseEntity.ok(solicitudService.buscarPorId(id));
    }

    @PostMapping("/{id}/aprobar")
    @PreAuthorize("hasAnyRole('JEFE', 'ADMINISTRADOR')")
    public ResponseEntity<CreditoResponseDto> aprobarCredito(@PathVariable("id") Long id,
                                                             @RequestBody(required = false) AprobacionDto dto,
                                                             Authentication authentication,
                                                             HttpServletRequest request) {
        String username = authentication != null ? authentication.getName() : "ANONYMOUS";
        String ip = request.getRemoteAddr();
        AprobacionDto aprobacionDto = (dto != null) ? dto : new AprobacionDto();
        CreditoResponseDto response = creditoService.aprobarCredito(id, aprobacionDto, username, ip);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/rechazar")
    @PreAuthorize("hasAnyRole('JEFE', 'ADMINISTRADOR')")
    public ResponseEntity<SolicitudResponseDto> rechazarCredito(@PathVariable("id") Long id,
                                                                @RequestBody RechazoDto dto,
                                                                Authentication authentication,
                                                                HttpServletRequest request) {
        String username = authentication != null ? authentication.getName() : "ANONYMOUS";
        String ip = request.getRemoteAddr();
        SolicitudResponseDto response = creditoService.rechazarCredito(id, dto, username, ip);
        return ResponseEntity.ok(response);
    }
}
