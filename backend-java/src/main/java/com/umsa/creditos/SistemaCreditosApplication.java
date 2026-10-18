package com.umsa.creditos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Punto de entrada del Sistema de Gestión de Créditos.
 * UMSA – Análisis y Diseño de Sistemas I – Grupo 4
 */
@SpringBootApplication
@EnableScheduling
public class SistemaCreditosApplication {

    public static void main(String[] args) {
        SpringApplication.run(SistemaCreditosApplication.class, args);
    }
}
