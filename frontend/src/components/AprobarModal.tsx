import React, { useState } from 'react';
import { api } from '../services/api';
import type { SolicitudItem, UsuarioSession } from '../types';

interface AprobarModalProps {
    solicitud: SolicitudItem;
    user: UsuarioSession;
    onClose: () => void;
    onSuccess: () => void;
}

export const AprobarModal: React.FC<AprobarModalProps> = ({ solicitud, user, onClose, onSuccess }) => {
    const [observaciones, setObservaciones] = useState('Aprobado conforme a evaluación favorable y garantía presentada.');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const limiteJefe = user.limiteAtribucion || 70000;
    const excedeAtribucion = solicitud.montoSolicitado > limiteJefe;
    const esFavorable = solicitud.tieneEvaluacion && solicitud.resultadoEvaluacion === 'FAVORABLE';

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

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary-dark)' }}>
                    Aprobación de Crédito (P04 – CU07 / RF08)
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    Validación de atribuciones y formalización transaccional del crédito bancario
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Validación CA11: Evaluación previa favorable */}
                {!esFavorable && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        <strong>Bloqueo de Aprobación (CA11):</strong> La solicitud no cuenta con una evaluación con dictamen FAVORABLE. No se puede proceder a la aprobación.
                    </div>
                )}

                {/* Validación CA13: Límite de atribución Jefe Bs 70.000 */}
                {excedeAtribucion && (
                    <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                        <strong>Monto Fuera de Atribución (CA13):</strong> El monto solicitado de{' '}
                        <strong>Bs {solicitud.montoSolicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong> supera su límite de aprobación de{' '}
                        <strong>Bs {limiteJefe.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong>. Debe derivar el trámite a una instancia superior (Comité de Créditos).
                    </div>
                )}

                <div style={{ background: 'var(--bg-nested)', padding: '1.25rem', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', boxShadow: '2px 2px 0px #1e0938' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Número de Solicitud:</span>
                            <div style={{ fontWeight: 600 }}>{solicitud.numeroSolicitud}</div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Cliente Solicitante:</span>
                            <div style={{ fontWeight: 600 }}>{solicitud.nombreCompletoCliente}</div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Monto a Aprobar:</span>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>
                                Bs {solicitud.montoSolicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Plazo y Tipo:</span>
                            <div style={{ fontWeight: 600 }}>{solicitud.plazoMeses} meses ({solicitud.tipoCredito})</div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Tasa Referencial:</span>
                            <div style={{ fontWeight: 600 }}>12.00 % anual (Sistema Francés, P05)</div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Límite del Aprobador:</span>
                            <div style={{ fontWeight: 600 }}>Bs {limiteJefe.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleAprobar}>
                    <div className="form-group">
                        <label className="form-label">Observaciones de Aprobación</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                        />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        * Al confirmar, se cambiará el estado a <strong>APROBADA</strong>, se creará la entidad Crédito, se generará el contrato en estado <strong>PENDIENTE_FIRMA</strong> y el cronograma de <strong>{solicitud.plazoMeses} cuotas</strong>, y se auditará la operación (CA12).
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !esFavorable || excedeAtribucion}
                        >
                            {loading ? 'Procesando...' : 'Confirmar Aprobación (CU07)'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
