/**
 * Adaptador Simulador de Buró de Riesgo Externo (CU03 / RF04 / CA06 / CA07 / RNF09).
 * Permite simular respuestas normales, caídas de servicio (timeout 30s) y respuestas parciales.
 */
class BuroRiesgoService {
    constructor() {
        this.forzarFallo = false;
        this.forzarRespuestaParcial = false;
    }

    configurarModo(forzarFallo, forzarRespuestaParcial) {
        this.forzarFallo = Boolean(forzarFallo);
        this.forzarRespuestaParcial = Boolean(forzarRespuestaParcial);
    }

    consultarHistorial(ciCliente, montoSolicitadoBs) {
        const fechaActualIso = new Date().toISOString();

        if (this.forzarFallo) {
            return {
                referencia: null,
                estadoHistorial: null,
                score: null,
                deudasVigentes: 0,
                fechaConsulta: fechaActualIso,
                exitoso: false,
                parcial: false,
                mensaje: 'Error de conexión con el Buró de Riesgo externo (Timeout 30s excedido) (CA07).',
            };
        }

        if (this.forzarRespuestaParcial) {
            return {
                referencia: `REF-PAR-${ciCliente}`,
                estadoHistorial: 'DATOS_INCOMPLETOS',
                score: null,
                deudasVigentes: 0,
                fechaConsulta: fechaActualIso,
                exitoso: false,
                parcial: true,
                mensaje: 'El Buró de Riesgo devolvió datos parciales: score no disponible (CA07).',
            };
        }

        // Simulación estándar con datos del informe base (referencia R04571, score 780, SIN MORA)
        const referenciaBuro = (ciCliente && ciCliente.includes('4587231'))
            ? 'R04571'
            : `R${Math.floor(10000 + Math.random() * 90000)}`;

        return {
            referencia: referenciaBuro,
            estadoHistorial: 'SIN MORA',
            score: 780, // Del informe (D13 y P13)
            deudasVigentes: 0.00,
            fechaConsulta: fechaActualIso,
            exitoso: true,
            parcial: false,
            mensaje: 'Consulta ejecutada con éxito. Historial crediticio verificado (CA06).',
        };
    }
}

export const buroRiesgoService = new BuroRiesgoService();
