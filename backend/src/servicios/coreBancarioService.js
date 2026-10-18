/**
 * Adaptador Simulador de Core Bancario Central (CU11 / RF12 / CA17 / CA18 / RNF09).
 * Se encarga de procesar la transferencia contable y liberación de fondos.
 */
class CoreBancarioService {
    constructor() {
        this.forzarFallo = false;
    }

    configurarModo(forzarFallo) {
        this.forzarFallo = Boolean(forzarFallo);
    }

    async ejecutarDesembolsoFondos(idCredito, numeroCredito, montoAprobadoBs, ciCliente) {
        if (this.forzarFallo) {
            return {
                exitoso: false,
                codigoTransaccion: null,
                mensaje: 'Core Bancario no disponible o rechazó la transacción de desembolso (CA18).',
            };
        }

        const codigoTransaccionCore = `CORE-TXN-${Date.now().toString().slice(-6)}`;

        return {
            exitoso: true,
            codigoTransaccion: codigoTransaccionCore,
            fechaDesembolso: new Date().toISOString().split('T')[0],
            mensaje: `Fondos de Bs ${montoAprobadoBs} transferidos exitosamente para crédito ${numeroCredito} a cuenta de cliente CI ${ciCliente}.`,
        };
    }
}

export const coreBancarioService = new CoreBancarioService();
