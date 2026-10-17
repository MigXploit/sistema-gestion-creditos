package com.umsa.creditos;

import com.umsa.creditos.aplicacion.auditoria.AuditoriaService;
import com.umsa.creditos.aplicacion.dtos.*;
import com.umsa.creditos.aplicacion.puertos.BuroRiesgoPort;
import com.umsa.creditos.aplicacion.servicios.*;
import com.umsa.creditos.dominio.entidades.*;
import com.umsa.creditos.dominio.enums.*;
import com.umsa.creditos.dominio.repositorios.*;
import com.umsa.creditos.infraestructura.config.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2")
public class Bloque2CasosDeUsoIntegrationTest {

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private SolicitudService solicitudService;

    @Autowired
    private GarantiaService garantiaService;

    @Autowired
    private EvaluacionService evaluacionService;

    @Autowired
    private CreditoService creditoService;

    @Autowired
    private BuroRiesgoPort buroRiesgoPort;

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    @Autowired
    private SolicitudCreditoRepository solicitudRepository;

    @Autowired
    private CreditoRepository creditoRepository;

    @Autowired
    private ContratoRepository contratoRepository;

    @Autowired
    private CuotaRepository cuotaRepository;

    @Autowired
    private GarantiaRepository garantiaRepository;

    @Test
    @DisplayName("CA01: Registrar cliente con datos obligatorios, fecha_registro y auditoria")
    @Transactional
    void test_CA01_RegistrarClienteValidoYAuditoria() {
        ClienteDto dto = new ClienteDto();
        dto.setCi("9876543");
        dto.setNombres("Roberto");
        dto.setApellidos("Flores Silva");
        dto.setTelefono("71234567");
        dto.setDireccion("Calle Murillo 450");
        dto.setIngresosMensuales(new BigDecimal("7500.00"));

        ClienteDto guardado = clienteService.registrarCliente(dto, "atorrez", "127.0.0.1");

        assertNotNull(guardado.getIdCliente());
        assertEquals("9876543", guardado.getCi());
        assertEquals(LocalDate.now(), guardado.getFechaRegistro(), "Debe guardarse con la fecha actual");

        // Verificar auditoría
        List<Auditoria> logs = auditoriaRepository.findByEntidadAndIdEntidadOrderByFechaHoraDesc("CLIENTE", guardado.getIdCliente().toString());
        assertFalse(logs.isEmpty());
        assertEquals("REGISTRAR_CLIENTE", logs.get(0).getOperacion());
        assertEquals("EXITOSO", logs.get(0).getResultado());
    }

    @Test
    @DisplayName("CA02: CI duplicado devuelve cliente existente y no crea otro")
    @Transactional
    void test_CA02_RegistrarClienteDuplicado() {
        // En semillas ya existe María Elena Quispe Mamani con CI 4587231
        ClienteDto dto = new ClienteDto();
        dto.setCi("4587231");
        dto.setNombres("Otro Nombre");
        dto.setApellidos("Otro Apellido");
        dto.setIngresosMensuales(new BigDecimal("9000.00"));

        ClienteDto resultado = clienteService.registrarCliente(dto, "atorrez", "127.0.0.1");

        assertNotNull(resultado);
        assertEquals("4587231", resultado.getCi());
        assertEquals("María Elena", resultado.getNombres(), "Debe devolver el cliente existente sin modificarlo ni duplicarlo");
    }

    @Test
    @DisplayName("CA03: Editar cliente modifica solo campos autorizados (teléfono y dirección) y audita valores anteriores")
    @Transactional
    void test_CA03_EditarClienteCamposAutorizadosYAuditoria() {
        // Registrar cliente de prueba
        ClienteDto nuevo = new ClienteDto();
        nuevo.setCi("1122334");
        nuevo.setNombres("Carla");
        nuevo.setApellidos("Vargas Perez");
        nuevo.setTelefono("2244668");
        nuevo.setDireccion("Zona Sopocachi");
        nuevo.setIngresosMensuales(new BigDecimal("6000.00"));
        ClienteDto creado = clienteService.registrarCliente(nuevo, "atorrez", "127.0.0.1");

        // Editar únicamente teléfono y dirección
        EditarClienteDto editDto = new EditarClienteDto("77889900", "Zona Miraflores Calle 3");
        ClienteDto actualizado = clienteService.editarCliente(creado.getIdCliente(), editDto, "atorrez", "127.0.0.1");

        assertEquals("1122334", actualizado.getCi(), "El CI no debe modificarse");
        assertEquals("77889900", actualizado.getTelefono());
        assertEquals("Zona Miraflores Calle 3", actualizado.getDireccion());

        // Verificar que en auditoría quedaron registrados los valores anteriores
        List<Auditoria> logs = auditoriaRepository.findByEntidadAndIdEntidadOrderByFechaHoraDesc("CLIENTE", creado.getIdCliente().toString());
        assertTrue(logs.stream().anyMatch(l -> "ACTUALIZAR_CLIENTE".equals(l.getOperacion()) &&
                l.getDetalles().contains("2244668") && l.getDetalles().contains("Zona Sopocachi")));
    }

    @Test
    @DisplayName("CA04: Registrar solicitud con estado REGISTRADA, fecha actual y numero único")
    @Transactional
    void test_CA04_RegistrarSolicitudValida() {
        SolicitudRegistroDto dto = new SolicitudRegistroDto();
        dto.setCiCliente("4587231"); // María Elena Quispe Mamani
        dto.setMontoSolicitado(new BigDecimal("25000.00"));
        dto.setPlazoMeses(18);
        dto.setTipoCredito(TipoCredito.CONSUMO);
        dto.setDestino("Remodelación del hogar");
        dto.setDocumentacionCompleta(true);

        SolicitudResponseDto resp = solicitudService.registrarSolicitud(dto, "atorrez", "127.0.0.1");

        assertNotNull(resp.getIdSolicitud());
        assertNotNull(resp.getNumeroSolicitud());
        assertTrue(resp.getNumeroSolicitud().startsWith("SOL-"));
        assertEquals(LocalDate.now(), resp.getFechaSolicitud());
        assertEquals(EstadoSolicitud.REGISTRADA, resp.getEstado());
        assertTrue(resp.getDocumentacionCompleta());
    }

    @Test
    @DisplayName("CA05: RN03 Bloquea paso a evaluación si la documentación está incompleta")
    @Transactional
    void test_CA05_IniciarEvaluacionConDocumentacionIncompletaBloqueada() {
        // Registrar solicitud con documentación incompleta
        SolicitudRegistroDto dto = new SolicitudRegistroDto();
        dto.setCiCliente("4587231");
        dto.setMontoSolicitado(new BigDecimal("15000.00"));
        dto.setPlazoMeses(12);
        dto.setTipoCredito(TipoCredito.CONSUMO);
        dto.setDestino("Viaje familiar");
        dto.setDocumentacionCompleta(false); // Incompleta

        SolicitudResponseDto creada = solicitudService.registrarSolicitud(dto, "atorrez", "127.0.0.1");

        // Intentar iniciar evaluación debe fallar
        BusinessException ex = assertThrows(BusinessException.class, () ->
                solicitudService.iniciarEvaluacion(creada.getIdSolicitud(), "lrojas", "127.0.0.1")
        );
        assertTrue(ex.getMessage().contains("documentación del cliente se encuentra incompleta"));

        // Verificar que el estado sigue siendo REGISTRADA
        SolicitudResponseDto recargada = solicitudService.buscarPorId(creada.getIdSolicitud());
        assertEquals(EstadoSolicitud.REGISTRADA, recargada.getEstado());
    }

    @Test
    @DisplayName("CA06: Consulta a Buró externa exitosa guarda referencia, historial y score")
    void test_CA06_ConsultarHistorialBuroExitoso() {
        buroRiesgoPort.configurarModoSimulador(false, false);

        // Buscar solicitud 101 existente de las semillas (María Elena Quispe Mamani, CI 4587231)
        SolicitudCredito s101 = solicitudRepository.findByNumeroSolicitud("SOL-101").orElseThrow();

        ResultadoBuroDto res = evaluacionService.consultarHistorialBuro(s101.getIdSolicitud(), "lrojas", "127.0.0.1");

        assertTrue(res.isExitoso());
        assertEquals("R04571", res.getReferencia(), "Referencia del informe");
        assertEquals("SIN MORA", res.getEstadoHistorial());
        assertEquals(780, res.getScore());
    }

    @Test
    @DisplayName("CA07: Buró con fallo o respuesta parcial informa, audita y no genera resultado por defecto")
    void test_CA07_ConsultarHistorialBuroFalloYRespuestaParcial() {
        SolicitudCredito s101 = solicitudRepository.findByNumeroSolicitud("SOL-101").orElseThrow();

        // 1. Forzar fallo total
        buroRiesgoPort.configurarModoSimulador(true, false);
        ResultadoBuroDto fallo = evaluacionService.consultarHistorialBuro(s101.getIdSolicitud(), "lrojas", "127.0.0.1");
        assertFalse(fallo.isExitoso());
        assertNull(fallo.getReferencia());

        // 2. Forzar respuesta parcial
        buroRiesgoPort.configurarModoSimulador(false, true);
        ResultadoBuroDto parcial = evaluacionService.consultarHistorialBuro(s101.getIdSolicitud(), "lrojas", "127.0.0.1");
        assertFalse(parcial.isExitoso());
        assertTrue(parcial.isParcial());
        assertNull(parcial.getScore());

        // Restaurar modo normal
        buroRiesgoPort.configurarModoSimulador(false, false);
    }

    @Test
    @DisplayName("CA08: Capacidad de pago = ingresos - gastos y bloqueo si datos inconsistentes")
    void test_CA08_CalcularCapacidadPagoYRatios() {
        SolicitudCredito s101 = solicitudRepository.findByNumeroSolicitud("SOL-101").orElseThrow();

        // Datos del informe P13: 6500 - 3200 = 3300
        EvaluacionResponseDto resp = evaluacionService.calcularCapacidadYRatios(
                s101.getIdSolicitud(),
                new BigDecimal("6500.00"),
                new BigDecimal("3200.00"),
                BigDecimal.ZERO
        );

        assertEquals(new BigDecimal("3300.00"), resp.getCapacidadPago());
        assertNotNull(resp.getCuotaEstimada());
        assertNotNull(resp.getRatioDti());
        assertNotNull(resp.getCumpleCapacidadPago());
        assertFalse(resp.getCumpleCapacidadPago(), "Con 3300 de excedente (80%=2640), la cuota de 2665.46 excede ligeramente");

        // Con excedente mayor (ingresos 7000, gastos 3000 -> excedente 4000, 80%=3200 >= 2665.46)
        EvaluacionResponseDto respSuficiente = evaluacionService.calcularCapacidadYRatios(
                s101.getIdSolicitud(),
                new BigDecimal("7000.00"),
                new BigDecimal("3000.00"),
                BigDecimal.ZERO
        );
        assertTrue(respSuficiente.getCumpleCapacidadPago());

        // Datos inconsistentes (gastos >= ingresos)
        assertThrows(BusinessException.class, () ->
                evaluacionService.calcularCapacidadYRatios(
                        s101.getIdSolicitud(),
                        new BigDecimal("4000.00"),
                        new BigDecimal("4500.00"),
                        BigDecimal.ZERO
                )
        );
    }

    @Test
    @DisplayName("CA09: Emitir dictamen no se cierra sin historial ni capacidad previa")
    @Transactional
    void test_CA09_EmitirDictamenSinHistorialBloqueado() {
        SolicitudCredito s101 = solicitudRepository.findByNumeroSolicitud("SOL-101").orElseThrow();

        EvaluacionFinancieraDto dtoIncompleto = new EvaluacionFinancieraDto();
        dtoIncompleto.setIdSolicitud(s101.getIdSolicitud());
        dtoIncompleto.setIngresos(new BigDecimal("6500.00"));
        dtoIncompleto.setGastos(new BigDecimal("3200.00"));
        // Falta buró
        dtoIncompleto.setNivelRiesgo(NivelRiesgo.MEDIO);
        dtoIncompleto.setResultado(ResultadoEvaluacion.FAVORABLE);
        dtoIncompleto.setDictamen("Aprobado");

        assertThrows(BusinessException.class, () ->
                evaluacionService.emitirDictamen(dtoIncompleto, "lrojas", "127.0.0.1")
        );

        // Completar con todos los requisitos CA09
        dtoIncompleto.setReferenciaBuro("R04571");
        dtoIncompleto.setScoreBuro(780);

        EvaluacionResponseDto resultado = evaluacionService.emitirDictamen(dtoIncompleto, "lrojas", "127.0.0.1");
        assertNotNull(resultado.getIdEvaluacion());
        assertEquals(ResultadoEvaluacion.FAVORABLE, resultado.getResultado());
        assertEquals(NivelRiesgo.MEDIO, resultado.getNivelRiesgo());
    }

    @Test
    @DisplayName("CA10: Garantía asociada a solicitud con valor > 0 y cálculo de cobertura")
    @Transactional
    void test_CA10_RegistrarGarantiaConSolicitud() {
        SolicitudCredito s101 = solicitudRepository.findByNumeroSolicitud("SOL-101").orElseThrow();
        // s101 tiene monto 30.000 Bs

        GarantiaRegistroDto dto = new GarantiaRegistroDto();
        dto.setIdSolicitud(s101.getIdSolicitud());
        dto.setTipo("VEHICULAR");
        dto.setDescripcion("Vehículo particular Toyota Corolla mod 2020");
        dto.setValorTasacion(new BigDecimal("45000.00"));

        GarantiaResponseDto res = garantiaService.registrarGarantia(dto, "atorrez", "127.0.0.1");

        assertNotNull(res.getIdGarantia());
        assertEquals(EstadoGarantia.VIGENTE, res.getEstado());
        // Cobertura = 45.000 / 30.000 * 100 = 150.00 %
        assertEquals(new BigDecimal("150.00"), res.getCoberturaPorcentaje());
    }

    @Test
    @DisplayName("CA11: Bloquea aprobación si no hay evaluación previa favorable")
    @Transactional
    void test_CA11_AprobarSolicitudSinEvaluacionFavorableBloqueada() {
        // En semillas, solicitud 102 (SOL-102) está EN_EVALUACION sin evaluación
        SolicitudCredito s102 = solicitudRepository.findByNumeroSolicitud("SOL-102").orElseThrow();

        BusinessException ex = assertThrows(BusinessException.class, () ->
                creditoService.aprobarCredito(s102.getIdSolicitud(), new AprobacionDto(), "cmendoza", "127.0.0.1")
        );
        assertTrue(ex.getMessage().contains("No existe una evaluación registrada"));

        // El estado no debe cambiar
        SolicitudCredito recargada = solicitudRepository.findById(s102.getIdSolicitud()).orElseThrow();
        assertEquals(EstadoSolicitud.EN_EVALUACION, recargada.getEstado());
    }

    @Test
    @DisplayName("CA12: Aprobación transaccional aprueba solicitud, crea crédito, contrato, cronograma y vincula garantías")
    @Transactional
    void test_CA12_AprobacionTransaccionalGeneraCreditoContratoCronograma() {
        SolicitudCredito s101 = solicitudRepository.findByNumeroSolicitud("SOL-101").orElseThrow();

        // Aseguramos que tenga una garantía registrada
        Garantia g = new Garantia();
        g.setSolicitud(s101);
        g.setTipo("HIPOTECARIA");
        g.setDescripcion("Departamento Zona Sur");
        g.setValorTasacion(new BigDecimal("50000.00"));
        g.setCoberturaPorcentaje(new BigDecimal("166.67"));
        g.setEstado(EstadoGarantia.VIGENTE);
        garantiaRepository.save(g);

        // Aprobación ejecutada por el Jefe Carlos Mendoza (límite Bs 70.000)
        CreditoResponseDto credito = creditoService.aprobarCredito(s101.getIdSolicitud(), new AprobacionDto("Aprobado conforme informe"), "cmendoza", "127.0.0.1");

        assertNotNull(credito.getIdCredito());
        assertEquals(EstadoCredito.APROBADO, credito.getEstado());
        assertEquals(new BigDecimal("30000.00"), credito.getMontoAprobado());

        // Solicitud en estado APROBADA
        SolicitudCredito sActualizada = solicitudRepository.findById(s101.getIdSolicitud()).orElseThrow();
        assertEquals(EstadoSolicitud.APROBADA, sActualizada.getEstado());

        // Contrato generado en PENDIENTE_FIRMA (CA15)
        assertNotNull(credito.getNumeroContrato());
        Contrato contrato = contratoRepository.findByCreditoIdCredito(credito.getIdCredito()).orElseThrow();
        assertEquals(EstadoContrato.PENDIENTE_FIRMA, contrato.getEstado());

        // Cronograma generado con 12 cuotas (CA16)
        List<Cuota> cuotas = cuotaRepository.findByCreditoIdCreditoOrderByNumeroCuotaAsc(credito.getIdCredito());
        assertEquals(12, cuotas.size());

        // Garantías vinculadas al nuevo crédito
        List<Garantia> garantiasVinculadas = garantiaRepository.findByCreditoIdCredito(credito.getIdCredito());
        assertFalse(garantiasVinculadas.isEmpty());
    }

    @Test
    @DisplayName("CA13: Intento de aprobación que supera límite de atribución (Bs 70.000) no cambia datos y queda auditado")
    @Transactional
    void test_CA13_AprobacionExcedeLimiteJefeBloqueadaYAuditada() {
        // Crear solicitud por Bs 80.000 (> 70.000) con evaluación FAVORABLE
        Cliente cliente = clienteService.listarTodos().get(0).getIdCliente() != null ?
                solicitudRepository.findAll().get(0).getCliente() : null;

        SolicitudCredito solExcede = new SolicitudCredito();
        solExcede.setCliente(cliente);
        solExcede.setNumeroSolicitud("SOL-TEST-EXCEDE");
        solExcede.setFechaSolicitud(LocalDate.now());
        solExcede.setMontoSolicitado(new BigDecimal("80000.00"));
        solExcede.setPlazoMeses(36);
        solExcede.setTipoCredito(TipoCredito.CONSUMO);
        solExcede.setDestino("Inversión comercial");
        solExcede.setEstado(EstadoSolicitud.EN_EVALUACION);
        solExcede.setDocumentacionCompleta(true);
        solExcede = solicitudRepository.save(solExcede);

        // Crear evaluación favorable
        EvaluacionFinancieraDto evalDto = new EvaluacionFinancieraDto();
        evalDto.setIdSolicitud(solExcede.getIdSolicitud());
        evalDto.setIngresos(new BigDecimal("25000.00"));
        evalDto.setGastos(new BigDecimal("10000.00"));
        evalDto.setReferenciaBuro("R99999");
        evalDto.setScoreBuro(800);
        evalDto.setNivelRiesgo(NivelRiesgo.BAJO);
        evalDto.setResultado(ResultadoEvaluacion.FAVORABLE);
        evalDto.setDictamen("Apto");
        evaluacionService.emitirDictamen(evalDto, "lrojas", "127.0.0.1");

        // Intento de aprobación por el Jefe Carlos Mendoza (límite Bs 70.000)
        Long idSol = solExcede.getIdSolicitud();
        BusinessException ex = assertThrows(BusinessException.class, () ->
                creditoService.aprobarCredito(idSol, new AprobacionDto(), "cmendoza", "127.0.0.1")
        );
        assertTrue(ex.getMessage().contains("Monto fuera de atribución"));

        // Verificar que los datos no cambiaron (solicitud sigue EN_EVALUACION)
        SolicitudCredito recargada = solicitudRepository.findById(idSol).orElseThrow();
        assertEquals(EstadoSolicitud.EN_EVALUACION, recargada.getEstado());

        // Verificar que el intento fuera de atribución quedó auditado con resultado BLOQUEADO
        List<Auditoria> logs = auditoriaRepository.findByEntidadAndIdEntidadOrderByFechaHoraDesc("SOLICITUD_CREDITO", idSol.toString());
        assertTrue(logs.stream().anyMatch(l -> "INTENTO_APROBACION_EXCEDE_ATRIBUCION".equals(l.getOperacion()) &&
                "BLOQUEADO".equals(l.getResultado())));
    }

    @Test
    @DisplayName("CA14: Rechazar solicitud exige motivo obligatorio y cambia a RECHAZADA")
    @Transactional
    void test_CA14_RechazarSolicitudConMotivoObligatorio() {
        SolicitudCredito s102 = solicitudRepository.findByNumeroSolicitud("SOL-102").orElseThrow();

        // Sin motivo falla
        assertThrows(BusinessException.class, () ->
                creditoService.rechazarCredito(s102.getIdSolicitud(), new RechazoDto(""), "cmendoza", "127.0.0.1")
        );

        // Con motivo exitoso
        SolicitudResponseDto rechazada = creditoService.rechazarCredito(
                s102.getIdSolicitud(),
                new RechazoDto("Score en buró insuficiente y documentación financiera incompleta"),
                "cmendoza",
                "127.0.0.1"
        );

        assertEquals(EstadoSolicitud.RECHAZADA, rechazada.getEstado());
        assertEquals("Score en buró insuficiente y documentación financiera incompleta", rechazada.getMotivoRechazo());
    }

    @Test
    @DisplayName("CA15: Generación de contrato único por crédito es idempotente")
    @Transactional
    void test_CA15_GeneracionContratoUnicoIdempotente() {
        SolicitudCredito s101 = solicitudRepository.findByNumeroSolicitud("SOL-101").orElseThrow();
        CreditoResponseDto cr = creditoService.aprobarCredito(s101.getIdSolicitud(), new AprobacionDto(), "cmendoza", "127.0.0.1");

        Credito credito = creditoRepository.findById(cr.getIdCredito()).orElseThrow();

        // Llamar a generar contrato nuevamente
        Contrato c1 = creditoService.generarOActualizarContrato(credito);
        Contrato c2 = creditoService.generarOActualizarContrato(credito);

        assertEquals(c1.getIdContrato(), c2.getIdContrato(), "No debe duplicar contratos para el mismo crédito");
    }
}
