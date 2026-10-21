import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RefreshCw } from 'lucide-react';

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
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                            Reporte Ejecutivo de Cartera y Morosidad (Gerencia · CU14 / RF15 / CA23)
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Métricas consolidadas de colocación crediticia, recaudación y salud de cartera
                        </p>
                    </div>

                    <button className="btn btn-secondary" onClick={cargarReporte} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <RefreshCw size={15} />
                        Actualizar Métricas
                    </button>
                </div>
            </div>

            {/* Tarjetas KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div className="card kpi-card kpi-purple">
                    <div className="kpi-label kpi-label-purple">MONTO TOTAL COLOCADO</div>
                    <div className="kpi-value kpi-value-purple">
                        Bs {indicadoresGenerales?.montoTotalColocadoBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="kpi-subtext">{indicadoresGenerales?.totalCreditosEmitidos} créditos formalizados</div>
                </div>

                <div className="card kpi-card kpi-teal">
                    <div className="kpi-label kpi-label-teal">CARTERA VIGENTE AL DÍA</div>
                    <div className="kpi-value kpi-value-teal">
                        Bs {indicadoresGenerales?.saldoCarteraVigenteBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="kpi-subtext kpi-subtext-teal">Saldo vivo recuperable</div>
                </div>

                <div className="card kpi-card kpi-rose">
                    <div className="kpi-label kpi-label-rose">CARTERA EN MORA</div>
                    <div className="kpi-value kpi-value-rose">
                        Bs {indicadoresGenerales?.saldoCarteraMoraBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="kpi-subtext kpi-subtext-rose">
                        Índice de mora: <strong>{indicadoresGenerales?.indiceMorosidadPorcentaje}%</strong>
                    </div>
                </div>

                <div className="card kpi-card kpi-amber">
                    <div className="kpi-label kpi-label-amber">TOTAL RECAUDADO (CAJA)</div>
                    <div className="kpi-value kpi-value-amber">
                        Bs {indicadoresGenerales?.totalRecaudadoPagosBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="kpi-subtext">Capital + Interés + Mora</div>
                </div>
            </div>

            {/* Embudo de Solicitudes */}
            <div className="card" style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Distribución de Trámites por Etapa Operativa</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div className="kpi-stage-box kpi-stage-registrada">
                        <div className="kpi-stage-label">REGISTRADAS</div>
                        <div className="kpi-stage-count">{solicitudesPorEstado?.REGISTRADA || 0}</div>
                    </div>
                    <div className="kpi-stage-box kpi-stage-evaluacion">
                        <div className="kpi-stage-label">EN EVALUACIÓN</div>
                        <div className="kpi-stage-count">{solicitudesPorEstado?.EN_EVALUACION || 0}</div>
                    </div>
                    <div className="kpi-stage-box kpi-stage-aprobada">
                        <div className="kpi-stage-label">APROBADAS</div>
                        <div className="kpi-stage-count">{solicitudesPorEstado?.APROBADA || 0}</div>
                    </div>
                    <div className="kpi-stage-box kpi-stage-rechazada">
                        <div className="kpi-stage-label">RECHAZADAS</div>
                        <div className="kpi-stage-count">{solicitudesPorEstado?.RECHAZADA || 0}</div>
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
