import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { SolicitudItem, CuotaItem, UsuarioSession } from '../types';
import { Clock, Receipt, CheckCircle, Search, RefreshCw, Download, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';
import { pdfService } from '../services/pdfService';

interface CajaPagosViewProps {
    user: UsuarioSession;
}

export const CajaPagosView: React.FC<CajaPagosViewProps> = ({ user }) => {
    const [solicitudes, setSolicitudes] = useState<SolicitudItem[]>([]);
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudItem | null>(null);
    const [creditoInfo, setCreditoInfo] = useState<any | null>(null);
    const [cronograma, setCronograma] = useState<CuotaItem[]>([]);
    const [cuotaParaPagar, setCuotaParaPagar] = useState<CuotaItem | null>(null);
    const [filtroBusqueda, setFiltroBusqueda] = useState('');

    const [montoPagar, setMontoPagar] = useState<string>('');
    const [formaPago, setFormaPago] = useState<string>('EFECTIVO');
    const [reciboGenerado, setReciboGenerado] = useState<any | null>(null);

    // Modal de Pago Flexible / Justificación
    const [cuotaParaFlexibilidad, setCuotaParaFlexibilidad] = useState<CuotaItem | null>(null);
    const [tipoFlexibilidad, setTipoFlexibilidad] = useState<'PRORROGA' | 'ACUMULACION'>('PRORROGA');
    const [motivoFlexibilidad, setMotivoFlexibilidad] = useState<string>('');
    const [procesandoFlexibilidad, setProcesandoFlexibilidad] = useState(false);

    const [loading, setLoading] = useState(false);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Cargar créditos disponibles
    const cargarCreditos = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getSolicitudes();
            setSolicitudes(data.filter((s: SolicitudItem) => s.idCredito));
        } catch (err: any) {
            setError(err.message || 'Error al cargar créditos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCreditos();
    }, []);

    const seleccionarSolicitud = async (sol: SolicitudItem) => {
        setSolicitudSeleccionada(sol);
        setCuotaParaPagar(null);
        setCuotaParaFlexibilidad(null);
        setReciboGenerado(null);
        setError(null);
        setMensajeExito(null);

        if (!sol.idCredito) return;

        try {
            setLoading(true);
            const [cr, cuotas] = await Promise.all([
                api.getCreditoById(sol.idCredito),
                api.getCronograma(sol.idCredito),
            ]);
            setCreditoInfo(cr);
            setCronograma(cuotas);
        } catch (err: any) {
            setError(err.message || 'Error al obtener cronograma del crédito');
        } finally {
            setLoading(false);
        }
    };

    const iniciarPago = (cuota: CuotaItem) => {
        setCuotaParaPagar(cuota);
        setCuotaParaFlexibilidad(null);
        setMontoPagar(cuota.saldoPendiente.toFixed(2));
        setError(null);
        setMensajeExito(null);
    };

    const handleProcesarPago = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cuotaParaPagar) return;

        const monto = parseFloat(montoPagar);
        if (isNaN(monto) || monto <= 0) {
            setError('Ingrese un monto válido a pagar.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const res = await api.registrarPago({
                idCuota: cuotaParaPagar.idCuota,
                montoAbonado: monto,
                formaPago: formaPago,
            });

            setReciboGenerado(res);
            setMensajeExito(`¡Pago registrado exitosamente! Comprobante N° ${res.numeroRecibo} emitido.`);
            setCuotaParaPagar(null);

            // Refrescar cronograma y crédito
            if (solicitudSeleccionada?.idCredito) {
                const [cr, cuotas] = await Promise.all([
                    api.getCreditoById(solicitudSeleccionada.idCredito),
                    api.getCronograma(solicitudSeleccionada.idCredito),
                ]);
                setCreditoInfo(cr);
                setCronograma(cuotas);
            }
        } catch (err: any) {
            setError(err.message || 'Error al registrar el pago');
        } finally {
            setLoading(false);
        }
    };

    const handleEjecutarMora = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.ejecutarControlMora();
            setMensajeExito(`${res.mensaje} (Fecha: ${res.fechaEjecucion})`);
            if (solicitudSeleccionada) {
                seleccionarSolicitud(solicitudSeleccionada);
            }
        } catch (err: any) {
            setError(err.message || 'Error al ejecutar control de mora');
        } finally {
            setLoading(false);
        }
    };

    const handleAplicarFlexibilidad = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cuotaParaFlexibilidad) return;
        if (!motivoFlexibilidad.trim()) {
            setError('Debe especificar la justificación documentada para la flexibilidad.');
            return;
        }

        try {
            setProcesandoFlexibilidad(true);
            setError(null);
            const res = await api.justificarPagoFlexible({
                idCuota: cuotaParaFlexibilidad.idCuota,
                tipo: tipoFlexibilidad,
                motivo: motivoFlexibilidad.trim(),
                dias: tipoFlexibilidad === 'PRORROGA' ? 30 : 0
            });

            setMensajeExito(`Flexibilidad aplicada: ${res.mensaje}`);
            setCuotaParaFlexibilidad(null);
            setMotivoFlexibilidad('');

            // Refrescar datos
            if (solicitudSeleccionada?.idCredito) {
                const [cr, cuotas] = await Promise.all([
                    api.getCreditoById(solicitudSeleccionada.idCredito),
                    api.getCronograma(solicitudSeleccionada.idCredito),
                ]);
                setCreditoInfo(cr);
                setCronograma(cuotas);
            }
        } catch (err: any) {
            setError(err.message || 'Error al procesar el plan flexible de pago');
        } finally {
            setProcesandoFlexibilidad(false);
        }
    };

    const esCancelado = creditoInfo && (creditoInfo.estado === 'CANCELADO' || (cronograma.length > 0 && cronograma.every(c => c.estado === 'PAGADA')));

    return (
        <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                            Módulo de Ventanilla y Cobranza (Caja · P08 · CU12 / CU13)
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Imputación contable en prelación estricta: 1° Mora → 2° Interés Compensatorio → 3° Capital Vivo
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" onClick={cargarCreditos} disabled={loading} title="Actualizar créditos">
                            <RefreshCw size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                            Actualizar
                        </button>
                        <button className="btn btn-secondary" onClick={handleEjecutarMora} disabled={loading}>
                            <Clock size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                            Ejecutar Control Diario de Mora (CU13)
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
                {mensajeExito && <div className="alert alert-success" style={{ marginTop: '1rem' }}>{mensajeExito}</div>}
            </div>

            <div className="caja-grid-layout">
                {/* Panel Izquierdo: Selección de Crédito */}
                <div className="card">
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--text-heading)' }}>Créditos Formalizados</h3>
                    
                    {/* Buscador Rápido de Crédito por CI o Nombre */}
                    <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por CI, cliente o N°..."
                            value={filtroBusqueda}
                            onChange={e => setFiltroBusqueda(e.target.value)}
                            style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
                        />
                    </div>

                    {loading && solicitudes.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando créditos...</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '520px', overflowY: 'auto' }}>
                            {solicitudes
                                .filter(sol => {
                                    if (!filtroBusqueda.trim()) return true;
                                    const term = filtroBusqueda.toLowerCase();
                                    return (
                                        (sol.nombreCompletoCliente || '').toLowerCase().includes(term) ||
                                        (sol.ciCliente || '').toLowerCase().includes(term) ||
                                        (sol.numeroCredito || '').toLowerCase().includes(term) ||
                                        (sol.numeroSolicitud || '').toLowerCase().includes(term)
                                    );
                                })
                                .map(sol => (
                                <div
                                    key={sol.idSolicitud}
                                    onClick={() => seleccionarSolicitud(sol)}
                                    style={{
                                        padding: '0.85rem',
                                        borderRadius: 'var(--radius)',
                                        border: solicitudSeleccionada?.idSolicitud === sol.idSolicitud ? '2px solid var(--purple-500)' : '1px solid var(--border-color)',
                                        background: solicitudSeleccionada?.idSolicitud === sol.idSolicitud ? 'rgba(124, 58, 237, 0.16)' : 'var(--bg-surface)',
                                        boxShadow: solicitudSeleccionada?.idSolicitud === sol.idSolicitud ? '2px 2px 0px #31135e' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{sol.nombreCompletoCliente}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CI: {sol.ciCliente} · {sol.numeroCredito || 'Sin N°'}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.85rem' }}>
                                        <span style={{ fontFamily: 'var(--font-tech)', fontWeight: 600, color: 'var(--teal-300)' }}>Bs {sol.montoSolicitado.toLocaleString()}</span>
                                        <span className={`badge-dev-pill status-${sol.estado}`} style={{ fontSize: '0.7rem' }}>
                                            {sol.estado}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {solicitudes.length === 0 && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>No hay créditos formalizados aún.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Panel Derecho: Cronograma, Cobro y Flexibilidad */}
                <div className="card">
                    {solicitudSeleccionada && creditoInfo ? (
                        <div>
                            {/* Banner de Crédito Liquidado al 100% (CA21) */}
                            {esCancelado && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: 'rgba(34, 197, 94, 0.12)',
                                    border: '2px solid var(--teal-500)',
                                    borderRadius: 'var(--radius)',
                                    padding: '1rem 1.25rem',
                                    marginBottom: '1.25rem'
                                }}>
                                    <ShieldCheck size={32} color="var(--teal-400)" />
                                    <div>
                                        <h4 style={{ margin: 0, color: 'var(--teal-300)', fontSize: '1rem', fontWeight: 700 }}>
                                            CRÉDITO TOTALMENTE CANCELADO Y LIQUIDADO (CA21)
                                        </h4>
                                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: 'var(--text-body)' }}>
                                            Todas las cuotas han sido amortizadas satisfactoriamente. El saldo capital vivo es <strong>Bs 0.00</strong>. Las garantías han quedado liberadas y el contrato legal finiquitado conforme a la normativa ASFI.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Cabecera del crédito */}
                            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: 'var(--purple-300)' }}>Crédito {creditoInfo.numeroCredito}</h3>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Titular: {solicitudSeleccionada.nombreCompletoCliente} (CI: {solicitudSeleccionada.ciCliente})</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Saldo Capital Vivo</div>
                                        <strong style={{ fontSize: '1.25rem', color: 'var(--teal-300)', fontFamily: 'var(--font-tech)' }}>
                                            Bs {creditoInfo.saldoCapital.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </strong>
                                        <div style={{ marginTop: '0.2rem' }}>
                                            <span className={`badge-dev-pill status-${creditoInfo.estado}`}>{creditoInfo.estado}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal / Caja de Pago Flexible */}
                            {cuotaParaFlexibilidad && (
                                <div style={{
                                    background: 'rgba(234, 179, 8, 0.08)',
                                    border: '1.5px solid var(--amber-400)',
                                    borderRadius: 'var(--radius)',
                                    padding: '1.25rem',
                                    marginBottom: '1.25rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--amber-300)' }}>
                                        <AlertTriangle size={18} />
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                                            Plan de Pago Flexible / Justificación de Cuota N° {cuotaParaFlexibilidad.numeroCuota}
                                        </h4>
                                    </div>
                                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                        Permite mitigar la mora otorgando prórroga justificada de 30 días o acumulación en el siguiente periodo sin alterar la tasa contractual francesa.
                                    </p>

                                    <form onSubmit={handleAplicarFlexibilidad}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                                    Mecanismo de Flexibilidad:
                                                </label>
                                                <select
                                                    className="form-control"
                                                    value={tipoFlexibilidad}
                                                    onChange={e => setTipoFlexibilidad(e.target.value as any)}
                                                    required
                                                >
                                                    <option value="PRORROGA">Prórroga de Vencimiento (30 días de gracia sin mora)</option>
                                                    <option value="ACUMULACION">Acumular a la Siguiente Cuota (Sistema Francés)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                                    Monto de Cuota Involucrado:
                                                </label>
                                                <div style={{ padding: '0.55rem', background: 'var(--bg-nested)', borderRadius: 'var(--radius)', fontWeight: 700, fontFamily: 'var(--font-tech)' }}>
                                                    Bs {cuotaParaFlexibilidad.saldoPendiente.toFixed(2)} (Mora: Bs {cuotaParaFlexibilidad.interesMora.toFixed(2)})
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                                Justificación Documentada / Motivo de Fuerza Mayor:
                                            </label>
                                            <textarea
                                                className="form-control"
                                                rows={2}
                                                placeholder="Ejemplo: Cliente presenta baja médica o retraso justificado en cobro salarial. Se concede prórroga conforme a normativa..."
                                                value={motivoFlexibilidad}
                                                onChange={e => setMotivoFlexibilidad(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setCuotaParaFlexibilidad(null)}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={procesandoFlexibilidad}
                                            >
                                                {procesandoFlexibilidad ? 'Procesando...' : 'Aplicar Flexibilidad'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Formulario de Pago Modal/Inline */}
                            {cuotaParaPagar && (
                                <div className="caja-cobro-box">
                                    <h4 className="caja-cobro-title">
                                        Cobro de Cuota N° {cuotaParaPagar.numeroCuota} (Vence: {cuotaParaPagar.fechaVencimiento})
                                    </h4>
                                    <form onSubmit={handleProcesarPago} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-heading)' }}>Monto a Cobrar (Bs):</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                value={montoPagar}
                                                onChange={e => setMontoPagar(e.target.value)}
                                                max={cuotaParaPagar.saldoPendiente}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-heading)' }}>Forma de Pago:</label>
                                            <select
                                                className="form-control"
                                                value={formaPago}
                                                onChange={e => setFormaPago(e.target.value)}
                                            >
                                                <option value="EFECTIVO">Efectivo en Ventanilla</option>
                                                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                                                <option value="CHEQUE">Cheque de Gerencia</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                                Confirmar Pago
                                            </button>
                                            <button type="button" className="btn btn-secondary" onClick={() => setCuotaParaPagar(null)}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--amber-400)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                                        * El abono amortizará en cascada: 1° Mora (Bs {cuotaParaPagar.interesMora.toFixed(2)}), 2° Interés (Bs {cuotaParaPagar.interesComp.toFixed(2)}), 3° Capital.
                                    </div>
                                </div>
                            )}

                            {/* Recibo Emitido con opción de PDF y Notificación */}
                            {reciboGenerado && (
                                <div className="caja-recibo-box">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                                        <h4 className="caja-recibo-title" style={{ margin: 0 }}>
                                            <Receipt size={16} /> Comprobante Fiscal: {reciboGenerado.numeroRecibo}
                                        </h4>
                                        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--purple-600)', color: '#fff' }}
                                                onClick={() => pdfService.emitirFacturaPDF(reciboGenerado, solicitudSeleccionada, creditoInfo)}
                                                title="Descargar comprobante tributario oficial en PDF"
                                            >
                                                <Download size={14} />
                                                Descargar Factura PDF
                                            </button>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--teal-400)', fontFamily: 'var(--font-mono)' }}>Fecha: {reciboGenerado.fechaPago}</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', margin: '0.5rem 0' }}>
                                        Cuota N° {reciboGenerado.numeroCuota} · Total Cobrado: <strong style={{ color: 'var(--teal-500)', fontFamily: 'var(--font-tech)' }}>Bs {reciboGenerado.montoTotal.toFixed(2)}</strong> ({reciboGenerado.formaPago})
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-body)', flexWrap: 'wrap' }}>
                                        <span>Mora: Bs {reciboGenerado.montoMora.toFixed(2)}</span>
                                        <span>Interés: Bs {reciboGenerado.montoInteres.toFixed(2)}</span>
                                        <span>Capital: Bs {reciboGenerado.montoCapital.toFixed(2)}</span>
                                        <span style={{ color: 'var(--text-heading)', fontWeight: 700 }}>Saldo Deudor Restante: Bs {reciboGenerado.saldoCapitalCredito.toFixed(2)}</span>
                                    </div>
                                    {reciboGenerado.notificacionEmail && (
                                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                            <Mail size={14} />
                                            <span>
                                                Notificación oficial de pago enviada a: <strong>{reciboGenerado.notificacionEmail.destinatario}</strong> ({reciboGenerado.notificacionEmail.simulado ? 'Notificación ASFI Registrada' : 'Correo SMTP Enviado'})
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cabecera y Botón Descargar Cronograma */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-heading)' }}>
                                    Cronograma de Cuotas (Sistema Francés)
                                </h4>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => pdfService.emitirCronogramaPDF(cronograma, solicitudSeleccionada, creditoInfo)}
                                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    title="Descargar cronograma completo en formato PDF formal"
                                >
                                    <Download size={14} />
                                    Descargar Cronograma PDF
                                </button>
                            </div>

                            {/* Tabla de Cronograma de Cuotas */}
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr>
                                            <th>N°</th>
                                            <th>Vencimiento</th>
                                            <th>Capital</th>
                                            <th>Interés</th>
                                            <th>Mora</th>
                                            <th>Cuota Total</th>
                                            <th>Saldo Exigible</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cronograma.map(c => (
                                            <tr key={c.idCuota} style={{ background: c.estado === 'VENCIDA' ? 'rgba(225, 29, 72, 0.12)' : (c.estado === 'PAGADA' ? 'rgba(13, 148, 136, 0.08)' : 'transparent') }}>
                                                <td><strong style={{ fontFamily: 'var(--font-tech)' }}>{c.numeroCuota}</strong></td>
                                                <td>{c.fechaVencimiento}</td>
                                                <td style={{ fontFamily: 'var(--font-tech)' }}>Bs {c.capital.toFixed(2)}</td>
                                                <td style={{ fontFamily: 'var(--font-tech)' }}>Bs {c.interesComp.toFixed(2)}</td>
                                                <td style={{ color: c.interesMora > 0 ? 'var(--rose-400)' : 'inherit', fontFamily: 'var(--font-tech)' }}>Bs {c.interesMora.toFixed(2)}</td>
                                                <td><strong style={{ fontFamily: 'var(--font-tech)', color: 'var(--purple-300)' }}>Bs {c.monto.toFixed(2)}</strong></td>
                                                <td style={{ fontFamily: 'var(--font-tech)' }}>Bs {c.saldoPendiente.toFixed(2)}</td>
                                                <td>
                                                    <span className={`badge-dev-pill status-${c.estado}`}>
                                                        {c.estado}
                                                    </span>
                                                </td>
                                                <td>
                                                    {c.estado !== 'PAGADA' ? (
                                                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                            {(user.rol === 'CAJERO' || user.rol === 'ADMINISTRADOR') && (
                                                                <button
                                                                    className="btn btn-primary"
                                                                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                                                                    onClick={() => iniciarPago(c)}
                                                                >
                                                                    Cobrar
                                                                </button>
                                                            )}
                                                            <button
                                                                className="btn btn-secondary"
                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--amber-400)' }}
                                                                onClick={() => { setCuotaParaFlexibilidad(c); setCuotaParaPagar(null); }}
                                                                title="Aplicar prórroga o plan flexible justificado"
                                                            >
                                                                Flexibilidad
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--teal-400)', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <CheckCircle size={13} /> Pagada
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            Seleccione un crédito de la lista izquierda para visualizar su plan de pagos y asentar cobranzas en caja.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
