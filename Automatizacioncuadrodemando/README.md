
# 📊 Automatización Cuadro de Mando – Google Apps Script

Este repositorio contiene un **script de automatización desarrollado en Google Apps Script** para la gestión, control y notificación de **servicios, facturación y vencimientos**, basado en información registrada en Google Sheets y archivos almacenados en Google Drive.

El objetivo principal es **reducir riesgos operativos**, **mejorar la trazabilidad de pagos** y **automatizar notificaciones críticas**, manteniendo controles claros y auditables.

---

## 🎯 Objetivos del Proyecto

- Automatizar **recordatorios y alertas de vencimiento de servicios**
- Detectar **pagos vencidos** y notificar de forma prioritaria
- Enviar **facturas semanales adjuntas** desde Google Drive
- Evitar envíos duplicados y **ordenar el histórico de facturación**
- Mantener un proceso **controlado, trazable y seguro**

---

## 🧩 Arquitectura General

**Componentes involucrados:**

- **Google Sheets**  
  Cuadro de mando principal (`SERVICIOS2025`) con:
  - Responsables
  - Servicios
  - Fechas de corte
  - Ciclo de facturación
  - Estado de pago por mes

- **Google Apps Script**
  - Lógica de validación
  - Cálculo de fechas
  - Agrupación de notificaciones
  - Envío de correos HTML

- **Gmail**
  - Envío de correos automáticos
  - Envío de facturas como adjuntos (PDF / ZIP)

- **Google Drive**
  - Carpeta de facturas
  - Carpeta de histórico para archivos enviados

---

## 🔁 Flujo de Funcionamiento

1. El script se ejecuta de forma programada (trigger)
2. Se leen los datos del cuadro de mando
3. Se valida:
   - Responsable
   - Fecha de corte
   - Estado de pago del mes correspondiente
4. Se clasifica cada servicio en:
   - ✅ Pagado
   - 🟡 Próximo a vencer
   - 🚨 Vencido
5. Se agrupan notificaciones por responsable
6. Se envía **un solo correo consolidado por persona**
7. En el envío semanal:
   - Se adjuntan facturas nuevas (PDF / ZIP)
   - Los archivos enviados se mueven a carpeta de historial

---

## 🚨 Gestión de Alertas y Recordatorios

### Alertas Críticas
- Pagos vencidos (+2 días)
- Asunto prioritario
- Colorización en hoja (rojo)

### Recordatorios Preventivos
- Mensual: 7 días antes
- Anual: 60 días antes
- Correos agrupados por responsable

### Semaforización Automática
- 🟥 No pagado
- 🟩 Pagado

---

## 🧾 Envío Inteligente de Facturas

- Se revisa una carpeta específica de Drive
- Se envían únicamente:
  - PDFs
  - ZIPs
- Las facturas enviadas:
  - Se adjuntan al correo (no links)
  - Se mueven automáticamente a `_Facturas Enviadas`
- Evita:
  - Reenvíos
  - Duplicados
  - Desorden en Drive

---

## 🔐 Consideraciones de Seguridad

- No se almacenan credenciales en el código
- Se utilizan servicios nativos de Google:
  - `MailApp`
  - `GmailApp`
  - `DriveApp`
- El procesamiento se ejecuta **dentro del entorno de Google**
- No se descargan ni ejecutan archivos localmente
- Los archivos ZIP se envían **íntegros**, sin extracción

---

## 📁 Estructura del Repositorio

