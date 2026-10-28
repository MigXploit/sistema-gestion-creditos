import { estaEnModoMemoria, baseDatosEnMemoria, obtenerPool } from '../config/baseDeDatos.js';
import { coreBancarioService } from './coreBancarioService.js';
import { auditoriaService } from './auditoriaService.js';
import { notificacionService } from './notificacionService.js';
import { ReglaNegocioError } from '../middleware/manejadorErrores.js';
import { ESTADOS_CREDITO, ESTADOS_CUOTA, ESTADOS_CONTRATO } from '../config/reglasNegocio.js';

/**
 * Servicio de Desembolso, Cobranza en Ventanilla y Control de Mora (CU11, CU12, CU13).
 * RF12, RF13, RF14.
 * Criterios: CA17, CA18, CA19, CA20, CA21, CA22.
 * Estándares: Prelación contable estricta (1° Mora -> 2° Interés -> 3° Capital) e imputación transparente.
 */
export const pagoService = {
    /**
     * CU11 / RF12 / CA17: Desembolsar crédito con integración a Core Bancario.
     * Precondiciones: Contrato y cronograma existentes; crédito en estado APROBADO.
     */
    async desembolsarCredito(idCredito, usernameOperador, ipOrigen) {
        const id = parseInt(idCredito, 10);

        if (estaEnModoMemoria()) {
            const credito = baseDatosEnMemoria.creditos.find(c => c.id_credito === id);
            if (!credito) throw new ReglaNegocioError(`Crédito no encontrado con ID: ${id}`);

            if (credito.estado !== ESTADOS_CREDITO.APROBADO) {
                throw new ReglaNegocioError(`Solo se pueden desembolsar créditos en estado APROBADO. Estado actual: ${credito.estado}`);
            }

            const solicitud = baseDatosEnMemoria.solicitudes.find(s => s.id_solicitud === credito.id_solicitud);
            const cliente = solicitud ? baseDatosEnMemoria.clientes.find(c => c.id_cliente === solicitud.id_cliente) : null;
            const ciCliente = cliente ? cliente.ci : 'Desconocido';

            // Invocar simulador de Core Bancario (CA17 / CA18)
            const respuestaCore = await coreBancarioService.ejecutarDesembolsoFondos(
                id,
                credito.numero_credito,
                credito.monto_aprobado,
                ciCliente
            );

            if (!respuestaCore.exitoso) {
                await auditoriaService.registrarEvento({
                    username: usernameOperador,
                    operacion: 'DESEMBOLSO_RECHAZADO_CORE',
                    entidad: 'CREDITO',
                    idEntidad: id,
                    resultado: 'FALLIDO',
                    detalles: `Fallo de desembolso para crédito ${credito.numero_credito}: ${respuestaCore.mensaje}`,
                    ipOrigen: ipOrigen,
                });
                throw new ReglaNegocioError(respuestaCore.mensaje);
            }

            // Transición a VIGENTE (CA17)
            credito.fecha_desembolso = respuestaCore.fechaDesembolso;
            credito.saldo_capital = credito.monto_aprobado;
            credito.estado = ESTADOS_CREDITO.VIGENTE;

            // Firmar contrato si estaba pendiente
            const contrato = baseDatosEnMemoria.contratos.find(c => c.id_credito === id);
            if (contrato) {
                contrato.fecha_firma = respuestaCore.fechaDesembolso;
                contrato.estado = ESTADOS_CONTRATO.FIRMADO;
            }

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'DESEMBOLSAR_CREDITO',
                entidad: 'CREDITO',
                idEntidad: id,
                resultado: 'EXITOSO',
                detalles: `Crédito ${credito.numero_credito} desembolsado por Bs ${credito.monto_aprobado} mediante Core Bancario (${respuestaCore.codigoTransaccion})`,
                ipOrigen: ipOrigen,
            });

            return {
                idCredito: id,
                numeroCredito: credito.numero_credito,
                montoAprobado: credito.monto_aprobado,
                fechaDesembolso: credito.fecha_desembolso,
                saldoCapital: credito.saldo_capital,
                estado: credito.estado,
                codigoTransaccionCore: respuestaCore.codigoTransaccion,
                mensaje: respuestaCore.mensaje,
            };
        }

        const pool = obtenerPool();
        const [creditos] = await pool.query(
            `SELECT cr.*, s.numero_solicitud, c.ci AS ciCliente
             FROM credito cr
             JOIN solicitud_credito s ON cr.id_solicitud = s.id_solicitud
             JOIN cliente c ON s.id_cliente = c.id_cliente
             WHERE cr.id_credito = ?`,
            [id]
        );
        if (creditos.length === 0) throw new ReglaNegocioError(`Crédito no encontrado con ID: ${id}`);
        const credito = creditos[0];

        if (credito.estado !== ESTADOS_CREDITO.APROBADO) {
            throw new ReglaNegocioError(`Solo se pueden desembolsar créditos en estado APROBADO. Estado actual: ${credito.estado}`);
        }

        const respuestaCore = await coreBancarioService.ejecutarDesembolsoFondos(
            id,
            credito.numero_credito,
            credito.monto_aprobado,
            credito.ciCliente
        );

        if (!respuestaCore.exitoso) {
            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'DESEMBOLSO_RECHAZADO_CORE',
                entidad: 'CREDITO',
                idEntidad: id,
                resultado: 'FALLIDO',
                detalles: `Fallo de desembolso para crédito ${credito.numero_credito}: ${respuestaCore.mensaje}`,
                ipOrigen: ipOrigen,
            });
            throw new ReglaNegocioError(respuestaCore.mensaje);
        }

        await pool.query(
            `UPDATE credito SET fecha_desembolso = ?, saldo_capital = monto_aprobado, estado = ? WHERE id_credito = ?`,
            [respuestaCore.fechaDesembolso, ESTADOS_CREDITO.VIGENTE, id]
        );
        await pool.query(
            `UPDATE contrato SET fecha_firma = ?, estado = ? WHERE id_credito = ?`,
            [respuestaCore.fechaDesembolso, ESTADOS_CONTRATO.FIRMADO, id]
        );

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'DESEMBOLSAR_CREDITO',
            entidad: 'CREDITO',
            idEntidad: id,
            resultado: 'EXITOSO',
            detalles: `Crédito ${credito.numero_credito} desembolsado por Bs ${credito.monto_aprobado} mediante Core Bancario (${respuestaCore.codigoTransaccion})`,
            ipOrigen: ipOrigen,
        });

        return {
            idCredito: id,
            numeroCredito: credito.numero_credito,
            montoAprobado: parseFloat(credito.monto_aprobado),
            fechaDesembolso: respuestaCore.fechaDesembolso,
            saldoCapital: parseFloat(credito.monto_aprobado),
            estado: ESTADOS_CREDITO.VIGENTE,
            codigoTransaccionCore: respuestaCore.codigoTransaccion,
            mensaje: respuestaCore.mensaje,
        };
    },

    /**
     * CU12 / RF13 / CA19: Cobro y registro de pagos en ventanilla (Caja).
     * Prelación contable en cascada estricta (Sección 13.5):
     * 1° Mora Acumulada -> 2° Interés Compensatorio -> 3° Capital Vivo.
     * Si saldo restante del crédito llega a cero -> Crédito pasa a CANCELADO (CA21).
     */
    async registrarPagoCuota(datosPago, usernameOperador, ipOrigen) {
        const idCuota = datosPago.idCuota;
        const id = parseInt(idCuota, 10);
        const monto = parseFloat(datosPago.montoAbonado !== undefined ? datosPago.montoAbonado : datosPago.montoPagado);
        const metodoPago = datosPago.formaPago || 'EFECTIVO';

        if (isNaN(monto) || monto <= 0) {
            throw new ReglaNegocioError('El monto abonado debe ser mayor a cero (CA20).');
        }

        const fechaPagoHoy = new Date().toISOString().split('T')[0];

        if (estaEnModoMemoria()) {
            const cuota = baseDatosEnMemoria.cuotas.find(c => c.id_cuota === id);
            if (!cuota) throw new ReglaNegocioError(`Cuota no encontrada con ID: ${id}`);

            const credito = baseDatosEnMemoria.creditos.find(cr => cr.id_credito === cuota.id_credito);
            if (!credito) throw new ReglaNegocioError('Crédito asociado a la cuota no encontrado.');

            if (cuota.estado === ESTADOS_CUOTA.PAGADA) {
                throw new ReglaNegocioError(`La cuota N° ${cuota.numero_cuota} ya se encuentra totalmente PAGADA.`);
            }

            const saldoCuota = parseFloat(cuota.saldo_pendiente);
            if (monto > saldoCuota) {
                throw new ReglaNegocioError(
                    `El monto ingresado (Bs ${monto}) supera el saldo exigible de la cuota (Bs ${saldoCuota}). Verifique antes de confirmar (CA20).`
                );
            }

            // Cascada de prelación contable:
            let remanente = monto;
            const moraPendiente = parseFloat(cuota.interes_mora || 0);
            const interesPendiente = parseFloat(cuota.interes_comp || 0);

            // 1. Imputar a mora
            const pagoMora = Math.min(remanente, moraPendiente);
            remanente = Math.round((remanente - pagoMora) * 100) / 100;

            // 2. Imputar a interés
            const pagoInteres = Math.min(remanente, interesPendiente);
            remanente = Math.round((remanente - pagoInteres) * 100) / 100;

            // 3. Imputar a capital
            const pagoCapital = remanente;

            // Actualizar saldo cuota
            cuota.saldo_pendiente = Math.round((cuota.saldo_pendiente - monto) * 100) / 100;
            if (cuota.saldo_pendiente <= 0) {
                cuota.saldo_pendiente = 0;
                cuota.estado = ESTADOS_CUOTA.PAGADA;
            }

            // Amortizar capital del crédito
            credito.saldo_capital = Math.round((credito.saldo_capital - pagoCapital) * 100) / 100;

            // CA21: Cancelación del crédito si saldo exigible es cero
            if (credito.saldo_capital <= 0) {
                credito.saldo_capital = 0;
                credito.estado = ESTADOS_CREDITO.CANCELADO;
            } else if (credito.estado === ESTADOS_CREDITO.EN_MORA) {
                // Verificar si quedan cuotas vencidas
                const quedanVencidas = baseDatosEnMemoria.cuotas.some(
                    c => c.id_credito === credito.id_credito && c.estado === ESTADOS_CUOTA.VENCIDA
                );
                if (!quedanVencidas) {
                    credito.estado = ESTADOS_CREDITO.VIGENTE;
                }
            }

            const nuevoIdPago = baseDatosEnMemoria.contadores.idPago++;
            const numeroRecibo = `REC-${String(nuevoIdPago).padStart(5, '0')}`;

            const nuevoPago = {
                id_pago: nuevoIdPago,
                id_cuota: id,
                fecha_pago: fechaPagoHoy,
                monto: monto,
                monto_mora: pagoMora,
                monto_interes: pagoInteres,
                monto_capital: pagoCapital,
                forma_pago: metodoPago,
                numero_recibo: numeroRecibo,
            };
            baseDatosEnMemoria.pagos.push(nuevoPago);

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'REGISTRAR_PAGO',
                entidad: 'PAGO',
                idEntidad: nuevoIdPago,
                resultado: 'EXITOSO',
                detalles: `Pago de Bs ${monto} registrado para Cuota N° ${cuota.numero_cuota} (Crédito ${credito.numero_credito}). Recibo: ${numeroRecibo}. Desglose: [Mora: ${pagoMora}, Interés: ${pagoInteres}, Capital: ${pagoCapital}]. Saldo crédito restante: Bs ${credito.saldo_capital}`,
                ipOrigen: ipOrigen,
            });

            let notifResMemoria = null;
            try {
                const solMem = baseDatosEnMemoria.solicitudes.find(s => s.id_solicitud === credito.id_solicitud);
                const cliMem = solMem ? baseDatosEnMemoria.clientes.find(c => c.id_cliente === solMem.id_cliente) : null;
                const emailCli = cliMem?.email || (cliMem ? `${cliMem.nombres.toLowerCase().replace(/\s+/g, '.')}@gmail.com` : 'cliente@banco-umsa.edu.bo');
                const nomCli = cliMem ? `${cliMem.nombres} ${cliMem.apellidos}` : 'Cliente Bancario';
                notifResMemoria = await notificacionService.enviarNotificacionPago({
                    destinatario: emailCli,
                    nombreCliente: nomCli,
                    numeroRecibo: numeroRecibo,
                    numeroCredito: credito.numero_credito,
                    numeroCuota: cuota.numero_cuota,
                    montoTotal: monto,
                    montoMora: pagoMora,
                    montoInteres: pagoInteres,
                    montoCapital: pagoCapital,
                    saldoCapitalCredito: credito.saldo_capital,
                    formaPago: metodoPago,
                    fechaPago: fechaPagoHoy,
                    usernameOperador,
                    ipOrigen
                });
            } catch (errNotif) {
                console.warn('Error al enviar notificacion de pago en memoria:', errNotif.message);
            }

            return {
                idPago: nuevoIdPago,
                numeroRecibo: numeroRecibo,
                idCuota: id,
                numeroCuota: cuota.numero_cuota,
                montoTotal: monto,
                montoMora: pagoMora,
                montoInteres: pagoInteres,
                montoCapital: pagoCapital,
                saldoPendienteCuota: cuota.saldo_pendiente,
                estadoCuota: cuota.estado,
                saldoCapitalCredito: credito.saldo_capital,
                estadoCredito: credito.estado,
                fechaPago: fechaPagoHoy,
                formaPago: metodoPago,
                notificacionEmail: notifResMemoria,
            };
        }

        const pool = obtenerPool();
        const conexionTransaccional = await pool.getConnection();

        try {
            await conexionTransaccional.beginTransaction();

            const [cuotas] = await conexionTransaccional.query('SELECT * FROM cuota WHERE id_cuota = ?', [id]);
            if (cuotas.length === 0) throw new ReglaNegocioError(`Cuota no encontrada con ID: ${id}`);
            const cuota = cuotas[0];

            if (cuota.estado === ESTADOS_CUOTA.PAGADA) {
                throw new ReglaNegocioError(`La cuota N° ${cuota.numero_cuota} ya se encuentra totalmente PAGADA.`);
            }

            const saldoCuota = parseFloat(cuota.saldo_pendiente);
            if (monto > saldoCuota) {
                throw new ReglaNegocioError(
                    `El monto ingresado (Bs ${monto}) supera el saldo exigible de la cuota (Bs ${saldoCuota}) (CA20).`
                );
            }

            const [creditos] = await conexionTransaccional.query('SELECT * FROM credito WHERE id_credito = ?', [cuota.id_credito]);
            const credito = creditos[0];

            let remanente = monto;
            const moraPendiente = parseFloat(cuota.interes_mora || 0);
            const interesPendiente = parseFloat(cuota.interes_comp || 0);

            const pagoMora = Math.min(remanente, moraPendiente);
            remanente = Math.round((remanente - pagoMora) * 100) / 100;

            const pagoInteres = Math.min(remanente, interesPendiente);
            remanente = Math.round((remanente - pagoInteres) * 100) / 100;

            const pagoCapital = remanente;

            const nuevoSaldoCuota = Math.round((saldoCuota - monto) * 100) / 100;
            const nuevoEstadoCuota = nuevoSaldoCuota <= 0 ? ESTADOS_CUOTA.PAGADA : cuota.estado;

            await conexionTransaccional.query(
                'UPDATE cuota SET saldo_pendiente = ?, estado = ? WHERE id_cuota = ?',
                [nuevoSaldoCuota, nuevoEstadoCuota, id]
            );

            // Verificar si quedan cuotas pendientes en el crédito
            const [cuotasRestantes] = await conexionTransaccional.query(
                "SELECT COUNT(*) AS pendientes FROM cuota WHERE id_credito = ? AND estado != 'PAGADA'",
                [cuota.id_credito]
            );
            const totalCuotasPendientes = cuotasRestantes[0]?.pendientes || 0;

            const nuevoSaldoCapital = Math.round((parseFloat(credito.saldo_capital) - pagoCapital) * 100) / 100;
            let nuevoEstadoCredito = credito.estado;

            // Si el saldo capital llega a cero o si ya no existen cuotas pendientes (CA21)
            if (nuevoSaldoCapital <= 0.05 || totalCuotasPendientes === 0) {
                nuevoEstadoCredito = ESTADOS_CREDITO.CANCELADO; // CA21: Totalmente pagado y cancelado
            }

            await conexionTransaccional.query(
                'UPDATE credito SET saldo_capital = ?, estado = ? WHERE id_credito = ?',
                [Math.max(0, nuevoSaldoCapital), nuevoEstadoCredito, cuota.id_credito]
            );

            // Si el crédito se canceló en su totalidad, liquidar contrato y liberar garantías
            if (nuevoEstadoCredito === ESTADOS_CREDITO.CANCELADO) {
                await conexionTransaccional.query(
                    "UPDATE contrato SET estado = 'LIQUIDADO' WHERE id_credito = ?",
                    [cuota.id_credito]
                );
                await conexionTransaccional.query(
                    "UPDATE garantia SET estado = 'LIBERADA' WHERE id_credito = ?",
                    [cuota.id_credito]
                );
                await conexionTransaccional.query(
                    "UPDATE solicitud_credito SET estado = 'PAGADA' WHERE id_solicitud = ?",
                    [credito.id_solicitud]
                );
                await auditoriaService.registrarEvento({
                    username: usernameOperador,
                    operacion: 'CANCELACION_TOTAL_CREDITO',
                    entidad: 'CREDITO',
                    idEntidad: cuota.id_credito,
                    resultado: 'EXITOSO',
                    detalles: `Crédito N° ${credito.numero_credito} amortizado en su totalidad. Estado actualizado a CANCELADO, contrato LIQUIDADO y garantías LIBERADAS (CA21).`,
                    ipOrigen: ipOrigen,
                });
            }

            const [conteoPagos] = await conexionTransaccional.query('SELECT COUNT(*) AS total FROM pago');
            const numeroRecibo = `REC-${String(conteoPagos[0].total + 1).padStart(5, '0')}`;

            const [resPago] = await conexionTransaccional.query(
                `INSERT INTO pago (id_cuota, fecha_pago, monto, monto_mora, monto_interes, monto_capital, forma_pago, numero_recibo)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, fechaPagoHoy, monto, pagoMora, pagoInteres, pagoCapital, metodoPago, numeroRecibo]
            );
            const idPago = resPago.insertId;

            await conexionTransaccional.commit();

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'REGISTRAR_PAGO',
                entidad: 'PAGO',
                idEntidad: idPago,
                resultado: 'EXITOSO',
                detalles: `Pago de Bs ${monto} registrado para Cuota N° ${cuota.numero_cuota}. Recibo: ${numeroRecibo}. Saldo capital restante: Bs ${nuevoSaldoCapital}`,
                ipOrigen: ipOrigen,
            });

            // Enviar notificación por correo al cliente
            let notifRes = null;
            try {
                const [infoClientes] = await pool.query(
                    `SELECT c.nombres, c.apellidos, c.email, cr.numero_credito
                     FROM cuota cu
                     JOIN credito cr ON cu.id_credito = cr.id_credito
                     JOIN solicitud_credito s ON cr.id_solicitud = s.id_solicitud
                     JOIN cliente c ON s.id_cliente = c.id_cliente
                     WHERE cu.id_cuota = ?`,
                    [id]
                );
                let nomCli = 'Cliente Bancario';
                let emailCli = 'cliente@banco-umsa.edu.bo';
                let numCred = credito.numero_credito;
                if (infoClientes.length > 0) {
                    nomCli = `${infoClientes[0].nombres} ${infoClientes[0].apellidos}`.trim();
                    emailCli = infoClientes[0].email || `${infoClientes[0].nombres.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
                    numCred = infoClientes[0].numero_credito;
                }
                notifRes = await notificacionService.enviarNotificacionPago({
                    destinatario: emailCli,
                    nombreCliente: nomCli,
                    numeroRecibo: numeroRecibo,
                    numeroCredito: numCred,
                    numeroCuota: cuota.numero_cuota,
                    montoTotal: monto,
                    montoMora: pagoMora,
                    montoInteres: pagoInteres,
                    montoCapital: pagoCapital,
                    saldoCapitalCredito: nuevoSaldoCapital,
                    formaPago: metodoPago,
                    fechaPago: fechaPagoHoy,
                    usernameOperador,
                    ipOrigen
                });
            } catch (errNotif) {
                console.warn('Error al enviar notificación:', errNotif.message);
            }

            return {
                idPago: idPago,
                numeroRecibo: numeroRecibo,
                idCuota: id,
                numeroCuota: cuota.numero_cuota,
                montoTotal: monto,
                montoMora: pagoMora,
                montoInteres: pagoInteres,
                montoCapital: pagoCapital,
                saldoPendienteCuota: nuevoSaldoCuota,
                estadoCuota: nuevoEstadoCuota,
                saldoCapitalCredito: nuevoSaldoCapital,
                estadoCredito: nuevoEstadoCredito,
                fechaPago: fechaPagoHoy,
                formaPago: metodoPago,
                notificacionEmail: notifRes,
            };
        } catch (error) {
            await conexionTransaccional.rollback();
            throw error;
        } finally {
            conexionTransaccional.release();
        }
    },

    /**
     * CU13 / RF14 / CA22: Ejecutar proceso de control y detección de mora.
     * Busca cuotas con fecha vencida y sin pagar, calcula interés moratorio diario y pasa crédito a EN_MORA.
     */
    async ejecutarControlMora(usernameOperador, ipOrigen) {
        const fechaHoy = new Date().toISOString().split('T')[0];
        let cuotasAfectadas = 0;

        if (estaEnModoMemoria()) {
            for (const cuota of baseDatosEnMemoria.cuotas) {
                if ((cuota.estado === ESTADOS_CUOTA.PENDIENTE || cuota.estado === ESTADOS_CUOTA.VENCIDA) && cuota.fecha_vencimiento < fechaHoy) {
                    const diasAtraso = Math.max(1, Math.floor((new Date(fechaHoy) - new Date(cuota.fecha_vencimiento)) / (1000 * 60 * 60 * 24)));
                    const credito = baseDatosEnMemoria.creditos.find(c => c.id_credito === cuota.id_credito);
                    const tasaMoraAnual = credito ? parseFloat(credito.tasa_mora || 18.0) : 18.0;

                    // Mora diaria = Saldo capital de cuota * (tasaMora / 360) * diasAtraso (CU13 / RF14)
                    const moraCalculada = Math.round((parseFloat(cuota.capital) * (tasaMoraAnual / 100.0 / 360.0) * diasAtraso) * 100) / 100;

                    cuota.dias_mora = diasAtraso;
                    cuota.interes_mora = moraCalculada;
                    cuota.estado = ESTADOS_CUOTA.VENCIDA;
                    cuota.saldo_pendiente = Math.round((parseFloat(cuota.capital) + parseFloat(cuota.interes_comp) + moraCalculada) * 100) / 100;

                    if (credito && (credito.estado === ESTADOS_CREDITO.VIGENTE || credito.estado === ESTADOS_CREDITO.EN_MORA)) {
                        credito.estado = ESTADOS_CREDITO.EN_MORA;
                    }
                    cuotasAfectadas++;
                }
            }

            await auditoriaService.registrarEvento({
                username: usernameOperador,
                operacion: 'CONTROL_MORA_EJECUTADO',
                entidad: 'SISTEMA',
                idEntidad: 'JOB_MORA',
                resultado: 'EXITOSO',
                detalles: `Proceso de control de mora ejecutado para fecha ${fechaHoy}. Cuotas marcadas en mora: ${cuotasAfectadas}.`,
                ipOrigen: ipOrigen,
            });

            return {
                exitoso: true,
                fechaEjecucion: fechaHoy,
                cuotasAfectadas: cuotasAfectadas,
                mensaje: `Control de mora ejecutado: ${cuotasAfectadas} cuotas vencidas actualizadas.`,
            };
        }

        const pool = obtenerPool();
        const [cuotasVencidas] = await pool.query(
            `SELECT c.*, cr.tasa_mora, cr.estado AS estadoCredito
             FROM cuota c
             JOIN credito cr ON c.id_credito = cr.id_credito
             WHERE c.estado IN ('PENDIENTE', 'VENCIDA') AND c.fecha_vencimiento < ?`,
            [fechaHoy]
        );

        for (const c of cuotasVencidas) {
            const diasAtraso = Math.max(1, Math.floor((new Date(fechaHoy) - new Date(c.fecha_vencimiento)) / (1000 * 60 * 60 * 24)));
            const tasaMoraAnual = parseFloat(c.tasa_mora || 18.0);
            const moraCalculada = Math.round((parseFloat(c.capital) * (tasaMoraAnual / 100.0 / 360.0) * diasAtraso) * 100) / 100;
            const nuevoSaldo = Math.round((parseFloat(c.capital) + parseFloat(c.interes_comp) + moraCalculada) * 100) / 100;

            await pool.query(
                `UPDATE cuota SET dias_mora = ?, interes_mora = ?, estado = 'VENCIDA', saldo_pendiente = ? WHERE id_cuota = ?`,
                [diasAtraso, moraCalculada, nuevoSaldo, c.id_cuota]
            );
            await pool.query(
                `UPDATE credito SET estado = 'EN_MORA' WHERE id_credito = ? AND estado IN ('VIGENTE', 'EN_MORA')`,
                [c.id_credito]
            );
            cuotasAfectadas++;
        }

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'CONTROL_MORA_EJECUTADO',
            entidad: 'SISTEMA',
            idEntidad: 'JOB_MORA',
            resultado: 'EXITOSO',
            detalles: `Proceso de control de mora ejecutado para fecha ${fechaHoy}. Cuotas marcadas en mora: ${cuotasAfectadas}.`,
            ipOrigen: ipOrigen,
        });

        return {
            exitoso: true,
            fechaEjecucion: fechaHoy,
            cuotasAfectadas: cuotasAfectadas,
            mensaje: `Control de mora ejecutado: ${cuotasAfectadas} cuotas vencidas actualizadas.`,
        };
    },

    /**
     * Pago Flexible / Justificación de imposibilidad de pago o prórroga (Normativa ASFI / Casos de Fuerza Mayor).
     * Permite:
     * 1. 'PRORROGA': Extiende la fecha de vencimiento 30 días y congela mora bajo justificación acreditada.
     * 2. 'ACUMULACION': Acumula/difiere la cuota al mes siguiente bajo amortización francesa.
     */
    async justificarPagoFlexible(datosFlexibilidad, usernameOperador, ipOrigen) {
        const {
            idCuota,
            tipoFlexibilidad = datosFlexibilidad.tipo,          // acepta 'tipo' o 'tipoFlexibilidad'
            motivoJustificacion = datosFlexibilidad.motivo,     // acepta 'motivo' o 'motivoJustificacion'
        } = datosFlexibilidad;
        const id = parseInt(idCuota, 10);

        if (!id || isNaN(id)) throw new ReglaNegocioError('ID de cuota inválido.');
        if (!motivoJustificacion || !motivoJustificacion.trim()) {
            throw new ReglaNegocioError('Debe ingresar el motivo o justificación documentada para la solicitud de pago flexible.');
        }

        const pool = obtenerPool();
        const [cuotas] = await pool.query('SELECT c.*, cr.id_credito, cr.numero_credito, cr.saldo_capital FROM cuota c JOIN credito cr ON c.id_credito = cr.id_credito WHERE c.id_cuota = ?', [id]);
        if (cuotas.length === 0) throw new ReglaNegocioError(`Cuota no encontrada con ID: ${id}`);
        const cuota = cuotas[0];

        if (cuota.estado === 'PAGADA') {
            throw new ReglaNegocioError('No se puede aplicar pago flexible a una cuota que ya está PAGADA.');
        }

        let detalleAccion = '';

        if (tipoFlexibilidad === 'PRORROGA') {
            const nuevaFechaVencimiento = new Date(new Date(cuota.fecha_vencimiento).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            await pool.query(
                `UPDATE cuota SET fecha_vencimiento = ?, dias_mora = 0, interes_mora = 0.00, estado = 'PENDIENTE', justificacion_flexibilidad = ? WHERE id_cuota = ?`,
                [nuevaFechaVencimiento, `Prórroga de 30 días concedida hasta ${nuevaFechaVencimiento}: ${motivoJustificacion.trim()}`, id]
            );
            detalleAccion = `Prórroga de 30 días concedida hasta ${nuevaFechaVencimiento}. Mora congelada por justificación acreditada.`;
        } else {
            const [siguienteCuota] = await pool.query(
                'SELECT * FROM cuota WHERE id_credito = ? AND numero_cuota = ?',
                [cuota.id_credito, cuota.numero_cuota + 1]
            );

            if (siguienteCuota.length > 0) {
                const proxId = siguienteCuota[0].id_cuota;
                const nuevoSaldoProx = Math.round((parseFloat(siguienteCuota[0].saldo_pendiente) + parseFloat(cuota.saldo_pendiente)) * 100) / 100;
                await pool.query(
                    `UPDATE cuota SET saldo_pendiente = ?, justificacion_flexibilidad = CONCAT(IFNULL(justificacion_flexibilidad, ''), ' | Saldo acumulado de cuota anterior Bs ${cuota.saldo_pendiente}') WHERE id_cuota = ?`,
                    [nuevoSaldoProx, proxId]
                );
                await pool.query(
                    `UPDATE cuota SET estado = 'PAGADA', saldo_pendiente = 0.00, justificacion_flexibilidad = ? WHERE id_cuota = ?`,
                    [`Cuota diferida y acumulada a Cuota N° ${cuota.numero_cuota + 1}: ${motivoJustificacion.trim()}`, id]
                );
                detalleAccion = `Cuota N° ${cuota.numero_cuota} diferida y saldo de Bs ${cuota.saldo_pendiente} acumulado a la Cuota N° ${cuota.numero_cuota + 1}.`;
            } else {
                const nuevaFecha = new Date(new Date(cuota.fecha_vencimiento).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                await pool.query(
                    `UPDATE cuota SET fecha_vencimiento = ?, dias_mora = 0, interes_mora = 0.00, estado = 'PENDIENTE', justificacion_flexibilidad = ? WHERE id_cuota = ?`,
                    [nuevaFecha, `Extensión especial de última cuota: ${motivoJustificacion.trim()}`, id]
                );
                detalleAccion = `Extensión especial de última cuota concedida hasta ${nuevaFecha}.`;
            }
        }

        const [cuotasVencidasRestantes] = await pool.query(
            "SELECT COUNT(*) AS totalVencidas FROM cuota WHERE id_credito = ? AND estado = 'VENCIDA'",
            [cuota.id_credito]
        );
        if (cuotasVencidasRestantes[0].totalVencidas === 0) {
            await pool.query("UPDATE credito SET estado = 'VIGENTE' WHERE id_credito = ?", [cuota.id_credito]);
        }

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'JUSTIFICAR_PAGO_FLEXIBLE',
            entidad: 'CUOTA',
            idEntidad: id,
            resultado: 'EXITOSO',
            detalles: `Pago flexible registrado para Cuota N° ${cuota.numero_cuota} del Crédito ${cuota.numero_credito}. Tipo: ${tipoFlexibilidad}. Motivo: ${motivoJustificacion.trim()}. Acción: ${detalleAccion}`,
            ipOrigen: ipOrigen,
        });

        return {
            exitoso: true,
            mensaje: `Pago flexible aplicado exitosamente: ${detalleAccion}`,
            idCuota: id,
            tipoFlexibilidad,
        };
    }
};
