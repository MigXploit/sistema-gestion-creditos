package com.umsa.creditos.aplicacion.servicios;

import com.umsa.creditos.dominio.entidades.Credito;
import com.umsa.creditos.dominio.entidades.Cuota;
import com.umsa.creditos.dominio.enums.EstadoCuota;
import com.umsa.creditos.infraestructura.config.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Pruebas unitarias para el Cronograma de Pagos bajo Sistema Francés (CU10 / RF11 / CA16).
 * Valida los datos y tablas de ejemplo exactos de la guía (Sección 20.8 y P05):
 * Monto: Bs 30.000, Plazo: 12 meses, Tasa: 12% anual.
 */
public class AmortizacionServiceTest {

    private AmortizacionService amortizacionService;

    @BeforeEach
    void setUp() {
        amortizacionService = new AmortizacionService();
    }

    @Test
    @DisplayName("CA16: Verificación exacta del cronograma francés con datos de la guía (30.000 Bs, 12m, 12%)")
    void test_CA16_CronogramaFrancesEjemploGuia() {
        Credito credito = new Credito();
        credito.setMontoAprobado(new BigDecimal("30000.00"));
        credito.setPlazoMeses(12);
        credito.setTasaInteres(new BigDecimal("12.00"));

        LocalDate fechaReferencia = LocalDate.of(2025, 4, 15);
        List<Cuota> cuotas = amortizacionService.generarCronogramaFrances(credito, fechaReferencia);

        assertNotNull(cuotas);
        assertEquals(12, cuotas.size(), "Deben generarse exactamente 12 cuotas");

        // Cuota fija mensual esperada según informe base: Bs 2.665,46
        BigDecimal cuotaEsperada = new BigDecimal("2665.46");

        // Cuota 1: Interés 300,00, Capital 2.365,46, Saldo 27.634,54
        Cuota c1 = cuotas.get(0);
        assertEquals(1, c1.getNumeroCuota());
        assertEquals(new BigDecimal("300.00"), c1.getInteresComp());
        assertEquals(new BigDecimal("2365.46"), c1.getCapital());
        assertEquals(cuotaEsperada, c1.getMonto());
        assertEquals(LocalDate.of(2025, 5, 15), c1.getFechaVencimiento(), "El vencimiento debe conservar el día 15");
        assertEquals(EstadoCuota.PENDIENTE, c1.getEstado());

        // Cuota 2: Interés 276,35, Capital 2.389,11, Saldo 25.245,43
        Cuota c2 = cuotas.get(1);
        assertEquals(2, c2.getNumeroCuota());
        assertEquals(new BigDecimal("276.35"), c2.getInteresComp());
        assertEquals(new BigDecimal("2389.11"), c2.getCapital());
        assertEquals(cuotaEsperada, c2.getMonto());
        assertEquals(LocalDate.of(2025, 6, 15), c2.getFechaVencimiento());

        // Cuota 3: Interés 252,45, Capital 2.413,01, Saldo 22.832,42
        Cuota c3 = cuotas.get(2);
        assertEquals(3, c3.getNumeroCuota());
        assertEquals(new BigDecimal("252.45"), c3.getInteresComp());
        assertEquals(new BigDecimal("2413.01"), c3.getCapital());
        assertEquals(cuotaEsperada, c3.getMonto());
        assertEquals(LocalDate.of(2025, 7, 15), c3.getFechaVencimiento());

        // Verificación de suma total de capital amortizado == 30.000,00 Bs
        BigDecimal sumaCapital = cuotas.stream()
                .map(Cuota::getCapital)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(new BigDecimal("30000.00"), sumaCapital, "La suma exacta de las amortizaciones de capital debe ser 30.000,00 Bs");

        // Verificación de ajuste de centavos en la cuota 12
        Cuota c12 = cuotas.get(11);
        assertEquals(12, c12.getNumeroCuota());
        assertEquals(LocalDate.of(2026, 4, 15), c12.getFechaVencimiento());
        assertTrue(c12.getCapital().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(c12.getInteresComp().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("CA16: Parámetros inválidos (plazo <= 0 o tasa < 0) impiden generar cronograma")
    void test_CA16_ParametrosInvalidosLanzanExcepcion() {
        Credito creditoPlazoInvalido = new Credito();
        creditoPlazoInvalido.setMontoAprobado(new BigDecimal("10000.00"));
        creditoPlazoInvalido.setPlazoMeses(0);
        creditoPlazoInvalido.setTasaInteres(new BigDecimal("12.00"));

        assertThrows(BusinessException.class, () ->
                amortizacionService.generarCronogramaFrances(creditoPlazoInvalido, LocalDate.now())
        );

        Credito creditoTasaNegativa = new Credito();
        creditoTasaNegativa.setMontoAprobado(new BigDecimal("10000.00"));
        creditoTasaNegativa.setPlazoMeses(12);
        creditoTasaNegativa.setTasaInteres(new BigDecimal("-5.00"));

        assertThrows(BusinessException.class, () ->
                amortizacionService.generarCronogramaFrances(creditoTasaNegativa, LocalDate.now())
        );
    }
}
