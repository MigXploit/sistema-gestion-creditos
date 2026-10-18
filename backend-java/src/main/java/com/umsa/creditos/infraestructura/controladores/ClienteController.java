package com.umsa.creditos.infraestructura.controladores;

import com.umsa.creditos.aplicacion.dtos.ClienteDto;
import com.umsa.creditos.aplicacion.dtos.EditarClienteDto;
import com.umsa.creditos.aplicacion.servicios.ClienteService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OFICIAL', 'ADMINISTRADOR')")
    public ResponseEntity<ClienteDto> registrarCliente(@RequestBody ClienteDto dto,
                                                       Authentication authentication,
                                                       HttpServletRequest request) {
        String username = authentication != null ? authentication.getName() : "ANONYMOUS";
        String ip = request.getRemoteAddr();
        ClienteDto response = clienteService.registrarCliente(dto, username, ip);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OFICIAL', 'ADMINISTRADOR')")
    public ResponseEntity<ClienteDto> editarCliente(@PathVariable("id") Long id,
                                                    @RequestBody EditarClienteDto dto,
                                                    Authentication authentication,
                                                    HttpServletRequest request) {
        String username = authentication != null ? authentication.getName() : "ANONYMOUS";
        String ip = request.getRemoteAddr();
        ClienteDto response = clienteService.editarCliente(id, dto, username, ip);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'ADMINISTRADOR')")
    public ResponseEntity<List<ClienteDto>> listarClientes() {
        return ResponseEntity.ok(clienteService.listarTodos());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'ADMINISTRADOR')")
    public ResponseEntity<ClienteDto> buscarPorId(@PathVariable("id") Long id) {
        return ResponseEntity.ok(clienteService.buscarPorId(id));
    }

    @GetMapping("/ci/{ci}")
    @PreAuthorize("hasAnyRole('OFICIAL', 'ANALISTA', 'JEFE', 'GERENTE', 'ADMINISTRADOR')")
    public ResponseEntity<ClienteDto> buscarPorCi(@PathVariable("ci") String ci) {
        return ResponseEntity.ok(clienteService.buscarPorCi(ci));
    }
}
