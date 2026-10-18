package com.umsa.creditos.aplicacion.seguridad;

import com.umsa.creditos.aplicacion.auditoria.AuditoriaService;
import com.umsa.creditos.aplicacion.seguridad.dto.UsuarioDto;
import com.umsa.creditos.dominio.entidades.Usuario;
import com.umsa.creditos.dominio.enums.RolUsuario;
import com.umsa.creditos.dominio.repositorios.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de aplicación para Administrar Usuarios (CU15 - RF16).
 * Reglas: RN12 (auditoría), RN20 (desactivación).
 */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          PasswordEncoder passwordEncoder,
                          AuditoriaService auditoriaService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaService = auditoriaService;
    }

    public List<UsuarioDto> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UsuarioDto crearUsuario(UsuarioDto dto, Usuario usuarioOperador, String ipOrigen) {
        if (usuarioRepository.existsByLogin(dto.getLogin())) {
            throw new IllegalArgumentException("Ya existe un usuario con el login: " + dto.getLogin());
        }

        Usuario usuario = new Usuario();
        usuario.setNombreCompleto(dto.getNombreCompleto());
        usuario.setLogin(dto.getLogin().trim().toLowerCase());
        usuario.setClaveHash(passwordEncoder.encode(dto.getPassword()));
        usuario.setRol(dto.getRol());

        // Regla: Solo el Jefe de Créditos puede tener atribución hasta 70.000 Bs (sección 13.5)
        if (dto.getRol() == RolUsuario.JEFE) {
            BigDecimal limite = dto.getLimiteAtribucion() != null ? dto.getLimiteAtribucion() : new BigDecimal("70000.00");
            usuario.setLimiteAtribucion(limite);
        } else {
            usuario.setLimiteAtribucion(BigDecimal.ZERO);
        }

        usuario.setActivo(dto.getActivo() != null ? dto.getActivo() : true);
        usuario.setIntentosFallidos(0);

        Usuario guardado = usuarioRepository.save(usuario);

        auditoriaService.registrarEvento(
                usuarioOperador,
                ipOrigen,
                "CREAR",
                "USUARIO",
                guardado.getLogin(),
                "EXITOSO",
                "Usuario creado con rol " + guardado.getRol()
        );

        return mapToDto(guardado);
    }

    @Transactional
    public UsuarioDto cambiarEstado(Long idUsuario, boolean activo, Usuario usuarioOperador, String ipOrigen) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + idUsuario));

        boolean estadoAnterior = Boolean.TRUE.equals(usuario.getActivo());
        usuario.setActivo(activo);
        if (activo) {
            usuario.setIntentosFallidos(0);
            usuario.setBloqueadoHasta(null);
        }

        Usuario actualizado = usuarioRepository.save(usuario);

        auditoriaService.registrarEvento(
                usuarioOperador,
                ipOrigen,
                activo ? "ACTIVAR" : "DESACTIVAR",
                "USUARIO",
                actualizado.getLogin(),
                "EXITOSO",
                "Estado cambiado de " + estadoAnterior + " a " + activo
        );

        return mapToDto(actualizado);
    }

    private UsuarioDto mapToDto(Usuario u) {
        UsuarioDto dto = new UsuarioDto();
        dto.setIdUsuario(u.getIdUsuario());
        dto.setNombreCompleto(u.getNombreCompleto());
        dto.setLogin(u.getLogin());
        dto.setRol(u.getRol());
        dto.setLimiteAtribucion(u.getLimiteAtribucion());
        dto.setActivo(u.getActivo());
        return dto;
    }
}
