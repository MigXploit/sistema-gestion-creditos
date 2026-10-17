package com.umsa.creditos.dominio.repositorios;

import com.umsa.creditos.dominio.entidades.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {
    Optional<Pago> findByNumeroRecibo(String numeroRecibo);
    List<Pago> findByCuotaIdCuota(Long idCuota);
}
