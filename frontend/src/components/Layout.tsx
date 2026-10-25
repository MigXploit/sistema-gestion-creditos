import React, { useEffect, useState } from 'react';
import type { UsuarioSession } from '../types';
import {
    LayoutDashboard,
    Users,
    FileText,
    Shield,
    CreditCard,
    ClipboardCheck,
    CheckSquare,
    DollarSign,
    BarChart3,
    ShieldAlert,
    Clock,
    LogOut,
    ChevronRight,
    ChevronDown,
    LayoutGrid,
    Menu,
    X,
    Sun,
    Moon
} from 'lucide-react';

interface LayoutProps {
    user: UsuarioSession;
    currentView: string;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, currentView, onNavigate, onLogout, children }) => {
    // Modo Claro / Modo Oscuro persistente
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

    // Contador regresivo de sesión (15 min = 900 seg, RNF01)
    const [timeLeft, setTimeLeft] = useState(900);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    // Efecto de scroll para el header flotante (estilo Detalle's Library)
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 15);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Cerrar menú desplegable con la tecla Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Menú según la Sección 20.3 Menú por rol con subetiquetas descriptivas
    const getMenuItems = () => {
        switch (user.rol) {
            case 'OFICIAL':
                return [
                    { id: 'dashboard', label: 'Inicio', sublabel: 'Panel y operaciones rápidas', icon: LayoutDashboard },
                    { id: 'clientes', label: 'Clientes (P10)', sublabel: 'Padrón y registro de prestatarios', icon: Users },
                    { id: 'solicitudes', label: 'Solicitudes (P11)', sublabel: 'Registro de solicitudes crediticias', icon: FileText },
                    { id: 'garantias', label: 'Garantías (P12)', sublabel: 'Custodia hipotecaria y documentos', icon: Shield },
                    { id: 'desembolsos', label: 'Desembolsos', sublabel: 'Consulta de desembolsos autorizados', icon: CreditCard },
                ];
            case 'ANALISTA':
                return [
                    { id: 'dashboard', label: 'Inicio', sublabel: 'Panel de riesgo financiero', icon: LayoutDashboard },
                    { id: 'evaluaciones', label: 'Evaluaciones (P13)', sublabel: 'Buró ASFI, DTI y dictamen', icon: ClipboardCheck },
                ];
            case 'JEFE':
                return [
                    { id: 'dashboard', label: 'Inicio', sublabel: 'Panel de resoluciones', icon: LayoutDashboard },
                    { id: 'bandeja', label: 'Bandeja Aprobación (P02)', sublabel: 'Resolución de créditos hasta Bs 70.000', icon: CheckSquare },
                    { id: 'desembolsos', label: 'Desembolsos Core', sublabel: 'Autorización y desembolso', icon: CreditCard },
                ];
            case 'CAJERO':
                return [
                    { id: 'dashboard', label: 'Inicio', sublabel: 'Panel de ventanilla', icon: LayoutDashboard },
                    { id: 'caja', label: 'Caja · Cobranzas (P08)', sublabel: 'Cobro de cuotas y factura en PDF', icon: DollarSign },
                ];
            case 'GERENTE':
                return [
                    { id: 'dashboard', label: 'Inicio', sublabel: 'Panel gerencial consolidado', icon: LayoutDashboard },
                    { id: 'bandeja', label: 'Aprobación Gerencial', sublabel: 'Dictamen de créditos > Bs 70.000', icon: CheckSquare },
                    { id: 'reportes', label: 'Reportes (P09)', sublabel: 'Métricas de cartera y mora ASFI', icon: BarChart3 },
                    { id: 'auditoria', label: 'Auditoría', sublabel: 'Pistas de no repudio y reportes PDF', icon: ShieldAlert },
                ];
            case 'ADMINISTRADOR':
                return [
                    { id: 'dashboard', label: 'Inicio', sublabel: 'Panel y métricas consolidadas', icon: LayoutDashboard },
                    { id: 'clientes', label: 'Clientes (P10)', sublabel: 'Padrón y registro de prestatarios', icon: Users },
                    { id: 'solicitudes', label: 'Solicitudes (P11)', sublabel: 'Registro y seguimiento de trámites', icon: FileText },
                    { id: 'evaluaciones', label: 'Evaluación (P13)', sublabel: 'Buró ASFI, DTI y capacidad de pago', icon: ClipboardCheck },
                    { id: 'garantias', label: 'Garantías (P12)', sublabel: 'Custodia hipotecaria y documentos', icon: Shield },
                    { id: 'bandeja', label: 'Aprobación (P02)', sublabel: 'Dictámenes y contratos formalizados', icon: CheckSquare },
                    { id: 'desembolsos', label: 'Desembolsos (P04)', sublabel: 'Transferencia por Core Bancario', icon: CreditCard },
                    { id: 'caja', label: 'Caja y Cobranzas (P08)', sublabel: 'Amortización y factura oficial', icon: DollarSign },
                    { id: 'reportes', label: 'Reportes (P09)', sublabel: 'Métricas de cartera y mora ASFI', icon: BarChart3 },
                    { id: 'usuarios', label: 'Usuarios y Roles (P14)', sublabel: 'Administración de cuentas RBAC', icon: Users },
                    { id: 'auditoria', label: 'Auditoría Inmutable', sublabel: 'Trazas de no repudio (RN12/RNF06)', icon: ShieldAlert },
                ];
            default:
                return [{ id: 'dashboard', label: 'Inicio', sublabel: 'Panel principal', icon: LayoutDashboard }];
        }
    };

    const menuItems = getMenuItems();

    return (
        <div className="app-root">
            {/* Luces radiales ambientales de fondo (estilo Detalle's Library) */}
            <div className="ambient-orb ambient-orb-top" aria-hidden="true"></div>
            <div className="ambient-orb ambient-orb-bottom" aria-hidden="true"></div>

            {/* Header Flotante Superior con Glassmorphism */}
            <header className={`floating-header ${isScrolled ? 'scrolled' : ''}`}>
                <div className="header-container">
                    {/* Identidad del Sistema — Título Original sin logo ficticio */}
                    <div className="header-brand" onClick={() => onNavigate('dashboard')} role="button" tabIndex={0}>
                        <div className="brand-text">
                            <span className="brand-title">Sistema de Gestión de Créditos</span>
                            <span className="brand-subtitle">Entidad Bancaria · UMSA</span>
                        </div>
                    </div>

                    {/* Navegación Horizontal Centrada: Para Administrador se muestra menú desplegable compacto; para los demás roles, navegación en píldoras */}
                    <nav className="header-nav">
                        {user.rol === 'ADMINISTRADOR' ? (
                            <div className="admin-nav-cluster">
                                <button
                                    type="button"
                                    className={`nav-pill ${currentView === 'dashboard' ? 'active' : ''}`}
                                    onClick={() => {
                                        onNavigate('dashboard');
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    <LayoutDashboard size={15} />
                                    <span>Inicio</span>
                                </button>

                                <button
                                    type="button"
                                    className={`nav-pill nav-dropdown-btn ${currentView !== 'dashboard' || mobileMenuOpen ? 'active' : ''}`}
                                    onClick={() => setMobileMenuOpen(prev => !prev)}
                                    aria-expanded={mobileMenuOpen}
                                    title="Desplegar menú de módulos del sistema"
                                >
                                    <LayoutGrid size={15} />
                                    <span>Módulos del Sistema</span>
                                    <ChevronDown size={14} className={`dropdown-chevron ${mobileMenuOpen ? 'open' : ''}`} />
                                </button>
                            </div>
                        ) : (
                            menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`nav-pill ${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            onNavigate(item.id);
                                            setMobileMenuOpen(false);
                                        }}
                                    >
                                        <Icon size={16} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })
                        )}
                    </nav>

                    {/* Acciones del Usuario en el extremo derecho */}
                    <div className="header-actions">
                        {/* Selector de Modo Claro / Modo Oscuro */}
                        <button
                            type="button"
                            className="btn-theme-toggle"
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                            aria-label="Cambiar tema de color"
                        >
                            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                        </button>

                        {/* Enlace al repositorio GitHub del proyecto */}
                        <a
                            href="https://github.com/MigXploit/sistema-gestion-creditos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-github-icon"
                            title="Ver repositorio en GitHub (MigXploit/sistema-gestion-creditos)"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                            </svg>
                        </a>

                        {/* Temporizador de Sesión Segura (RNF01) */}
                        <div className="session-timer-pill" title="Sesión activa (tiempo restante hasta cierre automático)">
                            <Clock size={13} />
                            <span>{formatTime(timeLeft)}</span>
                        </div>

                        {/* Píldora de Rol */}
                        <span className={`role-pill role-${user.rol}`}>{user.rol}</span>

                        {/* Información del Funcionario */}
                        <div className="user-info">
                            <span className="user-name">{user.nombreCompleto}</span>
                            <span className="user-login">@{user.login}</span>
                        </div>

                        {/* Botón Salir */}
                        <button
                            type="button"
                            className="btn-logout-icon"
                            onClick={onLogout}
                            title="Cerrar sesión segura (RNF01)"
                        >
                            <LogOut size={16} />
                            <span className="logout-text">Salir</span>
                        </button>

                        {/* Toggle de Menú Desplegable */}
                        <button
                            type="button"
                            className={`mobile-toggle ${user.rol === 'ADMINISTRADOR' ? 'admin-toggle-visible' : ''}`}
                            onClick={() => setMobileMenuOpen(prev => !prev)}
                            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                            title="Menú desplegable de módulos"
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Menú Desplegable Unificado (Móvil y Escritorio para Administrador) */}
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop traslúcido para cerrar al hacer clic afuera */}
                        <div
                            className="menu-dropdown-backdrop"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-hidden="true"
                        />
                        <div
                            className={`menu-dropdown-panel ${user.rol === 'ADMINISTRADOR' ? 'admin-dropdown-panel' : ''}`}
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="menu-dropdown-header">
                                <div className="menu-dropdown-title">
                                    <div className="menu-title-icon-box">
                                        <Shield size={18} />
                                    </div>
                                    <div>
                                        <div className="menu-dropdown-heading">
                                            {user.rol === 'ADMINISTRADOR' ? 'Módulos del Sistema' : 'Menú de Navegación'}
                                        </div>
                                        <div className="menu-dropdown-subheading">
                                            {user.rol === 'ADMINISTRADOR'
                                                ? 'Acceso integral RBAC · Seleccione un módulo para operar'
                                                : `Operaciones autorizadas para el funcionario (${user.rol})`}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="menu-dropdown-close"
                                    onClick={() => setMobileMenuOpen(false)}
                                    aria-label="Cerrar menú desplegable"
                                    title="Cerrar menú (Esc)"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <nav className={`menu-dropdown-grid ${user.rol === 'ADMINISTRADOR' ? 'admin-grid-2col' : ''}`}>
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = currentView === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`menu-dropdown-card ${isActive ? 'active' : ''}`}
                                            onClick={() => {
                                                onNavigate(item.id);
                                                setMobileMenuOpen(false);
                                            }}
                                        >
                                            <div className="menu-card-icon">
                                                <Icon size={18} />
                                            </div>
                                            <div className="menu-card-content">
                                                <div className="menu-card-label">
                                                    <span>{item.label}</span>
                                                    {isActive && <span className="menu-card-active-badge">Activo</span>}
                                                </div>
                                                {item.sublabel && (
                                                    <div className="menu-card-sublabel">{item.sublabel}</div>
                                                )}
                                            </div>
                                            <ChevronRight size={16} className="menu-card-arrow" />
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="menu-dropdown-footer">
                                <div className="menu-footer-actions">
                                    <button
                                        type="button"
                                        className="menu-footer-theme-btn"
                                        onClick={toggleTheme}
                                    >
                                        {theme === 'dark' ? <Sun size={15} color="var(--amber-400)" /> : <Moon size={15} color="var(--purple-600)" />}
                                        <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                                    </button>
                                    <div className="menu-footer-timer">
                                        <Clock size={14} />
                                        <span>Sesión: {formatTime(timeLeft)}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="menu-footer-logout-btn"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        onLogout();
                                    }}
                                >
                                    <LogOut size={15} />
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </header>

            {/* Contenido Principal con Desplazamiento Vertical Fluido */}
            <main className="main-content-fluid">
                <div className="content-inner">
                    {/* Barra de Migas de Pan (Breadcrumb) */}
                    <div className="fluid-breadcrumb">
                        <span>Sistema de Gestión de Créditos</span>
                        <ChevronRight size={13} color="var(--text-muted)" />
                        <span className="breadcrumb-active">{currentView.toUpperCase()}</span>
                    </div>

                    {/* Vistas Hijas */}
                    {children}
                </div>
            </main>

            {/* Pie Institucional estilo Detalle's Library */}
            <footer className="footer-library">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <span>Sistema de Gestión de Créditos · Entidad Bancaria</span>
                    </div>
                    <p className="footer-copy">
                        Universidad Mayor de San Andrés (INF-241) · Normativa ASFI · Cifrado SHA-256 · Trazabilidad Inmutable.
                    </p>
                </div>
            </footer>
        </div>
    );
};

