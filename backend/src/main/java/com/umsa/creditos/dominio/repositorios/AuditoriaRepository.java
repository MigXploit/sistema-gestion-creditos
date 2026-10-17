package com.umsa.creditos.dominio.repositorios;

import com.umsa.creditos.dominio.entidades.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findTop50ByOrderByFechaHoraDesc();
    List<Auditoria> findByEntidadOrderByFechaHoraDesc(String entidad);
    List<Auditoria> findByEntidadAndIdEntidadOrderByFechaHoraDesc(String entidad, String idEntidad);
    List<Auditoria> findByOperacionOrderByFechaHoraDesc(String operacion);
}
