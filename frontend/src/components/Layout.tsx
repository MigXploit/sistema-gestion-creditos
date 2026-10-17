import React, { useEffect, useState } from 'react';
import type { UsuarioSession } from '../types';

interface LayoutProps {
    user: UsuarioSession;
    currentView: string;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, currentView, onNavigate, onLogout, children }) => {
    // Contador regresivo de sesión (15 min = 900 seg, RNF01)
    const [timeLeft, setTimeLeft] = useState(900);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    alert('Su sesión ha expirado por inactividad (15 minutos). Por favor ingrese nuevamente.');
                    onLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onLogout]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Menú según la Sección 20.3 Menú por rol
    const getMenuItems = () => {
        switch (user.rol) {
            case 'OFICIAL':
                return [
                    { id: 'dashboard', label: 'Inicio' },
                    { id: 'clientes', label: 'Clientes (P10)' },
                    { id: 'solicitudes', label: 'Solicitudes (P11)' },
                    { id: 'garantias', label: 'Garantías (P12)' },
                    { id: 'desembolsos', label: 'Desembolsos' },
                ];
            case 'ANALISTA':
                return [
                    { id: 'dashboard', label: 'Inicio' },
                    { id: 'evaluaciones', label: 'Evaluaciones (P13)' },
                ];
            case 'JEFE':
                return [
                    { id: 'dashboard', label: 'Inicio' },
                    { id: 'bandeja', label: 'Bandeja de Aprobación (P02)' },
                ];
            case 'CAJERO':
                return [
                    { id: 'dashboard', label: 'Inicio' },
                    { id: 'caja', label: 'Caja · Registrar Pago' },
                ];
            case 'GERENTE':
                return [
                    { id: 'dashboard', label: 'Inicio' },
                    { id: 'reportes', label: 'Reportes' },
                ];
            case 'ADMINISTRADOR':
                return [
                    { id: 'dashboard', label: 'Inicio' },
                    { id: 'usuarios', label: 'Usuarios y Roles (P14)' },
                    { id: 'auditoria', label: 'Auditoría' },
                ];
            default:
                return [{ id: 'dashboard', label: 'Inicio' }];
        }
    };

    const menuItems = getMenuItems();

    return (
        <div className="app-shell">
            {/* Barra lateral / Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>Sistema de Créditos</h2>
                    <span>Entidad Bancaria · UMSA</span>
                </div>

                <div className="menu-category">Menú Principal (Sección 20.3)</div>
                <ul className="sidebar-menu">
                    {menuItems.map((item) => (
                        <li key={item.id}>
                            <div
                                className={`menu-item ${currentView === item.id ? 'active' : ''}`}
                                onClick={() => onNavigate(item.id)}
                            >
                                {item.label}
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="sidebar-footer">
                    <div>Sesión expira en: <strong>{formatTime(timeLeft)}</strong></div>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}>RNF01 (15 min timeout)</div>
                </div>
            </aside>

            {/* Contenido Principal */}
            <div className="main-wrapper">
                {/* Cabecera / Top Navbar */}
                <header className="top-navbar">
                    <div className="breadcrumb-area">
                        Sistema / <strong>{currentView.toUpperCase()}</strong>
                    </div>

                    <div className="user-profile-badge">
                        <span className={`role-pill role-${user.rol}`}>{user.rol}</span>
                        <div style={{ fontSize: '0.85rem' }}>
                            <strong>{user.nombreCompleto}</strong>
                            <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem' }}>@{user.login}</span>
                        </div>
                        <button className="btn-logout" onClick={onLogout}>
                            Cerrar Sesión
                        </button>
                    </div>
                </header>

                {/* Área de Trabajo */}
                <main className="content-container">
                    {children}
                </main>
            </div>
        </div>
    );
};
