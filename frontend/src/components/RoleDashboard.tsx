import React from 'react';
import type { UsuarioSession } from '../types';

interface RoleDashboardProps {
    user: UsuarioSession;
    onNavigate: (view: string) => void;
}

export const RoleDashboard: React.FC<RoleDashboardProps> = ({ user, onNavigate }) => {
    return (
        <div>
            <div className="card" style={{ borderLeft: '4px solid var(--purple-500)' }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#ffffff' }}>Bienvenido al Sistema de Gestión de Créditos</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Sesión activa iniciada como <strong style={{ color: 'var(--purple-300)' }}>{user.nombreCompleto}</strong> con rol <span className={`role-pill role-${user.rol}`} style={{ marginLeft: '0.5rem' }}>{user.rol}</span>.
                </p>
                {user.rol === 'JEFE' && (
                    <div style={{ padding: '0.85rem 1rem', background: 'rgba(217, 119, 6, 0.14)', border: '1.5px solid var(--amber-500)', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: '#fde68a', boxShadow: '2px 2px 0px #1e0938' }}>
                        <strong>Límite reglamentario de atribución crediticia:</strong> Bs {Number(user.limiteAtribucion).toLocaleString('es-BO', { minimumFractionDigits: 2 })} (Atribución Operativa · Sección 13.5).
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
                            <div className="module-card" onClick={() => onNavigate('usuarios')}>
                                <h4>P14: Usuarios y Roles</h4>
                                <p>Administrar cuentas de funcionarios, roles y límites (CU15 - RF16).</p>
                                <span className="badge-dev-pill">Habilitado - Bloque 1</span>
                            </div>
                            <div className="module-card" onClick={() => onNavigate('auditoria')}>
                                <h4>Auditoría Inmutable</h4>
                                <p>Consulta de trazas de eventos sensibles y no repudio (RNF06, RN12).</p>
                                <span className="badge-dev-pill">Habilitado - Bloque 1</span>
                            </div>
                        </>
                    )}

                    {user.rol === 'JEFE' && (
                        <>
                            <div className="module-card" onClick={() => onNavigate('bandeja')}>
                                <h4>P02: Bandeja de Aprobación</h4>
                                <p>Dictaminar solicitudes evaluadas con límite hasta Bs 70.000 (CU07, CU08).</p>
                                <span className="badge-dev-pill" style={{ background: 'rgba(13, 148, 136, 0.16)', color: '#5eead4', borderColor: '#0d9488' }}>
                                    Habilitado
                                </span>
                            </div>
                            <div className="module-card" onClick={() => onNavigate('desembolsos')}>
                                <h4>Desembolsos de Fondos</h4>
                                <p>Gestión de desembolsos mediante enlace a Core Bancario (CU11 - RF12).</p>
                                <span className="badge-dev-pill" style={{ background: 'rgba(13, 148, 136, 0.16)', color: '#5eead4', borderColor: '#0d9488' }}>
                                    Habilitado
                                </span>
                            </div>
                        </>
                    )}

                    {user.rol === 'OFICIAL' && (
                        <>
                            <div className="module-card" onClick={() => onNavigate('clientes')}>
                                <h4>P10: Registro de Clientes</h4>
                                <p>Captura de datos de clientes y validación de CI único (CU01 - RF01).</p>
                                <span className="badge-dev-pill" style={{ background: 'rgba(13, 148, 136, 0.16)', color: '#5eead4', borderColor: '#0d9488' }}>
                                    Habilitado
                                </span>
                            </div>
                            <div className="module-card" onClick={() => onNavigate('solicitudes')}>
                                <h4>P11: Nueva Solicitud</h4>
                                <p>Registro de monto, plazo, destino y checklist documental (CU02 - RF03).</p>
                                <span className="badge-dev-pill" style={{ background: 'rgba(13, 148, 136, 0.16)', color: '#5eead4', borderColor: '#0d9488' }}>
                                    Habilitado
                                </span>
                            </div>
                            <div className="module-card" onClick={() => onNavigate('garantias')}>
                                <h4>P12: Registro de Garantías</h4>
                                <p>Valuación de respaldo real con cobertura $\ge$ 120% (CU06 - RF07).</p>
                                <span className="badge-dev-pill" style={{ background: 'rgba(13, 148, 136, 0.16)', color: '#5eead4', borderColor: '#0d9488' }}>
                                    Habilitado
                                </span>
                            </div>
                            <div className="module-card" onClick={() => onNavigate('desembolsos')}>
                                <h4>Desembolso Core</h4>
                                <p>Ejecutar desembolso y activar cartera vigente (CU11 - RF12).</p>
                                <span className="badge-dev-pill" style={{ background: 'rgba(13, 148, 136, 0.16)', color: '#5eead4', borderColor: '#0d9488' }}>
                                    Habilitado
                                </span>
                            </div>
                        </>
                    )}

                    {user.rol === 'ANALISTA' && (
                        <>
                            <div className="module-card" onClick={() => onNavigate('evaluaciones')}>
                                <h4>P13: Evaluación Crediticia</h4>
                                <p>Buró externo, cálculo de capacidad, DTI $\le$ 40% y dictamen (CU03, CU04, CU05).</p>
                                <span className="badge-dev-pill" style={{ background: 'rgba(13, 148, 136, 0.16)', color: '#5eead4', borderColor: '#0d9488' }}>
                                    Habilitado
                                </span>
                            </div>
                        </>
                    )}

                    {user.rol === 'CAJERO' && (
                        <>
                            <div className="module-card" onClick={() => onNavigate('caja')}>
                                <h4>P08: Caja / Registrar Pago</h4>
                                <p>Imputación en cascada obligatoria (1° mora, 2° interés, 3° capital) (CU12 - RF13).</p>
                                <span className="badge-dev-pill" style={{ background: 'rgba(13, 148, 136, 0.16)', color: '#5eead4', borderColor: '#0d9488' }}>
                                    Habilitado
                                </span>
                            </div>
                        </>
                    )}

                    {user.rol === 'GERENTE' && (
                        <>
                            <div className="module-card" onClick={() => onNavigate('reportes')}>
                                <h4>P09: Centro de Reportes</h4>
                                <p>Consultas y KPIs consolidados de cartera, mora y pagos (CU14 - RF15).</p>
                                <span className="badge-dev-pill" style={{ background: 'rgba(13, 148, 136, 0.16)', color: '#5eead4', borderColor: '#0d9488' }}>
                                    Habilitado
                                </span>
                            </div>
                            <div className="module-card" onClick={() => onNavigate('auditoria')}>
                                <h4>Auditoría Inmutable</h4>
                                <p>Inspección de trazas de eventos bancarios críticos (RN12 / RNF06).</p>
                                <span className="badge-dev-pill" style={{ background: 'rgba(13, 148, 136, 0.16)', color: '#5eead4', borderColor: '#0d9488' }}>
                                    Habilitado
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
