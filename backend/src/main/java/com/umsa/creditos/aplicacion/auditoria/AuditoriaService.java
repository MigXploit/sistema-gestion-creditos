package com.umsa.creditos.aplicacion.auditoria;

import com.umsa.creditos.dominio.entidades.Auditoria;
import com.umsa.creditos.dominio.entidades.Usuario;
import com.umsa.creditos.dominio.repositorios.AuditoriaRepository;
import com.umsa.creditos.dominio.repositorios.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;
    private final UsuarioRepository usuarioRepository;

    public AuditoriaService(AuditoriaRepository auditoriaRepository, UsuarioRepository usuarioRepository) {
        this.auditoriaRepository = auditoriaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public void registrarEvento(Usuario usuario, String ipOrigen, String operacion, String entidad, String idEntidad, String resultado, String detalles) {
        Auditoria auditoria = new Auditoria();
        auditoria.setUsuario(usuario);
        auditoria.setFechaHora(LocalDateTime.now());
        auditoria.setIpOrigen(ipOrigen != null ? ipOrigen : "127.0.0.1");
        auditoria.setOperacion(operacion);
        auditoria.setEntidad(entidad);
        auditoria.setIdEntidad(idEntidad);
        auditoria.setResultado(resultado);
        auditoria.setDetalles(detalles);

        auditoriaRepository.save(auditoria);
    }

    @Transactional
    public void registrarEvento(String username, String operacion, String entidad, String idEntidad, String resultado, String detalles, String ipOrigen) {
        Usuario usuario = null;
        if (username != null && !username.equalsIgnoreCase("ANONYMOUS")) {
            usuario = usuarioRepository.findByLogin(username).orElse(null);
        }
        registrarEvento(usuario, ipOrigen, operacion, entidad, idEntidad, resultado, detalles);
    }
}
