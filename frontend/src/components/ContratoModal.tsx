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
                    <div style={{ background: 'var(--bg-nested)', padding: '1.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: '4px 4px 0px #1e0938' }}>
                        <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-strong)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                                CONTRATO DE PRÉSTAMO DE DINERO CON GARANTÍA
                            </h4>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--teal-300)', fontFamily: 'var(--font-mono)', marginTop: '0.35rem' }}>
                                CÓDIGO DE CONTRATO: {contrato.numeroContrato}
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <span className="badge badge-warning">
                                    ESTADO: {contrato.estado} (CA15)
                                </span>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.875rem', lineHeight: '1.7', color: 'var(--text-body)' }}>
                            <p style={{ marginBottom: '0.75rem' }}>
                                Conste por el presente documento privado de préstamo dinerario que surtirá efectos legales entre las partes:
                            </p>
                            <ul style={{ paddingLeft: '1.25rem', marginBottom: '1rem' }}>
                                <li>
                                    <strong style={{ color: 'var(--purple-300)' }}>ENTIDAD ACREEDORA:</strong> Entidad Bancaria (Sistema de Gestión de Créditos)
                                </li>
                                <li>
                                    <strong style={{ color: 'var(--purple-300)' }}>PARTE DEUDORA:</strong> {solicitud.nombreCompletoCliente}, con Cédula de Identidad N° <strong style={{ color: '#ffffff' }}>{solicitud.ciCliente}</strong>.
                                </li>
                                <li>
                                    <strong style={{ color: 'var(--purple-300)' }}>MONTO DEL CAPITAL:</strong> <span style={{ fontFamily: 'var(--font-tech)', fontWeight: 700, color: 'var(--teal-300)' }}>Bs {credito.montoAprobado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span> ({solicitud.tipoCredito}).
                                </li>
                                <li>
                                    <strong style={{ color: 'var(--purple-300)' }}>PLAZO DE REEMBOLSO:</strong> {credito.plazoMeses} cuotas mensuales sucesivas según el Cronograma Oficial.
                                </li>
                                <li>
                                    <strong style={{ color: 'var(--purple-300)' }}>TASA DE INTERÉS COMPENSATORIA:</strong> {credito.tasaInteres.toFixed(2)} % anual bajo Sistema Francés.
                                </li>
                                <li>
                                    <strong style={{ color: 'var(--purple-300)' }}>TASA DE INTERÉS PENAL POR MORA:</strong> {credito.tasaMora.toFixed(2)} % anual.
                                </li>
                            </ul>

                            <div style={{ background: 'rgba(124, 58, 237, 0.12)', padding: '1rem', borderRadius: 'var(--radius)', border: '1.5px dashed var(--purple-500)', marginTop: '1rem', color: 'var(--purple-200)' }}>
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
