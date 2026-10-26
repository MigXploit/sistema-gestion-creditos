import React, { useState } from 'react';
import { api } from '../services/api';
import type { UsuarioSession } from '../types';
import { Award, FileText, Search, DollarSign, BarChart3, Shield, AlertTriangle } from 'lucide-react';

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
                        padding: '0.85rem 1rem',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.875rem',
                        marginBottom: '1.25rem',
                        border: '1.5px solid #ef4444',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        lineHeight: 1.5,
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                    }}>
                        <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <div style={{ fontWeight: 700, color: '#fee2e2', marginBottom: '2px' }}>
                                Error de Acceso al Sistema
                            </div>
                            <div style={{ color: '#fecaca' }}>{error}</div>
                        </div>
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
                        <button type="button" onClick={() => handleSelectDemoUser('cmendoza')} className="login-quick-btn">
                            <Award size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> JEFE
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('atorrez')} className="login-quick-btn">
                            <FileText size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> OFICIAL
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('lrojas')} className="login-quick-btn">
                            <Search size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> ANALISTA
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('cajero1')} className="login-quick-btn">
                            <DollarSign size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> CAJERO
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('gerente1')} className="login-quick-btn">
                            <BarChart3 size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> GERENTE
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('admin')} className="login-quick-btn">
                            <Shield size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> ADMIN
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
