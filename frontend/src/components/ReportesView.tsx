import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const ReportesView: React.FC = () => {
    const [reporte, setReporte] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarReporte = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getReporteResumen();
            setReporte(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar reporte gerencial');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarReporte();
    }, []);

    if (loading) {
        return <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>Generando informe gerencial de cartera...</div>;
    }

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }

    const { indicadoresGenerales, solicitudesPorEstado, carteraCreditos } = reporte || {};

    return (
        <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e3a8a' }}>
                            Reporte Ejecutivo de Cartera y Morosidad (Gerencia · CU14 / RF15 / CA23)
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Métricas consolidadas de colocación crediticia, recaudación y salud de cartera
                        </p>
                    </div>

                    <button className="btn btn-secondary" onClick={cargarReporte}>
                        🔄 Actualizar Métricas
                    </button>
                </div>
            </div>

            {/* Tarjetas KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--purple-500)', background: 'var(--bg-nested)', boxShadow: '3px 3px 0px #1e0938' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--purple-400)', fontWeight: 700, fontFamily: 'var(--font-tech)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MONTO TOTAL COLOCADO</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                        Bs {indicadoresGenerales?.montoTotalColocadoBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{indicadoresGenerales?.totalCreditosEmitidos} créditos formalizados</div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--teal-500)', background: 'var(--bg-nested)', boxShadow: '3px 3px 0px #042f2e' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 700, fontFamily: 'var(--font-tech)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CARTERA VIGENTE AL DÍA</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--teal-300)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                        Bs {indicadoresGenerales?.saldoCarteraVigenteBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', marginTop: '0.35rem' }}>Saldo vivo recuperable</div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--rose-500)', background: 'var(--bg-nested)', boxShadow: '3px 3px 0px #4c0519' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--rose-400)', fontWeight: 700, fontFamily: 'var(--font-tech)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CARTERA EN MORA</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--rose-300)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                        Bs {indicadoresGenerales?.saldoCarteraMoraBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--rose-400)', marginTop: '0.35rem' }}>
                        Índice de mora: <strong>{indicadoresGenerales?.indiceMorosidadPorcentaje}%</strong>
                    </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--amber-500)', background: 'var(--bg-nested)', boxShadow: '3px 3px 0px #451a03' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--amber-400)', fontWeight: 700, fontFamily: 'var(--font-tech)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL RECAUDADO (CAJA)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--amber-300)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                        Bs {indicadoresGenerales?.totalRecaudadoPagosBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Capital + Interés + Mora</div>
                </div>
            </div>

            {/* Embudo de Solicitudes */}
            <div className="card" style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Distribución de Trámites por Etapa Operativa</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '1.25rem', borderRadius: '10px', textAlign: 'center', border: '1.5px solid rgba(14, 165, 233, 0.35)', boxShadow: '2px 2px 0px #090612' }}>
                        <div style={{ fontSize: '0.75rem', color: '#7dd3fc', fontFamily: 'var(--font-tech)', fontWeight: 700, textTransform: 'uppercase' }}>REGISTRADAS</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{solicitudesPorEstado?.REGISTRADA || 0}</div>
                    </div>
                    <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '1.25rem', borderRadius: '10px', textAlign: 'center', border: '1.5px solid rgba(245, 158, 11, 0.35)', boxShadow: '2px 2px 0px #090612' }}>
                        <div style={{ fontSize: '0.75rem', color: '#fde68a', fontFamily: 'var(--font-tech)', fontWeight: 700, textTransform: 'uppercase' }}>EN EVALUACIÓN</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{solicitudesPorEstado?.EN_EVALUACION || 0}</div>
                    </div>
                    <div style={{ background: 'rgba(13, 148, 136, 0.1)', padding: '1.25rem', borderRadius: '10px', textAlign: 'center', border: '1.5px solid rgba(20, 184, 166, 0.35)', boxShadow: '2px 2px 0px #090612' }}>
                        <div style={{ fontSize: '0.75rem', color: '#99f6e4', fontFamily: 'var(--font-tech)', fontWeight: 700, textTransform: 'uppercase' }}>APROBADAS</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2dd4bf', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{solicitudesPorEstado?.APROBADA || 0}</div>
                    </div>
                    <div style={{ background: 'rgba(225, 29, 72, 0.1)', padding: '1.25rem', borderRadius: '10px', textAlign: 'center', border: '1.5px solid rgba(244, 63, 94, 0.35)', boxShadow: '2px 2px 0px #090612' }}>
                        <div style={{ fontSize: '0.75rem', color: '#fecdd3', fontFamily: 'var(--font-tech)', fontWeight: 700, textTransform: 'uppercase' }}>RECHAZADAS</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{solicitudesPorEstado?.RECHAZADA || 0}</div>
                    </div>
                </div>
            </div>

            {/* Tabla Detallada de Cartera */}
            <div className="card">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>Detalle de Créditos Formalizados</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>N° Crédito</th>
                                <th>Cliente Titular</th>
                                <th>CI</th>
                                <th>Monto Aprobado</th>
                                <th>Saldo Capital Vivo</th>
                                <th>Plazo</th>
                                <th>Tasa Anual</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {carteraCreditos?.map((cr: any) => (
                                <tr key={cr.idCredito}>
                                    <td><strong>{cr.numeroCredito}</strong></td>
                                    <td>{cr.cliente}</td>
                                    <td>{cr.ci}</td>
                                    <td>Bs {cr.montoAprobado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                                    <td><strong>Bs {cr.saldoCapital.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong></td>
                                    <td>{cr.plazoMeses} meses</td>
                                    <td>{cr.tasaInteres}%</td>
                                    <td>
                                        <span className={`badge-dev-pill status-${cr.estado}`}>
                                            {cr.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!carteraCreditos || carteraCreditos.length === 0) && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                                        No se registran créditos en la base de datos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
