const API_BASE = 'http://localhost:8080/api';

export const api = {
    getToken(): string | null {
        return localStorage.getItem('token');
    },

    setSession(token: string, user: any) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('login_time', Date.now().toString());
    },

    clearSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('login_time');
    },

    getUser(): any | null {
        const data = localStorage.getItem('user');
        return data ? JSON.parse(data) : null;
    },

    async request(path: string, options: RequestInit = {}): Promise<any> {
        const token = this.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers,
        });

        if (res.status === 401) {
            this.clearSession();
            window.location.reload();
            throw new Error('Sesión expirada o no autorizada');
        }

        const text = await res.text();
        let json = null;
        try {
            json = text ? JSON.parse(text) : {};
        } catch {
            json = { text };
        }

        if (!res.ok) {
            throw new Error(json.message || json.mensaje || json.error || 'Error en la operación');
        }

        return json;
    },

    // --- AUTENTICACIÓN & GESTIÓN DE USUARIOS ---
    login(login: string, password: string) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ login, password }),
        });
    },

    getUsuarios() {
        return this.request('/usuarios');
    },

    crearUsuario(data: any) {
        return this.request('/usuarios', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    cambiarEstadoUsuario(id: number, activo: boolean) {
        return this.request(`/usuarios/${id}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ activo }),
        });
    },

    getAuditoria() {
        return this.request('/auditoria');
    },

    // --- CLIENTES (CU01 / RF01 / RF02 / P10) ---
    getClientes() {
        return this.request('/clientes');
    },

    getClienteByCi(ci: string) {
        return this.request(`/clientes/ci/${ci}`);
    },

    crearCliente(data: any) {
        return this.request('/clientes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    editarCliente(id: number, data: { telefono?: string; direccion?: string }) {
        return this.request(`/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // --- SOLICITUDES DE CRÉDITO (CU02 / RF03 / P11 / P02) ---
    getSolicitudes(estado?: string) {
        const query = estado ? `?estado=${estado}` : '';
        return this.request(`/solicitudes${query}`);
    },

    getSolicitudById(id: number) {
        return this.request(`/solicitudes/${id}`);
    },

    crearSolicitud(data: any) {
        return this.request('/solicitudes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    iniciarEvaluacion(id: number) {
        return this.request(`/solicitudes/${id}/iniciar-evaluacion`, {
            method: 'POST',
        });
    },

    aprobarSolicitud(id: number, data: { observaciones?: string }) {
        return this.request(`/solicitudes/${id}/aprobar`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    rechazarSolicitud(id: number, data: { motivo: string }) {
        return this.request(`/solicitudes/${id}/rechazar`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // --- GARANTÍAS (CU06 / RF07 / P12) ---
    getGarantiasBySolicitud(idSolicitud: number) {
        return this.request(`/garantias/solicitud/${idSolicitud}`);
    },

    crearGarantia(data: any) {
        return this.request('/garantias', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // --- EVALUACIÓN FINANCIERA & BURÓ (CU03, CU04, CU05 / P13) ---
    consultarBuro(idSolicitud: number) {
        return this.request(`/evaluaciones/solicitud/${idSolicitud}/consultar-buro`, {
            method: 'POST',
        });
    },

    calcularCapacidad(idSolicitud: number, data: { ingresos: number; gastos: number; deudasVigentes?: number }) {
        return this.request(`/evaluaciones/solicitud/${idSolicitud}/calcular-capacidad`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    emitirDictamen(data: any) {
        return this.request('/evaluaciones/dictamen', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getEvaluacionBySolicitud(idSolicitud: number) {
        return this.request(`/evaluaciones/solicitud/${idSolicitud}`);
    },

    // --- CRÉDITOS, CONTRATO Y CRONOGRAMA (CU07, CU09, CU10 / P03, P05) ---
    getCreditoBySolicitud(idSolicitud: number) {
        return this.request(`/creditos/solicitud/${idSolicitud}`);
    },

    getCronograma(idCredito: number) {
        return this.request(`/creditos/${idCredito}/cronograma`);
    },

    getContrato(idCredito: number) {
        return this.request(`/creditos/${idCredito}/contrato`);
    }
};
