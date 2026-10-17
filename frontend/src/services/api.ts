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
            throw new Error(json.mensaje || json.error || 'Error en la operación');
        }

        return json;
    },

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
    }
};
