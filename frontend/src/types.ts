export type RolUsuario = 'OFICIAL' | 'ANALISTA' | 'JEFE' | 'CAJERO' | 'ADMINISTRADOR' | 'GERENTE';

export interface UsuarioSession {
    token: string;
    tipo: string;
    login: string;
    nombreCompleto: string;
    rol: RolUsuario;
    limiteAtribucion: number;
}

export interface UsuarioItem {
    idUsuario: number;
    nombreCompleto: string;
    login: string;
    rol: RolUsuario;
    limiteAtribucion: number;
    activo: boolean;
}

export interface AuditoriaItem {
    idAuditoria: number;
    fechaHora: string;
    ipOrigen: string;
    operacion: string;
    entidad: string;
    idEntidad: string;
    resultado: string;
    detalles: string;
}

export interface ClienteItem {
    idCliente: number;
    ci: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    ingresosMensuales: number;
    fechaRegistro: string;
}

export type TipoCredito = 'CONSUMO' | 'VEHICULAR' | 'VIVIENDA' | 'MICROCREDITO';
export type EstadoSolicitud = 'REGISTRADA' | 'EN_EVALUACION' | 'DERIVADA_A_GERENCIA' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudItem {
    idSolicitud: number;
    numeroSolicitud: string;
    fechaSolicitud: string;
    idCliente: number;
    ciCliente: string;
    emailCliente?: string;
    nombreCompletoCliente: string;
    montoSolicitado: number;
    plazoMeses: number;
    tipoCredito: TipoCredito;
    destino: string;
    estado: EstadoSolicitud;
    motivoRechazo?: string;
    documentacionCompleta: boolean;
    tieneEvaluacion: boolean;
    resultadoEvaluacion?: string;
    idCredito?: number;
    numeroCredito?: string;
}

export interface GarantiaItem {
    idGarantia: number;
    idSolicitud: number;
    idCredito?: number;
    tipo: string;
    descripcion: string;
    valorTasacion: number;
    coberturaPorcentaje: number;
    estado: string;
    documentosAdjuntos?: Array<{
        nombre: string;
        tipo: string;
        tamanio?: string;
        datos?: string;
    }>;
}

export interface ResultadoBuro {
    referencia?: string;
    estadoHistorial?: string;
    score?: number;
    deudasVigentes: number;
    fechaConsulta: string;
    exitoso: boolean;
    parcial: boolean;
    mensaje: string;
}

export interface EvaluacionItem {
    idEvaluacion?: number;
    idSolicitud: number;
    fechaEvaluacion?: string;
    ingresos: number;
    gastos: number;
    capacidadPago: number;
    ratioDti?: number;
    scoreBuro?: number;
    referenciaBuro?: string;
    nivelRiesgo?: 'BAJO' | 'MEDIO' | 'ALTO';
    resultado?: 'FAVORABLE' | 'DESFAVORABLE';
    dictamen?: string;
    cuotaEstimada?: number;
    cumpleCapacidadPago?: boolean;
}

export interface CreditoItem {
    idCredito: number;
    idSolicitud: number;
    numeroCredito: string;
    montoAprobado: number;
    tasaInteres: number;
    tasaMora: number;
    sistemaAmortizacion: string;
    plazoMeses: number;
    fechaDesembolso?: string;
    saldoCapital: number;
    estado: string;
    numeroContrato?: string;
    idContrato?: number;
    cantidadCuotas: number;
}

export interface CuotaItem {
    idCuota: number;
    numeroCuota: number;
    fechaVencimiento: string;
    capital: number;
    interesComp: number;
    interesMora: number;
    monto: number;
    saldoPendiente: number;
    diasMora: number;
    estado: string;
}

export interface ContratoItem {
    idContrato: number;
    idCredito: number;
    numeroContrato: string;
    fechaFirma?: string;
    notariaRegistro?: string;
    estado: string;
}
