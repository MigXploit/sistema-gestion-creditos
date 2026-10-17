package com.umsa.creditos;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.umsa.creditos.aplicacion.seguridad.dto.LoginRequest;
import com.umsa.creditos.aplicacion.seguridad.dto.LoginResponse;
import com.umsa.creditos.aplicacion.seguridad.dto.UsuarioDto;
import com.umsa.creditos.dominio.enums.RolUsuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testLoginExitosoJefeCarlosMendoza() throws Exception {
        LoginRequest request = new LoginRequest("cmendoza", "Bancario2026!");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.login").value("cmendoza"))
                .andExpect(jsonPath("$.rol").value("JEFE"))
                .andExpect(jsonPath("$.limiteAtribucion").value(70000.00));
    }

    @Test
    void testLoginCredencialesInvalidas() throws Exception {
        LoginRequest request = new LoginRequest("cmendoza", "clave_erronea");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Error de autenticación"));
    }

    @Test
    void testControlAccesoRbacAdminVsOficial() throws Exception {
        // 1. Login como Oficial (Ana Torrez)
        LoginRequest reqOficial = new LoginRequest("atorrez", "Bancario2026!");
        MvcResult resOficial = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqOficial)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse respOficial = objectMapper.readValue(resOficial.getResponse().getContentAsString(), LoginResponse.class);

        // Oficial intenta entrar al módulo de administración de usuarios (CA25) -> Debe ser 403 Forbidden
        mockMvc.perform(get("/usuarios")
                        .header("Authorization", "Bearer " + respOficial.getToken()))
                .andExpect(status().isForbidden());

        // 2. Login como Administrador (admin)
        LoginRequest reqAdmin = new LoginRequest("admin", "Bancario2026!");
        MvcResult resAdmin = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqAdmin)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse respAdmin = objectMapper.readValue(resAdmin.getResponse().getContentAsString(), LoginResponse.class);

        // Administrador consulta usuarios (CU15, RF16, CA24) -> Debe ser 200 OK
        mockMvc.perform(get("/usuarios")
                        .header("Authorization", "Bearer " + respAdmin.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testCreacionUsuarioPorAdmin() throws Exception {
        // Login como Admin
        LoginRequest reqAdmin = new LoginRequest("admin", "Bancario2026!");
        MvcResult resAdmin = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqAdmin)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse respAdmin = objectMapper.readValue(resAdmin.getResponse().getContentAsString(), LoginResponse.class);

        UsuarioDto nuevo = new UsuarioDto();
        nuevo.setNombreCompleto("Nuevo Oficial Test");
        nuevo.setLogin("noficial");
        nuevo.setPassword("Bancario2026!");
        nuevo.setRol(RolUsuario.OFICIAL);
        nuevo.setActivo(true);

        mockMvc.perform(post("/usuarios")
                        .header("Authorization", "Bearer " + respAdmin.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nuevo)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.login").value("noficial"))
                .andExpect(jsonPath("$.rol").value("OFICIAL"));
    }
}
