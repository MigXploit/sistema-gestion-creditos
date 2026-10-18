package com.umsa.creditos.dominio.enums;

/**
 * Roles de usuario con control RBAC. Fuente: D02, sección 16.2.
 * El Cliente NO inicia sesión (decisión del grupo, Apéndice B4).
 */
public enum RolUsuario {
    OFICIAL,        // Oficial de Crédito: CU01, CU02, CU06, CU11
    ANALISTA,       // Analista de Crédito: CU03, CU04, CU05
    JEFE,           // Jefe de Créditos: CU07, CU08 (límite Bs 70.000)
    CAJERO,         // Cajero: CU12
    ADMINISTRADOR,  // Administrador: CU15
    GERENTE         // Gerente: CU14
}
