import React from 'react';
import type { UsuarioSession } from '../types';

interface RoleDashboardProps {
    user: UsuarioSession;
    onNavigate: (view: string) => void;
}

export const RoleDashboard: React.FC<RoleDashboardProps> = ({ user, onNavigate }) => {
    return (
        <div>
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Bienvenido al Sistema de Gestión de Créditos</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Sesión activa iniciada como <strong>{user.nombreCompleto}</strong> con rol <strong>{user.rol}</strong>.
                </p>
                {user.rol === 'JEFE' && (
                    <div style={{ padding: '0.75rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: '#92400e' }}>
                        <strong>Límite de atribución crediticia:</strong> Bs {Number(user.limiteAtribucion).toLocaleString('es-BO', { minimumFractionDigits: 2 })} (Sección 13.5).
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Matriz de Permisos y Módulos Autorizados (Sección 16.2 RBAC)</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {user.rol === 'ADMINISTRADOR' && (
                        <>
                            <div style={moduleCardStyle} onClick={() => onNavigate('usuarios')}>
                                <h4>P14: Usuarios y Roles</h4>
                                <p>Administrar cuentas de funcionarios, roles y límites (CU15 - RF16).</p>
                                <span className="badge-dev-pill">Habilitado - Bloque 1</span>
                            </div>
                            <div style={moduleCardStyle} onClick={() => onNavigate('auditoria')}>
                                <h4>Auditoría Inmutable</h4>
                                <p>Consulta de trazas de eventos sensibles y no repudio (RNF06, RN12).</p>
                                <span className="badge-dev-pill">Habilitado - Bloque 1</span>
                            </div>
                        </>
                    )}

                    {user.rol === 'JEFE' && (
                        <>
                            <div style={moduleCardStyle} onClick={() => onNavigate('bandeja')}>
                                <h4>P02: Bandeja de Aprobación</h4>
                                <p>Dictaminar solicitudes evaluadas con límite hasta Bs 70.000 (CU07, CU08).</p>
                                <span className="badge-dev-pill" style={{ background: '#fef3c7', color: '#92400e' }}>
                                    Programado para Bloque 2
                                </span>
                            </div>
                        </>
                    )}

                    {user.rol === 'OFICIAL' && (
                        <>
                            <div style={moduleCardStyle} onClick={() => onNavigate('clientes')}>
                                <h4>P10: Registro de Clientes</h4>
                                <p>Captura de datos de clientes y validación de CI único (CU01 - RF01).</p>
                                <span className="badge-dev-pill" style={{ background: '#fef3c7', color: '#92400e' }}>
                                    Programado para Bloque 2
                                </span>
                            </div>
                            <div style={moduleCardStyle} onClick={() => onNavigate('solicitudes')}>
                                <h4>P11: Nueva Solicitud</h4>
                                <p>Registro de monto, plazo, destino y checklist documental (CU02 - RF03).</p>
                                <span className="badge-dev-pill" style={{ background: '#fef3c7', color: '#92400e' }}>
                                    Programado para Bloque 2
                                </span>
                            </div>
                            <div style={moduleCardStyle} onClick={() => onNavigate('garantias')}>
                                <h4>P12: Registro de Garantías</h4>
                                <p>Valuación de respaldo real con cobertura $\ge$ 120% (CU06 - RF07).</p>
                                <span className="badge-dev-pill" style={{ background: '#fef3c7', color: '#92400e' }}>
                                    Programado para Bloque 2
                                </span>
                            </div>
                        </>
                    )}

                    {user.rol === 'ANALISTA' && (
                        <>
                            <div style={moduleCardStyle} onClick={() => onNavigate('evaluaciones')}>
                                <h4>P13: Evaluación Crediticia</h4>
                                <p>Buró externo, cálculo de capacidad, DTI $\le$ 40% y dictamen (CU03, CU04, CU05).</p>
                                <span className="badge-dev-pill" style={{ background: '#fef3c7', color: '#92400e' }}>
                                    Programado para Bloque 2
                                </span>
                            </div>
                        </>
                    )}

                    {user.rol === 'CAJERO' && (
                        <>
                            <div style={moduleCardStyle} onClick={() => onNavigate('caja')}>
                                <h4>P08: Caja / Registrar Pago</h4>
                                <p>Imputación en cascada obligatoria (1° mora, 2° interés, 3° capital) (CU12 - RF13).</p>
                                <span className="badge-dev-pill" style={{ background: '#fef3c7', color: '#92400e' }}>
                                    Programado para Bloque 3
                                </span>
                            </div>
                        </>
                    )}

                    {user.rol === 'GERENTE' && (
                        <>
                            <div style={moduleCardStyle} onClick={() => onNavigate('reportes')}>
                                <h4>P09: Centro de Reportes</h4>
                                <p>Consultas y KPIs consolidados de cartera, mora y pagos (CU14 - RF15).</p>
                                <span className="badge-dev-pill" style={{ background: '#fef3c7', color: '#92400e' }}>
                                    Programado para Bloque 3
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const moduleCardStyle: React.CSSProperties = {
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
};
