package com.umsa.creditos.dominio.repositorios;

import com.umsa.creditos.dominio.entidades.SolicitudCredito;
import com.umsa.creditos.dominio.enums.EstadoSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitudCreditoRepository extends JpaRepository<SolicitudCredito, Long> {
    Optional<SolicitudCredito> findByNumeroSolicitud(String numeroSolicitud);
    List<SolicitudCredito> findByEstado(EstadoSolicitud estado);
    List<SolicitudCredito> findByClienteIdCliente(Long idCliente);
}
