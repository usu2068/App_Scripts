// ==============================================================================
// 1. CONFIGURACIÓN DEL SCRIPT
// ==============================================================================

// ** CONFIGURACIÓN OBLIGATORIA **
const NOMBRE_HOJA = 'SERVICIOS2025';
const RESPONSABLE_COL = 1;
const SERVICIO_COL = 3;
const CONCEPTO_SERVICIO = 4;
const FECHA_CORTE_COL = 6;
const CICLO_FACTURACION_COL = 8;
const MONTO_COL = 10;
const TARJETA_COL = 12;
const WASABI_CHECK_SERVICE = 'WASABI';

const CORREOS_CC_FIJOS = [
  'sistemas3@ustarizabogados.com',
  'julian.mendez@ustarizabogados.com',
  'administrativo@ustarizabogados.com',
  'joseustariz@ustarizabogados.com',
  'publicidad@ustarizabogados.com'
];

// COLORES para la semaforización
const COLOR_ROJO = '#ea9999';
const COLOR_VERDE = '#b6d7a8';

// Criterio de búsqueda flexible en Gmail para encontrar el correo con facturas
// Busca las palabras clave "FACTURAS" y "SEMANA" en el asuntó.
const QUERY_CORREO_FACTURAS = 'subject:(FACTURAS AND SEMANA) from:sistemas3@ustarizabogados.com is:unread';

// ==============================================================================
// 2. FUNCIONES AUXILIARES DE FECHA Y BÚSQUEDA
// ==============================================================================

/**
 * Retorna el nombre del mes en mayúsculas.
 * @param {Date} fecha
 * @returns {string} Nombre del mes.
 */
function obtenerNombreMes(fecha) {
  if (!(fecha instanceof Date)) return 'ERROR_INVALIDO';

  const nombreMeses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  return nombreMeses[fecha.getMonth()];
}

/**
 * Quita la hora de una fecha para comparaciones precisas de días.
 * @param {Date} date
 * @returns {Date | null} La fecha sin componente de tiempo.
 */
function stripTime(date) {
  if (!(date instanceof Date)) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Busca el índice de la columna de 'MES PAGADO'.
 * @param {string} nombreMes - Ej: 'FEBRERO'
 * @param {any[]} encabezados - Fila 1 de la hoja de cálculo.
 * @returns {number} Índice de la columna o -1 si no se encuentra.
 */
function getPagosDelMes(nombreMes, encabezados) {
  const encabezadoBuscado = nombreMes.toUpperCase() + ' PAGADO';
  for (let i = 0; i < encabezados.length; i++) {
    const encabezadoLimpio = String(encabezados[i]).trim().toUpperCase();
    if (encabezadoLimpio.includes(encabezadoBuscado)) {
      return i;
    }
  }
  return -1;
}

/**
 * Intenta convertir el valor de la fecha de corte a un objeto Date.
 * Maneja formatos Date, 'XX DE CADA MES', y 'DÍA DE MES DE AÑO'.
 * @param {string | Date} fechaCorteRaw - Valor de la celda de fecha de corte.
 * @param {number} fila - Número de fila para logging.
 * @returns {Date | null} La fecha de corte convertida.
 */
function parseFechaCorte(fechaCorteRaw, fila) {
  if (fechaCorteRaw instanceof Date) {
    return stripTime(fechaCorteRaw);
  }

  if (typeof fechaCorteRaw !== 'string' || fechaCorteRaw.trim() === '') {
    return null;
  }

  const fechaStrUpper = fechaCorteRaw.trim().toUpperCase();

  // Valores de texto a ignorar
  if (['TODOS LOS MESES', 'N/A', 'ULTIMO DÍA DE CADA MES'].includes(fechaStrUpper)) {
    Logger.log(`SALTO DE FILA ${fila}: Fecha de corte no aplicable/constante. Valor: ${fechaCorteRaw}`);
    return null;
  }

  let fechaCorte;
  const fechaHoy = new Date();

  // Manejar el formato "XX DE CADA MES"
  if (fechaStrUpper.includes('DE CADA MES')) {
    const diaMatch = fechaStrUpper.match(/^(\d+)/);
    if (diaMatch && diaMatch[1]) {
      const dia = parseInt(diaMatch[1]);
      fechaCorte = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), dia);

      // Si la fecha de corte es anterior a hoy, asume el próximo mes - OJO

      if (stripTime(fechaCorte) < stripTime(fechaHoy)) {
        fechaCorte.setMonth(fechaCorte.getMonth() + 1);
      }
      return stripTime(fechaCorte);
    }
  }

  // Intentar manejar formatos de fecha estándar (DÍA DE MES DE AÑO)
  if (!fechaCorte) {
    try {
      const partes = fechaStrUpper.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);

      if (partes) {
        const dia = parseInt(partes[1]);
        const mes = parseInt(partes[2]); // Mes en formato 1-12
        const anio = parseInt(partes[3]);

        fechaCorte = new Date(anio, mes - 1, dia);

        if (!isNaN(fechaCorte.getTime())) {
          return stripTime(fechaCorte);
        }
      }
      // Reemplaza 'DE' y elimina espacios extras para ayudar a Date()
      const fechaStrLimpia = fechaStrUpper.replace(/ DE /g, ' ').replace(' DE', '');
      fechaCorte = new Date(fechaStrLimpia);
      if (!isNaN(fechaCorte.getTime())) {
        return stripTime(fechaCorte);
      }
    } catch (e) {
      Logger.log(`Error de conversión de fecha en fila ${fila}: ${fechaCorteRaw}. Error: ${e}`);
      return null;
    }
  }

  return null;
}
// ==============================================================================
// FUNCIÓN PRINCIPAL QUE SE EJECUTA DIARIAMENTE
// ==============================================================================

function gestionarRecordatorios() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(NOMBRE_HOJA);
  if (!hoja) {
    Logger.log(`Error: Hoja '${NOMBRE_HOJA}' no encontrada.`);
    return;
  }

  const datos = hoja.getDataRange().getValues();
  const encabezados = datos[0];
  const fechaHoy = stripTime(new Date());

  // recordatoriosAgrupados
  const recordatoriosAgrupados = {};

  for (let i = 1; i < datos.length; i++) {
    const fila = i + 1;
    const data = datos[i];

    // OBTENER DATOS CLAVE DE LA FILA
    const emailResponsable = String(data[RESPONSABLE_COL]).trim();
    const cicloFacturacion = String(data[CICLO_FACTURACION_COL]).trim().toUpperCase();
    const servicio = data[SERVICIO_COL];
    const conceptoServico = data[CONCEPTO_SERVICIO];
    const monto = data[MONTO_COL];
    const tarjeta = data[TARJETA_COL];
    const fechaCorteRaw = data[FECHA_CORTE_COL];

    // Conversión robusta de la fecha
    const fechaCorte = parseFechaCorte(fechaCorteRaw, fila);

    // 2. VALIDACIÓN INICIAL
    if (!emailResponsable || !(fechaCorte instanceof Date)) {
      if (fechaCorte !== null) { // Evita loguear los saltos intencionales (N/A, etc.)
        Logger.log(`SALTO DE FILA ${fila}: Fallo de validación inicial. Email: ${emailResponsable}. FechaCorteRaw: '${fechaCorteRaw}'`);
      }
      continue;
    }

    // --- LÓGICA DINÁMICA DE COLUMNA DE PAGO ---
    const nombreMes = obtenerNombreMes(fechaCorte);
    const colPagadoIndex = getPagosDelMes(nombreMes, encabezados);

    if (colPagadoIndex === -1) {
      Logger.log(`Advertencia: No se encontró la columna '${nombreMes} Pagado' para la fila ${fila}.`);
      continue;
    }

    const mesPagado = data[colPagadoIndex];
    const rangoColor = hoja.getRange(fila, colPagadoIndex + 1);

    // 3. SEMAFORIZACIÓN Y SUSPENDER CORREO
    let enviarCorreo = true;
    const pagoLimpio = String(mesPagado).trim();

    if (pagoLimpio !== '') {
      rangoColor.setBackground(COLOR_VERDE);
      enviarCorreo = false;
    } else {
      rangoColor.setBackground(COLOR_ROJO);
    }

    if (!enviarCorreo) continue;


    // 4. Chequeo de Alerta de Pago INMEDIATO (VENCIDO)
    const limiteAlertaSinHora = new Date(fechaCorte);
    limiteAlertaSinHora.setDate(limiteAlertaSinHora.getDate() + 2);

    if (fechaHoy > stripTime(limiteAlertaSinHora)) {
      if (!recordatoriosAgrupados[emailResponsable]) recordatoriosAgrupados[emailResponsable] = { recordatorios: [], alertas: [] };

      const mensajeAlerta = `🔖Servicio: ${servicio} | Concepto: ${conceptoServico} - 💰Monto: ${monto} - 🚫Venció el: ${Utilities.formatDate(fechaCorte, Session.getScriptTimeZone(), "dd/MM/yyyy")}`;
      recordatoriosAgrupados[emailResponsable].alertas.push(mensajeAlerta);

      // 🚨 DIAGNÓSTICO WASABI
      if (String(servicio).toUpperCase().includes(WASABI_CHECK_SERVICE)) {
        Logger.log(`🚨 ALERTA WASABI REGISTRADA para ${emailResponsable}. Fila: ${fila}`);
      }

      continue; // Si ya es una alerta crítica, no necesita recordatorio
    }


    // 5. Chequeo de Recordatorio de Vencimiento
    let diasAntes = (cicloFacturacion === 'MENSUAL') ? 7 :
      (cicloFacturacion === 'ANUAL') ? 60 :
        null;

    if (diasAntes === null) continue;

    const fechaRecordatorio = new Date(fechaCorte);
    fechaRecordatorio.setDate(fechaRecordatorio.getDate() - diasAntes);
    const recordatorioSinHora = stripTime(fechaRecordatorio);

    // Si la fecha de hoy está dentro del periodo de recordatorio (recordatorioSinHora <= fechaHoy < fechaCorte)
    if (fechaHoy >= recordatorioSinHora && fechaHoy < fechaCorte) {
      if (!recordatoriosAgrupados[emailResponsable]) recordatoriosAgrupados[emailResponsable] = { recordatorios: [], alertas: [] };

      // Construir el mensaje
      let mensaje = `🔖Servicio: ${servicio}  | Concepto:${conceptoServico} - 💰Monto: ${monto} - 🗓️Fecha de Corte: ${Utilities.formatDate(fechaCorte, Session.getScriptTimeZone(), "dd/MM/yyyy")}`;
      if (cicloFacturacion === 'MENSUAL') {
        mensaje += ` - 💳Tarjeta: ${tarjeta}`;
      }

      recordatoriosAgrupados[emailResponsable].recordatorios.push(mensaje);
    }
  }

  // 6. Enviar Correo ÚNICO Agrupado por Responsable
  enviarCorreosAgrupadosUnificados(recordatoriosAgrupados, new Date());

  // 🔍 LOG FINAL
  Logger.log("Recordatorios Agrupados Finales (para envío): " + JSON.stringify(recordatoriosAgrupados));

  SpreadsheetApp.flush();
}

// ==============================================================================
// FUNCIONES DE ENVÍO DE CORREO UNIFICADAS
// ==============================================================================

/**
 * Genera el cuerpo del correo con ambas secciones: Alertas y Recordatorios.
 */
function construirCuerpoCorreo(data, fechaStr) {
  const hayAlertas = data.alertas.length > 0;
  const hayRecordatorios = data.recordatorios.length > 0;

  let htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333333;">
          <h3 style="color: #4CAF50;">Estimado(a) Responsable,</h3>
          <p>Esta es la notificación automática del Cuadro de Mando con fecha <b>${fechaStr}</b>.</p>
          <hr style="border: 0; border-top: 1px solid #eee;">
          
          <p style="margin-top: 30px;">
            <b>Acción general:</b> Por favor, gestione los pagos o <b>actualice el estado en el Cuadro de Mando</b>.
          </p>
    `;

  // --- SECCIÓN 1: ALERTAS CRÍTICAS (Pagos Vencidos) ---
  if (hayAlertas) {
    htmlBody += `
          <div style="background-color: #F8D7DA; border-left: 5px solid #DC3545; padding: 15px; margin-bottom: 20px;">
            <h4 style="color: #DC3545; margin-top: 0;">🚨 ALERTA CRÍTICA: PAGO INMEDIATO REQUERIDO (${data.alertas.length} Servicios)</h4>
            <ul style="list-style: none; padding-left: 0;">
        `;
    data.alertas.forEach(alerta => {
      //const detalles = alerta.replace('• ', '');

      let detalles = alerta.replace('🔖Servicio:', '💳 **Servicio:**');
      detalles = detalles.replace('| Concepto:', '| 🔖 **Concepto:**');

      htmlBody += `<li>⚠️ <b>${detalles}</b></li>`;
    });
    htmlBody += `
            </ul>
            <p style="color: #DC3545;"><b>🚨 ACCIÓN URGENTE:</b> Por favor, procese estos pagos inmediatamente.</p>
          </div>
        `;
  }

  // --- SECCIÓN 2: RECORDATORIOS DE VENCIMIENTO ---
  if (hayRecordatorios) {
    htmlBody += `
          <h4 style="color: #1A73E8; border-top: 1px solid #eee; padding-top: 20px;">🗓️ Recordatorio de Vencimiento de Servicios (${data.recordatorios.length} Servicios)</h4>
          <ul style="list-style: square; padding-left: 25px;">
        `;
    data.recordatorios.forEach(recordatorio => {
      // Lógica de parseo simple para formato HTML
      /*let servicio = 'N/D', monto = 'N/D', corte = 'N/D', tarjeta = '';
      const parts = recordatorio.split(' - ');
      
      if (parts.length >= 3) {
          servicio = parts[0].replace('🔖 Servicio: ', '').trim();
          monto = parts[1].replace('💰 Monto: ', '').trim();
          corte = parts[2].replace('🗓️ Fecha de Corte: ', '').trim();
          if (parts.length === 4) {
              tarjeta = ` | ${parts[3].replace('💳 Tarjeta: ', '').trim()}`;
          }
      }*/

      let detalles = recordatorio.replace('🔖Servicio:', '💳 **Servicio:**');
      detalles = detalles.replace('| Concepto:', '| 🔖 **Concepto:**');
      detalles = detalles.replace(' - 💰Monto:', ' | 💰 **Monto:**');
      detalles = detalles.replace(' - 🗓️Fecha de Corte:', ' | 🗓️ **Vence:**');
      detalles = detalles.replace(' - 💳Tarjeta:', ' | 💳 **Tarjeta:**');

      htmlBody += `
              <li style="margin-bottom: 10px;">
                ${detalles}
              </li>
            `;
    });
    htmlBody += `
          </ul>
        `;
  }

  // --- CIERRE ---
  htmlBody += `
          <p style="font-size: 0.9em; color: #777777; margin-top: 30px;">
            Gracias por su atención. Este es un correo automático.
          </p>
        </body>
      </html>
    `;

  return htmlBody;
}


/**
 * Envía un único correo a cada responsable que tenga ALERTA o RECORDATORIO.
 * Se llama desde gestionarRecordatorios.
 */
function enviarCorreosAgrupadosUnificados(destinatarios, fechaHoy) {
  const fechaStr = Utilities.formatDate(fechaHoy, Session.getScriptTimeZone(), "dd/MM/yyyy");
  const ccString = CORREOS_CC_FIJOS.join(',');

  for (const email in destinatarios) {
    const data = destinatarios[email];

    if (data.alertas.length === 0 && data.recordatorios.length === 0) continue;

    // 1. Determinar el asunto basado en la prioridad
    let asunto;
    if (data.alertas.length > 0) {
      asunto = `🚨 ALERTA CRÍTICA Y PENDIENTES (${data.alertas.length} Urgentes + ${data.recordatorios.length} Próximos)`;
    } else {
      asunto = `📅 Recordatorio de Vencimiento de Servicios (${data.recordatorios.length} Servicios Próximos)`;
    }

    // 2. Construir el cuerpo HTML
    const htmlBody = construirCuerpoCorreo(data, fechaStr);

    // 3. Enviar el UNIFICADO
    MailApp.sendEmail({
      to: email,
      cc: ccString,
      subject: asunto,
      htmlBody: htmlBody
    });

    Logger.log(`Correo ÚNICO enviado a ${email}. Alertas: ${data.alertas.length}, Recordatorios: ${data.recordatorios.length}`);
  }
}

// ==============================================================================
// 🎯 NUEVAS FUNCIONES DE ENVÍO DE FACTURAS DE DRIVE (Weekly Invoice Sender)
// ==============================================================================

function enviarFacturasInteligente() {

  // --- CONFIGURACIÓN PRINCIPAL ---

  const ID_CARPETA = '1_H5kM5M0mXu7Pdfy3n_sNFHniJ9rYlwx';
  const EMAIL_DESTINO = 'facturacioncrc@ustarizabogados.com';

  const CORREOS_CC_ARRAY = [
    'sistemas3@ustarizabogados.com',
    'julian.mendez@ustarizabogados.com',
    'administrativo@ustarizabogados.com',
    'contador@ustarizabogados.com',
    'asistente.contable2@ustarizabogados.com'
  ];

  const CORREOS_CC = CORREOS_CC_ARRAY.join(',');

  //NOMBRE DE LA SUBCARPETA DONDE SE MUEVEN LAS FACTURAS ENVIADAS

  const NOMBRE_CARPETA_HISTORIAL = '_Facturas Enviadas';

  // 1. Tarjeta por defecto
  const TARJETA_DEFAULT = '(1977)';

  // 2. Excepciones: Se define que servicios usan otra tarjeta
  // El nombre debe coincidir EXACTAMENTE con el nombre del archivo antes del guion.
  const TARJETAS_ESPECIFICAS = {
    'TwilioSengrigBlue': '(2709)'
  };

  // --- OBTENER FECHAS ---
  const hoy = new Date();
  const datosFecha = obtenerSemanaYMes(hoy);
  const ASUNTO = `FACTURAS ${datosFecha.semana}A SEMANA ${datosFecha.mes}`; // Uso de template string

  // --- LÓGICA DE ARCHIVOS ---
  try {
    const carpeta = DriveApp.getFolderById(ID_CARPETA);

    //Obtener la subcarpeta de Historia
    const carpetasHijas = carpeta.getFoldersByName(NOMBRE_CARPETA_HISTORIAL);
    let carpetaHistorial;

    if (carpetasHijas.hasNext()) {
      carpetaHistorial = carpetasHijas.next();
    } else {
      carpetaHistorial = carpeta.createFolder(NOMBRE_CARPETA_HISTORIAL);
    }

    const archivos = carpeta.getFiles();

    let listaFacturasHTML = '<ol>';
    let hayAdjuntos = false;
    let adjuntosBlobs = [];
    let archivosParaMover = []; //Lista para los archivos a mover

    while (archivos.hasNext()) {
      let archivo = archivos.next();
      let mimeType = archivo.getMimeType();

      //FILTRO DE TIPO ARCHIVO: PDF Y ZIP
      if (mimeType === MimeType.PDF || mimeType === MimeType.ZIP) {

        // Extraemos el nombre del servicio
        let nombreServicio = archivo.getName().split('_')[0].trim();

        // LÓGICA DE TARJETAS
        let tarjetaAUsar = TARJETA_DEFAULT;
        if (TARJETAS_ESPECIFICAS[nombreServicio]) {
          tarjetaAUsar = TARJETAS_ESPECIFICAS[nombreServicio];
        }

        // Etiqueta para el tipo de archivo en la lista

        let tipoArchivoEtiqueta = mimeType === MimeType.ZIP ? 'ZIP' : 'PDF';

        // Armamos la línea de la lista
        listaFacturasHTML += `<li>${nombreServicio} ${tarjetaAUsar}</li>`;

        if (mimeType === MimeType.ZIP) {
          adjuntosBlobs.push(archivo.getBlob()); // ✔ ZIP intacto
        } else {
          adjuntosBlobs.push(archivo.getAs(MimeType.PDF)); // ✔ PDF normal
        }
        archivosParaMover.push(archivo);
        hayAdjuntos = true;
      }
    }
    listaFacturasHTML += '</ol>';

    // --- CUERPO DEL CORREO ---
    const CUERPO_HTML = `
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; background-color: #f4f4f4;">
          
          <div style="max-width: 650px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            
            <h1 style="color: #1A73E8; border-bottom: 3px solid #1A73E8; padding-bottom: 10px; margin-top: 0;">
                &#x1F4CB; Reporte Semanal de Facturación
            </h1>
            
            <p style="font-size: 1.1em; color: #555;">
                Buen día. A continuación envío facturas de los siguientes servicios:
            </p>

            <div style="text-align: center; background-color: #E8F0FE; padding: 15px; margin: 20px 0; border-radius: 6px; border: 1px solid #C5DAFC;">
                <span style="font-size: 1.5em; font-weight: bold; color: #1A73E8;">
                    SEMANA ${datosFecha.semana} de ${datosFecha.mes}
                </span>
            </div>

            <h3 style="color: #333; margin-top: 30px;">
                &#x1F4C1; Facturas Adjuntas (Servicios Reportados)
            </h3>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px;">
              ${hayAdjuntos
        ? listaFacturasHTML
        : '<p style="color: #777; font-style: italic;">❌ No se encontraron facturas nuevas en Drive esta semana.</p>'}
            </div>
            
            <ul style="list-style: disc; padding-left: 20px;">
              <li><b>Nota general:</b> No hay registro de pago de los demás servicios. En cuanto se encuentre un nuevo movimiento este será enviado de inmediato.</li>
            </ul>

            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
            
            <p style="font-size: 0.9em; color: #777777;">
                Cordialmente,<br>
                Sistema de Automatización de Facturas
            </p>
          </div>
        </body>
      </html>
    `;

    // --- ENVÍO Y MOVIMIENTO A HISTORIAL---
    if (hayAdjuntos) {
      GmailApp.sendEmail(EMAIL_DESTINO, ASUNTO, 'Ver correo en HTML', {
        htmlBody: CUERPO_HTML,
        attachments: adjuntosBlobs,
        cc: CORREOS_CC
      });

      //ACCION CLAVE: Mover los archivos a la carpeta de historial
      archivosParaMover.forEach(archivo => {
        try {
          archivo.moveTo(carpetaHistorial);
          Logger.log(`Movido: ${archivo.getName()}`);
        } catch (moveError) {
          Logger.log(`Error al mover el archivo ${archivo.getName()}: ${moveError}`);
        }
      });
      Logger.log('Proceso de envio y movimiento completado');
    } else {
      Logger.log('No se encontraaron archivos nuevos para adjuntar y enviar.');
    }
  } catch (e) {
    Logger.log(`Error al procesar facturas: ${e.toString()}`);
    // Si el error es al buscar la carpeta (por ID incorrecto o permisos), avisa
    if (e.toString().includes('No such folder')) {
      Logger.log('¡ADVERTENCIA! Revisa el ID de la carpeta en la constante ID_CARPETA.');
    }
  }
} // <<-- ¡Llave de cierre crucial!

// Función auxiliar de fecha (sin cambios)
function obtenerSemanaYMes(fecha) {
  const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  const mes = meses[fecha.getMonth()];
  const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const semana = Math.ceil((((fecha - primerDia) / 86400000) + primerDia.getDay() + 1) / 7);
  return { semana: semana, mes: mes };
}
