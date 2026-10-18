package com.umsa.creditos.aplicacion.servicios;

import com.umsa.creditos.aplicacion.auditoria.AuditoriaService;
import com.umsa.creditos.aplicacion.dtos.ClienteDto;
import com.umsa.creditos.aplicacion.dtos.EditarClienteDto;
import com.umsa.creditos.dominio.entidades.Cliente;
import com.umsa.creditos.dominio.repositorios.ClienteRepository;
import com.umsa.creditos.infraestructura.config.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio para Gestión de Clientes.
 * RF01, RF02 – CU01.
 * Criterios: CA01, CA02, CA03.
 * Regla: RN12 (Auditoría).
 */
@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final AuditoriaService auditoriaService;

    public ClienteService(ClienteRepository clienteRepository, AuditoriaService auditoriaService) {
        this.clienteRepository = clienteRepository;
        this.auditoriaService = auditoriaService;
    }

    /**
     * CA01: Valida obligatorios y formato. Guarda fecha_registro y audita.
     * CA02: CI duplicado -> Devuelve el cliente existente y no crea otro.
     */
    @Transactional
    public ClienteDto registrarCliente(ClienteDto dto, String username, String ip) {
        if (dto.getCi() == null || dto.getCi().trim().isEmpty()) {
            throw new BusinessException("El número de documento de identidad (CI) es obligatorio.");
        }
        if (dto.getNombres() == null || dto.getNombres().trim().isEmpty()) {
            throw new BusinessException("Los nombres del cliente son obligatorios.");
        }
        if (dto.getApellidos() == null || dto.getApellidos().trim().isEmpty()) {
            throw new BusinessException("Los apellidos del cliente son obligatorios.");
        }
        if (dto.getIngresosMensuales() == null || dto.getIngresosMensuales().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Los ingresos mensuales deben ser mayores a cero.");
        }

        String ciLimpio = dto.getCi().trim();
        Optional<Cliente> existenteOpt = clienteRepository.findByCi(ciLimpio);
        if (existenteOpt.isPresent()) {
            // CA02: Mostrar el cliente existente y no crear otro
            return toDto(existenteOpt.get());
        }

        Cliente nuevo = new Cliente();
        nuevo.setCi(ciLimpio);
        nuevo.setNombres(dto.getNombres().trim());
        nuevo.setApellidos(dto.getApellidos().trim());
        nuevo.setTelefono(dto.getTelefono() != null ? dto.getTelefono().trim() : null);
        nuevo.setDireccion(dto.getDireccion() != null ? dto.getDireccion().trim() : null);
        nuevo.setIngresosMensuales(dto.getIngresosMensuales());
        nuevo.setFechaRegistro(LocalDate.now());

        Cliente guardado = clienteRepository.save(nuevo);

        // CA01 / RN12: Auditoría obligatoria
        auditoriaService.registrarEvento(
                username,
                "REGISTRAR_CLIENTE",
                "CLIENTE",
                guardado.getIdCliente().toString(),
                "EXITOSO",
                "Registro de nuevo cliente CI: " + guardado.getCi() + " - " + guardado.getNombres() + " " + guardado.getApellidos(),
                ip
        );

        return toDto(guardado);
    }

    /**
     * RF02 / CA03: Solo se editan campos autorizados (teléfono y dirección).
     * El CI no es editable. El valor anterior queda en AUDITORIA con usuario y fecha.
     */
    @Transactional
    public ClienteDto editarCliente(Long idCliente, EditarClienteDto dto, String username, String ip) {
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new BusinessException("Cliente no encontrado con ID: " + idCliente));

        String telAnterior = cliente.getTelefono();
        String dirAnterior = cliente.getDireccion();

        cliente.setTelefono(dto.getTelefono() != null ? dto.getTelefono().trim() : null);
        cliente.setDireccion(dto.getDireccion() != null ? dto.getDireccion().trim() : null);

        Cliente actualizado = clienteRepository.save(cliente);

        // CA03: Registrar en auditoría los valores anteriores
        auditoriaService.registrarEvento(
                username,
                "ACTUALIZAR_CLIENTE",
                "CLIENTE",
                actualizado.getIdCliente().toString(),
                "EXITOSO",
                "Modificación datos autorizados CI " + cliente.getCi() + ". Anterior:[Tel: " + telAnterior + ", Dir: " + dirAnterior +
                        "] -> Nuevo:[Tel: " + cliente.getTelefono() + ", Dir: " + cliente.getDireccion() + "]",
                ip
        );

        return toDto(actualizado);
    }

    @Transactional(readOnly = true)
    public List<ClienteDto> listarTodos() {
        return clienteRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClienteDto buscarPorCi(String ci) {
        return clienteRepository.findByCi(ci)
                .map(this::toDto)
                .orElseThrow(() -> new BusinessException("No se encontró ningún cliente con CI: " + ci));
    }

    @Transactional(readOnly = true)
    public ClienteDto buscarPorId(Long idCliente) {
        return clienteRepository.findById(idCliente)
                .map(this::toDto)
                .orElseThrow(() -> new BusinessException("Cliente no encontrado con ID: " + idCliente));
    }

    private ClienteDto toDto(Cliente entity) {
        return new ClienteDto(
                entity.getIdCliente(),
                entity.getCi(),
                entity.getNombres(),
                entity.getApellidos(),
                entity.getTelefono(),
                entity.getDireccion(),
                entity.getIngresosMensuales(),
                entity.getFechaRegistro()
        );
    }
}
