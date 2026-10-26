import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ClienteItem, UsuarioSession } from '../types';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ClientesViewProps {
    user: UsuarioSession;
}

export const ClientesView: React.FC<ClientesViewProps> = ({ user }) => {
    const [clientes, setClientes] = useState<ClienteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [warningMsg, setWarningMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Modal Crear Cliente (P10)
    const [showCrearModal, setShowCrearModal] = useState(false);
    const [nuevoCi, setNuevoCi] = useState('');
    const [nuevoNombres, setNuevoNombres] = useState('');
    const [nuevoApellidos, setNuevoApellidos] = useState('');
    const [nuevoTelefono, setNuevoTelefono] = useState('');
    const [nuevoDireccion, setNuevoDireccion] = useState('');
    const [nuevoIngresos, setNuevoIngresos] = useState('');

    // Modal Editar Cliente (RF02 / CA03 / P15)
    const [clienteEditar, setClienteEditar] = useState<ClienteItem | null>(null);
    const [editTelefono, setEditTelefono] = useState('');
    const [editDireccion, setEditDireccion] = useState('');

    const cargarClientes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getClientes();
            setClientes(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarClientes();
    }, []);

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            setWarningMsg(null);
            setSuccessMsg(null);
            const res: any = await api.crearCliente({
                ci: nuevoCi,
                nombres: nuevoNombres,
                apellidos: nuevoApellidos,
                telefono: nuevoTelefono || null,
                direccion: nuevoDireccion || null,
                ingresosMensuales: parseFloat(nuevoIngresos)
            });

            if (res?.yaExistia) {
                setWarningMsg(`⚠️ Validación de Unicidad (CA02): El cliente con CI ${res.ci} ya se encontraba registrado en el sistema a nombre de "${res.nombres} ${res.apellidos}". Se recuperó su ficha original sin duplicar ni reescribir datos.`);
            } else {
                setSuccessMsg(`✅ Cliente ${res.nombres} ${res.apellidos} (CI: ${res.ci}) registrado exitosamente en el sistema (CA01).`);
            }

            setShowCrearModal(false);
            setNuevoCi('');
            setNuevoNombres('');
            setNuevoApellidos('');
            setNuevoTelefono('');
            setNuevoDireccion('');
            setNuevoIngresos('');
            cargarClientes();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const abrirEditar = (c: ClienteItem) => {
        setClienteEditar(c);
        setEditTelefono(c.telefono || '');
        setEditDireccion(c.direccion || '');
    };

    const handleEditar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clienteEditar) return;
        try {
            setError(null);
            await api.editarCliente(clienteEditar.idCliente, {
                telefono: editTelefono,
                direccion: editDireccion
            });
            setSuccessMsg(`Datos de contacto actualizados para CI ${clienteEditar.ci} (Registrado en Auditoría)`);
            setClienteEditar(null);
            cargarClientes();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const puedeRegistrar = user.rol === 'OFICIAL' || user.rol === 'ADMINISTRADOR';

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        Gestión de Clientes (P10 – CU01 / RF01 / RF02)
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Padrón de clientes solicitantes, datos de contacto e ingresos mensuales comprobados
                    </p>
                </div>
                {puedeRegistrar && (
                    <button className="btn btn-primary" onClick={() => setShowCrearModal(true)}>
                        + Registrar Nuevo Cliente
                    </button>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {warningMsg && (
                <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(245, 158, 11, 0.15)', border: '1.5px solid #f59e0b', color: '#fef3c7', marginBottom: '1rem', padding: '0.85rem 1rem' }}>
                    <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <div style={{ fontWeight: 500, lineHeight: 1.4 }}>{warningMsg}</div>
                </div>
            )}
            {successMsg && (
                <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', padding: '0.85rem 1rem' }}>
                    <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div style={{ fontWeight: 500, lineHeight: 1.4 }}>{successMsg}</div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Cargando clientes...</div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>CI</th>
                                <th>Nombre Completo</th>
                                <th>Teléfono</th>
                                <th>Dirección</th>
                                <th>Ingresos Mensuales</th>
                                <th>Fecha Registro</th>
                                {puedeRegistrar && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>
                                        No hay clientes registrados en el sistema.
                                    </td>
                                </tr>
                            ) : (
                                clientes.map(c => (
                                    <tr key={c.idCliente}>
                                        <td style={{ fontWeight: 600 }}>{c.ci}</td>
                                        <td>{c.nombres} {c.apellidos}</td>
                                        <td>{c.telefono || '—'}</td>
                                        <td>{c.direccion || '—'}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                            Bs {c.ingresosMensuales.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>{c.fechaRegistro}</td>
                                        {puedeRegistrar && (
                                            <td>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                    onClick={() => abrirEditar(c)}
                                                >
                                                    Editar Contacto
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Crear Cliente */}
            {showCrearModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary-dark)' }}>
                            Registrar Cliente (P10)
                        </h3>
                        <form onSubmit={handleCrear}>
                            <div className="form-group">
                                <label className="form-label">Documento de Identidad (CI) *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    placeholder="Ej: 4587231"
                                    value={nuevoCi}
                                    onChange={e => setNuevoCi(e.target.value)}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                                    Si el CI ya existe, se mostrará el cliente existente sin duplicar (CA02).
                                </span>
                                {nuevoCi.trim() && clientes.some(c => c.ci.trim() === nuevoCi.trim()) && (
                                    <div style={{
                                        marginTop: '0.5rem',
                                        padding: '0.65rem 0.85rem',
                                        background: 'rgba(245, 158, 11, 0.15)',
                                        border: '1.5px solid #f59e0b',
                                        borderRadius: 'var(--radius)',
                                        color: '#fef3c7',
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        lineHeight: 1.4
                                    }}>
                                        <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                                        <div>
                                            <strong>Aviso de Unicidad (CA02):</strong> Este CI ya pertenece a <strong>{clientes.find(c => c.ci.trim() === nuevoCi.trim())?.nombres} {clientes.find(c => c.ci.trim() === nuevoCi.trim())?.apellidos}</strong>. Al guardar se conservará la ficha existente sin crear duplicados.
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nombres *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    placeholder="Ej: María Elena"
                                    value={nuevoNombres}
                                    onChange={e => setNuevoNombres(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Apellidos *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    placeholder="Ej: Quispe Mamani"
                                    value={nuevoApellidos}
                                    onChange={e => setNuevoApellidos(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Teléfono / Celular</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ej: 70012345"
                                    value={nuevoTelefono}
                                    onChange={e => setNuevoTelefono(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Dirección Domiciliaria</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ej: Sopocachi, Calle Rosendo Gutiérrez"
                                    value={nuevoDireccion}
                                    onChange={e => setNuevoDireccion(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ingresos Mensuales Declarados (Bs) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="form-input"
                                    required
                                    placeholder="Ej: 6500.00"
                                    value={nuevoIngresos}
                                    onChange={e => setNuevoIngresos(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCrearModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Guardar Cliente (CA01)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar Cliente (RF02 / CA03 / P15) */}
            {clienteEditar && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary-dark)' }}>
                            Editar Cliente (RF02 / CA03)
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Por normativa bancaria (RF02), solo se permite actualizar teléfono y dirección. El CI no es editable y los valores anteriores se guardan en auditoría.
                        </p>
                        <form onSubmit={handleEditar}>
                            <div className="form-group">
                                <label className="form-label">CI (Bloqueado por seguridad)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    disabled
                                    value={clienteEditar.ci}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cliente</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    disabled
                                    value={`${clienteEditar.nombres} ${clienteEditar.apellidos}`}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Teléfono / Celular Autorizado</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editTelefono}
                                    onChange={e => setEditTelefono(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Dirección Domiciliaria Autorizada</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editDireccion}
                                    onChange={e => setEditDireccion(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setClienteEditar(null)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Guardar Cambios y Auditar (CA03)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
