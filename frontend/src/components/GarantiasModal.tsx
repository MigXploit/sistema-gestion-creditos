import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { GarantiaItem, SolicitudItem, UsuarioSession } from '../types';
import { X, Upload, FileText, Download, Trash2, Paperclip } from 'lucide-react';

interface GarantiasModalProps {
    solicitud: SolicitudItem;
    user: UsuarioSession;
    onClose: () => void;
}

interface ArchivoAdjunto {
    nombre: string;
    tipo: string;
    tamanio: string;
    datos: string;
}

export const GarantiasModal: React.FC<GarantiasModalProps> = ({ solicitud, user, onClose }) => {
    const [garantias, setGarantias] = useState<GarantiaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Formulario de nueva garantía
    const [tipo, setTipo] = useState('VEHICULAR');
    const [descripcion, setDescripcion] = useState('');
    const [valorTasacion, setValorTasacion] = useState('');
    const [archivosAdjuntos, setArchivosAdjuntos] = useState<ArchivoAdjunto[]>([]);

    const cargarGarantias = async () => {
        try {
            setLoading(true);
            const data = await api.getGarantiasBySolicitud(solicitud.idSolicitud);
            setGarantias(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar garantías');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarGarantias();
    }, [solicitud.idSolicitud]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Data = reader.result as string;
                const tamanioKb = (file.size / 1024).toFixed(1) + ' KB';
                setArchivosAdjuntos(prev => [
                    ...prev,
                    {
                        nombre: file.name,
                        tipo: file.type || 'application/octet-stream',
                        tamanio: tamanioKb,
                        datos: base64Data
                    }
                ]);
            };
            reader.readAsDataURL(file);
        });

        // Limpiar input file para permitir volver a seleccionar
        e.target.value = '';
    };

    const handleEliminarArchivo = (index: number) => {
        setArchivosAdjuntos(prev => prev.filter((_, i) => i !== index));
    };

    const handleDescargarArchivo = (archivo: { nombre: string; datos?: string }) => {
        if (!archivo.datos) return;
        const a = document.createElement('a');
        a.href = archivo.datos;
        a.download = archivo.nombre;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            await api.crearGarantia({
                idSolicitud: solicitud.idSolicitud,
                tipo,
                descripcion,
                valorTasacion: parseFloat(valorTasacion),
                documentosAdjuntos: archivosAdjuntos
            });
            setDescripcion('');
            setValorTasacion('');
            setArchivosAdjuntos([]);
            cargarGarantias();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const valorNum = parseFloat(valorTasacion) || 0;
    const coberturaCalculada = solicitud.montoSolicitado > 0
        ? ((valorNum / solicitud.montoSolicitado) * 100).toFixed(2)
        : '0.00';

    const puedeRegistrar = user.rol === 'OFICIAL' || user.rol === 'ADMINISTRADOR';

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                            Garantías de Solicitud (P12 – CU06 / RF07)
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Solicitud: <strong>{solicitud.numeroSolicitud}</strong> | Cliente: <strong>{solicitud.nombreCompletoCliente}</strong> | Monto: <strong>Bs {solicitud.montoSolicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong>
                        </p>
                    </div>
                    <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center' }}>
                        <X size={16} />
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Formulario para registrar garantía */}
                {puedeRegistrar && (solicitud.estado === 'REGISTRADA' || solicitud.estado === 'EN_EVALUACION') && (
                    <div style={{ background: 'var(--bg-nested)', padding: '1.25rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '2px 2px 0px #1e0938' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--purple-300)' }}>
                            + Registrar Nueva Garantía y Adjuntar Documentos de Validación (CA10)
                        </h4>
                        <form onSubmit={handleCrear}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Tipo de Garantía *</label>
                                    <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
                                        <option value="VEHICULAR">Prendaria / Vehicular</option>
                                        <option value="HIPOTECARIA">Hipotecaria (Inmueble)</option>
                                        <option value="PERSONAL">Personal / Garante</option>
                                        <option value="DEPOSITO_PLAZO">Depósito a Plazo Fijo (DPF)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Valor de Tasación (Bs) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        className="form-input"
                                        required
                                        placeholder="Ej: 45000.00"
                                        value={valorTasacion}
                                        onChange={e => setValorTasacion(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descripción del Bien o Título *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    placeholder="Ej: Inmueble ubicado en Sopocachi con Folio Real N° 201491823"
                                    value={descripcion}
                                    onChange={e => setDescripcion(e.target.value)}
                                />
                            </div>

                            {/* Subida de Documentos de Validación de la Garantía */}
                            <div className="form-group" style={{ marginTop: '0.75rem' }}>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Paperclip size={14} />
                                    <span>Documentos de Validación (Folio Real, RUAT, Gravamen, Avalúo Pericial, Boletas)</span>
                                </label>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <label
                                        className="btn btn-secondary"
                                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: 0, padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                                    >
                                        <Upload size={14} />
                                        Seleccionar Archivo(s)...
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Formatos admitidos: PDF, JPG, PNG, DOC (varios archivos permitidos)
                                    </span>
                                </div>

                                {/* Previsualización de archivos seleccionados para subir */}
                                {archivosAdjuntos.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                                        {archivosAdjuntos.map((arch, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    background: 'rgba(124, 58, 237, 0.15)',
                                                    border: '1px solid rgba(124, 58, 237, 0.35)',
                                                    borderRadius: '8px',
                                                    padding: '0.25rem 0.6rem',
                                                    fontSize: '0.78rem'
                                                }}
                                            >
                                                <FileText size={13} color="var(--purple-400)" />
                                                <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{arch.nombre}</span>
                                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>({arch.tamanio})</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEliminarArchivo(index)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 2px' }}
                                                    title="Eliminar este archivo"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                <div style={{ fontSize: '0.875rem' }}>
                                    Cobertura estimada:{' '}
                                    <strong style={{ color: parseFloat(coberturaCalculada) >= 120 ? 'var(--teal-400)' : 'var(--amber-400)', fontFamily: 'var(--font-tech)' }}>
                                        {coberturaCalculada} %
                                    </strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                                        (Referencia normativa: ≥ 120%, Sección 13.5)
                                    </span>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                    Guardar Garantía y Documentos (CA10)
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lista de garantías */}
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Garantías Vinculadas y Documentación de Respaldo
                </h4>
                {loading ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando garantías...</div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Descripción</th>
                                    <th>Valor Tasación</th>
                                    <th>Cobertura</th>
                                    <th>Documentos de Validación</th>
                                    <th>Estado</th>
                                    <th>Vínculo Crédito</th>
                                </tr>
                            </thead>
                            <tbody>
                                {garantias.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>
                                            No hay garantías registradas para esta solicitud.
                                        </td>
                                    </tr>
                                ) : (
                                    garantias.map(g => (
                                        <tr key={g.idGarantia}>
                                            <td style={{ fontWeight: 600 }}>{g.tipo}</td>
                                            <td>{g.descripcion}</td>
                                            <td>Bs {g.valorTasacion.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                                            <td style={{ fontWeight: 600, color: g.coberturaPorcentaje >= 120 ? '#10b981' : '#f59e0b' }}>
                                                {g.coberturaPorcentaje}%
                                            </td>
                                            <td>
                                                {g.documentosAdjuntos && g.documentosAdjuntos.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                        {g.documentosAdjuntos.map((doc, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                style={{
                                                                    padding: '0.2rem 0.5rem',
                                                                    fontSize: '0.72rem',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.35rem',
                                                                    textAlign: 'left'
                                                                }}
                                                                onClick={() => handleDescargarArchivo(doc)}
                                                                title={`Descargar archivo de respaldo: ${doc.nombre}`}
                                                            >
                                                                <FileText size={12} color="var(--purple-400)" />
                                                                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {doc.nombre}
                                                                </span>
                                                                <Download size={11} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                                        Sin archivos
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge badge-success">{g.estado}</span>
                                            </td>
                                            <td>
                                                {g.idCredito ? (
                                                    <span className="badge badge-info">ID Crédito: {g.idCredito}</span>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Pendiente de aprobación</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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
