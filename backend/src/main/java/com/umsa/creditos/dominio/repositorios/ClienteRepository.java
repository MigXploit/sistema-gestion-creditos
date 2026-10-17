package com.umsa.creditos.dominio.repositorios;

import com.umsa.creditos.dominio.entidades.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByCi(String ci);
    boolean existsByCi(String ci);
}
