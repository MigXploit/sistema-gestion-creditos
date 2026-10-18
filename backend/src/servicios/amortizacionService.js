import { ReglaNegocioError } from '../middleware/manejadorErrores.js';

/**
 * Servicio de Generación de Cronogramas de Pagos bajo Sistema Francés (CU10 / RF11 / CA16).
 * Reglas: RN06, RN07.
 * Estándares: Variables y métodos definidos de manera intuitiva y matemática rigurosa.
 */
export const amortizacionService = {
    /**
     * Genera el cronograma de cuotas mensuales bajo el sistema de amortización francés.
     * Ejemplo guía: Bs 30.000, 12 meses, 12% anual -> cuota mensual fija = Bs 2.665,46.
     * Cuota 1: Interés Bs 300,00, Capital Bs 2.365,46, Saldo Bs 27.634,54.
     * Última cuota: Ajuste de centavos garantizando que la suma de capitales sea exactamente igual al monto aprobado.
     */
    generarCronogramaFrances(montoAprobadoBs, plazoMeses, tasaInteresAnualPorcentaje, fechaInicio) {
        const capitalInicial = parseFloat(montoAprobadoBs);
        const totalCuotas = parseInt(plazoMeses, 10);
        const tasaAnual = parseFloat(tasaInteresAnualPorcentaje);

        if (!capitalInicial || capitalInicial <= 0) {
            throw new ReglaNegocioError('El monto del crédito debe ser mayor a cero para generar el cronograma.');
        }
        if (!totalCuotas || totalCuotas <= 0) {
            throw new ReglaNegocioError('Parámetros inválidos: El plazo debe ser mayor a cero meses (CA16).');
        }
        if (tasaAnual < 0) {
            throw new ReglaNegocioError('Parámetros inválidos: La tasa de interés no puede ser negativa (CA16).');
        }

        // Tasa periódica mensual: i = (tasaAnual / 100) / 12
        const tasaInteresMensual = (tasaAnual / 100.0) / 12.0;

        // Cuota mensual fija: Cuota = P * [ i / (1 - (1 + i)^(-n)) ]
        let cuotaMensualFija = 0;
        if (tasaInteresMensual === 0) {
            cuotaMensualFija = capitalInicial / totalCuotas;
        } else {
            const factorPotencia = Math.pow(1.0 + tasaInteresMensual, totalCuotas);
            cuotaMensualFija = capitalInicial * (tasaInteresMensual * factorPotencia) / (factorPotencia - 1.0);
        }
        cuotaMensualFija = Math.round(cuotaMensualFija * 100) / 100;

        const listaCuotas = [];
        let saldoCapitalRestante = capitalInicial;
        const fechaBase = fechaInicio ? new Date(fechaInicio) : new Date();

        for (let numeroCuota = 1; numeroCuota <= totalCuotas; numeroCuota++) {
            // Regla DEC-03: fecha de vencimiento cada mes conservando el día
            const fechaVencimiento = new Date(fechaBase);
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + numeroCuota);

            // Interés compensatorio del periodo = Saldo anterior * tasa mensual
            let interesPeriodo = Math.round((saldoCapitalRestante * tasaInteresMensual) * 100) / 100;

            let capitalAmortizado = 0;
            let montoTotalCuota = 0;

            if (numeroCuota === totalCuotas) {
                // Última cuota: Ajuste de centavos (CA16).
                // El capital amortizado es exactamente el saldo deudor restante para extinguir la deuda a cero.
                capitalAmortizado = Math.round(saldoCapitalRestante * 100) / 100;
                montoTotalCuota = Math.round((capitalAmortizado + interesPeriodo) * 100) / 100;
                saldoCapitalRestante = 0.00;
            } else {
                capitalAmortizado = Math.round((cuotaMensualFija - interesPeriodo) * 100) / 100;
                montoTotalCuota = Math.round((capitalAmortizado + interesPeriodo) * 100) / 100;
                saldoCapitalRestante = Math.round((saldoCapitalRestante - capitalAmortizado) * 100) / 100;
            }

            listaCuotas.push({
                numeroCuota: numeroCuota,
                fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
                capital: capitalAmortizado,
                interesComp: interesPeriodo,
                interesMora: 0.00,
                monto: montoTotalCuota,
                saldoPendiente: montoTotalCuota,
                diasMora: 0,
                estado: 'PENDIENTE',
            });
        }

        return listaCuotas;
    }
};
