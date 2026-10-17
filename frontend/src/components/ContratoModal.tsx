import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ContratoItem, CreditoItem, SolicitudItem } from '../types';

interface ContratoModalProps {
    solicitud: SolicitudItem;
    onClose: () => void;
}

export const ContratoModal: React.FC<ContratoModalProps> = ({ solicitud, onClose }) => {
    const [contrato, setContrato] = useState<ContratoItem | null>(null);
    const [credito, setCredito] = useState<CreditoItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarContrato = async () => {
        try {
            setLoading(true);
            setError(null);
            const cr = await api.getCreditoBySolicitud(solicitud.idSolicitud);
            setCredito(cr);
            if (cr && cr.idCredito) {
                const ctr = await api.getContrato(cr.idCredito);
                setContrato(ctr);
            }
        } catch (err: any) {
            setError(err.message || 'Error al cargar contrato');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarContrato();
    }, [solicitud.idSolicitud]);

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '750px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                            Contrato de Crédito Bancario (P03 – CU09 / RF10 / CA15)
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Instrumento público de formalización contractual y reconocimiento de obligaciones
                        </p>
                    </div>
                    <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.25rem 0.5rem' }}>
                        ✕
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Cargando información del contrato...
                    </div>
                ) : contrato && credito ? (
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                                CONTRATO DE PRÉSTAMO DE DINERO CON GARANTÍA
                            </h4>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                                CÓDIGO DE CONTRATO: {contrato.numeroContrato}
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <span className="badge badge-warning">
                                    ESTADO: {contrato.estado} (CA15)
                                </span>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#334155' }}>
                            <p style={{ marginBottom: '0.75rem' }}>
                                Conste por el presente documento privado de préstamo dinerario que surtirá efectos legales entre las partes:
                            </p>
                            <ul style={{ paddingLeft: '1.25rem', marginBottom: '1rem' }}>
                                <li>
                                    <strong>ENTIDAD ACREEDORA:</strong> Banco de Fomento y Crédito Boliviano S.A.
                                </li>
                                <li>
                                    <strong>PARTE DEUDORA:</strong> {solicitud.nombreCompletoCliente}, con Cédula de Identidad N° <strong>{solicitud.ciCliente}</strong>.
                                </li>
                                <li>
                                    <strong>MONTO DEL CAPITAL:</strong> Bs {credito.montoAprobado.toLocaleString('es-BO', { minimumFractionDigits: 2 })} ({solicitud.tipoCredito}).
                                </li>
                                <li>
                                    <strong>PLAZO DE REEMBOLSO:</strong> {credito.plazoMeses} cuotas mensuales sucesivas según el Cronograma Oficial.
                                </li>
                                <li>
                                    <strong>TASA DE INTERÉS COMPENSATORIA:</strong> {credito.tasaInteres.toFixed(2)} % anual bajo Sistema Francés.
                                </li>
                                <li>
                                    <strong>TASA DE INTERÉS PENAL POR MORA:</strong> {credito.tasaMora.toFixed(2)} % anual.
                                </li>
                            </ul>

                            <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '0.25rem', border: '1px dashed #cbd5e1', marginTop: '1rem' }}>
                                <strong>CLÁUSULA DE GARANTÍA:</strong> El crédito queda garantizado con los bienes tasados y registrados en el sistema, constituyendo el presente contrato título ejecutivo bastante ante eventual ejecución judicial o extrajudicial.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No se ha formalizado aún el contrato de crédito.
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
