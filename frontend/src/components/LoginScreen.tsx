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
                    <strong>P01:</strong> El menú se arma según el rol del usuario
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                        Usuarios de prueba (Contraseña: Bancario2026!):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <button type="button" onClick={() => handleSelectDemoUser('cmendoza')} style={quickBtnStyle}>
                            Jefe (cmendoza)
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('atorrez')} style={quickBtnStyle}>
                            Oficial (atorrez)
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('lrojas')} style={quickBtnStyle}>
                            Analista (lrojas)
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('cajero1')} style={quickBtnStyle}>
                            Cajero (cajero1)
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('admin')} style={quickBtnStyle}>
                            Admin (admin)
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('gerente1')} style={quickBtnStyle}>
                            Gerente (gerente1)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const quickBtnStyle: React.CSSProperties = {
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#334155'
};
