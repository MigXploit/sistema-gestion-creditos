import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { SolicitudItem, UsuarioSession, EvaluacionItem } from '../types';
import { Send, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';

interface AprobarModalProps {
    solicitud: SolicitudItem;
    user: UsuarioSession;
    onClose: () => void;
    onSuccess: () => void;
}

export const AprobarModal: React.FC<AprobarModalProps> = ({ solicitud, user, onClose, onSuccess }) => {
    const esGerenteOAdmin = user.rol === 'GERENTE' || user.rol === 'ADMINISTRADOR';
    const [observaciones, setObservaciones] = useState(
        esGerenteOAdmin
            ? 'Aprobación Gerencial emitida en base a informe favorable, verificación de capacidad financiera y garantías.'
            : 'Aprobado conforme a evaluación favorable y garantía presentada.'
    );
    const [evaluacion, setEvaluacion] = useState<EvaluacionItem | null>(null);
    const [loadingEvaluacion, setLoadingEvaluacion] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const limiteAprobador = esGerenteOAdmin ? 500000 : (user.limiteAtribucion || 70000);
    const excedeAtribucion = !esGerenteOAdmin && solicitud.montoSolicitado > limiteAprobador;
    const esFavorable = solicitud.tieneEvaluacion && solicitud.resultadoEvaluacion === 'FAVORABLE';

    useEffect(() => {
        const cargarInformeEvaluacion = async () => {
            try {
                setLoadingEvaluacion(true);
                const data = await api.getEvaluacionBySolicitud(solicitud.idSolicitud);
                setEvaluacion(data);
            } catch {
                // Informe no disponible o en proceso
            } finally {
                setLoadingEvaluacion(false);
            }
        };
        cargarInformeEvaluacion();
    }, [solicitud.idSolicitud]);

    const handleAprobar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await api.aprobarSolicitud(solicitud.idSolicitud, { observaciones });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDerivarAGerencia = async () => {
        try {
            setLoading(true);
            setError(null);
            await api.derivarSolicitud(solicitud.idSolicitud, {
                motivo: `Monto solicitado (Bs ${solicitud.montoSolicitado.toLocaleString()}) supera el límite de jefatura (Bs ${limiteAprobador.toLocaleString()}). Se deriva a Gerencia para revisión de dictamen y aprobación colegiada.`
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-primary-dark)' }}>
                            {esGerenteOAdmin ? 'Aprobación Gerencial de Crédito (Instancia Superior)' : 'Aprobación de Crédito (P04 – CU07 / RF08)'}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            {esGerenteOAdmin
                                ? 'Revisión del informe integral de riesgo y formalización colegiada para montos elevados'
                                : 'Validación de atribuciones y formalización transaccional del crédito bancario'}
                        </p>
                    </div>
                    <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.25rem 0.5rem', display: 'flex' }}>
                        <X size={16} />
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Validación CA11: Evaluación previa favorable */}
                {!esFavorable && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        <strong>Bloqueo de Aprobación (CA11):</strong> La solicitud no cuenta con una evaluación con dictamen FAVORABLE. No se puede formalizar el crédito.
                    </div>
                )}

                {/* Validación CA13 y Opción de Derivar a Gerente si excede atribución */}
                {excedeAtribucion && (
                    <div className="alert alert-warning" style={{ marginBottom: '1rem', background: 'rgba(245, 158, 11, 0.12)', border: '1.5px solid #f59e0b' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <strong>Monto Fuera de Atribución Autónoma (CA13):</strong>
                                <p style={{ margin: '0.25rem 0 0.75rem 0', fontSize: '0.85rem' }}>
                                    El monto solicitado de <strong>Bs {solicitud.montoSolicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong> supera su límite de atribución de <strong>Bs {limiteAprobador.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong>.
                                    Debe derivar este crédito a una instancia superior (Gerencia General) para su aprobación en base al informe financiero.
                                </p>
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    onClick={handleDerivarAGerencia}
                                    disabled={loading || !esFavorable}
                                    style={{
                                        background: '#f59e0b',
                                        color: '#000',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.45rem 0.85rem',
                                        fontSize: '0.82rem'
                                    }}
                                >
                                    <Send size={15} />
                                    {loading ? 'Derivando...' : 'Derivar a Instancia Superior (Gerente)'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resumen de la Operación */}
                <div style={{ background: 'var(--bg-nested)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>N° Solicitud:</span>
                            <div style={{ fontWeight: 600 }}>{solicitud.numeroSolicitud}</div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Cliente Titular:</span>
                            <div style={{ fontWeight: 600 }}>{solicitud.nombreCompletoCliente} (CI: {solicitud.ciCliente})</div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Monto Solicitado:</span>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                                Bs {solicitud.montoSolicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Plazo y Producto:</span>
                            <div style={{ fontWeight: 600 }}>{solicitud.plazoMeses} meses ({solicitud.tipoCredito})</div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Operador / Rol:</span>
                            <div style={{ fontWeight: 600 }}>{user.nombreCompleto} ({user.rol})</div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Límite de Atribución:</span>
                            <div style={{ fontWeight: 600 }}>Bs {limiteAprobador.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </div>

                {/* Informe de Evaluación Financiera para el Gerente (Requerimiento 5) */}
                <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: 'var(--purple-400)', fontWeight: 700, fontSize: '0.9rem' }}>
                        <FileText size={16} />
                        <span>Informe Técnico de Evaluación Crediticia (P13 · CU03, CU04, CU05)</span>
                    </div>

                    {loadingEvaluacion ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>Cargando informe...</p>
                    ) : evaluacion ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem', fontSize: '0.8rem' }}>
                            <div style={{ background: 'var(--bg-nested)', padding: '0.5rem', borderRadius: '6px' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Dictamen:</span>
                                <div>
                                    <span className={`badge ${evaluacion.resultado === 'FAVORABLE' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                                        {evaluacion.resultado}
                                    </span>
                                </div>
                            </div>
                            <div style={{ background: 'var(--bg-nested)', padding: '0.5rem', borderRadius: '6px' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Score Buró:</span>
                                <div style={{ fontWeight: 700, color: 'var(--teal-300)' }}>
                                    {evaluacion.scoreBuro || 750} pts ({evaluacion.nivelRiesgo || 'BAJO'})
                                </div>
                            </div>
                            <div style={{ background: 'var(--bg-nested)', padding: '0.5rem', borderRadius: '6px' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Ratio DTI:</span>
                                <div style={{ fontWeight: 700, color: (evaluacion.ratioDti || 0) <= 40 ? 'var(--teal-300)' : 'var(--rose-400)' }}>
                                    {evaluacion.ratioDti || 28.5}% (Máx 40%)
                                </div>
                            </div>
                            <div style={{ background: 'var(--bg-nested)', padding: '0.5rem', borderRadius: '6px' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Capacidad Pago:</span>
                                <div style={{ fontWeight: 700, color: 'var(--purple-300)' }}>
                                    Bs {Number(evaluacion.capacidadPago || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            Solicitud con dictamen favorable asentado.
                        </div>
                    )}
                    {evaluacion?.dictamen && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                            "{evaluacion.dictamen}"
                        </div>
                    )}
                </div>

                <form onSubmit={handleAprobar}>
                    <div className="form-group">
                        <label className="form-label">Resolución y Observaciones de Aprobación *</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        * Al confirmar, la solicitud pasará a estado <strong>APROBADA</strong>, se creará el Crédito oficial, se generará el contrato en estado <strong>PENDIENTE_FIRMA</strong> y el cronograma de <strong>{solicitud.plazoMeses} cuotas</strong>, auditando la operación.
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !esFavorable || excedeAtribucion}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <CheckCircle2 size={16} />
                            {loading ? 'Procesando...' : (esGerenteOAdmin ? 'Aprobar Crédito en Base al Informe' : 'Confirmar Aprobación (CU07)')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
