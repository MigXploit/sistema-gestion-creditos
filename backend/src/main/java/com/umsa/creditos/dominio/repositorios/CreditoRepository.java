package com.umsa.creditos.dominio.repositorios;

import com.umsa.creditos.dominio.entidades.Credito;
import com.umsa.creditos.dominio.enums.EstadoCredito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CreditoRepository extends JpaRepository<Credito, Long> {
    Optional<Credito> findByNumeroCredito(String numeroCredito);
    Optional<Credito> findBySolicitudIdSolicitud(Long idSolicitud);
    List<Credito> findByEstado(EstadoCredito estado);
}
