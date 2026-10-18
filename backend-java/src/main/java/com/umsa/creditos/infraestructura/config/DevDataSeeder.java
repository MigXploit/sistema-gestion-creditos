package com.umsa.creditos.infraestructura.config;

import com.umsa.creditos.dominio.entidades.*;
import com.umsa.creditos.dominio.enums.*;
import com.umsa.creditos.dominio.repositorios.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Cargador de datos semilla para perfiles de desarrollo y pruebas.
 * Carga usuarios y datos de los Conjuntos A y B si la base de datos se encuentra vacía.
 */
@Component
public class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final SolicitudCreditoRepository solicitudCreditoRepository;
    private final EvaluacionCreditoRepository evaluacionCreditoRepository;
    private final CreditoRepository creditoRepository;
    private final GarantiaRepository garantiaRepository;
    private final ContratoRepository contratoRepository;
    private final CuotaRepository cuotaRepository;
    private final PagoRepository pagoRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    public DevDataSeeder(UsuarioRepository usuarioRepository,
                          ClienteRepository clienteRepository,
                          SolicitudCreditoRepository solicitudCreditoRepository,
                          EvaluacionCreditoRepository evaluacionCreditoRepository,
                          CreditoRepository creditoRepository,
                          GarantiaRepository garantiaRepository,
                          ContratoRepository contratoRepository,
                          CuotaRepository cuotaRepository,
                          PagoRepository pagoRepository,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.solicitudCreditoRepository = solicitudCreditoRepository;
        this.evaluacionCreditoRepository = evaluacionCreditoRepository;
        this.creditoRepository = creditoRepository;
        this.garantiaRepository = garantiaRepository;
        this.contratoRepository = contratoRepository;
        this.cuotaRepository = cuotaRepository;
        this.pagoRepository = pagoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("Carga de datos semilla deshabilitada por configuración.");
            return;
        }

        if (usuarioRepository.count() > 0) {
            log.info("Base de datos ya inicializada con usuarios ({} registros). Se omite seed.", usuarioRepository.count());
            return;
        }

        log.info("Iniciando carga de datos semilla de desarrollo...");
        String devHash = passwordEncoder.encode("Bancario2026!");

        // 1. USUARIOS (Sección 16.2 Matriz RBAC, D02, P01, P10, P13)
        Usuario uJefe = crearUsuario("Carlos Mendoza", "cmendoza", devHash, RolUsuario.JEFE, new BigDecimal("70000.00"));
        Usuario uOficial = crearUsuario("Ana Torrez", "atorrez", devHash, RolUsuario.OFICIAL, BigDecimal.ZERO);
        Usuario uAnalista = crearUsuario("Luis Rojas", "lrojas", devHash, RolUsuario.ANALISTA, BigDecimal.ZERO);
        Usuario uCajero = crearUsuario("Cajero de prueba", "cajero1", devHash, RolUsuario.CAJERO, BigDecimal.ZERO);
        Usuario uGerente = crearUsuario("Gerente de prueba", "gerente1", devHash, RolUsuario.GERENTE, BigDecimal.ZERO);
        Usuario uAdmin = crearUsuario("Administrador de prueba", "admin", devHash, RolUsuario.ADMINISTRADOR, BigDecimal.ZERO);

        usuarioRepository.save(uJefe);
        usuarioRepository.save(uOficial);
        usuarioRepository.save(uAnalista);
        usuarioRepository.save(uCajero);
        usuarioRepository.save(uGerente);
        usuarioRepository.save(uAdmin);

        // 2. CONJUNTO A (GUÍA - Para demo de CU07 y pantallas P02, P03, P10, P11, P12, P13)
        Cliente c1 = new Cliente(null, "4587231", "María Elena", "Quispe Mamani", "70012345", "Sopocachi, La Paz", new BigDecimal("6500.00"), LocalDate.of(2025, 9, 10));
        Cliente c2 = new Cliente(null, "3498210", "Juan Carlos", "Mamani", "71122334", "Miraflores, La Paz", new BigDecimal("4000.00"), LocalDate.of(2025, 9, 11));
        Cliente c3 = new Cliente(null, "5928104", "Rosa", "Condori", "72233445", "San Pedro, La Paz", new BigDecimal("3500.00"), LocalDate.of(2025, 9, 12));
        c1 = clienteRepository.save(c1);
        c2 = clienteRepository.save(c2);
        c3 = clienteRepository.save(c3);

        // Solicitud 101: María Elena Quispe (Con evaluación favorable y garantía)
        SolicitudCredito sol101 = new SolicitudCredito();
        sol101.setCliente(c1);
        sol101.setNumeroSolicitud("SOL-101");
        sol101.setFechaSolicitud(LocalDate.of(2025, 9, 15));
        sol101.setMontoSolicitado(new BigDecimal("30000.00"));
        sol101.setPlazoMeses(12);
        sol101.setTipoCredito(TipoCredito.CONSUMO);
        sol101.setDestino("Capital de trabajo");
        sol101.setEstado(EstadoSolicitud.EN_EVALUACION);
        sol101.setDocumentacionCompleta(true);
        sol101 = solicitudCreditoRepository.save(sol101);

        Garantia gar101 = new Garantia();
        gar101.setSolicitud(sol101);
        gar101.setTipo("Prendaria");
        gar101.setDescripcion("Vehículo 1234ABC");
        gar101.setValorTasacion(new BigDecimal("45000.00"));
        gar101.setCoberturaPorcentaje(new BigDecimal("150.00"));
        gar101.setEstado(EstadoGarantia.VIGENTE);
        garantiaRepository.save(gar101);

        EvaluacionCredito ev101 = new EvaluacionCredito();
        ev101.setSolicitud(sol101);
        ev101.setFechaEvaluacion(LocalDate.of(2025, 9, 17));
        ev101.setIngresos(new BigDecimal("6500.00"));
        ev101.setGastos(new BigDecimal("3200.00"));
        ev101.setCapacidadPago(new BigDecimal("3300.00"));
        ev101.setRatioDti(new BigDecimal("38.00"));
        ev101.setScoreBuro(750);
        ev101.setReferenciaBuro("R04571");
        ev101.setNivelRiesgo(NivelRiesgo.MEDIO);
        ev101.setResultado(ResultadoEvaluacion.FAVORABLE);
        ev101.setDictamen("Se recomienda aprobación conforme a capacidad de pago favorable y garantía suficiente.");
        evaluacionCreditoRepository.save(ev101);

        // Solicitudes 102 y 103 (Sin evaluación en el informe, quedan como pendientes)
        SolicitudCredito sol102 = new SolicitudCredito();
        sol102.setCliente(c2);
        sol102.setNumeroSolicitud("SOL-102");
        sol102.setFechaSolicitud(LocalDate.of(2025, 9, 16));
        sol102.setMontoSolicitado(new BigDecimal("12000.00"));
        sol102.setPlazoMeses(6);
        sol102.setTipoCredito(TipoCredito.CONSUMO);
        sol102.setDestino("Gastos personales");
        sol102.setEstado(EstadoSolicitud.EN_EVALUACION);
        sol102.setDocumentacionCompleta(true);
        solicitudCreditoRepository.save(sol102);

        SolicitudCredito sol103 = new SolicitudCredito();
        sol103.setCliente(c3);
        sol103.setNumeroSolicitud("SOL-103");
        sol103.setFechaSolicitud(LocalDate.of(2025, 9, 18));
        sol103.setMontoSolicitado(new BigDecimal("8500.00"));
        sol103.setPlazoMeses(12);
        sol103.setTipoCredito(TipoCredito.CONSUMO);
        sol103.setDestino("Mejora de vivienda");
        sol103.setEstado(EstadoSolicitud.EN_EVALUACION);
        sol103.setDocumentacionCompleta(true);
        solicitudCreditoRepository.save(sol103);

        // 3. CONJUNTO B (D13 - Para demo de pagos y mora)
        Cliente cCarlos = new Cliente(null, "4839201 LP", "Carlos", "Mamani Quispe", null, null, new BigDecimal("6500.00"), LocalDate.of(2026, 9, 1));
        cCarlos = clienteRepository.save(cCarlos);

        SolicitudCredito solD13 = new SolicitudCredito();
        solD13.setCliente(cCarlos);
        solD13.setNumeroSolicitud("SOL-2026-0501");
        solD13.setFechaSolicitud(LocalDate.of(2026, 9, 15));
        solD13.setMontoSolicitado(new BigDecimal("35000.00"));
        solD13.setPlazoMeses(24);
        solD13.setTipoCredito(TipoCredito.CONSUMO);
        solD13.setDestino("Compra de vehículo");
        solD13.setEstado(EstadoSolicitud.APROBADA);
        solD13.setDocumentacionCompleta(true);
        solD13 = solicitudCreditoRepository.save(solD13);

        EvaluacionCredito evD13 = new EvaluacionCredito();
        evD13.setSolicitud(solD13);
        evD13.setFechaEvaluacion(LocalDate.of(2026, 9, 20));
        evD13.setIngresos(new BigDecimal("6500.00"));
        evD13.setGastos(new BigDecimal("4300.00")); // DERIVADO: 6500 - 2200
        evD13.setCapacidadPago(new BigDecimal("2200.00"));
        evD13.setRatioDti(new BigDecimal("32.00")); // De la imagen D13 (contradicción texto: 25.38%)
        evD13.setScoreBuro(780); // De la imagen D13 (contradicción texto: 810)
        evD13.setReferenciaBuro("R-D13-780");
        evD13.setNivelRiesgo(NivelRiesgo.BAJO);
        evD13.setResultado(ResultadoEvaluacion.FAVORABLE);
        evD13.setDictamen("Evaluación favorable con bajo riesgo según buró score 780.");
        evaluacionCreditoRepository.save(evD13);

        Credito crD13 = new Credito();
        crD13.setSolicitud(solD13);
        crD13.setNumeroCredito("CRE-2026-089");
        crD13.setMontoAprobado(new BigDecimal("35000.00"));
        crD13.setTasaInteres(new BigDecimal("11.50"));
        crD13.setTasaMora(new BigDecimal("18.00")); // PENDIENTE / SUPUESTO
        crD13.setSistemaAmortizacion(SistemaAmort.FRANCES);
        crD13.setPlazoMeses(24);
        crD13.setFechaDesembolso(LocalDate.of(2026, 10, 1));
        crD13.setSaldoCapital(new BigDecimal("33600.00"));
        crD13.setInteresAcumulado(BigDecimal.ZERO);
        crD13.setMoraAcumulada(BigDecimal.ZERO);
        crD13.setEstado(EstadoCredito.VIGENTE);
        crD13 = creditoRepository.save(crD13);

        Garantia garD13 = new Garantia();
        garD13.setSolicitud(solD13);
        garD13.setCredito(crD13);
        garD13.setTipo("VEHICULAR");
        garD13.setDescripcion("Toyota Hilux 2019");
        garD13.setValorTasacion(new BigDecimal("50000.00"));
        garD13.setCoberturaPorcentaje(new BigDecimal("142.86"));
        garD13.setEstado(EstadoGarantia.CUSTODIA);
        garantiaRepository.save(garD13);

        Contrato ctrD13 = new Contrato();
        ctrD13.setCredito(crD13);
        ctrD13.setNumeroContrato("CTR-89-2026");
        ctrD13.setFechaFirma(LocalDate.of(2026, 10, 1));
        ctrD13.setNotariaRegistro("Notaría 45 LP");
        ctrD13.setEstado(EstadoContrato.FIRMADO);
        contratoRepository.save(ctrD13);

        Cuota ct1 = new Cuota();
        ct1.setCredito(crD13);
        ct1.setNumeroCuota(1);
        ct1.setFechaVencimiento(LocalDate.of(2026, 11, 1));
        ct1.setCapital(new BigDecimal("1400.00"));
        ct1.setInteresComp(new BigDecimal("250.00"));
        ct1.setInteresMora(new BigDecimal("50.00"));
        ct1.setMonto(new BigDecimal("1700.00"));
        ct1.setSaldoPendiente(BigDecimal.ZERO);
        ct1.setDiasMora(0);
        ct1.setEstado(EstadoCuota.PAGADA);
        ct1 = cuotaRepository.save(ct1);

        Cuota ct2 = new Cuota();
        ct2.setCredito(crD13);
        ct2.setNumeroCuota(2);
        ct2.setFechaVencimiento(LocalDate.of(2026, 12, 1));
        ct2.setCapital(new BigDecimal("1415.00"));
        ct2.setInteresComp(new BigDecimal("235.00"));
        ct2.setInteresMora(BigDecimal.ZERO);
        ct2.setMonto(new BigDecimal("1650.00"));
        ct2.setSaldoPendiente(new BigDecimal("1650.00"));
        ct2.setDiasMora(0);
        ct2.setEstado(EstadoCuota.PENDIENTE);
        cuotaRepository.save(ct2);

        Pago pg1 = new Pago();
        pg1.setCuota(ct1);
        pg1.setFechaPago(LocalDate.of(2026, 11, 5));
        pg1.setMonto(new BigDecimal("1700.00"));
        pg1.setMontoMora(new BigDecimal("50.00"));
        pg1.setMontoInteres(new BigDecimal("250.00"));
        pg1.setMontoCapital(new BigDecimal("1400.00"));
        pg1.setFormaPago(FormaPago.EFECTIVO);
        pg1.setNumeroRecibo("REC-4401");
        pagoRepository.save(pg1);

        log.info("Carga de datos semilla completada con éxito. Usuarios y registros de prueba listos.");
    }

    private Usuario crearUsuario(String nombre, String login, String hash, RolUsuario rol, BigDecimal limite) {
        Usuario u = new Usuario();
        u.setNombreCompleto(nombre);
        u.setLogin(login);
        u.setClaveHash(hash);
        u.setRol(rol);
        u.setLimiteAtribucion(limite);
        u.setActivo(true);
        u.setIntentosFallidos(0);
        return u;
    }
}
