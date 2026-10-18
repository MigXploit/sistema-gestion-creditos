package com.umsa.creditos.dominio.repositorios;

import com.umsa.creditos.dominio.entidades.EvaluacionCredito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EvaluacionCreditoRepository extends JpaRepository<EvaluacionCredito, Long> {
    Optional<EvaluacionCredito> findBySolicitudIdSolicitud(Long idSolicitud);
}
