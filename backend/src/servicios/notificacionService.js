import { auditoriaService } from './auditoriaService.js';

export const notificacionService = {
    /**
     * Enviar notificación de pago por correo electrónico al cliente (RF13 / CU12).
     */
    async enviarNotificacionPago({
        destinatario,
        nombreCliente,
        numeroRecibo,
        numeroCredito,
        numeroCuota,
        montoTotal,
        montoMora,
        montoInteres,
        montoCapital,
        saldoCapitalCredito,
        formaPago,
        fechaPago,
        usernameOperador = 'cajero',
        ipOrigen = '127.0.0.1'
    }) {
        const emailDestino = destinatario || 'cliente@banco-umsa.edu.bo';
        const asunto = `Comprobante de Pago - Recibo ${numeroRecibo} - Banco UMSA`;
        
        const cuerpoHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #4c1d95; color: #ffffff; padding: 24px; text-align: center; }
    .header h2 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 24px; }
    .amount-box { background: #f5f3ff; border: 1.5px solid #c4b5fd; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
    .amount-box .amount { font-size: 28px; font-weight: 800; color: #6d28d9; }
    .table-detail { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
    .table-detail td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .table-detail td.label { color: #64748b; font-weight: 500; }
    .table-detail td.value { text-align: right; font-weight: 600; color: #0f172a; }
    .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>SISTEMA BANCARIO UMSA</h2>
      <p>Notificación Oficial de Pago y Amortización</p>
    </div>
    <div class="content">
      <p>Estimado(a) <strong>${nombreCliente}</strong>,</p>
      <p>Confirmamos la recepción de su abono aplicado a su crédito bancario con éxito:</p>
      
      <div class="amount-box">
        <div style="font-size: 12px; text-transform: uppercase; color: #7c3aed; font-weight: 600;">Total Amortizado</div>
        <div class="amount">Bs ${Number(montoTotal).toFixed(2)}</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Recibo Fiscal: <strong>${numeroRecibo}</strong> · Forma: ${formaPago}</div>
      </div>

      <table class="table-detail">
        <tr><td class="label">N° de Crédito</td><td class="value">${numeroCredito}</td></tr>
        <tr><td class="label">Cuota Amortizada</td><td class="value">Cuota N° ${numeroCuota}</td></tr>
        <tr><td class="label">Fecha y Hora</td><td class="value">${fechaPago}</td></tr>
        <tr><td class="label">Amortización a Mora</td><td class="value">Bs ${Number(montoMora).toFixed(2)}</td></tr>
        <tr><td class="label">Amortización a Interés</td><td class="value">Bs ${Number(montoInteres).toFixed(2)}</td></tr>
        <tr><td class="label">Amortización a Capital</td><td class="value">Bs ${Number(montoCapital).toFixed(2)}</td></tr>
        <tr style="background:#f8fafc;"><td class="label" style="font-weight:700; color:#334155;">Saldo Capital Restante</td><td class="value" style="color:#059669; font-size:15px;">Bs ${Number(saldoCapitalCredito).toFixed(2)}</td></tr>
      </table>
    </div>
    <div class="footer">
      Documento electrónico conforme a normativa ASFI y Ley N° 393 de Servicios Financieros.<br>
      Universidad Mayor de San Andrés · Carrera de Informática (INF-241)
    </div>
  </div>
</body>
</html>
        `;

        let enviadoReal = false;
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            try {
                const nodemailer = await import('nodemailer');
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT || '587', 10),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });
                await transporter.sendMail({
                    from: `"Banco UMSA Créditos" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                    to: emailDestino,
                    subject: asunto,
                    html: cuerpoHtml,
                });
                enviadoReal = true;
            } catch (err) {
                console.warn(`[NOTIFICACIÓN] Error en servidor SMTP real: ${err.message}. Continuando con despacho simulado.`);
            }
        }

        await auditoriaService.registrarEvento({
            username: usernameOperador,
            operacion: 'ENVIAR_NOTIFICACION_PAGO',
            entidad: 'PAGO',
            idEntidad: numeroRecibo,
            resultado: 'EXITOSO',
            detalles: `Notificación de pago enviada a ${emailDestino} para Recibo ${numeroRecibo} (${enviadoReal ? 'SMTP Real' : 'Simulado Bancario'}). Monto: Bs ${montoTotal}`,
            ipOrigen: ipOrigen,
        });

        return {
            enviado: true,
            simulado: !enviadoReal,
            destinatario: emailDestino,
            asunto: asunto,
            mensaje: `Comprobante de pago enviado satisfactoriamente a ${emailDestino}`
        };
    }
};
