package com.umsa.creditos.aplicacion.servicios;

import com.umsa.creditos.aplicacion.auditoria.AuditoriaService;
import com.umsa.creditos.aplicacion.dtos.*;
import com.umsa.creditos.dominio.entidades.*;
import com.umsa.creditos.dominio.enums.*;
import com.umsa.creditos.dominio.repositorios.*;
import com.umsa.creditos.infraestructura.config.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio para Decisión, Formalización y Control de Créditos.
 * CU07 (Aprobar), CU08 (Rechazar), CU09 (Generar contrato), CU10 (Generar cronograma).
 * RF08, RF09, RF10, RF11.
 * Criterios: CA11, CA12, CA13, CA14, CA15, CA16.
 */
@Service
public class CreditoService {

    private final SolicitudCreditoRepository solicitudRepository;
    private final CreditoRepository creditoRepository;
    private final EvaluacionCreditoRepository evaluacionRepository;
    private final ContratoRepository contratoRepository;
    private final CuotaRepository cuotaRepository;
    private final GarantiaRepository garantiaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AmortizacionService amortizacionService;
    private final AuditoriaService auditoriaService;

    public CreditoService(SolicitudCreditoRepository solicitudRepository,
                          CreditoRepository creditoRepository,
                          EvaluacionCreditoRepository evaluacionRepository,
                          ContratoRepository contratoRepository,
                          CuotaRepository cuotaRepository,
                          GarantiaRepository garantiaRepository,
                          UsuarioRepository usuarioRepository,
                          AmortizacionService amortizacionService,
                          AuditoriaService auditoriaService) {
        this.solicitudRepository = solicitudRepository;
        this.creditoRepository = creditoRepository;
        this.evaluacionRepository = evaluacionRepository;
        this.contratoRepository = contratoRepository;
        this.cuotaRepository = cuotaRepository;
        this.garantiaRepository = garantiaRepository;
        this.usuarioRepository = usuarioRepository;
        this.amortizacionService = amortizacionService;
        this.auditoriaService = auditoriaService;
    }

    /**
     * CU07 / RF08: Aprobar crédito.
     * Criterios:
     * - CA11: Solo si la evaluación es FAVORABLE. Si no hay o es DESFAVORABLE -> bloquear, estado sin cambios.
     * - CA12: Transaccional: aprueba solicitud, crea crédito, genera contrato y cronograma, vincula garantías.
     * - CA13: Valida límite de atribución (Bs 70.000 para Jefe). Si excede -> bloquear, auditar intento, sugerir escalar.
     */
    @Transactional
    public CreditoResponseDto aprobarCredito(Long idSolicitud, AprobacionDto dto, String username, String ip) {
        SolicitudCredito solicitud = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new BusinessException("Solicitud no encontrada con ID: " + idSolicitud));

        if (solicitud.getEstado() != EstadoSolicitud.EN_EVALUACION) {
            throw new BusinessException("Solo se pueden aprobar solicitudes en estado EN_EVALUACION. Estado actual: " + solicitud.getEstado());
        }

        // CA11: Validación estricta de evaluación previa FAVORABLE
        Optional<EvaluacionCredito> evaluacionOpt = evaluacionRepository.findBySolicitudIdSolicitud(idSolicitud);
        if (evaluacionOpt.isEmpty()) {
            throw new BusinessException("Bloqueo de Aprobación: No existe una evaluación registrada para esta solicitud (CA11).");
        }
        EvaluacionCredito evaluacion = evaluacionOpt.get();
        if (evaluacion.getResultado() != ResultadoEvaluacion.FAVORABLE) {
            throw new BusinessException("Bloqueo de Aprobación: La evaluación crediticia tiene dictamen " + evaluacion.getResultado() +
                    ". Solo se permite aprobar solicitudes con evaluación FAVORABLE (CA11).");
        }

        // CA13: Validación de límite de atribución del Jefe (Bs 70.000)
        Usuario usuario = usuarioRepository.findByLogin(username)
                .orElseThrow(() -> new BusinessException("Usuario autenticado no encontrado: " + username));

        BigDecimal limiteAtribucion = usuario.getLimiteAtribucion();
        if (limiteAtribucion != null && limiteAtribucion.compareTo(BigDecimal.ZERO) > 0) {
            if (solicitud.getMontoSolicitado().compareTo(limiteAtribucion) > 0) {
                // CA13: Bloquear, no cambiar datos, auditar intento fallido
                auditoriaService.registrarEvento(
                        username,
                        "INTENTO_APROBACION_EXCEDE_ATRIBUCION",
                        "SOLICITUD_CREDITO",
                        idSolicitud.toString(),
                        "BLOQUEADO",
                        "Intento de aprobación bloqueado: Monto solicitado (Bs " + solicitud.getMontoSolicitado() +
                                ") excede el límite de atribución del Jefe (Bs " + limiteAtribucion + "). Requiere escalar a Comité de Créditos.",
                        ip
                );
                throw new BusinessException("Monto fuera de atribución: El monto solicitado de Bs " + solicitud.getMontoSolicitado() +
                        " supera su límite de aprobación de Bs " + limiteAtribucion + ". Debe derivar el trámite al Comité de Créditos.");
            }
        }

        // TRANSACCIONAL: Actualizar solicitud a APROBADA
        solicitud.setEstado(EstadoSolicitud.APROBADA);
        solicitudRepository.save(solicitud);

        // Crear Credito
        Credito credito = new Credito();
        credito.setSolicitud(solicitud);
        long countCreditos = creditoRepository.count() + 1;
        String numeroCredito = String.format("CR%d%05d", LocalDate.now().getYear(), countCreditos);
        credito.setNumeroCredito(numeroCredito);
        credito.setMontoAprobado(solicitud.getMontoSolicitado());
        credito.setTasaInteres(new BigDecimal("12.00")); // Valor de referencia P05 (configurable PENDIENTE)
        credito.setTasaMora(new BigDecimal("18.00"));    // Configurable PENDIENTE
        credito.setSistemaAmortizacion(SistemaAmort.FRANCES);
        credito.setPlazoMeses(solicitud.getPlazoMeses());
        credito.setSaldoCapital(solicitud.getMontoSolicitado());
        credito.setEstado(EstadoCredito.APROBADO);

        Credito creditoGuardado = creditoRepository.save(credito);

        // CU09 / CA15: Generar Contrato (idempotente)
        Contrato contrato = generarOActualizarContrato(creditoGuardado);

        // CU10 / CA16: Generar Cronograma de Pagos bajo sistema francés
        List<Cuota> cuotas = amortizacionService.generarCronogramaFrances(creditoGuardado, LocalDate.now());
        cuotaRepository.saveAll(cuotas);

        // Vincular garantías de la solicitud al nuevo crédito
        List<Garantia> garantias = garantiaRepository.findBySolicitudIdSolicitud(idSolicitud);
        for (Garantia g : garantias) {
            g.setCredito(creditoGuardado);
        }
        garantiaRepository.saveAll(garantias);

        // Auditar aprobación exitosa
        auditoriaService.registrarEvento(
                username,
                "APROBAR_CREDITO",
                "CREDITO",
                creditoGuardado.getIdCredito().toString(),
                "EXITOSO",
                "Crédito " + creditoGuardado.getNumeroCredito() + " aprobado exitosamente para solicitud " +
                        solicitud.getNumeroSolicitud() + " por Bs " + creditoGuardado.getMontoAprobado() +
                        ". Contrato " + contrato.getNumeroContrato() + " y cronograma generados.",
                ip
        );

        CreditoResponseDto resp = toCreditoDto(creditoGuardado);
        resp.setNumeroContrato(contrato.getNumeroContrato());
        resp.setIdContrato(contrato.getIdContrato());
        resp.setCantidadCuotas(cuotas.size());
        return resp;
    }

    /**
     * CU08 / RF09 / CA14: Rechazar crédito con motivo obligatorio.
     */
    @Transactional
    public SolicitudResponseDto rechazarCredito(Long idSolicitud, RechazoDto dto, String username, String ip) {
        SolicitudCredito solicitud = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new BusinessException("Solicitud no encontrada con ID: " + idSolicitud));

        if (solicitud.getEstado() != EstadoSolicitud.EN_EVALUACION && solicitud.getEstado() != EstadoSolicitud.REGISTRADA) {
            throw new BusinessException("Solo se pueden rechazar solicitudes en trámite. Estado actual: " + solicitud.getEstado());
        }

        if (dto.getMotivo() == null || dto.getMotivo().trim().isEmpty()) {
            throw new BusinessException("El motivo de rechazo es obligatorio para formalizar el rechazo (CA14).");
        }

        solicitud.setEstado(EstadoSolicitud.RECHAZADA);
        solicitud.setMotivoRechazo(dto.getMotivo().trim());
        SolicitudCredito guardada = solicitudRepository.save(solicitud);

        auditoriaService.registrarEvento(
                username,
                "RECHAZAR_CREDITO",
                "SOLICITUD_CREDITO",
                guardada.getIdSolicitud().toString(),
                "EXITOSO",
                "Solicitud " + guardada.getNumeroSolicitud() + " rechazada. Motivo: " + guardada.getMotivoRechazo(),
                ip
        );

        SolicitudResponseDto resp = new SolicitudResponseDto();
        resp.setIdSolicitud(guardada.getIdSolicitud());
        resp.setNumeroSolicitud(guardada.getNumeroSolicitud());
        resp.setEstado(guardada.getEstado());
        resp.setMotivoRechazo(guardada.getMotivoRechazo());
        return resp;
    }

    /**
     * CU09 / CA15: Generación de contrato único por crédito.
     */
    @Transactional
    public Contrato generarOActualizarContrato(Credito credito) {
        Optional<Contrato> existente = contratoRepository.findByCreditoIdCredito(credito.getIdCredito());
        if (existente.isPresent()) {
            return existente.get();
        }

        long countContratos = contratoRepository.count() + 1;
        String numeroContrato = String.format("CT%d%05d", LocalDate.now().getYear(), countContratos);

        Contrato nuevo = new Contrato();
        nuevo.setCredito(credito);
        nuevo.setNumeroContrato(numeroContrato);
        nuevo.setEstado(EstadoContrato.PENDIENTE_FIRMA);

        return contratoRepository.save(nuevo);
    }

    @Transactional(readOnly = true)
    public CreditoResponseDto buscarCreditoPorId(Long idCredito) {
        Credito credito = creditoRepository.findById(idCredito)
                .orElseThrow(() -> new BusinessException("Crédito no encontrado con ID: " + idCredito));
        return toCreditoDto(credito);
    }

    @Transactional(readOnly = true)
    public CreditoResponseDto buscarCreditoPorSolicitud(Long idSolicitud) {
        Credito credito = creditoRepository.findBySolicitudIdSolicitud(idSolicitud)
                .orElseThrow(() -> new BusinessException("No existe crédito formalizado para la solicitud ID: " + idSolicitud));
        return toCreditoDto(credito);
    }

    @Transactional(readOnly = true)
    public List<CuotaResponseDto> listarCronogramaPorCredito(Long idCredito) {
        return cuotaRepository.findByCreditoIdCreditoOrderByNumeroCuotaAsc(idCredito)
                .stream().map(this::toCuotaDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContratoResponseDto buscarContratoPorCredito(Long idCredito) {
        Contrato contrato = contratoRepository.findByCreditoIdCredito(idCredito)
                .orElseThrow(() -> new BusinessException("No existe contrato para el crédito ID: " + idCredito));
        return toContratoDto(contrato);
    }

    private CreditoResponseDto toCreditoDto(Credito entity) {
        CreditoResponseDto dto = new CreditoResponseDto();
        dto.setIdCredito(entity.getIdCredito());
        if (entity.getSolicitud() != null) {
            dto.setIdSolicitud(entity.getSolicitud().getIdSolicitud());
        }
        dto.setNumeroCredito(entity.getNumeroCredito());
        dto.setMontoAprobado(entity.getMontoAprobado());
        dto.setTasaInteres(entity.getTasaInteres());
        dto.setTasaMora(entity.getTasaMora());
        dto.setSistemaAmortizacion(entity.getSistemaAmortizacion());
        dto.setPlazoMeses(entity.getPlazoMeses());
        dto.setFechaDesembolso(entity.getFechaDesembolso());
        dto.setSaldoCapital(entity.getSaldoCapital());
        dto.setEstado(entity.getEstado());

        contratoRepository.findByCreditoIdCredito(entity.getIdCredito()).ifPresent(c -> {
            dto.setNumeroContrato(c.getNumeroContrato());
            dto.setIdContrato(c.getIdContrato());
        });

        List<Cuota> cuotas = cuotaRepository.findByCreditoIdCreditoOrderByNumeroCuotaAsc(entity.getIdCredito());
        dto.setCantidadCuotas(cuotas.size());

        return dto;
    }

    private CuotaResponseDto toCuotaDto(Cuota entity) {
        CuotaResponseDto dto = new CuotaResponseDto();
        dto.setIdCuota(entity.getIdCuota());
        dto.setNumeroCuota(entity.getNumeroCuota());
        dto.setFechaVencimiento(entity.getFechaVencimiento());
        dto.setCapital(entity.getCapital());
        dto.setInteresComp(entity.getInteresComp());
        dto.setInteresMora(entity.getInteresMora());
        dto.setMonto(entity.getMonto());
        dto.setSaldoPendiente(entity.getSaldoPendiente());
        dto.setDiasMora(entity.getDiasMora());
        dto.setEstado(entity.getEstado());
        return dto;
    }

    private ContratoResponseDto toContratoDto(Contrato entity) {
        ContratoResponseDto dto = new ContratoResponseDto();
        dto.setIdContrato(entity.getIdContrato());
        if (entity.getCredito() != null) {
            dto.setIdCredito(entity.getCredito().getIdCredito());
        }
        dto.setNumeroContrato(entity.getNumeroContrato());
        dto.setFechaFirma(entity.getFechaFirma());
        dto.setNotariaRegistro(entity.getNotariaRegistro());
        dto.setEstado(entity.getEstado());
        return dto;
    }
}
