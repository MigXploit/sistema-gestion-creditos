import React, { useState } from 'react';
import { api } from '../services/api';
import type { ClienteItem, TipoCredito } from '../types';

interface SolicitudRegistroModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const SolicitudRegistroModal: React.FC<SolicitudRegistroModalProps> = ({ onClose, onSuccess }) => {
    // Búsqueda de cliente
    const [busquedaCi, setBusquedaCi] = useState('');
    const [clienteEncontrado, setClienteEncontrado] = useState<ClienteItem | null>(null);
    const [buscando, setBuscando] = useState(false);

    // Formulario de Solicitud (P11)
    const [montoSolicitado, setMontoSolicitado] = useState('30000.00'); // Ejemplo guía
    const [plazoMeses, setPlazoMeses] = useState('12');                 // Ejemplo guía
    const [tipoCredito, setTipoCredito] = useState<TipoCredito>('CONSUMO');
    const [destino, setDestino] = useState('Capital de operaciones y adquisición de activos');

    // Checklist de Documentación (P11 / RN03 / CA05)
    const [docCi, setDocCi] = useState(true);
    const [docServicios, setDocServicios] = useState(true);
    const [docIngresos, setDocIngresos] = useState(true);
    const [docGarantia, setDocGarantia] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBuscarCliente = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!busquedaCi.trim()) return;
        try {
            setBuscando(true);
            setError(null);
            const cl = await api.getClienteByCi(busquedaCi.trim());
            setClienteEncontrado(cl);
        } catch (err: any) {
            setError(err.message || 'No se encontró cliente con ese CI');
            setClienteEncontrado(null);
        } finally {
            setBuscando(false);
        }
    };

    const handleCrearSolicitud = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clienteEncontrado) {
            setError('Debe buscar y seleccionar primero un cliente registrado por su CI.');
            return;
        }

        const docCompleta = docCi && docServicios && docIngresos && docGarantia;

        try {
            setLoading(true);
            setError(null);
            await api.crearSolicitud({
                ciCliente: clienteEncontrado.ci,
                montoSolicitado: parseFloat(montoSolicitado),
                plazoMeses: parseInt(plazoMeses, 10),
                tipoCredito,
                destino,
                documentacionCompleta: docCompleta
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const documentacionCompleta = docCi && docServicios && docIngresos && docGarantia;

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '750px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary-dark)' }}>
                    Registro de Solicitud de Crédito (P11 – CU02 / RF03)
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    Originación de crédito bancario, límites normativos de producto y control documental
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                {/* 1. Búsqueda de Cliente por CI */}
                <div style={{ background: 'var(--bg-nested)', padding: '1.25rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', border: '1px solid var(--border-color)', boxShadow: '2px 2px 0px #1e0938' }}>
                    <form onSubmit={handleBuscarCliente} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label className="form-label" style={{ fontSize: '0.8125rem' }}>Buscar Cliente por CI *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ej: 4587231"
                                value={busquedaCi}
                                onChange={e => setBusquedaCi(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary" disabled={buscando}>
                            {buscando ? 'Buscando...' : 'Buscar Cliente'}
                        </button>
                    </form>

                    {clienteEncontrado && (
                        <div style={{ marginTop: '0.75rem', background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                            <div>
                                Cliente: <strong style={{ color: '#ffffff' }}>{clienteEncontrado.nombres} {clienteEncontrado.apellidos}</strong> (CI: <span style={{ fontFamily: 'var(--font-mono)' }}>{clienteEncontrado.ci}</span>)
                            </div>
                            <div style={{ color: 'var(--teal-300)', fontWeight: 600, marginTop: '0.25rem' }}>
                                Ingresos Mensuales Comprobados: <span style={{ fontFamily: 'var(--font-tech)' }}>Bs {clienteEncontrado.ingresosMensuales.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Datos del Crédito */}
                <form onSubmit={handleCrearSolicitud}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Tipo de Crédito *</label>
                            <select
                                className="form-select"
                                value={tipoCredito}
                                onChange={e => setTipoCredito(e.target.value as TipoCredito)}
                            >
                                <option value="CONSUMO">Consumo (Bs 1.000 a 70.000, 6 a 60m)</option>
                                <option value="VEHICULAR">Vehicular (Bs 5.000 a 200.000, 12 a 72m)</option>
                                <option value="VIVIENDA">Vivienda (Bs 20.000 a 500.000, 36 a 240m)</option>
                                <option value="MICROCREDITO">Microcrédito (Bs 500 a 50.000, 3 a 36m)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Monto Solicitado (Bs) *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="1"
                                className="form-input"
                                required
                                value={montoSolicitado}
                                onChange={e => setMontoSolicitado(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Plazo (Meses) *</label>
                            <input
                                type="number"
                                min="1"
                                className="form-input"
                                required
                                value={plazoMeses}
                                onChange={e => setPlazoMeses(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Destino del Crédito *</label>
                        <input
                            type="text"
                            className="form-input"
                            required
                            placeholder="Ej: Inversión en mercadería, refacción domiciliaria, capital de trabajo..."
                            value={destino}
                            onChange={e => setDestino(e.target.value)}
                        />
                    </div>

                    {/* 3. Checklist de Documentación (P11) */}
                    <div style={{ background: 'var(--bg-nested)', padding: '1.25rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '2px 2px 0px #1e0938' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--purple-300)' }}>
                                Checklist de Documentación Requerida (P11 – RN03 / CA05)
                            </h4>
                            <span className={`badge ${documentacionCompleta ? 'badge-success' : 'badge-danger'}`}>
                                {documentacionCompleta ? 'DOCUMENTACIÓN COMPLETA' : 'DOCUMENTACIÓN INCOMPLETA'}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-body)' }}>
                                <input type="checkbox" checked={docCi} onChange={e => setDocCi(e.target.checked)} />
                                Fotocopia Cédula de Identidad vigente
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-body)' }}>
                                <input type="checkbox" checked={docServicios} onChange={e => setDocServicios(e.target.checked)} />
                                Factura reciente de servicios básicos (Luz/Agua)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-body)' }}>
                                <input type="checkbox" checked={docIngresos} onChange={e => setDocIngresos(e.target.checked)} />
                                Respaldo de Ingresos (Boletas de pago / Extracto)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-body)' }}>
                                <input type="checkbox" checked={docGarantia} onChange={e => setDocGarantia(e.target.checked)} />
                                Documentación de Respaldo de Garantía
                            </label>
                        </div>

                        {!documentacionCompleta && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--rose-400)', marginTop: '0.75rem' }}>
                                * Advertencia RN03: Si la documentación está incompleta, el sistema permitirá registrar la solicitud en estado REGISTRADA pero bloqueará el inicio de la evaluación hasta regularizar los requisitos (CA05).
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || !clienteEncontrado}>
                            {loading ? 'Registrando...' : 'Registrar Solicitud (CU02)'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
