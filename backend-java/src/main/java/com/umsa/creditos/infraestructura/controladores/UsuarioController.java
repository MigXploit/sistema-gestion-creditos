package com.umsa.creditos.infraestructura.controladores;

import com.umsa.creditos.aplicacion.seguridad.CustomUserDetails;
import com.umsa.creditos.aplicacion.seguridad.UsuarioService;
import com.umsa.creditos.aplicacion.seguridad.dto.UsuarioDto;
import com.umsa.creditos.dominio.entidades.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<UsuarioDto>> listar() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<?> crear(@RequestBody UsuarioDto dto,
                                  @AuthenticationPrincipal CustomUserDetails userDetails,
                                  HttpServletRequest request) {
        try {
            Usuario operador = userDetails.getUsuario();
            String ip = request.getRemoteAddr();
            UsuarioDto creado = usuarioService.crearUsuario(dto, operador, ip);
            return ResponseEntity.ok(creado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id,
                                          @RequestBody Map<String, Boolean> body,
                                          @AuthenticationPrincipal CustomUserDetails userDetails,
                                          HttpServletRequest request) {
        try {
            boolean activo = body.getOrDefault("activo", true);
            Usuario operador = userDetails.getUsuario();
            String ip = request.getRemoteAddr();
            UsuarioDto actualizado = usuarioService.cambiarEstado(id, activo, operador, ip);
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
