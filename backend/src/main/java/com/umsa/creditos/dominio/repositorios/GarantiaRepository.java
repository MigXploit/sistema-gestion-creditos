package com.umsa.creditos.dominio.repositorios;

import com.umsa.creditos.dominio.entidades.Garantia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GarantiaRepository extends JpaRepository<Garantia, Long> {
    List<Garantia> findBySolicitudIdSolicitud(Long idSolicitud);
    List<Garantia> findByCreditoIdCredito(Long idCredito);
}
