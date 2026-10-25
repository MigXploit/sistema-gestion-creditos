import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AuditoriaItem } from '../types';
import { Download, RefreshCw, ShieldAlert } from 'lucide-react';
import { pdfService } from '../services/pdfService';

export const AuditoriaView: React.FC = () => {
    const [trazas, setTrazas] = useState<AuditoriaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarAuditoria = async () => {
        try {
            setLoading(true);
            const data = await api.getAuditoria();
            setTrazas(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar eventos de auditoría');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarAuditoria();
    }, []);

    return (
        <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-heading)' }}>
                        <ShieldAlert size={20} color="var(--purple-400)" />
                        Trazabilidad y Auditoría Inmutable
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Registro histórico inmutable de eventos sensibles (RNF06, RN12). Estándar ASFI de integridad bancaria.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={cargarAuditoria}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <RefreshCw size={14} />
                        Actualizar
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => pdfService.emitirReporteAuditoriaPDF(trazas)}
                        disabled={trazas.length === 0}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        title="Exportar reporte formal de auditoría en formato PDF"
                    >
                        <Download size={14} />
                        Exportar Reporte PDF
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>Cargando trazas de auditoría...</p>
            ) : trazas.length === 0 ? (
                <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay eventos auditados registrados aún.</p>
            ) : (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha y Hora</th>
                                <th>Usuario</th>
                                <th>Operación</th>
                                <th>Entidad</th>
                                <th>Clave Negocio</th>
                                <th>IP Origen</th>
                                <th>Resultado</th>
                                <th>Detalles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trazas.map((t) => (
                                <tr key={t.idAuditoria}>
                                    <td><small>{new Date(t.fechaHora).toLocaleString('es-BO')}</small></td>
                                    <td><strong>{t.idEntidad && t.operacion === 'LOGIN' ? t.idEntidad : 'Sistema'}</strong></td>
                                    <td><code>{t.operacion}</code></td>
                                    <td>{t.entidad}</td>
                                    <td>{t.idEntidad || '—'}</td>
                                    <td><small>{t.ipOrigen}</small></td>
                                    <td>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: t.resultado === 'EXITOSO' ? 'var(--success-bg)' : 'var(--danger-bg)',
                                            color: t.resultado === 'EXITOSO' ? 'var(--success)' : 'var(--danger)'
                                        }}>
                                            {t.resultado}
                                        </span>
                                    </td>
                                    <td><small>{t.detalles}</small></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
