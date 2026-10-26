import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { UsuarioSession } from '../types';
import { Award, FileText, Search, DollarSign, BarChart3, Shield, Sun, Moon } from 'lucide-react';

interface LoginScreenProps {
    onLoginSuccess: (user: UsuarioSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [login, setLogin] = useState('mbustillos');
    const [password, setPassword] = useState('Bancario2026!');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modo Claro / Modo Oscuro persistente en pantalla de login
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const saved = localStorage.getItem('theme');
        return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

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
                <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
                    <button
                        type="button"
                        className="btn-theme-toggle"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                        aria-label="Cambiar tema de color"
                        style={{ width: '32px', height: '32px' }}
                    >
                        {theme === 'dark' ? <Sun size={15} color="var(--amber-400)" /> : <Moon size={15} color="var(--purple-600)" />}
                    </button>
                </div>

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
                        Acceso Rápido Grupo 4 (Clave: Bancario2026!):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                        <button type="button" onClick={() => handleSelectDemoUser('mbustillos')} className="login-quick-btn">
                            <Award size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> JEFE: M. Bustillos
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('scallisaya')} className="login-quick-btn">
                            <FileText size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> OFICIAL: S. Callisaya
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('rrojas')} className="login-quick-btn">
                            <Search size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> ANALISTA: R. Rojas
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('rpatty')} className="login-quick-btn">
                            <DollarSign size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> CAJERO: R. Patty
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('ajamachi')} className="login-quick-btn">
                            <BarChart3 size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> GERENTE: A. Jamachi
                        </button>
                        <button type="button" onClick={() => handleSelectDemoUser('admin')} className="login-quick-btn">
                            <Shield size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> ADMIN: R. Flores
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
