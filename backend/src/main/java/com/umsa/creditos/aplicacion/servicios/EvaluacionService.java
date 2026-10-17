package com.umsa.creditos.aplicacion.servicios;

import com.umsa.creditos.aplicacion.auditoria.AuditoriaService;
import com.umsa.creditos.aplicacion.dtos.EvaluacionFinancieraDto;
import com.umsa.creditos.aplicacion.dtos.EvaluacionResponseDto;
import com.umsa.creditos.aplicacion.dtos.ResultadoBuroDto;
import com.umsa.creditos.aplicacion.puertos.BuroRiesgoPort;
import com.umsa.creditos.dominio.entidades.EvaluacionCredito;
import com.umsa.creditos.dominio.entidades.SolicitudCredito;
import com.umsa.creditos.dominio.enums.EstadoSolicitud;
import com.umsa.creditos.dominio.repositorios.EvaluacionCreditoRepository;
import com.umsa.creditos.dominio.repositorios.SolicitudCreditoRepository;
import com.umsa.creditos.infraestructura.config.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Optional;

/**
 * Servicio para Evaluación Financiera y de Riesgo.
 * RF04, RF05, RF06 – CU03, CU04, CU05.
 * Reglas: RN03, RN08, RN09, RN14, RNF09.
 * Criterios: CA06, CA07, CA08, CA09.
 */
@Service
public class EvaluacionService {

    private final EvaluacionCreditoRepository evaluacionRepository;
    private final SolicitudCreditoRepository solicitudRepository;
    private final BuroRiesgoPort buroRiesgoPort;
    private final AuditoriaService auditoriaService;

    public EvaluacionService(EvaluacionCreditoRepository evaluacionRepository,
                             SolicitudCreditoRepository solicitudRepository,
                             BuroRiesgoPort buroRiesgoPort,
                             AuditoriaService auditoriaService) {
        this.evaluacionRepository = evaluacionRepository;
        this.solicitudRepository = solicitudRepository;
        this.buroRiesgoPort = buroRiesgoPort;
        this.auditoriaService = auditoriaService;
    }

    /**
     * CU03 / RF04: Consultar historial crediticio en Buró externo.
     * Criterios CA06, CA07.
     */
    @Transactional
    public ResultadoBuroDto consultarHistorialBuro(Long idSolicitud, String username, String ip) {
        SolicitudCredito solicitud = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new BusinessException("Solicitud no encontrada con ID: " + idSolicitud));

        String ci = solicitud.getCliente().getCi();
        BigDecimal monto = solicitud.getMontoSolicitado();

        ResultadoBuroDto resultado = buroRiesgoPort.consultarHistorial(ci, monto);

        if (!resultado.isExitoso()) {
            // CA07: El servicio no responde o devuelve datos incompletos.
            // Informar, registrar el evento en auditoría, permitir reintentar y NO generar resultado por defecto.
            auditoriaService.registrarEvento(
                    username,
                    "CONSULTA_BURO_FALLIDA",
                    "SOLICITUD_CREDITO",
                    idSolicitud.toString(),
                    "FALLIDO",
                    "Fallo en consulta a Buró para CI " + ci + ": " + resultado.getMensaje(),
                    ip
            );
            return resultado;
        }

        // CA06: Guarda referencia y resultado
        auditoriaService.registrarEvento(
                username,
                "CONSULTA_BURO_EXITOSA",
                "SOLICITUD_CREDITO",
                idSolicitud.toString(),
                "EXITOSO",
                "Consulta Buró exitosa para CI " + ci + ". Ref: " + resultado.getReferencia() +
                        ", Historial: " + resultado.getEstadoHistorial() + ", Score: " + resultado.getScore(),
                ip
        );

        return resultado;
    }

    /**
     * CU04 / RF05 / CA08: Calcular capacidad de pago = ingresos - gastos.
     * Calcula DTI = (cuota estimada + deudas vigentes) / ingresos * 100.
     * Calcula criterio cuota <= 80% del excedente neto.
     */
    public EvaluacionResponseDto calcularCapacidadYRatios(Long idSolicitud, BigDecimal ingresos, BigDecimal gastos, BigDecimal deudasVigentes) {
        SolicitudCredito solicitud = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new BusinessException("Solicitud no encontrada con ID: " + idSolicitud));

        if (ingresos == null || ingresos.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Los ingresos deben ser mayores a cero (CA08).");
        }
        if (gastos == null || gastos.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Los gastos no pueden ser negativos (CA08).");
        }
        if (gastos.compareTo(ingresos) >= 0) {
            throw new BusinessException("Datos inconsistentes: los gastos superan o igualan a los ingresos declarados (CA08).");
        }

        // Capacidad de pago = ingresos - gastos (P13: 6500 - 3200 = 3300)
        BigDecimal capacidadPago = ingresos.subtract(gastos);

        // Cuota mensual estimada bajo sistema francés (12% anual por defecto, P05)
        BigDecimal cuotaEstimada = calcularCuotaEstimada(solicitud.getMontoSolicitado(), solicitud.getPlazoMeses(), new BigDecimal("12.00"));

        BigDecimal deudas = (deudasVigentes != null) ? deudasVigentes : BigDecimal.ZERO;

        // DTI = (cuota estimada + deudas vigentes) / ingresos * 100 (Sección 13.5 y D13)
        BigDecimal totalCargaMensual = cuotaEstimada.add(deudas);
        BigDecimal ratioDti = totalCargaMensual.multiply(new BigDecimal("100")).divide(ingresos, 2, RoundingMode.HALF_UP);

        // Criterio: cuota <= 80% del excedente neto (capacidadPago)
        BigDecimal ochentaPorcientoExcedente = capacidadPago.multiply(new BigDecimal("0.80"));
        boolean cumpleCapacidad = cuotaEstimada.compareTo(ochentaPorcientoExcedente) <= 0;

        EvaluacionResponseDto dto = new EvaluacionResponseDto();
        dto.setIdSolicitud(idSolicitud);
        dto.setIngresos(ingresos);
        dto.setGastos(gastos);
        dto.setCapacidadPago(capacidadPago);
        dto.setCuotaEstimada(cuotaEstimada);
        dto.setRatioDti(ratioDti);
        dto.setCumpleCapacidadPago(cumpleCapacidad);

        return dto;
    }

    /**
     * CU05 / RF06 / CA09: Emitir dictamen de evaluación.
     * Precondición (CA09): No se cierra la evaluación sin historial de buró ni capacidad de pago.
     */
    @Transactional
    public EvaluacionResponseDto emitirDictamen(EvaluacionFinancieraDto dto, String username, String ip) {
        if (dto.getIdSolicitud() == null) {
            throw new BusinessException("El ID de la solicitud es obligatorio.");
        }
        SolicitudCredito solicitud = solicitudRepository.findById(dto.getIdSolicitud())
                .orElseThrow(() -> new BusinessException("Solicitud no encontrada con ID: " + dto.getIdSolicitud()));

        // Precondición CA09: Validación de historial de buró
        if (dto.getReferenciaBuro() == null || dto.getReferenciaBuro().trim().isEmpty() || dto.getScoreBuro() == null) {
            throw new BusinessException("Precondición incumplida: No se puede emitir el dictamen sin consulta previa al Buró de Riesgo (CA09).");
        }

        // Precondición CA09: Validación de ingresos y gastos consistentes
        if (dto.getIngresos() == null || dto.getGastos() == null || dto.getIngresos().compareTo(dto.getGastos()) <= 0) {
            throw new BusinessException("Precondición incumplida: No se puede emitir el dictamen sin cálculo válido de capacidad de pago (CA09).");
        }

        if (dto.getNivelRiesgo() == null) {
            throw new BusinessException("El nivel de riesgo (BAJO, MEDIO, ALTO) es obligatorio para el dictamen.");
        }
        if (dto.getResultado() == null) {
            throw new BusinessException("El resultado de la evaluación (FAVORABLE / DESFAVORABLE) es obligatorio.");
        }
        if (dto.getDictamen() == null || dto.getDictamen().trim().isEmpty()) {
            throw new BusinessException("El texto del dictamen / recomendación es obligatorio.");
        }

        BigDecimal capacidadPago = dto.getIngresos().subtract(dto.getGastos());

        // Cuota mensual estimada y DTI
        BigDecimal cuotaEstimada = calcularCuotaEstimada(solicitud.getMontoSolicitado(), solicitud.getPlazoMeses(), new BigDecimal("12.00"));
        BigDecimal deudas = (dto.getDeudasVigentes() != null) ? dto.getDeudasVigentes() : BigDecimal.ZERO;
        BigDecimal ratioDti = cuotaEstimada.add(deudas).multiply(new BigDecimal("100")).divide(dto.getIngresos(), 2, RoundingMode.HALF_UP);

        // Buscar si ya existía evaluación para actualizarla o crearla
        Optional<EvaluacionCredito> existenteOpt = evaluacionRepository.findBySolicitudIdSolicitud(dto.getIdSolicitud());
        EvaluacionCredito evaluacion = existenteOpt.orElseGet(EvaluacionCredito::new);

        evaluacion.setSolicitud(solicitud);
        evaluacion.setFechaEvaluacion(LocalDate.now());
        evaluacion.setIngresos(dto.getIngresos());
        evaluacion.setGastos(dto.getGastos());
        evaluacion.setCapacidadPago(capacidadPago);
        evaluacion.setRatioDti(ratioDti);
        evaluacion.setScoreBuro(dto.getScoreBuro());
        evaluacion.setReferenciaBuro(dto.getReferenciaBuro());
        evaluacion.setNivelRiesgo(dto.getNivelRiesgo());
        evaluacion.setResultado(dto.getResultado());
        evaluacion.setDictamen(dto.getDictamen().trim());

        EvaluacionCredito guardada = evaluacionRepository.save(evaluacion);

        // Si la solicitud estaba en REGISTRADA, pasa a EN_EVALUACION
        if (solicitud.getEstado() == EstadoSolicitud.REGISTRADA) {
            solicitud.setEstado(EstadoSolicitud.EN_EVALUACION);
            solicitudRepository.save(solicitud);
        }

        auditoriaService.registrarEvento(
                username,
                "EMITIR_DICTAMEN_EVALUACION",
                "EVALUACION_CREDITO",
                guardada.getIdEvaluacion().toString(),
                "EXITOSO",
                "Dictamen emitido para solicitud " + solicitud.getNumeroSolicitud() + ": " + guardada.getResultado() +
                        " (Riesgo: " + guardada.getNivelRiesgo() + ", DTI: " + ratioDti + "%)",
                ip
        );

        EvaluacionResponseDto resp = toDto(guardada);
        resp.setCuotaEstimada(cuotaEstimada);
        resp.setCumpleCapacidadPago(cuotaEstimada.compareTo(capacidadPago.multiply(new BigDecimal("0.80"))) <= 0);
        return resp;
    }

    @Transactional(readOnly = true)
    public Optional<EvaluacionResponseDto> buscarPorSolicitud(Long idSolicitud) {
        return evaluacionRepository.findBySolicitudIdSolicitud(idSolicitud).map(this::toDto);
    }

    private BigDecimal calcularCuotaEstimada(BigDecimal monto, int plazo, BigDecimal tasaAnual) {
        if (monto == null || plazo <= 0 || tasaAnual == null) return BigDecimal.ZERO;
        double r = tasaAnual.doubleValue() / 1200.0;
        double p = monto.doubleValue();
        double cuota = p * (r * Math.pow(1.0 + r, plazo)) / (Math.pow(1.0 + r, plazo) - 1.0);
        return new BigDecimal(cuota, MathContext.DECIMAL64).setScale(2, RoundingMode.HALF_UP);
    }

    private EvaluacionResponseDto toDto(EvaluacionCredito entity) {
        EvaluacionResponseDto dto = new EvaluacionResponseDto();
        dto.setIdEvaluacion(entity.getIdEvaluacion());
        if (entity.getSolicitud() != null) {
            dto.setIdSolicitud(entity.getSolicitud().getIdSolicitud());
        }
        dto.setFechaEvaluacion(entity.getFechaEvaluacion());
        dto.setIngresos(entity.getIngresos());
        dto.setGastos(entity.getGastos());
        dto.setCapacidadPago(entity.getCapacidadPago());
        dto.setRatioDti(entity.getRatioDti());
        dto.setScoreBuro(entity.getScoreBuro());
        dto.setReferenciaBuro(entity.getReferenciaBuro());
        dto.setNivelRiesgo(entity.getNivelRiesgo());
        dto.setResultado(entity.getResultado());
        dto.setDictamen(entity.getDictamen());
        return dto;
    }
}
