import { useState, useEffect } from 'react';
import { api } from './services/api';
import type { UsuarioSession } from './types';
import { LoginScreen } from './components/LoginScreen';
import { Layout } from './components/Layout';
import { RoleDashboard } from './components/RoleDashboard';
import { UsuariosView } from './components/UsuariosView';
import { AuditoriaView } from './components/AuditoriaView';

export function App() {
    const [user, setUser] = useState<UsuarioSession | null>(null);
    const [currentView, setCurrentView] = useState('dashboard');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = api.getUser();
        const token = api.getToken();
        if (storedUser && token) {
            setUser(storedUser);
            // Si es administrador, abrir directamente usuarios
            if (storedUser.rol === 'ADMINISTRADOR') {
                setCurrentView('usuarios');
            }
        }
        setLoading(false);
    }, []);

    const handleLoginSuccess = (session: UsuarioSession) => {
        setUser(session);
        if (session.rol === 'ADMINISTRADOR') {
            setCurrentView('usuarios');
        } else {
            setCurrentView('dashboard');
        }
    };

    const handleLogout = () => {
        api.clearSession();
        setUser(null);
        setCurrentView('dashboard');
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Iniciando Sistema de Créditos...</div>;
    }

    if (!user) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <Layout
            user={user}
            currentView={currentView}
            onNavigate={setCurrentView}
            onLogout={handleLogout}
        >
            {currentView === 'dashboard' && (
                <RoleDashboard user={user} onNavigate={setCurrentView} />
            )}

            {currentView === 'usuarios' && (
                <UsuariosView />
            )}

            {currentView === 'auditoria' && (
                <AuditoriaView />
            )}

            {currentView !== 'dashboard' && currentView !== 'usuarios' && currentView !== 'auditoria' && (
                <div className="card">
                    <div className="card-header">
                        <h3>Módulo: {currentView.toUpperCase()}</h3>
                    </div>
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ fontSize: '1rem', color: '#334155', marginBottom: '0.5rem' }}>
                            Este caso de uso está asignado al <strong>Bloque 2</strong> (Originación y Evaluación) o <strong>Bloque 3</strong> (Desembolso y Pagos).
                        </p>
                        <span className="badge-dev-pill" style={{ background: '#fef3c7', color: '#92400e' }}>
                            Próxima fase de implementación
                        </span>
                        <div style={{ marginTop: '1rem' }}>
                            <button className="btn-secondary" onClick={() => setCurrentView('dashboard')}>
                                Regresar al Inicio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default App;
