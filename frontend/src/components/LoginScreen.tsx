import React, { useState } from 'react';
import { api } from '../services/api';
import type { UsuarioSession } from '../types';

interface LoginScreenProps {
    onLoginSuccess: (user: UsuarioSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [login, setLogin] = useState('cmendoza');
    const [password, setPassword] = useState('Bancario2026!');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data: UsuarioSession = await api.login(login, password);
            api.setSession(data.token, data);
            onLoginSuccess(data);
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDemoUser = (userLogin: string) => {
        setLogin(userLogin);
        setPassword('Bancario2026!');
        setError(null);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Sistema de Créditos</h1>
                    <p>Solicitudes, evaluación, aprobación, desembolso y pagos en un solo lugar.</p>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        background: 'var(--danger-bg)',
                        color: 'var(--danger)',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.85rem',
                        marginBottom: '1rem',
                        border: '1px solid rgba(185, 28, 28, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login">Usuario</label>
                        <input
                            id="login"
                            type="text"
                            className="form-control"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Validando credenciales...' : 'Ingresar'}
                    </button>
                </form>

                <div className="login-footer-notice">
                    <strong>P01:</strong> Control de Acceso por Roles (RBAC) & Inactividad 15 min (RNF01)
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', fontFamily: 'var(--font-tech)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Acceso Rápido por Rol (Clave: Bancario2026!):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        <button type="button" onClick={() => handleSelectDemoUser('cmendoza')} style={quickBtnStyle}>
                            ⭐ JEFE
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('atorrez')} style={quickBtnStyle}>
                            📝 OFICIAL
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('lrojas')} style={quickBtnStyle}>
                            🔍 ANALISTA
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('cajero1')} style={quickBtnStyle}>
                            💵 CAJERO
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('gerente1')} style={quickBtnStyle}>
                            📊 GERENTE
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('admin')} style={quickBtnStyle}>
                            🛡️ ADMIN
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const quickBtnStyle: React.CSSProperties = {
    padding: '0.45rem 0.6rem',
    fontSize: '0.75rem',
    background: 'rgba(26, 18, 46, 0.7)',
    border: '1.5px solid var(--border-color)',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#cbd5e1',
    fontFamily: 'var(--font-tech)',
    fontWeight: 600,
    letterSpacing: '0.04em',
    transition: 'all 0.15s ease',
    boxShadow: '2px 2px 0px #090612',
    textAlign: 'center'
};
