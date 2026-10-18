import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { RolUsuario, UsuarioItem } from '../types';

export const UsuariosView: React.FC = () => {
    const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Formulario modal
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('Bancario2026!');
    const [rol, setRol] = useState<RolUsuario>('OFICIAL');
    const [limiteAtribucion, setLimiteAtribucion] = useState('0.00');

    const cargarUsuarios = async () => {
        try {
            setLoading(true);
            const data = await api.getUsuarios();
            setUsuarios(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const handleCrearUsuario = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.crearUsuario({
                nombreCompleto,
                login,
                password,
                rol,
                limiteAtribucion: parseFloat(limiteAtribucion) || 0,
                activo: true
            });
            setShowModal(false);
            setNombreCompleto('');
            setLogin('');
            setPassword('Bancario2026!');
            setRol('OFICIAL');
            setLimiteAtribucion('0.00');
            cargarUsuarios();
        } catch (err: any) {
            alert('Error al crear usuario: ' + err.message);
        }
    };

    const handleToggleEstado = async (id: number, activoActual: boolean) => {
        try {
            await api.cambiarEstadoUsuario(id, !activoActual);
            cargarUsuarios();
        } catch (err: any) {
            alert('Error al cambiar estado: ' + err.message);
        }
    };

    const handleRolChange = (nuevoRol: RolUsuario) => {
        setRol(nuevoRol);
        if (nuevoRol === 'JEFE') {
            setLimiteAtribucion('70000.00');
        } else {
            setLimiteAtribucion('0.00');
        }
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3>P14: Usuarios y Roles</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Gestión de accesos, perfiles de funcionario y límites de atribución (CU15 - RF16).
                        </p>
                    </div>
                    <button
                        className="btn-primary"
                        style={{ width: 'auto', padding: '0.5rem 1rem' }}
                        onClick={() => setShowModal(true)}
                    >
                        + Nuevo Usuario
                    </button>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>Cargando catálogo de usuarios...</p>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre Completo</th>
                                    <th>Login</th>
                                    <th>Rol RBAC</th>
                                    <th>Límite Atribución</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map((u) => (
                                    <tr key={u.idUsuario}>
                                        <td>{u.idUsuario}</td>
                                        <td><strong>{u.nombreCompleto}</strong></td>
                                        <td><code>{u.login}</code></td>
                                        <td>
                                            <span className={`role-pill role-${u.rol}`}>{u.rol}</span>
                                        </td>
                                        <td>Bs {Number(u.limiteAtribucion).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: u.activo ? 'var(--success-bg)' : 'var(--danger-bg)',
                                                color: u.activo ? 'var(--success)' : 'var(--danger)'
                                            }}>
                                                {u.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => handleToggleEstado(u.idUsuario, u.activo)}
                                                style={{
                                                    padding: '0.3rem 0.65rem',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {u.activo ? 'Desactivar' : 'Activar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Nuevo Usuario */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-dialog">
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Registrar Nuevo Usuario</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCrearUsuario}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Nombre Completo *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={nombreCompleto}
                                        onChange={(e) => setNombreCompleto(e.target.value)}
                                        required
                                        placeholder="Ej. Roberto Paredes"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Login de Acceso *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={login}
                                        onChange={(e) => setLogin(e.target.value)}
                                        required
                                        placeholder="Ej. rparedes"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contraseña Inicial *</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Rol del Sistema *</label>
                                    <select
                                        className="form-control"
                                        value={rol}
                                        onChange={(e) => handleRolChange(e.target.value as RolUsuario)}
                                    >
                                        <option value="OFICIAL">OFICIAL (Oficial de Crédito)</option>
                                        <option value="ANALISTA">ANALISTA (Analista de Crédito)</option>
                                        <option value="JEFE">JEFE (Jefe de Créditos)</option>
                                        <option value="CAJERO">CAJERO (Cajero)</option>
                                        <option value="GERENTE">GERENTE (Gerente)</option>
                                        <option value="ADMINISTRADOR">ADMINISTRADOR (Administrador)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Límite de Atribución (Bs)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={limiteAtribucion}
                                        onChange={(e) => setLimiteAtribucion(e.target.value)}
                                        disabled={rol !== 'JEFE'}
                                    />
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        {rol === 'JEFE' ? 'Límite máximo permitido: Bs 70.000,00' : 'Fijado en 0,00 para este rol'}
                                    </span>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                                    Guardar Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
