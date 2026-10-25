import { estaEnModoMemoria, baseDatosEnMemoria, obtenerPool } from '../config/baseDeDatos.js';

/**
 * Servicio de Informes y Estadísticas de Cartera de Créditos (CU14 / RF15 / CA23).
 * Destinado al Gerente de la Entidad Bancaria.
 */
export const reporteService = {
    async obtenerResumenCartera() {
        if (estaEnModoMemoria()) {
            const creditos = baseDatosEnMemoria.creditos;
            const solicitudes = baseDatosEnMemoria.solicitudes;
            const pagos = baseDatosEnMemoria.pagos;

            const totalCreditos = creditos.length;
            const montoTotalColocado = creditos.reduce((acc, c) => acc + parseFloat(c.monto_aprobado), 0);
            const saldoCarteraVigente = creditos.filter(c => c.estado === 'VIGENTE').reduce((acc, c) => acc + parseFloat(c.saldo_capital), 0);
            const saldoCarteraMora = creditos.filter(c => c.estado === 'EN_MORA').reduce((acc, c) => acc + parseFloat(c.saldo_capital), 0);
            const totalRecaudadoPagos = pagos.reduce((acc, p) => acc + parseFloat(p.monto), 0);

            const tasaMorosidad = (saldoCarteraVigente + saldoCarteraMora) > 0
                ? Math.round((saldoCarteraMora / (saldoCarteraVigente + saldoCarteraMora)) * 10000) / 100
                : 0;

            const conteoSolicitudesPorEstado = {
                REGISTRADA: solicitudes.filter(s => s.estado === 'REGISTRADA').length,
                EN_EVALUACION: solicitudes.filter(s => s.estado === 'EN_EVALUACION').length,
                DERIVADA_A_GERENCIA: solicitudes.filter(s => s.estado === 'DERIVADA_A_GERENCIA').length,
                APROBADA: solicitudes.filter(s => s.estado === 'APROBADA').length,
                RECHAZADA: solicitudes.filter(s => s.estado === 'RECHAZADA').length,
            };

            const detalleCreditos = creditos.map(cr => {
                const sol = solicitudes.find(s => s.id_solicitud === cr.id_solicitud) || {};
                const cli = baseDatosEnMemoria.clientes.find(c => c.id_cliente === sol.id_cliente) || {};
                return {
                    idCredito: cr.id_credito,
                    numeroCredito: cr.numero_credito,
                    cliente: cli.nombres ? `${cli.nombres} ${cli.apellidos}` : 'N/A',
                    ci: cli.ci || 'N/A',
                    montoAprobado: parseFloat(cr.monto_aprobado),
                    saldoCapital: parseFloat(cr.saldo_capital),
                    estado: cr.estado,
                    plazoMeses: cr.plazo_meses,
                    tasaInteres: parseFloat(cr.tasa_interes),
                };
            });

            return {
                indicadoresGenerales: {
                    totalCreditosEmitidos: totalCreditos,
                    montoTotalColocadoBs: Math.round(montoTotalColocado * 100) / 100,
                    saldoCarteraVigenteBs: Math.round(saldoCarteraVigente * 100) / 100,
                    saldoCarteraMoraBs: Math.round(saldoCarteraMora * 100) / 100,
                    totalRecaudadoPagosBs: Math.round(totalRecaudadoPagos * 100) / 100,
                    indiceMorosidadPorcentaje: tasaMorosidad,
                },
                solicitudesPorEstado: conteoSolicitudesPorEstado,
                carteraCreditos: detalleCreditos,
            };
        }

        const pool = obtenerPool();
        const [kpis] = await pool.query(`
            SELECT
                COUNT(*) AS totalCreditos,
                COALESCE(SUM(monto_aprobado), 0) AS montoTotalColocado,
                COALESCE(SUM(CASE WHEN estado = 'VIGENTE' THEN saldo_capital ELSE 0 END), 0) AS saldoCarteraVigente,
                COALESCE(SUM(CASE WHEN estado = 'EN_MORA' THEN saldo_capital ELSE 0 END), 0) AS saldoCarteraMora
            FROM credito
        `);

        const [pagosTotal] = await pool.query('SELECT COALESCE(SUM(monto), 0) AS totalRecaudado FROM pago');
        const [solicitudesConteo] = await pool.query(`
            SELECT estado, COUNT(*) AS cantidad FROM solicitud_credito GROUP BY estado
        `);

        const [cartera] = await pool.query(`
            SELECT cr.id_credito, cr.numero_credito, CONCAT(c.nombres, ' ', c.apellidos) AS cliente,
                   c.ci, cr.monto_aprobado, cr.saldo_capital, cr.estado, cr.plazo_meses, cr.tasa_interes
            FROM credito cr
            JOIN solicitud_credito s ON cr.id_solicitud = s.id_solicitud
            JOIN cliente c ON s.id_cliente = c.id_cliente
            ORDER BY cr.id_credito DESC
        `);

        const saldoVigente = parseFloat(kpis[0].saldoCarteraVigente);
        const saldoMora = parseFloat(kpis[0].saldoCarteraMora);
        const indiceMora = (saldoVigente + saldoMora) > 0
            ? Math.round((saldoMora / (saldoVigente + saldoMora)) * 10000) / 100
            : 0;

        const conteoEstados = { REGISTRADA: 0, EN_EVALUACION: 0, DERIVADA_A_GERENCIA: 0, APROBADA: 0, RECHAZADA: 0 };
        for (const row of solicitudesConteo) {
            conteoEstados[row.estado] = row.cantidad;
        }

        return {
            indicadoresGenerales: {
                totalCreditosEmitidos: kpis[0].totalCreditos,
                montoTotalColocadoBs: parseFloat(kpis[0].montoTotalColocado),
                saldoCarteraVigenteBs: saldoVigente,
                saldoCarteraMoraBs: saldoMora,
                totalRecaudadoPagosBs: parseFloat(pagosTotal[0].totalRecaudado),
                indiceMorosidadPorcentaje: indiceMora,
            },
            solicitudesPorEstado: conteoEstados,
            carteraCreditos: cartera.map(cr => ({
                idCredito: cr.id_credito,
                numeroCredito: cr.numero_credito,
                cliente: cr.cliente,
                ci: cr.ci,
                montoAprobado: parseFloat(cr.monto_aprobado),
                saldoCapital: parseFloat(cr.saldo_capital),
                estado: cr.estado,
                plazoMeses: cr.plazo_meses,
                tasaInteres: parseFloat(cr.tasa_interes),
            })),
        };
    }
};
