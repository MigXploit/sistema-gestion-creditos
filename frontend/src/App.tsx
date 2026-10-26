import { useState, useEffect } from 'react';
import { api } from './services/api';
import type { UsuarioSession } from './types';
import { LoginScreen } from './components/LoginScreen';
import { Layout } from './components/Layout';
import { RoleDashboard } from './components/RoleDashboard';
import { ClientesView } from './components/ClientesView';
import { SolicitudesView } from './components/SolicitudesView';
import { DesembolsosView } from './components/DesembolsosView';
import { CajaPagosView } from './components/CajaPagosView';
import { ReportesView } from './components/ReportesView';
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
        } else if (session.rol === 'CAJERO') {
            setCurrentView('caja');
        } else if (session.rol === 'GERENTE') {
            setCurrentView('reportes');
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

            {currentView === 'clientes' && (
                <ClientesView user={user} />
            )}

            {(currentView === 'solicitudes' || currentView === 'bandeja' || currentView === 'evaluaciones' || currentView === 'garantias') && (
                <SolicitudesView user={user} currentView={currentView} />
            )}

            {currentView === 'desembolsos' && (
                <DesembolsosView user={user} />
            )}

            {currentView === 'caja' && (
                <CajaPagosView user={user} />
            )}

            {currentView === 'reportes' && (
                <ReportesView />
            )}

            {currentView === 'usuarios' && (
                <UsuariosView />
            )}

            {currentView === 'auditoria' && (
                <AuditoriaView />
            )}
        </Layout>
    );
}

export default App;
