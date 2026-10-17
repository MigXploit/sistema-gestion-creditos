package com.umsa.creditos.infraestructura.controladores;

import com.umsa.creditos.dominio.entidades.Auditoria;
import com.umsa.creditos.dominio.repositorios.AuditoriaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/auditoria")
public class AuditoriaController {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaController(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'GERENTE')")
    public ResponseEntity<List<Auditoria>> listarRecientes() {
        return ResponseEntity.ok(auditoriaRepository.findTop50ByOrderByFechaHoraDesc());
    }
}
