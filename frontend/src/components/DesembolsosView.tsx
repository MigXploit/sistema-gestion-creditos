import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { SolicitudItem, UsuarioSession } from '../types';

interface DesembolsosViewProps {
    user: UsuarioSession;
}

export const DesembolsosView: React.FC<DesembolsosViewProps> = ({ user: _user }) => {
    const [solicitudesAprobadas, setSolicitudesAprobadas] = useState<SolicitudItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [desembolsandoId, setDesembolsandoId] = useState<number | null>(null);

    const cargarSolicitudes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getSolicitudes('APROBADA');
            setSolicitudesAprobadas(data.filter((s: SolicitudItem) => s.idCredito));
        } catch (err: any) {
            setError(err.message || 'Error al cargar solicitudes para desembolso');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarSolicitudes();
    }, []);

    const handleDesembolsar = async (idCredito: number, numeroCredito?: string) => {
        if (!window.confirm(`¿Confirma el desembolso de fondos a través del Core Bancario para el crédito ${numeroCredito || idCredito}?`)) {
            return;
        }

        try {
            setDesembolsandoId(idCredito);
            setError(null);
            const res = await api.desembolsarCredito(idCredito);
            setMensajeExito(`¡Desembolso exitoso! ${res.mensaje} (Código Core: ${res.codigoTransaccionCore})`);
            await cargarSolicitudes();
        } catch (err: any) {
            setError(err.message || 'Error al procesar el desembolso con el Core Bancario');
        } finally {
            setDesembolsandoId(null);
        }
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                        Módulo de Desembolsos (CU11 / RF12 / CA17)
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Formalización y liberación de fondos a través del Sistema Core Bancario
                    </p>
                </div>

                <button className="btn btn-secondary" onClick={cargarSolicitudes}>
                    🔄 Refrescar Lista
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}

            {loading ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando créditos listos para desembolso...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>N° Solicitud</th>
                                <th>N° Crédito</th>
                                <th>Cliente Titular</th>
                                <th>CI</th>
                                <th>Monto Aprobado</th>
                                <th>Plazo</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Acción Core</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solicitudesAprobadas.map(sol => (
                                <tr key={sol.idSolicitud}>
                                    <td><strong style={{ fontFamily: 'var(--font-tech)', color: 'var(--purple-300)' }}>{sol.numeroSolicitud}</strong></td>
                                    <td style={{ fontFamily: 'var(--font-mono)' }}>{sol.numeroCredito || 'Generado'}</td>
                                    <td style={{ fontWeight: 600 }}>{sol.nombreCompletoCliente}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{sol.ciCliente}</td>
                                    <td style={{ fontFamily: 'var(--font-tech)', fontWeight: 700, color: 'var(--teal-300)' }}>
                                        Bs {sol.montoSolicitado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>{sol.plazoMeses} meses</td>
                                    <td>{sol.tipoCredito}</td>
                                    <td>
                                        <span className="badge-dev-pill status-APROBADA">
                                            {sol.estado}
                                        </span>
                                    </td>
                                    <td>
                                        {sol.idCredito && (
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                                onClick={() => handleDesembolsar(sol.idCredito!, sol.numeroCredito)}
                                                disabled={desembolsandoId === sol.idCredito}
                                            >
                                                {desembolsandoId === sol.idCredito ? 'Procesando...' : '🏦 Desembolsar'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {solicitudesAprobadas.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No hay créditos pendientes de desembolso en este momento.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
