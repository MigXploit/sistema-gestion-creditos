package com.umsa.creditos.infraestructura.controladores;

import com.umsa.creditos.aplicacion.seguridad.AuthService;
import com.umsa.creditos.aplicacion.seguridad.CustomUserDetails;
import com.umsa.creditos.aplicacion.seguridad.dto.LoginRequest;
import com.umsa.creditos.aplicacion.seguridad.dto.LoginResponse;
import com.umsa.creditos.dominio.entidades.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        try {
            String ipOrigen = request.getRemoteAddr();
            LoginResponse response = authService.autenticar(loginRequest, ipOrigen);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error de autenticación");
            error.put("mensaje", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> obtenerUsuarioAutenticado(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));
        }
        Usuario u = userDetails.getUsuario();
        Map<String, Object> data = new HashMap<>();
        data.put("idUsuario", u.getIdUsuario());
        data.put("login", u.getLogin());
        data.put("nombreCompleto", u.getNombreCompleto());
        data.put("rol", u.getRol().name());
        data.put("limiteAtribucion", u.getLimiteAtribucion());
        return ResponseEntity.ok(data);
    }
}
