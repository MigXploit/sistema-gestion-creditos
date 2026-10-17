import React, { useState } from 'react';
import { api } from '../services/api';
import type { SolicitudItem } from '../types';

interface RechazarModalProps {
    solicitud: SolicitudItem;
    onClose: () => void;
    onSuccess: () => void;
}

export const RechazarModal: React.FC<RechazarModalProps> = ({ solicitud, onClose, onSuccess }) => {
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRechazar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!motivo.trim()) {
            setError('El motivo de rechazo es obligatorio para formalizar el rechazo (CA14).');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await api.rechazarSolicitud(solicitud.idSolicitud, { motivo: motivo.trim() });
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
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ef4444' }}>
                    Rechazo de Solicitud de Crédito (P06 – CU08 / RF09)
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    Solicitud: <strong>{solicitud.numeroSolicitud}</strong> | Cliente: <strong>{solicitud.nombreCompletoCliente}</strong>
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleRechazar}>
                    <div className="form-group">
                        <label className="form-label">Motivo de Rechazo Formal (Obligatorio, CA14) *</label>
                        <textarea
                            className="form-input"
                            rows={4}
                            required
                            placeholder="Describa el motivo técnico o financiero del rechazo (ej: Capacidad de pago insuficiente, deudas en mora no regularizadas, garantía no idónea)..."
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-danger" disabled={loading}>
                            {loading ? 'Rechazando...' : 'Formalizar Rechazo (CU08)'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
