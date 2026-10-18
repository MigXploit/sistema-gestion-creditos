import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { GarantiaItem, SolicitudItem, UsuarioSession } from '../types';

interface GarantiasModalProps {
    solicitud: SolicitudItem;
    user: UsuarioSession;
    onClose: () => void;
}

export const GarantiasModal: React.FC<GarantiasModalProps> = ({ solicitud, user, onClose }) => {
    const [garantias, setGarantias] = useState<GarantiaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Formulario de nueva garantía
    const [tipo, setTipo] = useState('VEHICULAR');
    const [descripcion, setDescripcion] = useState('');
    const [valorTasacion, setValorTasacion] = useState('');

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

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            await api.crearGarantia({
                idSolicitud: solicitud.idSolicitud,
                tipo,
                descripcion,
                valorTasacion: parseFloat(valorTasacion)
            });
            setDescripcion('');
            setValorTasacion('');
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
            <div className="modal-content" style={{ maxWidth: '750px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                            Garantías de Solicitud (P12 – CU06 / RF07)
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Solicitud: <strong>{solicitud.numeroSolicitud}</strong> | Cliente: <strong>{solicitud.nombreCompletoCliente}</strong> | Monto: <strong>Bs {solicitud.montoSolicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong>
                        </p>
                    </div>
                    <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.25rem 0.5rem' }}>
                        ✕
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Formulario para registrar garantía */}
                {puedeRegistrar && solicitud.estado === 'REGISTRADA' && (
                    <div style={{ background: 'var(--bg-nested)', padding: '1.25rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '2px 2px 0px #1e0938' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--purple-300)' }}>
                            + Registrar Nueva Garantía (CA10)
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
                                    placeholder="Ej: Toyota Hilux mod 2019 placa 1234ABC con RUAT original"
                                    value={descripcion}
                                    onChange={e => setDescripcion(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
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
                                    Guardar Garantía (CA10)
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lista de garantías */}
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Garantías Vinculadas
                </h4>
                {loading ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando...</div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Descripción</th>
                                    <th>Valor Tasación</th>
                                    <th>Cobertura</th>
                                    <th>Estado</th>
                                    <th>Vínculo Crédito</th>
                                </tr>
                            </thead>
                            <tbody>
                                {garantias.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>
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
