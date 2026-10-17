package com.umsa.creditos.aplicacion.servicios;

import com.umsa.creditos.dominio.entidades.Credito;
import com.umsa.creditos.dominio.entidades.Cuota;
import com.umsa.creditos.dominio.enums.EstadoCuota;
import com.umsa.creditos.infraestructura.config.BusinessException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Servicio de Generación de Cronogramas de Pagos (Sistema Francés).
 * RF11 – CU10.
 * Criterio: CA16.
 * Reglas: RN06, RN07.
 */
@Service
public class AmortizacionService {

    /**
     * CA16: Generación de cronograma bajo sistema de amortización francés.
     * Ejemplo guía: 30.000 Bs, 12 meses, 12% anual -> cuota 2.665,46 Bs.
     * Cuota 1: int 300,00, cap 2.365,46, saldo 27.634,54.
     * Cuota 2: int 276,35, cap 2.389,11, saldo 25.245,43.
     * Cuota 3: int 252,45, cap 2.413,01, saldo 22.832,42.
     * Ajuste de centavos en la última cuota garantizando suma de capital = monto aprobado.
     */
    public List<Cuota> generarCronogramaFrances(Credito credito, LocalDate fechaReferencia) {
        if (credito.getMontoAprobado() == null || credito.getMontoAprobado().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El monto del crédito debe ser mayor a cero para generar el cronograma.");
        }
        if (credito.getPlazoMeses() == null || credito.getPlazoMeses() <= 0) {
            throw new BusinessException("Parámetros inválidos: El plazo debe ser mayor a cero meses (CA16).");
        }
        if (credito.getTasaInteres() == null || credito.getTasaInteres().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Parámetros inválidos: La tasa de interés no puede ser negativa (CA16).");
        }

        BigDecimal p = credito.getMontoAprobado().setScale(2, RoundingMode.HALF_UP);
        int n = credito.getPlazoMeses();
        BigDecimal tasaAnual = credito.getTasaInteres();

        // Tasa periódica mensual i = (tasaAnual / 100) / 12
        BigDecimal tasaMensual = tasaAnual.divide(new BigDecimal("1200"), 10, RoundingMode.HALF_UP);

        // Cuota fija mensual = P * [ i / (1 - (1 + i)^(-n)) ]
        BigDecimal cuotaFija;
        if (tasaMensual.compareTo(BigDecimal.ZERO) == 0) {
            cuotaFija = p.divide(new BigDecimal(n), 2, RoundingMode.HALF_UP);
        } else {
            double r = tasaMensual.doubleValue();
            double factor = Math.pow(1.0 + r, n);
            double cuotaDouble = p.doubleValue() * (r * factor) / (factor - 1.0);
            cuotaFija = new BigDecimal(cuotaDouble, MathContext.DECIMAL64).setScale(2, RoundingMode.HALF_UP);
        }

        List<Cuota> cuotas = new ArrayList<>();
        BigDecimal saldoRestante = p;

        LocalDate baseDate = (fechaReferencia != null) ? fechaReferencia : LocalDate.now();

        for (int k = 1; k <= n; k++) {
            Cuota cuota = new Cuota();
            cuota.setCredito(credito);
            cuota.setNumeroCuota(k);

            // Regla provisional DEC-03: n meses después de la referencia, conservando el día del mes
            LocalDate fechaVencimiento = baseDate.plusMonths(k);
            cuota.setFechaVencimiento(fechaVencimiento);

            // Interés de la cuota = Saldo anterior * tasaMensual
            BigDecimal interes = saldoRestante.multiply(tasaMensual).setScale(2, RoundingMode.HALF_UP);

            BigDecimal capital;
            BigDecimal montoCuota;

            if (k == n) {
                // Última cuota: Ajuste de centavos. El capital amortizado es exactamente el saldo restante.
                capital = saldoRestante;
                montoCuota = capital.add(interes);
                saldoRestante = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            } else {
                capital = cuotaFija.subtract(interes).setScale(2, RoundingMode.HALF_UP);
                montoCuota = capital.add(interes);
                saldoRestante = saldoRestante.subtract(capital).setScale(2, RoundingMode.HALF_UP);
            }

            cuota.setCapital(capital);
            cuota.setInteresComp(interes);
            cuota.setInteresMora(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            cuota.setMonto(montoCuota);
            cuota.setSaldoPendiente(montoCuota);
            cuota.setDiasMora(0);
            cuota.setEstado(EstadoCuota.PENDIENTE);

            cuotas.add(cuota);
        }

        return cuotas;
    }
}
