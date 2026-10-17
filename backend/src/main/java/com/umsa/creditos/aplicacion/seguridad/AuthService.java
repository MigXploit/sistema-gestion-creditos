package com.umsa.creditos.aplicacion.seguridad;

import com.umsa.creditos.aplicacion.auditoria.AuditoriaService;
import com.umsa.creditos.aplicacion.seguridad.dto.LoginRequest;
import com.umsa.creditos.aplicacion.seguridad.dto.LoginResponse;
import com.umsa.creditos.dominio.entidades.Usuario;
import com.umsa.creditos.dominio.repositorios.UsuarioRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditoriaService auditoriaService;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuditoriaService auditoriaService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public LoginResponse autenticar(LoginRequest request, String ipOrigen) {
        Usuario usuario = usuarioRepository.findByLogin(request.getLogin())
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

        if (Boolean.FALSE.equals(usuario.getActivo())) {
            auditoriaService.registrarEvento(usuario, ipOrigen, "LOGIN", "USUARIO", usuario.getLogin(), "DENEGADO", "Usuario inactivo");
            throw new BadCredentialsException("El usuario se encuentra inactivo");
        }

        // Validación de bloqueo temporal (5 intentos fallidos, RNF01, sección 16.2)
        if (usuario.getBloqueadoHasta() != null) {
            if (usuario.getBloqueadoHasta().isAfter(LocalDateTime.now())) {
                auditoriaService.registrarEvento(usuario, ipOrigen, "LOGIN", "BLOQUEADO", usuario.getLogin(), "DENEGADO", "Cuenta temporalmente bloqueada");
                throw new BadCredentialsException("Cuenta bloqueada temporalmente por intentos fallidos. Intente más tarde.");
            } else {
                // Periodo de bloqueo expirado, se restablece
                usuario.setBloqueadoHasta(null);
                usuario.setIntentosFallidos(0);
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getClaveHash())) {
            int intentos = usuario.getIntentosFallidos() + 1;
            usuario.setIntentosFallidos(intentos);

            if (intentos >= 5) {
                usuario.setBloqueadoHasta(LocalDateTime.now().plusMinutes(30));
                usuarioRepository.save(usuario);
                auditoriaService.registrarEvento(usuario, ipOrigen, "LOGIN", "USUARIO", usuario.getLogin(), "BLOQUEO_CUENTA", "Bloqueado al 5to intento fallido");
                throw new BadCredentialsException("Cuenta bloqueada por exceder 5 intentos fallidos consecutivos.");
            }

            usuarioRepository.save(usuario);
            auditoriaService.registrarEvento(usuario, ipOrigen, "LOGIN", "USUARIO", usuario.getLogin(), "FALLIDO", "Intento " + intentos + " de 5");
            throw new BadCredentialsException("Credenciales inválidas. Intento " + intentos + " de 5.");
        }

        // Login exitoso: se restablecen intentos fallidos
        usuario.setIntentosFallidos(0);
        usuario.setBloqueadoHasta(null);
        usuarioRepository.save(usuario);

        String token = tokenProvider.generateToken(usuario.getLogin(), usuario.getRol().name(), usuario.getNombreCompleto());

        auditoriaService.registrarEvento(usuario, ipOrigen, "LOGIN", "USUARIO", usuario.getLogin(), "EXITOSO", "Sesión iniciada");

        return new LoginResponse(
                token,
                usuario.getLogin(),
                usuario.getNombreCompleto(),
                usuario.getRol().name(),
                usuario.getLimiteAtribucion()
        );
    }
}
