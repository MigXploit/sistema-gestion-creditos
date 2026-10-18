package com.umsa.creditos.infraestructura.controladores;

import com.umsa.creditos.aplicacion.dtos.ContratoResponseDto;
import com.umsa.creditos.aplicacion.dtos.CreditoResponseDto;
import com.umsa.creditos.aplicacion.dtos.CuotaResponseDto;
import com.umsa.creditos.aplicacion.servicios.CreditoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/creditos")
public class CreditoController {

    private final CreditoService creditoService;

    public CreditoController(CreditoService creditoService) {
        this.creditoService = creditoService;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('JEFE', 'OFICIAL', 'ANALISTA', 'GERENTE', 'CAJERO', 'ADMINISTRADOR')")
    public ResponseEntity<CreditoResponseDto> buscarPorId(@PathVariable("id") Long id) {
        return ResponseEntity.ok(creditoService.buscarCreditoPorId(id));
    }

    @GetMapping("/solicitud/{idSolicitud}")
    @PreAuthorize("hasAnyRole('JEFE', 'OFICIAL', 'ANALISTA', 'GERENTE', 'CAJERO', 'ADMINISTRADOR')")
    public ResponseEntity<CreditoResponseDto> buscarPorSolicitud(@PathVariable("idSolicitud") Long idSolicitud) {
        return ResponseEntity.ok(creditoService.buscarCreditoPorSolicitud(idSolicitud));
    }

    @GetMapping("/{id}/cronograma")
    @PreAuthorize("hasAnyRole('JEFE', 'OFICIAL', 'ANALISTA', 'GERENTE', 'CAJERO', 'ADMINISTRADOR')")
    public ResponseEntity<List<CuotaResponseDto>> listarCronograma(@PathVariable("id") Long id) {
        return ResponseEntity.ok(creditoService.listarCronogramaPorCredito(id));
    }

    @GetMapping("/{id}/contrato")
    @PreAuthorize("hasAnyRole('JEFE', 'OFICIAL', 'ANALISTA', 'GERENTE', 'CAJERO', 'ADMINISTRADOR')")
    public ResponseEntity<ContratoResponseDto> buscarContrato(@PathVariable("id") Long id) {
        return ResponseEntity.ok(creditoService.buscarContratoPorCredito(id));
    }
}
