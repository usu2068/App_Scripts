📧 Automatización de Recordatorios y Envío de Facturas – Google Apps Script
📌 Descripción general

Este proyecto implementa una automatización sobre Google Apps Script que cumple dos funciones principales:

Gestión automática de recordatorios y alertas de pago a partir de un Google Sheet.

Envío semanal de facturas desde Google Drive por correo electrónico, evitando duplicados y manteniendo un historial de archivos ya enviados.

El script está diseñado para operar de forma controlada, trazable y segura, utilizando únicamente servicios nativos de Google Workspace (Sheets, Drive y Gmail).

🧩 Arquitectura general
Google Sheets (SERVICIOS2025)
        │
        ▼
Google Apps Script
        │
 ┌──────┴─────────┐
 │                │
 ▼                ▼
Recordatorios     Envío de facturas
(Gmail)           (Drive → Gmail)

1️⃣ Gestión de recordatorios de pagos
📄 Fuente de datos

Hoja de cálculo: SERVICIOS2025

Cada fila representa un servicio con:

Responsable

Servicio

Concepto

Fecha de corte

Ciclo de facturación

Monto

Tarjeta asociada

Columnas dinámicas de pago mensual (ENERO PAGADO, FEBRERO PAGADO, etc.)

⚙️ Lógica de funcionamiento

La función principal es:

gestionarRecordatorios()

Flujo de ejecución:

Lee todas las filas del Sheet.

Convierte y valida la fecha de corte (soporta:

Fechas reales

“XX DE CADA MES”

Formatos texto comunes).

Identifica dinámicamente la columna del mes correspondiente.

Aplica semaforización visual:

🟢 Verde → Pagado

🔴 Rojo → Pendiente

Evalúa el estado del servicio:

🚨 Alerta crítica: pago vencido (+2 días).

📅 Recordatorio: próximo a vencer (según ciclo mensual o anual).

Agrupa los mensajes por responsable.

Envía un solo correo consolidado por persona.

✉️ Envío de correos

Servicio utilizado: MailApp

Formato: HTML

Contenido:

Alertas críticas separadas de recordatorios

Información clara del servicio, monto y fecha

Copia fija a correos administrativos definidos en configuración.

2️⃣ Envío inteligente de facturas desde Google Drive
📂 Fuente de archivos

Carpeta principal de Drive (ID configurable).

Tipos de archivo admitidos:

📄 PDF

📦 ZIP (enviados sin alteración).

⚙️ Función principal
enviarFacturasInteligente()

Flujo de ejecución:

Accede a la carpeta configurada por ID.

Busca o crea una única carpeta de historial:

_Facturas Enviadas


Filtra únicamente archivos PDF y ZIP.

Adjunta los archivos al correo:

ZIP → getBlob() (sin conversión).

PDF → getAs(PDF).

Envía el correo con todas las facturas nuevas.

Mueve los archivos enviados a la carpeta de historial.

✅ Esto garantiza:

No reenviar facturas antiguas.

Historial limpio y trazable.

Idempotencia del proceso.

🔐 Seguridad y control

No se almacenan credenciales en el código.

Permisos limitados a:

Google Sheets

Google Drive

Gmail

Todo el procesamiento ocurre dentro de la infraestructura de Google.

No hay servicios externos ni dependencias de terceros.

📁 Estructura del proyecto
apps-scripts/
│
├─ EnvioCorreos.js
├─ appsscript.json
├─ README.md
├─ .gitignore

🚀 Despliegue y control de versiones

Este proyecto se gestiona mediante clasp:

clasp pull → Descargar cambios desde Google

clasp push → Subir cambios a Google

git → Control de versiones y trazabilidad

🧠 Autor

Karen Lorena Pedraza Castañeda
Analista de TI
Consultorías en Innovación Financiera S.A.S