import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ClienteItem, UsuarioSession } from '../types';

interface ClientesViewProps {
    user: UsuarioSession;
}

export const ClientesView: React.FC<ClientesViewProps> = ({ user }) => {
    const [clientes, setClientes] = useState<ClienteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Modal Crear Cliente (P10)
    const [showCrearModal, setShowCrearModal] = useState(false);
    const [nuevoCi, setNuevoCi] = useState('');
    const [nuevoNombres, setNuevoNombres] = useState('');
    const [nuevoApellidos, setNuevoApellidos] = useState('');
    const [nuevoTelefono, setNuevoTelefono] = useState('');
    const [nuevoEmail, setNuevoEmail] = useState('');
    const [nuevoDireccion, setNuevoDireccion] = useState('');
    const [nuevoIngresos, setNuevoIngresos] = useState('');

    // Modal Editar Cliente (RF02 / CA03 / P15)
    const [clienteEditar, setClienteEditar] = useState<ClienteItem | null>(null);
    const [editTelefono, setEditTelefono] = useState('');
    const [editEmail, setEditEmail] = useState('');
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
            await api.crearCliente({
                ci: nuevoCi,
                nombres: nuevoNombres,
                apellidos: nuevoApellidos,
                telefono: nuevoTelefono || null,
                email: nuevoEmail || null,
                direccion: nuevoDireccion || null,
                ingresosMensuales: parseFloat(nuevoIngresos)
            });
            setSuccessMsg('Cliente registrado exitosamente (o recuperado si ya existía)');
            setShowCrearModal(false);
            setNuevoCi('');
            setNuevoNombres('');
            setNuevoApellidos('');
            setNuevoTelefono('');
            setNuevoEmail('');
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
        setEditEmail(c.email || '');
        setEditDireccion(c.direccion || '');
    };

    const handleEditar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clienteEditar) return;
        try {
            setError(null);
            await api.editarCliente(clienteEditar.idCliente, {
                telefono: editTelefono,
                email: editEmail,
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
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Cargando clientes...</div>
            ) : (
                <div className="table-container" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>CI</th>
                                <th>Nombre Completo</th>
                                <th>Teléfono</th>
                                <th>Correo Electrónico</th>
                                <th>Dirección</th>
                                <th>Ingresos Mensuales</th>
                                <th>Fecha Registro</th>
                                {puedeRegistrar && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>
                                        No hay clientes registrados en el sistema.
                                    </td>
                                </tr>
                            ) : (
                                clientes.map(c => (
                                    <tr key={c.idCliente}>
                                        <td style={{ fontWeight: 600 }}>{c.ci}</td>
                                        <td>{c.nombres} {c.apellidos}</td>
                                        <td>{c.telefono || '—'}</td>
                                        <td style={{ color: 'var(--purple-300)' }}>{c.email || '—'}</td>
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

            {/* Modal Crear Cliente con distribución compacta */}
            {showCrearModal && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '640px' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary-dark)' }}>
                            Registrar Cliente (P10)
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Si el CI ya existe, se mostrará el cliente existente sin duplicar (CA02).
                        </p>
                        <form onSubmit={handleCrear}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                    <label className="form-label">Documento de Identidad (CI) *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        placeholder="Ej: 4587231 LP"
                                        value={nuevoCi}
                                        onChange={e => setNuevoCi(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
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
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
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
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
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
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                    <label className="form-label">Teléfono / Celular</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ej: 70012345"
                                        value={nuevoTelefono}
                                        onChange={e => setNuevoTelefono(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                    <label className="form-label">Correo Electrónico (Notificaciones)</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Ej: maria.quispe@gmail.com"
                                        value={nuevoEmail}
                                        onChange={e => setNuevoEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                                <label className="form-label">Dirección Domiciliaria</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ej: Sopocachi, Calle Rosendo Gutiérrez #452"
                                    value={nuevoDireccion}
                                    onChange={e => setNuevoDireccion(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
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
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary-dark)' }}>
                            Editar Cliente (RF02 / CA03)
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Por normativa bancaria (RF02), solo se permite actualizar datos de contacto (teléfono, correo y dirección). El CI es inmutable y los cambios se registran en auditoría.
                        </p>
                        <form onSubmit={handleEditar}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                    <label className="form-label">CI (Bloqueado por seguridad)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        disabled
                                        value={clienteEditar.ci}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                    <label className="form-label">Cliente</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        disabled
                                        value={`${clienteEditar.nombres} ${clienteEditar.apellidos}`}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                    <label className="form-label">Teléfono / Celular Autorizado</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editTelefono}
                                        onChange={e => setEditTelefono(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                    <label className="form-label">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={editEmail}
                                        onChange={e => setEditEmail(e.target.value)}
                                        placeholder="cliente@ejemplo.com"
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                                <label className="form-label">Dirección Domiciliaria Autorizada</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editDireccion}
                                    onChange={e => setEditDireccion(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
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
