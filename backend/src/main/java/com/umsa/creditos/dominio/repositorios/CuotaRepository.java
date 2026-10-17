package com.umsa.creditos.dominio.repositorios;

import com.umsa.creditos.dominio.entidades.Cuota;
import com.umsa.creditos.dominio.enums.EstadoCuota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CuotaRepository extends JpaRepository<Cuota, Long> {
    List<Cuota> findByCreditoIdCreditoOrderByNumeroCuotaAsc(Long idCredito);
    List<Cuota> findByCreditoIdCreditoAndEstado(Long idCredito, EstadoCuota estado);
}
