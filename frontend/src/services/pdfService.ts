import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AuditoriaItem, SolicitudItem } from '../types';

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
            didParseCell: (data) => {
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
            didParseCell: (data) => {
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
     * Emitir Contrato Oficial de Crédito en PDF (CU09 / RF10 / P05)
     */
    emitirContratoPDF(contrato: any, solicitud?: SolicitudItem | null, credito?: any | null) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'letter'
        });

        const titular = solicitud?.nombreCompletoCliente || credito?.nombreCompletoCliente || 'CLIENTE TITULAR';
        const ci = solicitud?.ciCliente || credito?.ciCliente || 'N/A';
        const numContrato = contrato?.numeroContrato || `CTR-2026-${credito?.idCredito || '001'}`;
        const numCredito = credito?.numeroCredito || solicitud?.numeroCredito || 'CRE-2026-001';
        const monto = Number(credito?.montoAprobado || solicitud?.montoSolicitado || 0);
        const plazo = credito?.plazoMeses || solicitud?.plazoMeses || 12;
        const tasa = Number(credito?.tasaInteresAnual || 12.0);
        const fechaCreacion = contrato?.fechaCreacion ? new Date(contrato.fechaCreacion).toLocaleDateString('es-BO') : new Date().toLocaleDateString('es-BO');
        const estadoContrato = contrato?.estado || 'PENDIENTE_FIRMA';

        // 1. Encabezado Institucional UMSA
        doc.setFillColor(76, 29, 149);
        doc.rect(0, 0, 216, 26, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('UNIVERSIDAD MAYOR DE SAN ANDRÉS', 108, 10, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('FACULTAD DE CIENCIAS PURAS Y NATURALES · CARRERA DE INFORMÁTICA', 108, 16, { align: 'center' });
        doc.setFontSize(8);
        doc.text('SISTEMA BANCARIO DE GESTIÓN CREDITICIA (INF-241) · SUPERVISIÓN ASFI', 108, 22, { align: 'center' });

        // 2. Título Legal
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('CONTRATO FORMAL DE PRÉSTAMO DE DINERO CON FUERZA EJECUTIVA', 108, 36, { align: 'center' });

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`N° de Instrumento Legal: ${numContrato} · Código de Crédito: ${numCredito}`, 108, 42, { align: 'center' });

        // Caja de Estado del Contrato
        const isFirmado = estadoContrato === 'FIRMADO';
        doc.setFillColor(isFirmado ? 240 : 254, isFirmado ? 253 : 242, isFirmado ? 244 : 242);
        doc.setDrawColor(isFirmado ? 34 : 239, isFirmado ? 197 : 68, isFirmado ? 94 : 68);
        doc.roundedRect(14, 46, 188, 10, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(isFirmado ? 21 : 185, isFirmado ? 128 : 28, isFirmado ? 61 : 28);
        doc.text(`ESTADO LEGAL DEL INSTRUMENTO: ${isFirmado ? 'FIRMADO Y REGISTRADO' : 'PENDIENTE DE FIRMA Y LEGALIZACIÓN'}`, 108, 52.5, { align: 'center' });

        // 3. Declaración de Partes
        let y = 62;
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');

        const parrafoPartes = `Conste por el presente documento privado con reconocimiento de firmas y fuerza ejecutiva, que suscriben por una parte la ENTIDAD BANCARIA UMSA (representada por el Oficial de Crédito Saúl Walter Callisaya Sumi y el Gerente General Alex Arturo Jamachi Condori), con NIT 1020304050, que en adelante se denominará el BANCO; y por otra parte, el(la) señor(a) ${titular}, mayor de edad, con Cédula de Identidad N° ${ci}, con plena capacidad de obrar, que en adelante se denominará el DEUDOR, bajo las siguientes cláusulas y estipulaciones:`;
        const linesPartes = doc.splitTextToSize(parrafoPartes, 188);
        doc.text(linesPartes, 14, y);
        y += linesPartes.length * 4 + 4;

        // 4. Cláusulas Contractuales
        const clausulas = [
            {
                titulo: 'PRIMERA (DEL OBJETO Y MONTO):',
                texto: `El BANCO otorga en favor del DEUDOR un crédito de dinero por la suma líquida y exigible de Bs ${monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })} (Bolivianos), dinero que el DEUDOR declara recibir en su totalidad a satisfacción en su cuenta habilitada.`
            },
            {
                titulo: 'SEGUNDA (DEL PLAZO Y SISTEMA DE AMORTIZACIÓN):',
                texto: `El plazo improrrogable para la restitución total del capital e intereses será de ${plazo} meses calendario. La amortización se efectuará mediante cuotas mensuales consecutivas bajo el SISTEMA FRANCÉS DE CUOTA FIJA.`
            },
            {
                titulo: 'TERCERA (DE LA TASA DE INTERÉS CORRIENTE Y MORATORIA):',
                texto: `La operación devengará un interés compensatorio corriente del ${tasa.toFixed(2)}% nominal anual. En caso de mora involuntaria o dolosa en el pago de cualquier cuota, se aplicará de pleno derecho un interés penal moratorio estricto del 18.00% anual sobre el capital vencido sin necesidad de intimación judicial previa, conforme a la Circular ASFI regulatoria.`
            },
            {
                titulo: 'CUARTA (DE LA PRELACIÓN LEGAL DE PAGOS):',
                texto: `Todo abono realizado por el DEUDOR en ventanilla de caja será imputado en prelación rigurosa: 1° Intereses Moratorios, 2° Intereses Corrientes devengados, y 3° Amortización efectiva al Capital Vivo (CA19).`
            },
            {
                titulo: 'QUINTA (DE LAS GARANTÍAS Y EFECTIVIDAD EJECUTIVA):',
                texto: `El DEUDOR responde por la obligación asumida con la totalidad de sus bienes habidos y por haber, además de la garantía registrada y calificada favorablemente en la fase de evaluación crediticia. El incumplimiento dará lugar al inicio inmediato de la acción ejecutiva por la vía coactiva civil.`
            },
            {
                titulo: 'SEXTA (DE LA CONFORMIDAD):',
                texto: `Ambas partes contratantes expresan su plena y absoluta conformidad con el tenor de todas las cláusulas precedentes, obligándose a su fiel y estricto cumplimiento.`
            }
        ];

        clausulas.forEach(c => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.2);
            doc.setTextColor(76, 29, 149);
            doc.text(c.titulo, 14, y);
            y += 4;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);
            const lines = doc.splitTextToSize(c.texto, 188);
            doc.text(lines, 14, y);
            y += lines.length * 3.8 + 2.5;
        });

        // 5. Bloque de Firmas y Legalización
        y = Math.max(y + 8, 220);

        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.3);

        // Línea Deudor
        doc.line(20, y, 75, y);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(titular, 47.5, y + 4, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(`CI: ${ci} · DEUDOR TITULAR`, 47.5, y + 8, { align: 'center' });

        // Línea Oficial de Crédito
        doc.line(82, y, 134, y);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('Saúl Walter Callisaya Sumi', 108, y + 4, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('OFICIAL DE CRÉDITO (INF-241)', 108, y + 8, { align: 'center' });

        // Línea Gerente General
        doc.line(141, y, 196, y);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('Alex Arturo Jamachi Condori', 168.5, y + 4, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('GERENTE GENERAL / AUTORIZACIÓN', 168.5, y + 8, { align: 'center' });

        // Sello y pie
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`La Paz, Bolivia · Fecha de Registro: ${fechaCreacion} · Documento Auditado SHA-256`, 108, 268, { align: 'center' });

        doc.save(`Contrato_${numContrato}_${ci}.pdf`);
    },

    /**
     * Emitir Plan de Pagos / Cronograma de Amortización en PDF (CU10 / RF11 / P03)
     */
    emitirCronogramaPDF(cuotas: any[], solicitud?: SolicitudItem | null, credito?: any | null) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'letter'
        });

        const titular = solicitud?.nombreCompletoCliente || credito?.nombreCompletoCliente || 'CLIENTE TITULAR';
        const ci = solicitud?.ciCliente || credito?.ciCliente || 'N/A';
        const numCredito = credito?.numeroCredito || solicitud?.numeroCredito || 'CRE-2026-001';
        const monto = Number(credito?.montoAprobado || solicitud?.montoSolicitado || 0);
        const plazo = cuotas.length || credito?.plazoMeses || 12;
        const tasa = Number(credito?.tasaInteresAnual || 12.0);
        const fechaEmision = new Date().toLocaleDateString('es-BO');

        // Totales
        const totalCapital = cuotas.reduce((acc, c) => acc + Number(c.capital || c.montoCapital || 0), 0);
        const totalInteres = cuotas.reduce((acc, c) => acc + Number(c.interes || c.montoInteres || 0), 0);
        const totalPagar = totalCapital + totalInteres;
        const cuotaFijaEstimada = cuotas.length > 0 ? Number(cuotas[0].montoCuota || (Number(cuotas[0].capital || 0) + Number(cuotas[0].interes || 0))).toFixed(2) : '0.00';

        // 1. Encabezado Institucional UMSA
        doc.setFillColor(76, 29, 149);
        doc.rect(0, 0, 216, 26, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('UNIVERSIDAD MAYOR DE SAN ANDRÉS', 108, 10, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('CARRERA DE INFORMÁTICA · ANÁLISIS Y DISEÑO DE SISTEMAS I (INF-241)', 108, 16, { align: 'center' });
        doc.setFontSize(8);
        doc.text('PLAN DE PAGOS Y CRONOGRAMA DE AMORTIZACIÓN · SISTEMA FRANCÉS', 108, 22, { align: 'center' });

        // 2. Metadatos de la Operación
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, 31, 188, 24, 2, 2, 'FD');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`Cliente: ${titular}`, 18, 37);
        doc.text(`CI: ${ci} · Emisión: ${fechaEmision}`, 18, 43);
        doc.text(`N° Crédito: ${numCredito}`, 18, 49);

        doc.setFont('helvetica', 'normal');
        doc.text(`Monto Capital (C): Bs ${monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, 110, 37);
        doc.text(`Tasa Interés Anual: ${tasa.toFixed(2)}% (Mensual: ${(tasa / 12).toFixed(4)}%)`, 110, 43);
        doc.text(`Plazo (n): ${plazo} cuotas fijas · Cuota Ref.: Bs ${cuotaFijaEstimada}`, 110, 49);

        // 3. Tabla de Amortización Francesa
        const filas = cuotas.map(c => [
            String(c.numeroCuota),
            c.fechaVencimiento ? new Date(c.fechaVencimiento).toLocaleDateString('es-BO') : 'N/A',
            `Bs ${Number(c.montoCuota || (Number(c.capital || 0) + Number(c.interes || 0))).toFixed(2)}`,
            `Bs ${Number(c.capital || c.montoCapital || 0).toFixed(2)}`,
            `Bs ${Number(c.interes || c.montoInteres || 0).toFixed(2)}`,
            `Bs ${Number(c.saldoCapital || 0).toFixed(2)}`,
            c.estado || 'PENDIENTE'
        ]);

        // Fila de Totales
        filas.push([
            'TOTALES',
            '—',
            `Bs ${totalPagar.toFixed(2)}`,
            `Bs ${totalCapital.toFixed(2)}`,
            `Bs ${totalInteres.toFixed(2)}`,
            'Bs 0.00',
            '—'
        ]);

        autoTable(doc, {
            startY: 59,
            head: [['N°', 'Vencimiento', 'Cuota Fija (M)', 'Capital Vivo (A)', 'Interés (I)', 'Saldo Deudor', 'Estado']],
            body: filas,
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
                cellPadding: 2,
                halign: 'center',
            },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 26 },
                2: { cellWidth: 32, fontStyle: 'bold', halign: 'right' },
                3: { cellWidth: 32, halign: 'right' },
                4: { cellWidth: 32, halign: 'right' },
                5: { cellWidth: 32, halign: 'right' },
                6: { cellWidth: 24, fontStyle: 'bold' },
            },
            didParseCell: (data) => {
                if (data.row.index === filas.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [237, 233, 254];
                    data.cell.styles.textColor = [76, 29, 149];
                } else if (data.column.index === 6) {
                    if (data.cell.raw === 'PAGADA') {
                        data.cell.styles.textColor = [16, 185, 129];
                    } else if (data.cell.raw === 'VENCIDA') {
                        data.cell.styles.textColor = [239, 68, 68];
                    } else {
                        data.cell.styles.textColor = [100, 116, 139];
                    }
                }
            }
        });

        // 4. Nota al pie normativa y fórmula matemática
        const finalY = (doc as any).lastAutoTable?.finalY || 200;
        doc.setFillColor(245, 243, 255);
        doc.setDrawColor(196, 181, 253);
        doc.roundedRect(14, finalY + 4, 188, 16, 1.5, 1.5, 'FD');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(76, 29, 149);
        doc.text('FÓRMULA FINANCIERA DEL SISTEMA FRANCÉS DE AMORTIZACIÓN:', 18, finalY + 9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('M = C * [ i * (1 + i)^n ] / [ (1 + i)^n - 1 ]   |   Donde C = Capital Solicitado, i = Tasa mensual (Tasa/12), n = Plazo de meses.', 18, finalY + 13);
        doc.text('Los intereses se calculan mes a mes sobre el saldo deudor remanente: I_k = Saldo_(k-1) * i. Amortización de capital: A_k = M - I_k.', 18, finalY + 17);

        // Guardar archivo
        doc.save(`Cronograma_${numCredito}_${ci}.pdf`);
    }
};
