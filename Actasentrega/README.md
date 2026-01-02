📄 Automatización de Actas de Entrega – Google Apps Script

Este repositorio contiene un sistema de automatización desarrollado en **Google Apps Script** para la **gestión, generación, control y notificación de Actas de Entrega de equipos tecnológicos**, utilizando **Google Sheets, Google Docs, Google Drive y Gmail**.

El objetivo principal es asegurar la trazabilidad de la asignación de activos TI, reducir reprocesos manuales y garantizar evidencia documental y controlada del proceso de entrega y firma de equipos.

---

## 🎯 Objetivos del Proyecto

- Automatizar la generación de Actas de Entrega desde una plantilla
- Validar que la información del acta esté completa antes del envío
- Enviar actas automáticamente por correo electrónico
- Adjuntar evidencias fotográficas del equipo en formato `.zip`
- Gestionar recordatorios automáticos de firma
- Visualizar el estado del acta mediante semaforización
- Evitar duplicidad de actas y reprocesos
- Mantener un proceso controlado, auditable y seguro

---

## 🧩 Arquitectura General

### Componentes involucrados

#### 📊 Google Sheets
Hoja de control **ACTAS DE ENTREGA** con campos como:

- Datos del funcionario
- Datos del equipo (marca, modelo, código interno, etc.)
- Correo del responsable
- Estado del acta
- ID de carpeta de evidencias
- Confirmación de acta recibida

#### 📄 Google Docs
- Plantilla base del Acta de Entrega
- Uso de variables dinámicas (`{{CAMPO}}`) para completar la información

#### 📁 Google Drive
- Carpeta por acta con:
  - Fotos del equipo
- Generación automática de archivo `.zip` con evidencias

#### ✉️ Gmail
- Envío de correos HTML personalizados
- Adjuntos:
  - Acta en PDF
  - ZIP con fotos del equipo

---

## 🔁 Flujo de Funcionamiento

1. El script se ejecuta de forma manual o programada
2. Se validan los campos obligatorios del acta
3. Se genera **una única copia** del acta desde la plantilla
4. Se reemplazan los datos dinámicos
5. Se convierte el documento a PDF
6. Se comprimen las fotos del equipo en un ZIP
7. Se envía el correo al funcionario responsable
8. Se actualiza el estado del acta en la hoja

---

## 🚦 Gestión de Estados y Recordatorios

### Estados Automáticos

- 🟥 **Pendiente**
  - No se ha recibido el acta firmada
  - Se envían recordatorios periódicos
- 🟩 **Recibido**
  - Acta confirmada
  - Se detienen los recordatorios

### Recordatorios Automáticos

- Envío de correos de recordatorio al funcionario
- Copia al área de TI
- Cambio automático de color según el estado

---

## 🧾 Envío Inteligente de Evidencias

- Las fotos del equipo:
  - Se toman desde una carpeta de Drive
  - Se adjuntan como `.zip`
- No se envían enlaces, solo archivos adjuntos
- Garantiza:
  - Integridad
  - Evidencia documental
  - Control del proceso

---

## 🔐 Consideraciones de Seguridad

- No se almacenan credenciales en el código
- Uso exclusivo de servicios nativos de Google:
  - `MailApp`
  - `DriveApp`
  - `DocumentApp`
- El procesamiento se realiza dentro del entorno de Google
- No se ejecuta código ni archivos localmente
- El ZIP se envía íntegro, sin extracción

---

## ⚠️ Nota Importante sobre `.clasp.json`

El archivo `.clasp.json` contiene identificadores internos del proyecto de Google Apps Script y **no se incluye en el repositorio público** por razones de seguridad y buenas prácticas.

---

## 🛠️ Requisitos

- Cuenta Google con acceso a:
  - Google Sheets
  - Google Docs
  - Google Drive
  - Gmail
- Proyecto de Google Apps Script
- Permisos para:
  - Envío de correos
  - Lectura y movimiento de archivos en Drive
  - Edición de documentos

---

## 📌 Autor

**Karen Lorena Pedraza Castañeda**  
Analista de TI  
Consultorías en Innovación Financiera S.A.S

---

## 📅 Última actualización

Enero 2026



