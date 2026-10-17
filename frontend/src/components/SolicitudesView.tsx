import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { SolicitudItem, UsuarioSession } from '../types';
import { SolicitudRegistroModal } from './SolicitudRegistroModal';
import { GarantiasModal } from './GarantiasModal';
import { EvaluacionModal } from './EvaluacionModal';
import { AprobarModal } from './AprobarModal';
import { RechazarModal } from './RechazarModal';
import { CronogramaModal } from './CronogramaModal';
import { ContratoModal } from './ContratoModal';

interface SolicitudesViewProps {
    user: UsuarioSession;
}

export const SolicitudesView: React.FC<SolicitudesViewProps> = ({ user }) => {
    const [solicitudes, setSolicitudes] = useState<SolicitudItem[]>([]);
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Modales
    const [showRegistroModal, setShowRegistroModal] = useState(false);
    const [solicitudGarantias, setSolicitudGarantias] = useState<SolicitudItem | null>(null);
    const [solicitudEvaluacion, setSolicitudEvaluacion] = useState<SolicitudItem | null>(null);
    const [solicitudAprobar, setSolicitudAprobar] = useState<SolicitudItem | null>(null);
    const [solicitudRechazar, setSolicitudRechazar] = useState<SolicitudItem | null>(null);
    const [solicitudCronograma, setSolicitudCronograma] = useState<SolicitudItem | null>(null);
    const [solicitudContrato, setSolicitudContrato] = useState<SolicitudItem | null>(null);

    const cargarSolicitudes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getSolicitudes(filtroEstado === 'TODOS' ? undefined : filtroEstado);
            setSolicitudes(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar solicitudes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarSolicitudes();
    }, [filtroEstado]);

    const handleIniciarEvaluacion = async (s: SolicitudItem) => {
        try {
            setError(null);
            await api.iniciarEvaluacion(s.idSolicitud);
            setSuccessMsg(`Solicitud ${s.numeroSolicitud} pasó a estado EN_EVALUACION exitosamente (RN03).`);
            cargarSolicitudes();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const esOficial = user.rol === 'OFICIAL' || user.rol === 'ADMINISTRADOR';
    const esAnalista = user.rol === 'ANALISTA' || user.rol === 'ADMINISTRADOR';
    const esJefe = user.rol === 'JEFE' || user.rol === 'ADMINISTRADOR';

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        Bandeja de Solicitudes de Crédito (P02 – CU02 a CU10)
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Flujo integral de originación, control documental, evaluación financiera y decisión crediticia
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <select
                        className="form-select"
                        style={{ width: 'auto', padding: '0.5rem 1rem' }}
                        value={filtroEstado}
                        onChange={e => setFiltroEstado(e.target.value)}
                    >
                        <option value="TODOS">Todos los estados</option>
                        <option value="REGISTRADA">REGISTRADA (Bandeja Analista)</option>
                        <option value="EN_EVALUACION">EN_EVALUACION (Bandeja Jefe)</option>
                        <option value="APROBADA">APROBADA (Formalizadas)</option>
                        <option value="RECHAZADA">RECHAZADA</option>
                    </select>

                    {esOficial && (
                        <button className="btn btn-primary" onClick={() => setShowRegistroModal(true)}>
                            + Nueva Solicitud (P11)
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Cargando solicitudes...</div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>N° Solicitud</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Monto Solicitado</th>
                                <th>Plazo</th>
                                <th>Tipo</th>
                                <th>Documentación</th>
                                <th>Estado</th>
                                <th>Evaluación</th>
                                <th>Acciones Disponibles (20.8)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solicitudes.length === 0 ? (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        No hay solicitudes registradas con el filtro seleccionado.
                                    </td>
                                </tr>
                            ) : (
                                solicitudes.map(s => (
                                    <tr key={s.idSolicitud}>
                                        <td style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                                            {s.numeroSolicitud}
                                        </td>
                                        <td>{s.fechaSolicitud}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{s.nombreCompletoCliente}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CI: {s.ciCliente}</div>
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                                            Bs {s.montoSolicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>{s.plazoMeses}m</td>
                                        <td style={{ fontSize: '0.8125rem' }}>{s.tipoCredito}</td>
                                        <td>
                                            <span className={`badge ${s.documentacionCompleta ? 'badge-success' : 'badge-danger'}`}>
                                                {s.documentacionCompleta ? 'Completa' : 'Incompleta'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${
                                                s.estado === 'APROBADA' ? 'badge-success' :
                                                s.estado === 'EN_EVALUACION' ? 'badge-info' :
                                                s.estado === 'RECHAZADA' ? 'badge-danger' : 'badge-warning'
                                            }`}>
                                                {s.estado}
                                            </span>
                                        </td>
                                        <td>
                                            {s.tieneEvaluacion ? (
                                                <span className={`badge ${s.resultadoEvaluacion === 'FAVORABLE' ? 'badge-success' : 'badge-danger'}`}>
                                                    {s.resultadoEvaluacion}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                                    Sin evaluar
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                {/* Garantías P12 */}
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                                                    onClick={() => setSolicitudGarantias(s)}
                                                    title="Ver / Registrar Garantías"
                                                >
                                                    Garantías (P12)
                                                </button>

                                                {/* ESTADO REGISTRADA: Acción "Evaluar" para Analista */}
                                                {s.estado === 'REGISTRADA' && esAnalista && (
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                                                        onClick={() => handleIniciarEvaluacion(s)}
                                                        title="Pasar a Evaluación (RN03)"
                                                    >
                                                        Iniciar Evaluación
                                                    </button>
                                                )}

                                                {/* ESTADO EN_EVALUACION: Evaluar P13 (Analista/Jefe) */}
                                                {s.estado === 'EN_EVALUACION' && (
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                                                        onClick={() => setSolicitudEvaluacion(s)}
                                                        title="Evaluar capacidad y buró (P13)"
                                                    >
                                                        {s.tieneEvaluacion ? 'Ver Dictamen (P13)' : 'Evaluar Riesgo (P13)'}
                                                    </button>
                                                )}

                                                {/* ESTADO EN_EVALUACION: Decisión Jefe (CU07 / CU08) */}
                                                {s.estado === 'EN_EVALUACION' && esJefe && (
                                                    <>
                                                        <button
                                                            className="btn btn-success"
                                                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', background: '#10b981', color: '#fff' }}
                                                            onClick={() => setSolicitudAprobar(s)}
                                                            title="Aprobar Crédito (P04)"
                                                        >
                                                            Aprobar (P04)
                                                        </button>
                                                        <button
                                                            className="btn btn-danger"
                                                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                                                            onClick={() => setSolicitudRechazar(s)}
                                                            title="Rechazar Crédito (P06)"
                                                        >
                                                            Rechazar (P06)
                                                        </button>
                                                    </>
                                                )}

                                                {/* ESTADO APROBADA: Cronograma P05 y Contrato P03 */}
                                                {s.estado === 'APROBADA' && (
                                                    <>
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                                                            onClick={() => setSolicitudCronograma(s)}
                                                            title="Ver Cronograma Francés (P05)"
                                                        >
                                                            Cronograma (P05)
                                                        </button>
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                                                            onClick={() => setSolicitudContrato(s)}
                                                            title="Ver Contrato Formalizado (P03)"
                                                        >
                                                            Contrato (P03)
                                                        </button>
                                                    </>
                                                )}

                                                {/* ESTADO RECHAZADA: Ver motivo */}
                                                {s.estado === 'RECHAZADA' && s.motivoRechazo && (
                                                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontStyle: 'italic', maxWidth: '150px' }} title={s.motivoRechazo}>
                                                        Motivo: {s.motivoRechazo.slice(0, 30)}...
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modales */}
            {showRegistroModal && (
                <SolicitudRegistroModal
                    onClose={() => setShowRegistroModal(false)}
                    onSuccess={() => {
                        setSuccessMsg('Solicitud registrada exitosamente en estado REGISTRADA (CA04).');
                        cargarSolicitudes();
                    }}
                />
            )}

            {solicitudGarantias && (
                <GarantiasModal
                    solicitud={solicitudGarantias}
                    user={user}
                    onClose={() => setSolicitudGarantias(null)}
                />
            )}

            {solicitudEvaluacion && (
                <EvaluacionModal
                    solicitud={solicitudEvaluacion}
                    user={user}
                    onClose={() => setSolicitudEvaluacion(null)}
                    onSuccess={() => {
                        setSuccessMsg('Evaluación registrada y dictamen emitido (CU03, CU04, CU05).');
                        cargarSolicitudes();
                    }}
                />
            )}

            {solicitudAprobar && (
                <AprobarModal
                    solicitud={solicitudAprobar}
                    user={user}
                    onClose={() => setSolicitudAprobar(null)}
                    onSuccess={() => {
                        setSuccessMsg('Crédito aprobado exitosamente. Se generó contrato y cronograma (CU07 / CA12).');
                        cargarSolicitudes();
                    }}
                />
            )}

            {solicitudRechazar && (
                <RechazarModal
                    solicitud={solicitudRechazar}
                    onClose={() => setSolicitudRechazar(null)}
                    onSuccess={() => {
                        setSuccessMsg('Solicitud rechazada formalmente con motivo obligatorio (CU08 / CA14).');
                        cargarSolicitudes();
                    }}
                />
            )}

            {solicitudCronograma && (
                <CronogramaModal
                    solicitud={solicitudCronograma}
                    onClose={() => setSolicitudCronograma(null)}
                />
            )}

            {solicitudContrato && (
                <ContratoModal
                    solicitud={solicitudContrato}
                    onClose={() => setSolicitudContrato(null)}
                />
            )}
        </div>
    );
};
