package com.umsa.creditos.dominio.repositorios;

import com.umsa.creditos.dominio.entidades.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContratoRepository extends JpaRepository<Contrato, Long> {
    Optional<Contrato> findByNumeroContrato(String numeroContrato);
    Optional<Contrato> findByCreditoIdCredito(Long idCredito);
}
