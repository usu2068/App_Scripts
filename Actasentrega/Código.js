// ================= CONFIGURACIÓN =================

const ID_PLANTILLA = '1zj82FqlvaCkNdBoZdJ9yq1SYrunu7Xot0mogDaSaBKQ';
const NOMBRE_HOJA_DATOS = 'ACTAS DE ENTREGA';

/*const CORREOS_CC = [
  "sistemas3@ustarizabogados.com",
  "julian.mendez@ustarizabogados.com",
  "administrativo@ustarizabogados.com",
  "admin3@legalcrc.com"
].join(",");*/

const COLUMNAS_DATOS = 12;
const COLUMNA_EMAIL = 13;
const COLUMNA_STATUS = 14;
const COLUMNA_ID_CARPETA_FOTOS = 16;

// =================================================

function procesarFilasPendientes() {

  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA_DATOS);
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return;

  const datos = hoja.getRange(2, 1, ultimaFila - 1, COLUMNA_ID_CARPETA_FOTOS).getValues();

  datos.forEach((filaDatos, i) => {
    const fila = i + 2;
    const estado = hoja.getRange(fila, COLUMNA_STATUS).getValue();

    if (estado === 'ENVIADO' || estado === 'PROCESANDO') return;

    const email = filaDatos[COLUMNA_EMAIL - 1];
    if (!email) return;

    for (let j = 0; j < COLUMNAS_DATOS; j++) {
      if (!filaDatos[j]) return;
    }

    hoja.getRange(fila, COLUMNA_STATUS).setValue('PROCESANDO');

    try {
      generarActaYEnviar(hoja, fila, filaDatos, email);
    } catch (e) {
      hoja.getRange(fila, COLUMNA_STATUS)
        .setValue(`ERROR`)
        .setBackground('#f4cccc');
      Logger.log(e);
    }
  });
}

// =================================================

function generarActaYEnviar(hoja, fila, datos, email) {

  const hoy = new Date();
  const dia = Utilities.formatDate(hoy, "America/Bogota", "dd");
  const mes = hoy.toLocaleDateString('es-CO', { month: 'long' });
  //const anio = hoy.getFullYear();
  const anioNumero = hoy.getFullYear();
  const anioTexto = numeroALetras(anioNumero);


  const datosActa = {
    NOMBRE_FUNCIONARIO: datos[0],
    CEDULA: datos[1],
    CIUDAD_EXPEDICION: datos[2],
    CODIGO_INTERNO: datos[3],
    MARCA: datos[4],
    TIPO: datos[5],
    MODELO: datos[6],
    PULGADAS: datos[7],
    RESOLUCIÓN_PANTALLA: datos[8],
    CONECTIVIDAD: datos[9],
    SOFTWARE_INSTALADO: datos[10],
    OBSERVACIONES: datos[11],
    DIA: dia,
    MES_TEXTO: mes,
    AÑO_NUMERO: anioNumero,
    AÑO_TEXTO: anioTexto
  };

  const nombreArchivo = `Acta de Entrega - ${datosActa.NOMBRE_FUNCIONARIO} - ${datosActa.CEDULA}`;

  // Crear UNA sola copia
  const docFile = DriveApp.getFileById(ID_PLANTILLA).makeCopy(nombreArchivo);
  const doc = DocumentApp.openById(docFile.getId());
  const body = doc.getBody();

  Object.entries(datosActa).forEach(([k, v]) => {
    body.replaceText(`{{${k}}}`, v);
  });

  doc.saveAndClose();

  const pdf = docFile.getAs(MimeType.PDF);

  // ZIP de fotos
  const idCarpetaFotos = hoja.getRange(fila, COLUMNA_ID_CARPETA_FOTOS).getValue();
  const zipFotos = obtenerZipFotos(idCarpetaFotos, `${nombreArchivo} - Fotos`);

  const adjuntos = [pdf];
  if (zipFotos) adjuntos.push(zipFotos);

  MailApp.sendEmail({
    to: email,
    //cc: CORREOS_CC,
    subject: `📄 Acta de Entrega de Equipo – ${datosActa.CODIGO_INTERNO}`,
    htmlBody: generarCorreoHTML(datosActa),
    attachments: adjuntos
  });

  // Pintar TODA la fila de verde
  hoja.getRange(fila, 1, 1, COLUMNA_STATUS)
    .setBackground('#b6d7a8');

  hoja.getRange(fila, COLUMNA_STATUS).setValue('ENVIADO');
}

// =================================================
// 🔹 HTML MEJORADO DEL CORREO
// =================================================

function generarCorreoHTML(d) {
  return `
  <html>
    <body style="font-family: Arial, sans-serif; background-color:#f4f5f7; padding:25px;">
      <div style="max-width:650px; margin:auto; background:#ffffff; border-radius:8px; padding:30px; box-shadow:0 4px 8px rgba(0,0,0,0.08); text-align:center;">

        <h2 style="margin-top:0; color:#1A73E8; font-size:24px;">
          📄 Acta de Entrega de Equipo
        </h2>

        <p style="color:#555; font-size:15px; margin-top:-10px;">
          Notificación automática – Área de Tecnología
        </p>

        <hr style="margin:25px 0; border:none; border-top:1px solid #e5e5e5;">

        <p style="font-size:17px; color:#333;">
          Estimado(a) <strong>${d.NOMBRE_FUNCIONARIO}</strong>,
        </p>

        <p style="font-size:16px; color:#333;">
          Adjuntamos el <strong>Acta de Entrega</strong> correspondiente al equipo asignado, con la siguiente referencia:
        </p>

        <div style="background:#eef4ff; border-left:4px solid #1A73E8; padding:15px; border-radius:5px; margin:25px auto; max-width:350px;">
          <p style="margin:0; font-size:15px; color:#333;">
            <strong>Código interno del equipo:</strong><br>
            <span style="font-size:20px; font-weight:bold;">
              ${d.CODIGO_INTERNO}
            </span>
          </p>
        </div>

        <p style="font-size:16px; color:#333; text-align:left;">
          Por favor:
        </p>

        <ul style="font-size:15px; color:#333; text-align:left; margin-left:20px;">
          <li>Descargue el documento adjunto.</li>
          <li>Revise cuidadosamente la información.</li>
          <li>Firme el acta.</li>
          <li>Entregue el documento firmado al área Administrativa y envíe una copia firmada al área de Tecnología.</li>
        </ul>

        <p style="font-size:16px; color:#333;">
          Si tiene alguna inquietud, puede comunicarse con el área de Tecnología.
        </p>

        <p style="font-size:16px; color:#333;">
          Cordialmente,<br>
          <strong>Área de Tecnología</strong>
        </p>

        <hr style="margin:25px 0; border:none; border-top:1px solid #e5e5e5;">

        <p style="font-size:12px; color:#777;">
          © ${new Date().getFullYear()} – Sistema de Gestión de Activos TI<br>
          Este mensaje fue generado automáticamente. Por favor no responder.
        </p>

      </div>
    </body>
  </html>
  `;
}

// =================================================

function obtenerZipFotos(idCarpeta, nombreZip) {
  if (!idCarpeta) return null;

  const carpeta = DriveApp.getFolderById(idCarpeta);
  const archivos = carpeta.getFiles();
  const blobs = [];

  while (archivos.hasNext()) {
    blobs.push(archivos.next().getBlob());
  }

  if (blobs.length === 0) return null;
  return Utilities.zip(blobs, `${nombreZip}.zip`);
}

// =================================================

function numeroALetras(numero) {
  const unidades = [
    '', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis',
    'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
    'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
    'dieciocho', 'diecinueve'
  ];
  const decenas = [
    '', '', 'veinte', 'treinta', 'cuarenta',
    'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'
  ];
  const centenas = [
    '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos',
    'quinientos', 'seiscientos', 'setecientos', 'ochocientos',
    'novecientos'
  ];

  if (numero === 100) return 'cien';
  if (numero < 20) return unidades[numero];
  if (numero < 100) {
    const d = Math.floor(numero / 10);
    const u = numero % 10;
    return u === 0 ? decenas[d] : `${decenas[d]} y ${unidades[u]}`;
  }
  if (numero < 1000) {
    const c = Math.floor(numero / 100);
    const resto = numero % 100;
    return resto === 0
      ? centenas[c]
      : `${centenas[c]} ${numeroALetras(resto)}`;
  }

  // Para años como 2026
  const miles = Math.floor(numero / 1000);
  const resto = numero % 1000;
  return resto === 0
    ? `${unidades[miles]} mil`
    : `${unidades[miles]} mil ${numeroALetras(resto)}`;
}

