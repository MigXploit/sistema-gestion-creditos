import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AuditoriaItem, SolicitudItem, CuotaItem, ContratoItem, CreditoItem } from '../types';

/**
 * Servicio de Generación de Documentos y Reportes en Formato PDF
 * Cumple con estándares formales bancarios y normativa ASFI / UMSA INF-241.
 */
export const pdfService = {
    /**
     * Emitir Factura / Comprobante de Cobranza Oficial en PDF (P08 / CU12 / RF13)
     */
    emitirFacturaPDF(recibo: any, solicitud?: SolicitudItem | null, credito?: any | null) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'letter'
        });

        const titular = solicitud?.nombreCompletoCliente || 'CLIENTE TITULAR';
        const ci = solicitud?.ciCliente || 'N/A';
        const numCredito = credito?.numeroCredito || solicitud?.numeroCredito || 'CR-OFICIAL';
        const fechaHoy = recibo.fechaPago || new Date().toISOString().split('T')[0];

        // 1. Encabezado Institucional UMSA
        doc.setFillColor(76, 29, 149); // #4c1d95 Púrpura bancario UMSA
        doc.rect(0, 0, 216, 28, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('UNIVERSIDAD MAYOR DE SAN ANDRÉS', 108, 11, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('FACULTAD DE CIENCIAS PURAS Y NATURALES · CARRERA DE INFORMÁTICA', 108, 17, { align: 'center' });
        doc.setFontSize(8.5);
        doc.text('SISTEMA DE GESTIÓN DE CRÉDITOS Y COBRANZAS BANCARIAS (INF-241)', 108, 23, { align: 'center' });

        // 2. Título del Comprobante Fiscal
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('COMPROBANTE FISCAL DE PAGO Y AMORTIZACIÓN', 14, 38);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`N° Recibo Oficial: ${recibo.numeroRecibo}`, 14, 44);
        doc.text(`Fecha y Hora de Emisión: ${fechaHoy}`, 14, 49);

        // Caja lateral derecha: NIT y Autorización ASFI
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(135, 33, 67, 21, 2, 2, 'FD');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('ENTIDAD BANCARIA UMSA', 138, 38);
        doc.setFont('helvetica', 'normal');
        doc.text('NIT Entidad: 1020304050', 138, 43);
        doc.text('Autorización ASFI N°: 884-2026-CB', 138, 48);
        doc.text('Modalidad: Facturación Computarizada', 138, 52);

        // 3. Cuadro de Datos del Cliente y Crédito
        doc.setDrawColor(124, 58, 237);
        doc.setLineWidth(0.4);
        doc.setFillColor(245, 243, 255);
        doc.roundedRect(14, 58, 188, 26, 2, 2, 'FD');

        doc.setTextColor(109, 40, 217);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('DATOS DE LA OPERACIÓN CREDITICIA', 18, 64);

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Titular / Cliente: ${titular}`, 18, 71);
        doc.text(`Documento de Identidad (CI): ${ci}`, 18, 77);
        doc.text(`N° de Crédito Asociado: ${numCredito}`, 18, 82);

        doc.text(`Cuota N°: ${recibo.numeroCuota || '1'}`, 120, 71);
        doc.text(`Forma de Pago: ${recibo.formaPago || 'EFECTIVO'}`, 120, 77);
        doc.text(`Estado Cuota: ${recibo.estadoCuota || 'PAGADA'}`, 120, 82);

        // 4. Tabla de Imputación Contable en Cascada (CA19 / RF13)
        const itemsFactura = [
            ['1', 'Interés Penal Moratorio (18% anual s/ capital)', `Bs ${Number(recibo.montoMora || 0).toFixed(2)}`],
            ['2', 'Interés Compensatorio Corriente (Sistema Francés)', `Bs ${Number(recibo.montoInteres || 0).toFixed(2)}`],
            ['3', 'Amortización Efectiva a Capital Vivo', `Bs ${Number(recibo.montoCapital || 0).toFixed(2)}`],
            ['', 'TOTAL COBRADO Y AMORTIZADO', `Bs ${Number(recibo.montoTotal || 0).toFixed(2)}`],
        ];

        autoTable(doc, {
            startY: 89,
            head: [['Ítem', 'Concepto de Imputación (Prelación Estricta)', 'Importe Amortizado']],
            body: itemsFactura,
            theme: 'grid',
            headStyles: {
                fillColor: [76, 29, 149],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
                halign: 'left',
            },
            styles: {
                fontSize: 8.5,
                cellPadding: 3.5,
            },
            columnStyles: {
                0: { cellWidth: 16, halign: 'center' },
                1: { cellWidth: 122 },
                2: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
            },
            didParseCell: (data: any) => {
                if (data.row.index === 3) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [237, 233, 254];
                    data.cell.styles.textColor = [109, 40, 217];
                }
            }
        });

        // 5. Estado de Cuenta Posterior al Pago
        const finalY = (doc as any).lastAutoTable?.finalY || 135;
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, finalY + 5, 188, 22, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text('RESUMEN DE SALDO DEUDOR REMANENTE', 18, finalY + 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Saldo Capital Vivo Restante: Bs ${Number(recibo.saldoCapitalCredito || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, 18, finalY + 17);
        doc.text(`Estado del Crédito: ${recibo.estadoCredito || 'VIGENTE'}`, 18, finalY + 22);

        doc.text(`Saldo Exigible Cuota: Bs ${Number(recibo.saldoPendienteCuota || 0).toFixed(2)}`, 120, finalY + 17);
        doc.text('Canal: Ventanilla Principal de Caja (P08)', 120, finalY + 22);

        // 6. Pie de Página y Control Fiscal
        const qrBoxY = finalY + 34;
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, qrBoxY, 188, 30, 2, 2);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('CÓDIGO DE CONTROL FISCAL Y SEGURIDAD BANCARIA:', 18, qrBoxY + 6);
        doc.setFont('courier', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(76, 29, 149);
        doc.text(`CF-2026-${recibo.numeroRecibo}-ASFI-UMSA-9941A`, 18, qrBoxY + 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Este documento constituye comprobante formal y fiscal de pago conforme a la Ley N° 393 de Servicios Financieros.', 18, qrBoxY + 18);
        doc.text('La imputación contable se ejecutó respetando estrictamente la prelación legal: 1° Intereses Penales, 2° Intereses Corrientes, 3° Capital Vivo.', 18, qrBoxY + 23);
        doc.text('Original: Cliente · Copia Digital: Archivo de Auditoría Inmutable del Sistema Bancario.', 18, qrBoxY + 27);

        // Guardar archivo PDF en navegador
        const nombreArchivo = `Factura_${recibo.numeroRecibo || 'PAGO'}_${fechaHoy}.pdf`;
        doc.save(nombreArchivo);
    },

    /**
     * Generar Reporte de Auditoría Inmutable en PDF (CU15 / RNF06 / RN12)
     */
    emitirReporteAuditoriaPDF(trazas: AuditoriaItem[], usuarioGenerador: string = 'GERENTE') {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'letter'
        });

        const fechaGeneracion = new Date().toLocaleString('es-BO');

        // 1. Encabezado Institucional UMSA Landscape (279 x 216 mm)
        doc.setFillColor(76, 29, 149);
        doc.rect(0, 0, 279, 24, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('UNIVERSIDAD MAYOR DE SAN ANDRÉS · CARRERA DE INFORMÁTICA (INF-241)', 139.5, 10, { align: 'center' });
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.text('SISTEMA DE GESTIÓN DE CRÉDITOS · REPORTE OFICIAL DE TRAZABILIDAD Y AUDITORÍA INMUTABLE', 139.5, 17, { align: 'center' });

        // 2. Metadatos del Reporte
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('TRAZA HISTÓRICA DE EVENTOS DE AUDITORÍA BANCARIA (RNF06 / RN12)', 14, 32);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Fecha y Hora de Emisión: ${fechaGeneracion}`, 14, 37);
        doc.text(`Generado por Operador: ${usuarioGenerador}`, 14, 42);
        doc.text(`Total de Eventos Auditados: ${trazas.length} registros`, 150, 37);
        doc.text('Integridad: Trazabilidad SHA-256 inmutable (Solo Lectura)', 150, 42);

        // 3. Formateo de datos para la tabla
        const tablaDatos = trazas.map((t, idx) => [
            String(idx + 1),
            new Date(t.fechaHora).toLocaleString('es-BO'),
            t.operacion,
            t.entidad,
            t.idEntidad || '—',
            t.ipOrigen || '127.0.0.1',
            t.resultado,
            t.detalles || 'Sin observaciones'
        ]);

        autoTable(doc, {
            startY: 46,
            head: [['#', 'Fecha / Hora', 'Operación', 'Entidad', 'Clave', 'IP Origen', 'Resultado', 'Detalles del Evento']],
            body: tablaDatos,
            theme: 'grid',
            headStyles: {
                fillColor: [76, 29, 149],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
            },
            styles: {
                fontSize: 7.5,
                cellPadding: 2.2,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 8, halign: 'center' },
                1: { cellWidth: 28, halign: 'center' },
                2: { cellWidth: 38, fontStyle: 'bold' },
                3: { cellWidth: 24 },
                4: { cellWidth: 18, halign: 'center' },
                5: { cellWidth: 22, halign: 'center' },
                6: { cellWidth: 20, halign: 'center' },
                7: { cellWidth: 93 },
            },
            didParseCell: (data: any) => {
                if (data.column.index === 6) {
                    if (data.cell.raw === 'EXITOSO') {
                        data.cell.styles.textColor = [16, 185, 129];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.cell.raw === 'BLOQUEADO' || data.cell.raw === 'FALLIDO') {
                        data.cell.styles.textColor = [239, 68, 68];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        const fechaSello = new Date().toISOString().split('T')[0];
        doc.save(`Reporte_Auditoria_Bancaria_${fechaSello}.pdf`);
    },

    /**
     * Emitir Cronograma de Pagos - Sistema Francés Oficial en PDF (P05 / CU10 / RF11 / CA16)
     */
    emitirCronogramaPDF(solicitud: SolicitudItem, cuotas: CuotaItem[], credito?: any) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'letter'
        });

        const titular = solicitud.nombreCompletoCliente || 'CLIENTE TITULAR';
        const ci = solicitud.ciCliente || 'N/A';
        const numCredito = credito?.numeroCredito || solicitud.numeroCredito || 'CRÉDITO VIGENTE';
        const numSolicitud = solicitud.numeroSolicitud;
        const monto = Number(credito?.montoAprobado || solicitud.montoSolicitado || 0);
        const plazo = credito?.plazoMeses || solicitud.plazoMeses || cuotas.length || 12;
        const tasa = Number(credito?.tasaInteres || 12.00);
        const fechaHoy = new Date().toISOString().split('T')[0];

        // 1. Encabezado Institucional UMSA
        doc.setFillColor(76, 29, 149); // #4c1d95 Púrpura bancario UMSA
        doc.rect(0, 0, 216, 28, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('UNIVERSIDAD MAYOR DE SAN ANDRÉS', 108, 11, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('FACULTAD DE CIENCIAS PURAS Y NATURALES · CARRERA DE INFORMÁTICA', 108, 17, { align: 'center' });
        doc.setFontSize(8.5);
        doc.text('SISTEMA DE GESTIÓN DE CRÉDITOS Y COBRANZAS BANCARIAS (INF-241)', 108, 23, { align: 'center' });

        // 2. Título del Documento
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('PLAN DE PAGOS Y CRONOGRAMA DE AMORTIZACIÓN (P05)', 14, 38);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`N° Crédito Formal: ${numCredito}`, 14, 44);
        doc.text(`Solicitud Origen: ${numSolicitud} | Fecha de Emisión: ${fechaHoy}`, 14, 49);

        // Caja lateral derecha: Parámetros del Sistema Francés
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(130, 33, 72, 21, 2, 2, 'FD');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('SISTEMA DE AMORTIZACIÓN', 133, 38);
        doc.setFont('helvetica', 'normal');
        doc.text('Método: Francés (Cuota Neta Fija)', 133, 43);
        doc.text('Regulación: Circular ASFI / UMSA INF-241', 133, 48);
        doc.text('Ajuste de Redondeo: Última Cuota (CA16)', 133, 52);

        // 3. Cuadro de Datos del Cliente y Condiciones del Préstamo
        doc.setDrawColor(124, 58, 237);
        doc.setLineWidth(0.4);
        doc.setFillColor(245, 243, 255);
        doc.roundedRect(14, 58, 188, 25, 2, 2, 'FD');

        doc.setTextColor(109, 40, 217);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('DATOS DEL SUJETO DE CRÉDITO Y CONDICIONES FINANCIERAS', 18, 64);

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Titular: ${titular}`, 18, 70);
        doc.text(`Cédula de Identidad (CI): ${ci}`, 18, 75);
        doc.text(`Tipo de Crédito: ${solicitud.tipoCredito || 'CONSUMO'}`, 18, 80);

        doc.text(`Capital Aprobado: Bs ${monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, 115, 70);
        doc.text(`Plazo Total: ${plazo} Meses`, 115, 75);
        doc.text(`Tasa Anual Efectiva: ${tasa.toFixed(2)}% | Tasa Mora: 18.00%`, 115, 80);

        // 4. Tabla de Cuotas del Cronograma
        const tablaCuotas = cuotas.map(c => [
            String(c.numeroCuota),
            c.fechaVencimiento,
            `Bs ${Number(c.capital).toFixed(2)}`,
            `Bs ${Number(c.interesComp).toFixed(2)}`,
            `Bs ${Number(c.monto).toFixed(2)}`,
            `Bs ${Number(c.saldoPendiente).toFixed(2)}`,
            c.estado
        ]);

        const totalCapital = cuotas.reduce((acc, c) => acc + Number(c.capital), 0);
        const totalInteres = cuotas.reduce((acc, c) => acc + Number(c.interesComp), 0);
        const totalMonto = cuotas.reduce((acc, c) => acc + Number(c.monto), 0);

        tablaCuotas.push([
            'TOTAL',
            'TOTALES ACUMULADOS',
            `Bs ${totalCapital.toFixed(2)}`,
            `Bs ${totalInteres.toFixed(2)}`,
            `Bs ${totalMonto.toFixed(2)}`,
            'Bs 0.00',
            'CONFORME'
        ]);

        autoTable(doc, {
            startY: 88,
            head: [['N°', 'Vencimiento', 'Capital (Bs)', 'Interés (Bs)', 'Cuota Fija (Bs)', 'Saldo Deudor (Bs)', 'Estado']],
            body: tablaCuotas,
            theme: 'grid',
            headStyles: {
                fillColor: [76, 29, 149],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
            },
            styles: {
                fontSize: 8,
                cellPadding: 2,
            },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                1: { cellWidth: 26, halign: 'center' },
                2: { cellWidth: 32, halign: 'right' },
                3: { cellWidth: 30, halign: 'right' },
                4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
                5: { cellWidth: 34, halign: 'right' },
                6: { cellWidth: 22, halign: 'center' },
            },
            didParseCell: (data: any) => {
                if (data.row.index === cuotas.length) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [237, 233, 254];
                    data.cell.styles.textColor = [109, 40, 217];
                }
            }
        });

        // 5. Firmas Institucionales y Sello
        const finalY = Math.min((doc as any).lastAutoTable?.finalY || 200, 235);

        doc.setDrawColor(148, 163, 184);
        doc.setLineDashPattern([1.5, 1.5], 0);

        // Línea firma deudor
        doc.line(25, finalY + 20, 85, finalY + 20);
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.text(`${titular}`, 55, finalY + 24, { align: 'center' });
        doc.text(`CI: ${ci} · Deudor Titular`, 55, finalY + 28, { align: 'center' });

        // Línea firma Jefe de Créditos
        doc.line(130, finalY + 20, 190, finalY + 20);
        doc.text('Lic. Carlos Mendoza', 160, finalY + 24, { align: 'center' });
        doc.text('Jefe de Créditos · Banco UMSA', 160, finalY + 28, { align: 'center' });
        doc.text('Aprobación Colegiada (CA13)', 160, finalY + 32, { align: 'center' });

        doc.save(`Cronograma_Credito_${numCredito.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    },

    /**
     * Emitir Contrato Legal de Crédito en PDF (P03 / CU09 / RF10 / CA15)
     */
    emitirContratoPDF(solicitud: SolicitudItem, contrato: ContratoItem, credito: CreditoItem) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'letter'
        });

        const titular = solicitud.nombreCompletoCliente || 'CLIENTE TITULAR';
        const ci = solicitud.ciCliente || 'N/A';
        const numContrato = contrato.numeroContrato || 'CT-2026-OFICIAL';
        const numCredito = credito.numeroCredito || solicitud.numeroCredito || 'CR-OFICIAL';
        const monto = Number(credito.montoAprobado || solicitud.montoSolicitado || 0);
        const plazo = credito.plazoMeses || solicitud.plazoMeses || 12;
        const tasa = Number(credito.tasaInteres || 12.00);
        const tasaMora = Number(credito.tasaMora || 18.00);
        const fechaFirma = contrato.fechaFirma || new Date().toISOString().split('T')[0];

        // 1. Encabezado Institucional UMSA
        doc.setFillColor(76, 29, 149);
        doc.rect(0, 0, 216, 28, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('UNIVERSIDAD MAYOR DE SAN ANDRÉS', 108, 11, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('FACULTAD DE CIENCIAS PURAS Y NATURALES · CARRERA DE INFORMÁTICA', 108, 17, { align: 'center' });
        doc.setFontSize(8.5);
        doc.text('SISTEMA DE GESTIÓN DE CRÉDITOS Y COBRANZAS BANCARIAS (INF-241)', 108, 23, { align: 'center' });

        // 2. Título del Contrato
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12.5);
        doc.text('CONTRATO PRIVADO DE PRÉSTAMO DE DINERO CON GARANTÍA', 14, 38);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`N° Instrumento Contractual: ${numContrato}`, 14, 44);
        doc.text(`N° Operación Crédito: ${numCredito} | Fecha de Suscripción: ${fechaFirma}`, 14, 49);

        // Caja lateral derecha: Notaría y Estado
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(130, 33, 72, 21, 2, 2, 'FD');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('REGISTRO NOTARIAL BANCARIO', 133, 38);
        doc.setFont('helvetica', 'normal');
        doc.text(`Estado: ${contrato.estado || 'PENDIENTE_FIRMA'} (CA15)`, 133, 43);
        doc.text('Notaría N° 42 de La Paz', 133, 48);
        doc.text('Título Ejecutivo y Coactivo Civil', 133, 52);

        // 3. Cuadro de Comparecientes
        doc.setDrawColor(124, 58, 237);
        doc.setLineWidth(0.4);
        doc.setFillColor(245, 243, 255);
        doc.roundedRect(14, 58, 188, 22, 2, 2, 'FD');

        doc.setTextColor(109, 40, 217);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('PARTES INTERVINIENTES EN EL INSTRUMENTO CONTRACTUAL', 18, 63);

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Acreedor Institucional: Entidad Bancaria UMSA (NIT 1020304050 - Licencia ASFI 884-2026-CB)`, 18, 69);
        doc.text(`Parte Deudora / Beneficiario: ${titular} con C.I. N° ${ci}`, 18, 74);

        // 4. Cláusulas Contractuales
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        let yPos = 86;

        const clausulas = [
            {
                titulo: 'CLÁUSULA PRIMERA (ANTECEDENTES Y CAPACIDAD LEGAL):',
                texto: `La ENTIDAD ACREEDORA, en el marco de sus atribuciones financieras y normativa ASFI, otorga a favor del DEUDOR un crédito de dinero conforme a las condiciones evaluadas y aprobadas en la solicitud ${solicitud.numeroSolicitud}.`
            },
            {
                titulo: 'CLÁUSULA SEGUNDA (MONTO, MONEDA Y DESTINO):',
                texto: `El monto otorgado asciende a la suma de Bs ${monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })} (${solicitud.tipoCredito || 'CONSUMO'}), que el DEUDOR declara recibir en su totalidad a través del desembolso en su cuenta bancaria, con destino a: ${solicitud.destino || 'Adquisición de activos y capital de trabajo'}.`
            },
            {
                titulo: 'CLÁUSULA TERCERA (PLAZO, TASA Y AMORTIZACIÓN FRANCESA):',
                texto: `El DEUDOR se obliga formalmente a restituir el capital en el plazo de ${plazo} meses, en cuotas fijas mensuales sucesivas calculadas bajo el Sistema de Amortización Francés con una Tasa de Interés Compensatoria fija del ${tasa.toFixed(2)}% anual, según el Cronograma Oficial anexo que forma parte indivisible del presente contrato.`
            },
            {
                titulo: 'CLÁUSULA CUARTA (INTERÉS PENAL MORATORIO Y VENCIMIENTO ANTICIPADO):',
                texto: `En caso de mora o retraso en el pago de cualquiera de las cuotas estipuladas, se aplicará automáticamente un Interés Penal Moratorio del ${tasaMora.toFixed(2)}% anual computado diariamente sobre el capital en mora. La mora en dos cuotas consecutivas facultará a la entidad a declarar de plazo vencido la totalidad de la obligación.`
            },
            {
                titulo: 'CLÁUSULA QUINTA (GARANTÍA Y FUERZA COACTIVA):',
                texto: `Para asegurar el fiel y exacto cumplimiento de todas las obligaciones asumidas, el DEUDOR constituye garantía formal inscrita en el padrón del sistema bancario, reconociendo al presente instrumento plena fuerza ejecutiva y coactiva conforme a las leyes vigentes del Estado Plurinacional de Bolivia.`
            },
            {
                titulo: 'CLÁUSULA SEXTA (CONFORMIDAD Y RESOLUCIÓN COLEGIADA):',
                texto: `Las partes declaran su plena conformidad con todas y cada una de las cláusulas precedentes, firmando el presente contrato en dos ejemplares de un mismo tenor y efecto legal.`
            }
        ];

        clausulas.forEach(c => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(76, 29, 149);
            doc.text(c.titulo, 14, yPos);
            yPos += 3.8;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            const lineas = doc.splitTextToSize(c.texto, 188);
            doc.text(lineas, 14, yPos);
            yPos += (lineas.length * 3.5) + 3;
        });

        // 5. Bloque de Firmas y Sellos
        const firmaY = Math.max(yPos + 4, 218);

        doc.setDrawColor(148, 163, 184);
        doc.setLineDashPattern([1.5, 1.5], 0);

        // Firma deudor
        doc.line(18, firmaY + 12, 72, firmaY + 12);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`${titular}`, 45, firmaY + 16, { align: 'center' });
        doc.text(`CI: ${ci} · Deudor Titular`, 45, firmaY + 20, { align: 'center' });

        // Firma Jefe de Créditos
        doc.line(80, firmaY + 12, 134, firmaY + 12);
        doc.text('Lic. Carlos Mendoza', 107, firmaY + 16, { align: 'center' });
        doc.text('Jefe de Créditos · Banco UMSA', 107, firmaY + 20, { align: 'center' });
        doc.text('Resolución Aprobatoria CA13', 107, firmaY + 24, { align: 'center' });

        // Notaría de Fe Pública
        doc.line(142, firmaY + 12, 196, firmaY + 12);
        doc.text('Dra. Beatriz Sandoval', 169, firmaY + 16, { align: 'center' });
        doc.text('Notaria de Fe Pública N° 42', 169, firmaY + 20, { align: 'center' });
        doc.text('Testimonio de Escritura Pública', 169, firmaY + 24, { align: 'center' });

        doc.save(`Contrato_Credito_${numContrato.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    }
};
