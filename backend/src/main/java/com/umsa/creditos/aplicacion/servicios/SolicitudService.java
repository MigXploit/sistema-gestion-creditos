package com.umsa.creditos.aplicacion.servicios;

import com.umsa.creditos.aplicacion.auditoria.AuditoriaService;
import com.umsa.creditos.aplicacion.dtos.SolicitudRegistroDto;
import com.umsa.creditos.aplicacion.dtos.SolicitudResponseDto;
import com.umsa.creditos.dominio.entidades.Cliente;
import com.umsa.creditos.dominio.entidades.SolicitudCredito;
import com.umsa.creditos.dominio.enums.EstadoSolicitud;
import com.umsa.creditos.dominio.enums.TipoCredito;
import com.umsa.creditos.dominio.repositorios.ClienteRepository;
import com.umsa.creditos.dominio.repositorios.CreditoRepository;
import com.umsa.creditos.dominio.repositorios.SolicitudCreditoRepository;
import com.umsa.creditos.infraestructura.config.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para Solicitudes de Crédito.
 * RF03 – CU02.
 * Reglas: RN01, RN02, RN03, RN04, RN12.
 * Criterios: CA04, CA05.
 */
@Service
public class SolicitudService {

    private final SolicitudCreditoRepository solicitudRepository;
    private final ClienteRepository clienteRepository;
    private final CreditoRepository creditoRepository;
    private final AuditoriaService auditoriaService;

    public SolicitudService(SolicitudCreditoRepository solicitudRepository,
                            ClienteRepository clienteRepository,
                            CreditoRepository creditoRepository,
                            AuditoriaService auditoriaService) {
        this.solicitudRepository = solicitudRepository;
        this.clienteRepository = clienteRepository;
        this.creditoRepository = creditoRepository;
        this.auditoriaService = auditoriaService;
    }

    /**
     * CU02 / CA04: Busca cliente por CI, valida monto > 0, plazo > 0, destino, límites (RN04).
     * Estado inicial: REGISTRADA con fecha actual y numero_solicitud único.
     */
    @Transactional
    public SolicitudResponseDto registrarSolicitud(SolicitudRegistroDto dto, String username, String ip) {
        if (dto.getCiCliente() == null || dto.getCiCliente().trim().isEmpty()) {
            throw new BusinessException("El CI del cliente solicitante es obligatorio.");
        }
        Cliente cliente = clienteRepository.findByCi(dto.getCiCliente().trim())
                .orElseThrow(() -> new BusinessException("No existe un cliente registrado con el CI: " + dto.getCiCliente()));

        if (dto.getMontoSolicitado() == null || dto.getMontoSolicitado().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El monto solicitado debe ser mayor a cero.");
        }
        if (dto.getPlazoMeses() == null || dto.getPlazoMeses() <= 0) {
            throw new BusinessException("El plazo en meses debe ser mayor a cero.");
        }
        if (dto.getDestino() == null || dto.getDestino().trim().isEmpty()) {
            throw new BusinessException("El destino del crédito es obligatorio.");
        }
        if (dto.getTipoCredito() == null) {
            throw new BusinessException("El tipo de crédito es obligatorio.");
        }

        // RN04: Validar límites de monto y plazo por producto (Parámetros configurables PENDIENTE)
        validarLimitesProducto(dto.getTipoCredito(), dto.getMontoSolicitado(), dto.getPlazoMeses());

        // Generar número de solicitud único (formato SOL-YYYY-XXXXX)
        long count = solicitudRepository.count() + 1;
        String numeroSolicitud = String.format("SOL-%d-%05d", LocalDate.now().getYear(), count);

        SolicitudCredito solicitud = new SolicitudCredito();
        solicitud.setCliente(cliente);
        solicitud.setNumeroSolicitud(numeroSolicitud);
        solicitud.setFechaSolicitud(LocalDate.now());
        solicitud.setMontoSolicitado(dto.getMontoSolicitado());
        solicitud.setPlazoMeses(dto.getPlazoMeses());
        solicitud.setTipoCredito(dto.getTipoCredito());
        solicitud.setDestino(dto.getDestino().trim());
        solicitud.setEstado(EstadoSolicitud.REGISTRADA);
        solicitud.setDocumentacionCompleta(Boolean.TRUE.equals(dto.getDocumentacionCompleta()));

        SolicitudCredito guardada = solicitudRepository.save(solicitud);

        // RN12 / CA04: Auditoría
        auditoriaService.registrarEvento(
                username,
                "REGISTRAR_SOLICITUD",
                "SOLICITUD_CREDITO",
                guardada.getIdSolicitud().toString(),
                "EXITOSO",
                "Registro de solicitud " + guardada.getNumeroSolicitud() + " para cliente CI: " + cliente.getCi() +
                        " por Bs " + guardada.getMontoSolicitado() + " a " + guardada.getPlazoMeses() + " meses",
                ip
        );

        return toDto(guardada);
    }

    /**
     * RN03: Una solicitud solo pasa a EN_EVALUACION si su documentación está completa (CA05).
     * Acción "Evaluar" ejecutada por el Analista.
     */
    @Transactional
    public SolicitudResponseDto iniciarEvaluacion(Long idSolicitud, String username, String ip) {
        SolicitudCredito solicitud = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new BusinessException("Solicitud no encontrada con ID: " + idSolicitud));

        if (solicitud.getEstado() != EstadoSolicitud.REGISTRADA) {
            throw new BusinessException("Solo se pueden pasar a evaluación solicitudes en estado REGISTRADA. Estado actual: " + solicitud.getEstado());
        }

        // RN03 / CA05: Validar documentación completa
        if (!Boolean.TRUE.equals(solicitud.getDocumentacionCompleta())) {
            throw new BusinessException("No se puede iniciar la evaluación: la documentación del cliente se encuentra incompleta (RN03 / CA05).");
        }

        solicitud.setEstado(EstadoSolicitud.EN_EVALUACION);
        SolicitudCredito actualizada = solicitudRepository.save(solicitud);

        auditoriaService.registrarEvento(
                username,
                "INICIAR_EVALUACION",
                "SOLICITUD_CREDITO",
                actualizada.getIdSolicitud().toString(),
                "EXITOSO",
                "Solicitud " + actualizada.getNumeroSolicitud() + " pasa a estado EN_EVALUACION",
                ip
        );

        return toDto(actualizada);
    }

    @Transactional(readOnly = true)
    public List<SolicitudResponseDto> listarTodas() {
        return solicitudRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SolicitudResponseDto> listarPorEstado(EstadoSolicitud estado) {
        return solicitudRepository.findByEstado(estado).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SolicitudResponseDto buscarPorId(Long idSolicitud) {
        return solicitudRepository.findById(idSolicitud)
                .map(this::toDto)
                .orElseThrow(() -> new BusinessException("Solicitud no encontrada con ID: " + idSolicitud));
    }

    /**
     * RN04: Límites de producto configurables (Marcados PENDIENTE en DECISIONES_PENDIENTES.md).
     */
    private void validarLimitesProducto(TipoCredito tipo, BigDecimal monto, int plazo) {
        switch (tipo) {
            case CONSUMO -> {
                // Min 1.000, Max 70.000, Plazo 6 a 60 meses (PENDIENTE)
                if (monto.compareTo(new BigDecimal("1000")) < 0 || monto.compareTo(new BigDecimal("70000")) > 0) {
                    throw new BusinessException("Crédito de Consumo: El monto debe estar entre Bs 1.000 y Bs 70.000 (RN04).");
                }
                if (plazo < 6 || plazo > 60) {
                    throw new BusinessException("Crédito de Consumo: El plazo debe estar entre 6 y 60 meses (RN04).");
                }
            }
            case VEHICULAR -> {
                // Min 5.000, Max 200.000, Plazo 12 a 72 meses (PENDIENTE)
                if (monto.compareTo(new BigDecimal("5000")) < 0 || monto.compareTo(new BigDecimal("200000")) > 0) {
                    throw new BusinessException("Crédito Vehicular: El monto debe estar entre Bs 5.000 y Bs 200.000 (RN04).");
                }
                if (plazo < 12 || plazo > 72) {
                    throw new BusinessException("Crédito Vehicular: El plazo debe estar entre 12 y 72 meses (RN04).");
                }
            }
            case VIVIENDA -> {
                // Min 20.000, Max 500.000, Plazo 36 a 240 meses (PENDIENTE)
                if (monto.compareTo(new BigDecimal("20000")) < 0 || monto.compareTo(new BigDecimal("500000")) > 0) {
                    throw new BusinessException("Crédito de Vivienda: El monto debe estar entre Bs 20.000 y Bs 500.000 (RN04).");
                }
                if (plazo < 36 || plazo > 240) {
                    throw new BusinessException("Crédito de Vivienda: El plazo debe estar entre 36 y 240 meses (RN04).");
                }
            }
            case MICROCREDITO -> {
                // Min 500, Max 50.000, Plazo 3 a 36 meses (PENDIENTE)
                if (monto.compareTo(new BigDecimal("500")) < 0 || monto.compareTo(new BigDecimal("50000")) > 0) {
                    throw new BusinessException("Microcrédito: El monto debe estar entre Bs 500 y Bs 50.000 (RN04).");
                }
                if (plazo < 3 || plazo > 36) {
                    throw new BusinessException("Microcrédito: El plazo debe estar entre 3 y 36 meses (RN04).");
                }
            }
        }
    }

    private SolicitudResponseDto toDto(SolicitudCredito entity) {
        SolicitudResponseDto dto = new SolicitudResponseDto();
        dto.setIdSolicitud(entity.getIdSolicitud());
        dto.setNumeroSolicitud(entity.getNumeroSolicitud());
        dto.setFechaSolicitud(entity.getFechaSolicitud());
        if (entity.getCliente() != null) {
            dto.setIdCliente(entity.getCliente().getIdCliente());
            dto.setCiCliente(entity.getCliente().getCi());
            dto.setNombreCompletoCliente(entity.getCliente().getNombres() + " " + entity.getCliente().getApellidos());
        }
        dto.setMontoSolicitado(entity.getMontoSolicitado());
        dto.setPlazoMeses(entity.getPlazoMeses());
        dto.setTipoCredito(entity.getTipoCredito());
        dto.setDestino(entity.getDestino());
        dto.setEstado(entity.getEstado());
        dto.setMotivoRechazo(entity.getMotivoRechazo());
        dto.setDocumentacionCompleta(entity.getDocumentacionCompleta());
        dto.setTieneEvaluacion(entity.getEvaluacion() != null);
        if (entity.getEvaluacion() != null && entity.getEvaluacion().getResultado() != null) {
            dto.setResultadoEvaluacion(entity.getEvaluacion().getResultado().name());
        }

        creditoRepository.findBySolicitudIdSolicitud(entity.getIdSolicitud()).ifPresent(credito -> {
            dto.setIdCredito(credito.getIdCredito());
            dto.setNumeroCredito(credito.getNumeroCredito());
        });

        return dto;
    }
}
