# 💼 Presupuestos Pro - SaaS de Presupuestos, Firma Digital y Facturación

Plataforma ágil y profesional diseñada para autónomos, empresas instaladoras, reformas y agencias que necesitan generar presupuestos en PDF de alta calidad, compartirlos por WhatsApp, recabar firmas digitales en línea con valor contractual y convertirlos automáticamente en facturas oficiales correlativas.

Desarrollada para correr sobre **Linux / Portainer** mediante Docker Compose con PostgreSQL, sincronizada con GitHub y preparada para integrarse fácilmente en sistemas superiores.

---

## 🔌 Puertos de Despliegue (Desplazados +25)

- **Portal Web / SaaS:** Puerto **`3025`** *(3000 + 25)* ➔ `http://<ip-servidor>:3025`
- **Base de Datos (PostgreSQL):** Puerto **`5457`** *(5432 + 25)* ➔ Conectable externamente para tu ecosistema

---

## 🚀 Características Principales

- **Multi-Tenant SaaS con Control de Créditos:**
  - Panel de administración exclusivo (`/admin/users`) para gestionar usuarios.
  - Asignación y recarga de créditos (1 presupuesto = 1 crédito) o activación de **Tarifa Plana Ilimitada**.
  - Auditoría y trazabilidad de recargas.
- **Configuración Fiscal y de Marca del Emisor:**
  - Logotipo de empresa con previsualización en tiempo real.
  - Datos fiscales completos (NIF/CIF, dirección, contacto).
  - Modalidades de pago: Transferencia bancaria (con IBAN y titular), efectivo o tarjeta.
  - Calculadora de plazos fraccionados: división proporcional automática en X pagos (ej. 50% inicio y 50% fin).
  - **Hoja 2 Independiente en PDF**: Condiciones legales contractuales, cláusulas de garantía y RGPD anexas siempre en hoja aparte.
- **Editor Ágil de Presupuestos (Mobile-First):**
  - Creación por partidas alzadas o por unidades/horas con precios unitarios.
  - Cálculo fiscal configurable: con/sin IVA, tipos impositivos (21%, 10%, 4%, 0%) y retenciones IRPF.
  - **Catálogo de Conceptos Reutilizables**: Guarda partidas frecuentes y añádelas con un solo clic.
  - **Asistente IA para Partidas**: Describe lo que necesitas en lenguaje natural y la IA desglosará automáticamente los trabajos y estimaciones.
- **Visualización Pública y Firma Digital:**
  - Enlace público seguro y responsive (`/p/[token]`) sin necesidad de login para el cliente.
  - Pad de firma digital táctil para smartphones o ratón en ordenadores.
  - Detección automática de apertura (marca el estado como `VISTO`).
  - Caja de comentarios y dudas del cliente que se reflejan directamente en tu panel de control.
- **Compartición por WhatsApp y Descarga de PDF:**
  - Botón directo de WhatsApp que genera el mensaje con el importe, número de presupuesto y enlace de firma.
  - Generación de PDF multi-página impecable con sello de firma digital y fecha estampada.
- **Facturación y Exportación para Gestoría:**
  - Convierte cualquier presupuesto aceptado en factura oficial con numeración correlativa (`FAC-0001`).
  - Exportador a CSV / Excel con formato estándar para tu asesoría o gestoría contable.
- **Diseño Mobile-First y Temas:**
  - Barra de navegación táctil inferior en móviles.
  - Barra lateral completa y tablas de alta densidad en ordenadores.
  - Selector de modo Claro y Oscuro con persistencia automática.

---

## 🛠️ Despliegue en Portainer (Linux)

Consulta el manual paso a paso en [PORTAINER_DEPLOY.md](./PORTAINER_DEPLOY.md) para desplegar como Stack conectado directamente a este repositorio GitHub:
`https://github.com/kaitoalex17/budget-presupuesto`

### Credenciales de Primer Acceso (Seed Automático):
- **Administrador:** `admin@presupuesto.local` / `AdminPassword2026!`
- **Usuario Demo:** `demo@empresa.com` / `DemoPassword2026!`

---

## 📐 Documentación de Arquitectura e Integración

Para conocer la estructura modular del código y cómo integrarlo en una plataforma mayor (ERP, CRM o Suite Empresarial), consulta [ARCHITECTURE.md](./ARCHITECTURE.md).
