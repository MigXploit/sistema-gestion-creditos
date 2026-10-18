import { estaEnModoMemoria, baseDatosEnMemoria, obtenerPool } from '../config/baseDeDatos.js';
import { auditoriaService } from './auditoriaService.js';
import { ReglaNegocioError } from '../middleware/manejadorErrores.js';

/**
 * Servicio para Gestión de Clientes (CU01 / RF01 / RF02 / P10).
 * Criterios: CA01, CA02, CA03.
 * Regla: RN12 (Auditoría).
 */
export const clienteService = {
    /**
     * CA01: Registro exitoso de cliente con validaciones obligatorias.
     * CA02: Si el CI ya existe, devuelve el cliente existente sin duplicar.
     */
    async registrarCliente(datosCliente, usernameOperador, ipOrigen) {
        const { ci, nombres, apellidos, telefono, direccion, ingresosMensuales } = datosCliente;

        if (!ci || !ci.trim()) {
            throw new ReglaNegocioError('El número de documento de identidad (CI) es obligatorio (CA01).');
        }
        if (!nombres || !nombres.trim()) {
            throw new ReglaNegocioError('Los nombres del cliente son obligatorios (CA01).');
        }
        if (!apellidos || !apellidos.trim()) {
            throw new ReglaNegocioError('Los apellidos del cliente son obligatorios (CA01).');
        }
        const ingresosNumericos = parseFloat(ingresosMensuales);
        if (isNaN(ingresosNumericos) || ingresosNumericos <= 0) {
            throw new ReglaNegocioError('Los ingresos mensuales deben ser mayores a cero (CA01).');
        }

        const ciLimpio = ci.trim();
        const fechaRegistroHoy = new Date().toISOString().split('T')[0];

        if (estaEnModoMemoria()) {
            const clienteExistente = baseDatosEnMemoria.clientes.find(c => c.ci === ciLimpio);
            if (clienteExistente) {
                // CA02: Mostrar el cliente existente y no crear otro
                return this.mapearAClienteDto(clienteExistente);
            }

            const nuevoIdCliente = baseDatosEnMemoria.contadores.idCliente++;
            const nuevoCliente = {
                id_cliente: nuevoIdCliente,
                ci: ciLimpio,
                nombres: nombres.trim(),
                apellidos: apellidos.trim(),
                telefono: telefono ? telefono.trim() : null,
                direccion: direccion ? direccion.trim() : null,
                ingresos_mensuales: ingresosNumericos,
                fecha_registro: fechaRegistroHoy,
            };

            baseDatosEnMemoria.clientes.push(nuevoCliente);

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'REGISTRAR_CLIENTE',
                entidad: 'CLIENTE',
                idEntidad: nuevoIdCliente,
                resultado: 'EXITOSO',
                detalles: `Registro de nuevo cliente CI: ${ciLimpio} - ${nuevoCliente.nombres} ${nuevoCliente.apellidos} con ingresos Bs ${ingresosNumericos}`,
                ipOrigen: ipOrigen,
            });

            return this.mapearAClienteDto(nuevoCliente);
        }

        const pool = obtenerPool();
        // Verificar si existe por CI
        const [existentes] = await pool.query('SELECT * FROM cliente WHERE ci = ?', [ciLimpio]);
        if (existentes.length > 0) {
            return this.mapearAClienteDto(existentes[0]);
        }

        const [resultadoInsert] = await pool.query(
            `INSERT INTO cliente (ci, nombres, apellidos, telefono, direccion, ingresos_mensuales, fecha_registro)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [ciLimpio, nombres.trim(), apellidos.trim(), telefono ? telefono.trim() : null, direccion ? direccion.trim() : null, ingresosNumericos, fechaRegistroHoy]
        );

        const nuevoId = resultadoInsert.insertId;

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'REGISTRAR_CLIENTE',
            entidad: 'CLIENTE',
            idEntidad: nuevoId,
            resultado: 'EXITOSO',
            detalles: `Registro de nuevo cliente CI: ${ciLimpio} - ${nombres} ${apellidos} con ingresos Bs ${ingresosNumericos}`,
            ipOrigen: ipOrigen,
        });

        return this.buscarPorId(nuevoId);
    },

    /**
     * RF02 / CA03: Solo se modifican teléfono y dirección.
     * El CI no es editable. Se audita el valor anterior con usuario y fecha.
     */
    async editarCliente(idCliente, datosModificados, usernameOperador, ipOrigen) {
        const id = parseInt(idCliente, 10);
        const { telefono, direccion } = datosModificados;

        if (estaEnModoMemoria()) {
            const cliente = baseDatosEnMemoria.clientes.find(c => c.id_cliente === id);
            if (!cliente) {
                throw new ReglaNegocioError(`Cliente no encontrado con ID: ${id}`);
            }

            const telefonoAnterior = cliente.telefono || 'Sin teléfono';
            const direccionAnterior = cliente.direccion || 'Sin dirección';

            cliente.telefono = telefono ? telefono.trim() : cliente.telefono;
            cliente.direccion = direccion ? direccion.trim() : cliente.direccion;

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'EDITAR_CLIENTE',
                entidad: 'CLIENTE',
                idEntidad: id,
                resultado: 'EXITOSO',
                detalles: `Actualización de cliente CI: ${cliente.ci}. Valores previos: [Tel: ${telefonoAnterior}, Dir: ${direccionAnterior}]. Nuevos: [Tel: ${cliente.telefono}, Dir: ${cliente.direccion}]`,
                ipOrigen: ipOrigen,
            });

            return this.mapearAClienteDto(cliente);
        }

        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT * FROM cliente WHERE id_cliente = ?', [id]);
        if (filas.length === 0) {
            throw new ReglaNegocioError(`Cliente no encontrado con ID: ${id}`);
        }

        const clienteActual = filas[0];
        const nuevoTelefono = telefono !== undefined ? telefono.trim() : clienteActual.telefono;
        const nuevaDireccion = direccion !== undefined ? direccion.trim() : clienteActual.direccion;

        await pool.query(
            'UPDATE cliente SET telefono = ?, direccion = ? WHERE id_cliente = ?',
            [nuevoTelefono, nuevaDireccion, id]
        );

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'EDITAR_CLIENTE',
            entidad: 'CLIENTE',
            idEntidad: id,
            resultado: 'EXITOSO',
            detalles: `Actualización de cliente CI: ${clienteActual.ci}. Valores previos: [Tel: ${clienteActual.telefono}, Dir: ${clienteActual.direccion}]. Nuevos: [Tel: ${nuevoTelefono}, Dir: ${nuevaDireccion}]`,
            ipOrigen: ipOrigen,
        });

        return this.buscarPorId(id);
    },

    async listarTodos() {
        if (estaEnModoMemoria()) {
            return baseDatosEnMemoria.clientes.map(this.mapearAClienteDto);
        }
        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT * FROM cliente ORDER BY fecha_registro DESC, id_cliente DESC');
        return filas.map(this.mapearAClienteDto);
    },

    async buscarPorId(idCliente) {
        const id = parseInt(idCliente, 10);
        if (estaEnModoMemoria()) {
            const cliente = baseDatosEnMemoria.clientes.find(c => c.id_cliente === id);
            if (!cliente) throw new ReglaNegocioError(`Cliente no encontrado con ID: ${id}`);
            return this.mapearAClienteDto(cliente);
        }
        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT * FROM cliente WHERE id_cliente = ?', [id]);
        if (filas.length === 0) throw new ReglaNegocioError(`Cliente no encontrado con ID: ${id}`);
        return this.mapearAClienteDto(filas[0]);
    },

    async buscarPorCi(ci) {
        const ciLimpio = ci.trim();
        if (estaEnModoMemoria()) {
            const cliente = baseDatosEnMemoria.clientes.find(c => c.ci === ciLimpio);
            if (!cliente) throw new ReglaNegocioError(`Cliente no encontrado con CI: ${ciLimpio}`);
            return this.mapearAClienteDto(cliente);
        }
        const pool = obtenerPool();
        const [filas] = await pool.query('SELECT * FROM cliente WHERE ci = ?', [ciLimpio]);
        if (filas.length === 0) throw new ReglaNegocioError(`Cliente no encontrado con CI: ${ciLimpio}`);
        return this.mapearAClienteDto(filas[0]);
    },

    mapearAClienteDto(fila) {
        return {
            idCliente: fila.id_cliente,
            ci: fila.ci,
            nombres: fila.nombres,
            apellidos: fila.apellidos,
            telefono: fila.telefono || undefined,
            direccion: fila.direccion || undefined,
            ingresosMensuales: parseFloat(fila.ingresos_mensuales),
            fechaRegistro: fila.fecha_registro instanceof Date
                ? fila.fecha_registro.toISOString().split('T')[0]
                : String(fila.fecha_registro).split('T')[0],
        };
    }
};
