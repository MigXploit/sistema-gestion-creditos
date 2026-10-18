package com.umsa.creditos.aplicacion.servicios;

import com.umsa.creditos.aplicacion.auditoria.AuditoriaService;
import com.umsa.creditos.aplicacion.dtos.GarantiaRegistroDto;
import com.umsa.creditos.aplicacion.dtos.GarantiaResponseDto;
import com.umsa.creditos.dominio.entidades.Garantia;
import com.umsa.creditos.dominio.entidades.SolicitudCredito;
import com.umsa.creditos.dominio.enums.EstadoGarantia;
import com.umsa.creditos.dominio.repositorios.GarantiaRepository;
import com.umsa.creditos.dominio.repositorios.SolicitudCreditoRepository;
import com.umsa.creditos.infraestructura.config.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para Registro y Control de Garantías.
 * RF07 – CU06.
 * Criterio: CA10.
 * Regla: RN12, RN13.
 */
@Service
public class GarantiaService {

    private final GarantiaRepository garantiaRepository;
    private final SolicitudCreditoRepository solicitudRepository;
    private final AuditoriaService auditoriaService;

    public GarantiaService(GarantiaRepository garantiaRepository,
                           SolicitudCreditoRepository solicitudRepository,
                           AuditoriaService auditoriaService) {
        this.garantiaRepository = garantiaRepository;
        this.solicitudRepository = solicitudRepository;
        this.auditoriaService = auditoriaService;
    }

    /**
     * CA10: Registra la garantía asociada a la solicitud en proceso.
     * Valida tipo, descripción, valor > 0.
     * Calcula cobertura = (valorTasacion / montoSolicitado) * 100.
     */
    @Transactional
    public GarantiaResponseDto registrarGarantia(GarantiaRegistroDto dto, String username, String ip) {
        if (dto.getIdSolicitud() == null) {
            throw new BusinessException("El ID de la solicitud es obligatorio para registrar la garantía (CA10).");
        }
        SolicitudCredito solicitud = solicitudRepository.findById(dto.getIdSolicitud())
                .orElseThrow(() -> new BusinessException("Solicitud no encontrada con ID: " + dto.getIdSolicitud()));

        if (dto.getTipo() == null || dto.getTipo().trim().isEmpty()) {
            throw new BusinessException("El tipo de garantía es obligatorio (CA10).");
        }
        if (dto.getDescripcion() == null || dto.getDescripcion().trim().isEmpty()) {
            throw new BusinessException("La descripción de la garantía es obligatoria (CA10).");
        }
        if (dto.getValorTasacion() == null || dto.getValorTasacion().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El valor de tasación de la garantía debe ser mayor a cero (CA10).");
        }

        // Calcular cobertura = (valorTasacion / montoSolicitado) * 100
        BigDecimal cobertura = BigDecimal.ZERO;
        if (solicitud.getMontoSolicitado() != null && solicitud.getMontoSolicitado().compareTo(BigDecimal.ZERO) > 0) {
            cobertura = dto.getValorTasacion()
                    .multiply(new BigDecimal("100"))
                    .divide(solicitud.getMontoSolicitado(), 2, RoundingMode.HALF_UP);
        }

        Garantia garantia = new Garantia();
        garantia.setSolicitud(solicitud);
        garantia.setTipo(dto.getTipo().trim());
        garantia.setDescripcion(dto.getDescripcion().trim());
        garantia.setValorTasacion(dto.getValorTasacion());
        garantia.setCoberturaPorcentaje(cobertura);
        garantia.setEstado(EstadoGarantia.VIGENTE);

        Garantia guardada = garantiaRepository.save(garantia);

        auditoriaService.registrarEvento(
                username,
                "REGISTRAR_GARANTIA",
                "GARANTIA",
                guardada.getIdGarantia().toString(),
                "EXITOSO",
                "Garantía tipo: " + guardada.getTipo() + " registrada para solicitud " + solicitud.getNumeroSolicitud() +
                        " por valor Bs " + guardada.getValorTasacion() + " (Cobertura: " + cobertura + "%)",
                ip
        );

        return toDto(guardada);
    }

    @Transactional(readOnly = true)
    public List<GarantiaResponseDto> listarPorSolicitud(Long idSolicitud) {
        return garantiaRepository.findBySolicitudIdSolicitud(idSolicitud)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GarantiaResponseDto> listarPorCredito(Long idCredito) {
        return garantiaRepository.findByCreditoIdCredito(idCredito)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private GarantiaResponseDto toDto(Garantia entity) {
        GarantiaResponseDto dto = new GarantiaResponseDto();
        dto.setIdGarantia(entity.getIdGarantia());
        if (entity.getSolicitud() != null) {
            dto.setIdSolicitud(entity.getSolicitud().getIdSolicitud());
        }
        if (entity.getCredito() != null) {
            dto.setIdCredito(entity.getCredito().getIdCredito());
        }
        dto.setTipo(entity.getTipo());
        dto.setDescripcion(entity.getDescripcion());
        dto.setValorTasacion(entity.getValorTasacion());
        dto.setCoberturaPorcentaje(entity.getCoberturaPorcentaje());
        dto.setEstado(entity.getEstado());
        return dto;
    }
}
