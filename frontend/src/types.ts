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
