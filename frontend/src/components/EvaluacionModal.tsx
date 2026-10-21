import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { EvaluacionItem, ResultadoBuro, SolicitudItem, UsuarioSession } from '../types';
import { X } from 'lucide-react';

interface EvaluacionModalProps {
    solicitud: SolicitudItem;
    user: UsuarioSession;
    onClose: () => void;
    onSuccess: () => void;
}

export const EvaluacionModal: React.FC<EvaluacionModalProps> = ({ solicitud, user, onClose, onSuccess }) => {
    const [_evaluacion, setEvaluacion] = useState<EvaluacionItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Buró (CU03)
    const [buroLoading, setBuroLoading] = useState(false);
    const [buroResult, setBuroResult] = useState<ResultadoBuro | null>(null);

    // Capacidad y Ratios (CU04)
    const [ingresos, setIngresos] = useState('6500.00'); // Valor guía P13
    const [gastos, setGastos] = useState('3200.00');     // Valor guía P13
    const [deudasVigentes, setDeudasVigentes] = useState('0.00');
    const [capacidadCalculada, setCapacidadCalculada] = useState<number | null>(null);
    const [cuotaEstimada, setCuotaEstimada] = useState<number | null>(null);
    const [ratioDti, setRatioDti] = useState<number | null>(null);
    const [cumpleCapacidad, setCumpleCapacidad] = useState<boolean | null>(null);

    // Dictamen (CU05)
    const [nivelRiesgo, setNivelRiesgo] = useState<'BAJO' | 'MEDIO' | 'ALTO'>('MEDIO');
    const [resultado, setResultado] = useState<'FAVORABLE' | 'DESFAVORABLE'>('FAVORABLE');
    const [dictamen, setDictamen] = useState(
        'Se recomienda la aprobación del crédito considerando que el solicitante cuenta con historial crediticio intachable sin moras (Score 780), capacidad de pago suficiente y cobertura de garantía adecuada.'
    );

    const cargarEvaluacion = async () => {
        try {
            setLoading(true);
            const data = await api.getEvaluacionBySolicitud(solicitud.idSolicitud);
            if (data && data.idEvaluacion) {
                setEvaluacion(data);
                setIngresos(data.ingresos.toString());
                setGastos(data.gastos.toString());
                setCapacidadCalculada(data.capacidadPago);
                setCuotaEstimada(data.cuotaEstimada || null);
                setRatioDti(data.ratioDti || null);
                setCumpleCapacidad(data.cumpleCapacidadPago || null);
                if (data.referenciaBuro) {
                    setBuroResult({
                        referencia: data.referenciaBuro,
                        score: data.scoreBuro,
                        estadoHistorial: 'SIN MORA',
                        deudasVigentes: 0,
                        fechaConsulta: data.fechaEvaluacion || '',
                        exitoso: true,
                        parcial: false,
                        mensaje: 'Historial previamente verificado'
                    });
                }
                if (data.nivelRiesgo) setNivelRiesgo(data.nivelRiesgo);
                if (data.resultado) setResultado(data.resultado);
                if (data.dictamen) setDictamen(data.dictamen);
            }
        } catch {
            // No existe evaluación previa, queda listo para nueva evaluación
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarEvaluacion();
    }, [solicitud.idSolicitud]);

    const handleConsultarBuro = async () => {
        try {
            setBuroLoading(true);
            setError(null);
            const res = await api.consultarBuro(solicitud.idSolicitud);
            setBuroResult(res);
            if (!res.exitoso) {
                setError(res.mensaje || 'Error en consulta al Buró de Riesgo externo (CA07).');
            } else {
                setSuccessMsg(`Consulta a Buró exitosa. Referencia: ${res.referencia}, Score: ${res.score} (CA06).`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBuroLoading(false);
        }
    };

    const handleCalcularCapacidad = async () => {
        try {
            setError(null);
            const data = await api.calcularCapacidad(solicitud.idSolicitud, {
                ingresos: parseFloat(ingresos),
                gastos: parseFloat(gastos),
                deudasVigentes: parseFloat(deudasVigentes) || 0
            });
            setCapacidadCalculada(data.capacidadPago);
            setCuotaEstimada(data.cuotaEstimada || null);
            setRatioDti(data.ratioDti || null);
            setCumpleCapacidad(data.cumpleCapacidadPago || null);
            setSuccessMsg('Capacidad de pago y ratios calculados exitosamente (CA08).');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEmitirDictamen = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            if (!buroResult?.referencia || !buroResult.score) {
                setError('Debe consultar primero el historial en el Buró de Riesgo (CA09).');
                return;
            }
            if (capacidadCalculada === null) {
                setError('Debe calcular primero la capacidad de pago y ratios (CA09).');
                return;
            }

            await api.emitirDictamen({
                idSolicitud: solicitud.idSolicitud,
                ingresos: parseFloat(ingresos),
                gastos: parseFloat(gastos),
                deudasVigentes: parseFloat(deudasVigentes) || 0,
                referenciaBuro: buroResult.referencia,
                scoreBuro: buroResult.score,
                nivelRiesgo,
                resultado,
                dictamen
            });

            setSuccessMsg('Dictamen emitido exitosamente. La solicitud está lista para decisión del Jefe (CA09 / CU05).');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1200);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const esAnalista = user.rol === 'ANALISTA' || user.rol === 'ADMINISTRADOR';

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '850px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                            Evaluación Crediticia y Dictamen de Riesgo (P13 – CU03 / CU04 / CU05)
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Solicitud: <strong>{solicitud.numeroSolicitud}</strong> | Cliente: <strong>{solicitud.nombreCompletoCliente}</strong> (CI: {solicitud.ciCliente}) | Monto: <strong>Bs {solicitud.montoSolicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong> | Plazo: <strong>{solicitud.plazoMeses} meses</strong>
                        </p>
                    </div>
                    <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center' }}>
                        <X size={16} />
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {successMsg && <div className="alert alert-success">{successMsg}</div>}

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando evaluación...</div>
                ) : (
                    <form onSubmit={handleEmitirDictamen}>
                        {/* 1. SECCIÓN BURÓ DE RIESGO (CU03 / RF04 / CA06, CA07) */}
                        <div style={{ background: 'var(--bg-nested)', padding: '1.25rem', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--purple-300)' }}>
                                    1. Verificación de Historial en Buró de Crédito (CU03 / CA06)
                                </h4>
                                {esAnalista && (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                        onClick={handleConsultarBuro}
                                        disabled={buroLoading}
                                    >
                                        {buroLoading ? 'Consultando Buró...' : 'Consultar Buró Externo'}
                                    </button>
                                )}
                            </div>

                            {buroResult ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.875rem' }}>
                                    <div>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Referencia Buró:</span>
                                        <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{buroResult.referencia || '—'}</div>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Historial:</span>
                                        <div style={{ fontWeight: 600, color: buroResult.estadoHistorial === 'SIN MORA' ? 'var(--teal-400)' : 'var(--rose-400)' }}>
                                            {buroResult.estadoHistorial || '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Score Crediticio:</span>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--teal-300)', fontFamily: 'var(--font-tech)' }}>
                                            {buroResult.score || '—'} / 850
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Estado Consulta:</span>
                                        <div>
                                            <span className={`badge ${buroResult.exitoso ? 'badge-success' : 'badge-danger'}`}>
                                                {buroResult.exitoso ? 'EXITOSA (CA06)' : 'FALLIDA (CA07)'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                    No se ha realizado la consulta al buró aún. Presione "Consultar Buró Externo" para verificar moras y score (CA06).
                                </div>
                            )}
                        </div>

                        {/* 2. SECCIÓN CAPACIDAD DE PAGO Y RATIOS (CU04 / RF05 / CA08) */}
                        <div style={{ background: 'var(--bg-nested)', padding: '1.25rem', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--purple-300)' }}>
                                    2. Capacidad de Pago y Ratios Financieros (CU04 / CA08)
                                </h4>
                                {esAnalista && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                        onClick={handleCalcularCapacidad}
                                    >
                                        Calcular Ratios
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Ingresos Mensuales (Bs) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        required
                                        value={ingresos}
                                        onChange={e => setIngresos(e.target.value)}
                                        disabled={!esAnalista}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Gastos Mensuales (Bs) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        required
                                        value={gastos}
                                        onChange={e => setGastos(e.target.value)}
                                        disabled={!esAnalista}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Deudas Vigentes en Sistema (Bs)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        value={deudasVigentes}
                                        onChange={e => setDeudasVigentes(e.target.value)}
                                        disabled={!esAnalista}
                                    />
                                </div>
                            </div>

                            {capacidadCalculada !== null && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Capacidad de Pago (Excedente):</span>
                                        <div style={{ fontWeight: 700, color: 'var(--teal-300)', fontFamily: 'var(--font-tech)' }}>
                                            Bs {capacidadCalculada.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Cuota Estimada (Francés):</span>
                                        <div style={{ fontWeight: 600, fontFamily: 'var(--font-tech)' }}>
                                            Bs {cuotaEstimada ? cuotaEstimada.toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ratio DTI:</span>
                                        <div style={{ fontWeight: 700, color: ratioDti && ratioDti <= 40 ? 'var(--teal-400)' : 'var(--amber-400)', fontFamily: 'var(--font-tech)' }}>
                                            {ratioDti !== null ? `${ratioDti}%` : '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Criterio Cuota &le; 80% Excedente:</span>
                                        <div>
                                            <span className={`badge ${cumpleCapacidad ? 'badge-success' : 'badge-warning'}`}>
                                                {cumpleCapacidad ? 'CUMPLE' : 'AL LÍMITE'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. SECCIÓN DICTAMEN DE RIESGO (CU05 / RF06 / CA09) */}
                        <div style={{ background: 'var(--bg-nested)', padding: '1.25rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--purple-300)' }}>
                                3. Emisión de Dictamen y Nivel de Riesgo (CU05 / CA09)
                            </h4>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Nivel de Riesgo Evaluado *</label>
                                    <select
                                        className="form-select"
                                        value={nivelRiesgo}
                                        onChange={e => setNivelRiesgo(e.target.value as any)}
                                        disabled={!esAnalista}
                                    >
                                        <option value="BAJO">BAJO (Perfil ideal, score &ge; 750)</option>
                                        <option value="MEDIO">MEDIO (Capacidad moderada / garantía requerida)</option>
                                        <option value="ALTO">ALTO (Alto nivel de endeudamiento o antecedentes)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Resultado / Decisión Recomendada *</label>
                                    <select
                                        className="form-select"
                                        value={resultado}
                                        onChange={e => setResultado(e.target.value as any)}
                                        disabled={!esAnalista}
                                        style={{ fontWeight: 700, color: resultado === 'FAVORABLE' ? '#10b981' : '#ef4444' }}
                                    >
                                        <option value="FAVORABLE">FAVORABLE (Habilita aprobación del Jefe)</option>
                                        <option value="DESFAVORABLE">DESFAVORABLE (Recomienda rechazo)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Dictamen / Recomendación Escrita *</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    required
                                    value={dictamen}
                                    onChange={e => setDictamen(e.target.value)}
                                    disabled={!esAnalista}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cerrar
                            </button>
                            {esAnalista && (
                                <button type="submit" className="btn btn-primary">
                                    Emitir y Guardar Dictamen (CA09)
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
