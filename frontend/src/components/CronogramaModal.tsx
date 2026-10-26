import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { pdfService } from '../services/pdfService';
import type { CuotaItem, SolicitudItem, CreditoItem } from '../types';
import { X, Download } from 'lucide-react';

interface CronogramaModalProps {
    solicitud: SolicitudItem;
    onClose: () => void;
}

export const CronogramaModal: React.FC<CronogramaModalProps> = ({ solicitud, onClose }) => {
    const [cuotas, setCuotas] = useState<CuotaItem[]>([]);
    const [credito, setCredito] = useState<CreditoItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarCronograma = async () => {
        try {
            setLoading(true);
            setError(null);
            // Primero obtener el crédito por solicitud
            const cr = await api.getCreditoBySolicitud(solicitud.idSolicitud);
            setCredito(cr);
            if (cr && cr.idCredito) {
                const data = await api.getCronograma(cr.idCredito);
                setCuotas(data);
            } else {
                setError('No se encontró crédito generado para esta solicitud.');
            }
        } catch (err: any) {
            setError(err.message || 'Error al cargar cronograma');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCronograma();
    }, [solicitud.idSolicitud]);

    const totalCapital = cuotas.reduce((acc, c) => acc + c.capital, 0);
    const totalInteres = cuotas.reduce((acc, c) => acc + c.interesComp, 0);
    const totalMonto = cuotas.reduce((acc, c) => acc + c.monto, 0);

    const handleDescargarPDF = () => {
        if (!cuotas.length) return;
        pdfService.emitirCronogramaPDF(cuotas, solicitud, credito);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '900px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                            Cronograma de Pagos – Sistema Francés (P05 – CU10 / RF11 / CA16)
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Solicitud: <strong>{solicitud.numeroSolicitud}</strong> | Crédito: <strong>{solicitud.numeroCredito || credito?.numeroCredito || 'Formalizado'}</strong> | Monto: <strong>Bs {solicitud.montoSolicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong> | Plazo: <strong>{solicitud.plazoMeses} meses</strong> (12% anual)
                        </p>
                    </div>
                    <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center' }}>
                        <X size={16} />
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Cargando cronograma de pagos...
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleDescargarPDF}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
                            >
                                <Download size={16} />
                                <span>Descargar Cronograma en PDF</span>
                            </button>
                        </div>

                        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>N°</th>
                                        <th>Vencimiento</th>
                                        <th style={{ textAlign: 'right' }}>Capital (Bs)</th>
                                        <th style={{ textAlign: 'right' }}>Interés Comp. (Bs)</th>
                                        <th style={{ textAlign: 'right' }}>Monto Cuota (Bs)</th>
                                        <th style={{ textAlign: 'right' }}>Saldo Pendiente (Bs)</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cuotas.map(c => (
                                        <tr key={c.idCuota}>
                                            <td style={{ fontWeight: 600 }}>{c.numeroCuota}</td>
                                            <td>{c.fechaVencimiento}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                {c.capital.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {c.interesComp.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                {c.monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {c.saldoPendiente.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                <span className={`badge ${c.estado === 'PAGADA' ? 'badge-success' : c.estado === 'VENCIDA' ? 'badge-danger' : 'badge-warning'}`}>
                                                    {c.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: 'var(--bg-nested)', fontWeight: 700, borderTop: '2px solid var(--border-strong)' }}>
                                        <td colSpan={2} style={{ color: 'var(--purple-300)' }}>TOTALES ACUMULADOS:</td>
                                        <td style={{ textAlign: 'right', color: 'var(--teal-300)', fontFamily: 'var(--font-tech)' }}>
                                            Bs {totalCapital.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--purple-300)', fontFamily: 'var(--font-tech)' }}>
                                            Bs {totalInteres.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-heading)', fontFamily: 'var(--font-tech)', fontSize: '1rem' }}>
                                            Bs {totalMonto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                            * Amortización calculada con precisión centesimal bajo el Sistema Francés. La suma exacta de las cuotas de capital amortizado cubre la totalidad del crédito con ajuste de redondeo en la última cuota (CA16).
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
