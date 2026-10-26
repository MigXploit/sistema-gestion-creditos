import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { pdfService } from '../services/pdfService';
import type { ContratoItem, CreditoItem, SolicitudItem } from '../types';
import { X, Download, Upload, CheckCircle, FileText, AlertCircle } from 'lucide-react';

interface ContratoModalProps {
    solicitud: SolicitudItem;
    onClose: () => void;
}

export const ContratoModal: React.FC<ContratoModalProps> = ({ solicitud, onClose }) => {
    const [contrato, setContrato] = useState<ContratoItem | null>(null);
    const [credito, setCredito] = useState<CreditoItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exito, setExito] = useState<string | null>(null);

    // Formulario de estado y documento firmado
    const [estadoContrato, setEstadoContrato] = useState<string>('PENDIENTE_FIRMA');
    const [archivoFirmado, setArchivoFirmado] = useState<string | null>(null);
    const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

    const cargarContrato = async () => {
        try {
            setLoading(true);
            setError(null);
            const cr = await api.getCreditoBySolicitud(solicitud.idSolicitud);
            setCredito(cr);
            if (cr && cr.idCredito) {
                const ctr = await api.getContrato(cr.idCredito);
                setContrato(ctr);
                if (ctr) {
                    setEstadoContrato(ctr.estado || 'PENDIENTE_FIRMA');
                    if (ctr.documentoAdjunto) {
                        setArchivoFirmado(ctr.documentoAdjunto);
                        setNombreArchivo('contrato_firmado_registrado.pdf');
                    }
                }
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            setError('El archivo seleccionado supera el límite permitido de 20 MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setArchivoFirmado(base64);
            setNombreArchivo(file.name);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleGuardarContrato = async () => {
        if (!credito || !credito.idCredito) return;
        try {
            setGuardando(true);
            setError(null);
            await api.actualizarContrato(credito.idCredito, {
                estado: estadoContrato,
                documentoAdjunto: archivoFirmado || undefined,
            });
            setExito('Estado del contrato y documentación legal actualizados con éxito.');
            setTimeout(() => setExito(null), 4000);
            await cargarContrato();
        } catch (err: any) {
            setError(err.message || 'Error al guardar los cambios del contrato');
        } finally {
            setGuardando(false);
        }
    };

    const handleDescargarPDF = () => {
        if (!contrato || !credito) return;
        pdfService.emitirContratoPDF(contrato, solicitud, credito);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                            Instrumento Legal de Contrato de Crédito (P03 – CU09 / RF10)
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Gestión contractual, descarga oficial en PDF y registro de contrato firmado
                        </p>
                    </div>
                    <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center' }}>
                        <X size={16} />
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {exito && (
                    <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <CheckCircle size={18} />
                        <span>{exito}</span>
                    </div>
                )}

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Cargando información del contrato legal...
                    </div>
                ) : contrato && credito ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Ficha Resumen del Contrato */}
                        <div style={{ background: 'var(--bg-nested)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                        N° DE INSTRUMENTO CONTRACTUAL
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                                        {contrato.numeroContrato}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.25rem' }}>
                                        Titular: <strong>{solicitud.nombreCompletoCliente}</strong> (CI: {solicitud.ciCliente})
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={`badge ${estadoContrato === 'FIRMADO' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                                        {estadoContrato === 'FIRMADO' ? '✓ CONTRATO FIRMADO' : '⏳ PENDIENTE DE FIRMA'}
                                    </span>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                                        Crédito: {credito.numeroCredito}
                                    </div>
                                </div>
                            </div>

                            {/* Detalles Financieros del Contrato */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Monto de Capital:</span>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--teal-300)' }}>
                                        Bs {credito.montoAprobado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Plazo de Reembolso:</span>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                        {credito.plazoMeses} meses ({credito.cantidadCuotas || credito.plazoMeses} cuotas)
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tasa Compensatoria:</span>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                        {credito.tasaInteres.toFixed(2)}% anual (Francés)
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Interés por Mora:</span>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-danger)' }}>
                                        {credito.tasaMora.toFixed(2)}% anual
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botón Descargar Contrato Oficial PDF */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(124, 58, 237, 0.08)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--purple-500)' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--purple-300)' }}>
                                    Descarga de Documento Contractual Oficial
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    Genera el documento legal formal con cláusulas, montos y sellos institucionales UMSA/ASFI.
                                </div>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleDescargarPDF}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                            >
                                <Download size={16} />
                                <span>Descargar Contrato (PDF)</span>
                            </button>
                        </div>

                        {/* Formulario: Estado de Firma y Adjuntar Contrato Firmado */}
                        <div style={{ background: 'var(--bg-nested)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text)' }}>
                                Gestión de Legalización y Archivo Firmado
                            </h4>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-muted)' }}>
                                        Estado del Contrato:
                                    </label>
                                    <select
                                        className="form-control"
                                        value={estadoContrato}
                                        onChange={(e) => setEstadoContrato(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem' }}
                                    >
                                        <option value="PENDIENTE_FIRMA">PENDIENTE_FIRMA (En espera de suscripción)</option>
                                        <option value="FIRMADO">FIRMADO (Firmas verificadas y legalizadas)</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-muted)' }}>
                                        Adjuntar Contrato Firmado (PDF o Imagen escaneada):
                                    </label>
                                    <label
                                        className="btn btn-secondary"
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%' }}
                                    >
                                        <Upload size={16} />
                                        <span>{nombreArchivo ? 'Reemplazar Archivo' : 'Subir Archivo Escaneado'}</span>
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Mostrar archivo adjunto actual si existe */}
                            {archivoFirmado && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(34, 197, 94, 0.08)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--teal-500)', marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={18} color="var(--teal-300)" />
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--teal-300)' }}>
                                                {nombreArchivo || 'Contrato_Firmado.pdf'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                Documento listo para persistir en expediente bancario
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <a
                                            href={archivoFirmado}
                                            download={nombreArchivo || 'contrato_firmado.pdf'}
                                            className="btn btn-secondary"
                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                        >
                                            Ver / Descargar Adjunto
                                        </a>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => { setArchivoFirmado(null); setNombreArchivo(null); }}
                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--color-danger)' }}
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleGuardarContrato}
                                    disabled={guardando}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <CheckCircle size={16} />
                                    <span>{guardando ? 'Guardando...' : 'Guardar Estado y Documento'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No se ha formalizado aún el contrato de crédito para esta solicitud.
                    </div>
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
