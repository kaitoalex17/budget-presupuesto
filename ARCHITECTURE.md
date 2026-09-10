# 📐 Arquitectura del Sistema de Presupuestos y Facturación (SaaS)

Este documento detalla la estructura, flujo de datos, modelo de entidades y guías de integración para permitir que este módulo de presupuestos funcione de manera autónoma en Portainer o se integre fácilmente como subsistema en una plataforma más grande (ERP, CRM o suite SaaS).

---

## 1. Visión General y Principios de Diseño

1. **Modularidad e Independencia:** Todo el módulo está contenido en esta estructura. No depende de servicios externos obligatorios; utiliza SQLite embebido en un volumen Docker persistente por defecto, con total compatibilidad para PostgreSQL con solo cambiar `DATABASE_URL`.
2. **Multi-tenant / SaaS Ready:** Cada usuario gestiona sus propios clientes, presupuestos, secuencias de numeración (`PRES-0001`, `FAC-0001`) y catálogo de conceptos.
3. **Control Administrativo de Consumo:**
   - Sistema de **Créditos (Puntos)**: 1 presupuesto creado = 1 crédito consumido.
   - Opción de **Tarifa Plana**: El administrador puede activar tarifa plana ilimitada para usuarios suscritos.
4. **Flujo de Vida del Presupuesto:**
   ```
   [Borrador] ➔ [Enviado] ➔ [Visto por Cliente] ➔ [Aceptado / Firmado] ➔ [Facturado]
                                  │
                                  └───> [Rechazado con Feedback]
   ```
5. **Firma Digital & Visualización Pública:**
   - Ruta `/p/[token]` independiente y responsive para el cliente final (sin login).
   - Firma mediante Canvas HTML5 táctil/ratón.
   - Generación de PDF multi-página con **Hoja 1 (Presupuesto y firma)** y **Hoja 2 (Condiciones legales y garantía)**.
6. **Módulo de Asistente IA:** Diseñado con un adaptador desacoplado (`src/lib/ai/`) para conectarse a OpenAI, Google Gemini o modelos locales (Ollama) sin modificar la lógica central del negocio.

---

## 2. Estructura de Directorios

```
budget-presupuesto/
├── ARCHITECTURE.md          # Este documento (Estructura y diseño para integración)
├── PORTAINER_DEPLOY.md      # Manual paso a paso para despliegue en Portainer
├── Dockerfile               # Construcción multi-stage unprivileged Alpine
├── docker-compose.yml       # Stack listo para Portainer con volumen persistente
├── prisma/
│   ├── schema.prisma        # Definición de modelos relacionales (User, Client, Budget, etc.)
│   ├── seed.ts              # Script de inicialización (Admin, usuario demo, conceptos)
│   └── data/                # Carpeta para SQLite en volumen Docker persistente
├── src/
│   ├── app/                 # Next.js 15 App Router
│   │   ├── (auth)/login/    # Inicio de sesión con soporte para Administrador y Usuarios
│   │   ├── (public)/p/      # Vista pública para clientes con firma digital y feedback
│   │   ├── admin/           # Panel de administración SaaS (Gestión de usuarios y créditos)
│   │   ├── dashboard/       # Portal del usuario emisor (mobile-first y responsive PC)
│   │   │   ├── budgets/     # Listado, creación, edición, compartición y WhatsApp
│   │   │   ├── clients/     # Agenda y seguimiento de presupuestos por cliente
│   │   │   ├── concepts/    # Catálogo de partidas y conceptos preconfigurados
│   │   │   ├── invoices/    # Facturación y exportación contable para gestoría
│   │   │   └── settings/    # Perfil fiscal, logotipo, plazos y condiciones legales
│   │   └── api/             # Endpoints REST y Server Actions
│   ├── components/          # Componentes reutilizables
│   │   ├── layout/          # MobileNav (barra inferior móvil), DesktopSidebar, TopNavbar
│   │   ├── theme/           # ThemeProvider y toggle Dark/Light mode
│   │   ├── budget/          # SignaturePad, AIBudgetModal, WhatsAppShare, StatusBadge
│   │   └── ui/              # Botones, modales, tarjetas, inputs, tablas
│   ├── lib/                 # Utilidades y servicios centrales
│   │   ├── db.ts            # Cliente Prisma singleton
│   │   ├── auth.ts          # Sesiones seguras JWT y hashing bcrypt
│   │   ├── pdf/             # Motor generador de presupuestos y facturas en PDF
│   │   ├── ai/              # Adaptador para asistencia de partidas con IA
│   │   └── export/          # Exportador CSV/Excel estructurado para gestorías
│   └── types/               # Tipos TypeScript compartidos
```

---

## 3. Modelo de Datos (Prisma)

- **`User`**: Administrador o Usuario SaaS. Almacena credenciales, rol (`ADMIN`, `USER`), saldo de créditos, bandera de tarifa plana, datos de empresa (nombre, NIF, teléfono, email, dirección, logo en base64).
- **`ProfileSettings`**: Preferencias del emisor: prefijo de presupuesto (`PRES-`), contador correlativo, validez por defecto (días), condiciones contractuales por defecto, método de pago e IBAN, estructura de plazos de pago.
- **`Client`**: Ficha de contacto/cliente: Nombre, Empresa, CIF/NIF, Teléfono, Email, Dirección, Notas de seguimiento.
- **`Budget`**: Registro principal del presupuesto:
  - Número único correlativo por usuario.
  - Fechas (emisión y caducidad).
  - Estado: `BORRADOR`, `ENVIADO`, `VISTO`, `ACEPTADO`, `RECHAZADO`, `FACTURADO`.
  - Token público único para acceso del cliente (`/p/[token]`).
  - Totales (Base, % IVA, importe IVA, IRPF, descuento, total final).
  - Términos de pago fraccionados (ej. `[{"plazo": "50% al inicio", "importe": 500}, {"plazo": "50% al finalizar", "importe": 500}]`).
  - Condiciones contractuales para la hoja 2.
  - Datos de firma: Imagen en PNG base64, nombre del firmante, fecha/hora de aceptación, comentarios u objeciones del cliente.
- **`BudgetItem`**: Partidas del presupuesto: Tipo (`PARTIDA` alzada o `UNIDAD` con cantidad y precio unitario), concepto, descripción, orden.
- **`SavedConcept`**: Catálogo de conceptos frecuentes para que el usuario pueda insertarlos con 1 clic.
- **`Invoice`**: Factura generada tras la aceptación del presupuesto, con numeración secuencial propia (`FAC-`).
- **`CreditTransaction`**: Auditoría de recargas y consumos de créditos realizada por el administrador.

---

## 4. Guía para Futura Integración en un Proyecto Mayor

Si en el futuro deseas embeber este módulo en una plataforma superior:
1. **Autenticación Unificada:**
   - Reemplaza la verificación de sesión en `src/lib/auth.ts` con el token JWT de tu sistema principal (o cabeceras de SSO como Forward-Auth).
2. **Base de Datos Compartida:**
   - Cambia `provider = "sqlite"` a `provider = "postgresql"` en `prisma/schema.prisma` y apunta `DATABASE_URL` a la base de datos principal.
   - Las tablas llevan nombres claros (`User`, `Budget`, etc.) que pueden asociarse con un `tenantId` u `organizationId`.
3. **Módulo de IA:**
   - La interfaz en `src/lib/ai/aiBudgetService.ts` recibe un texto de usuario y devuelve un arreglo estructurado de partidas `{ concepto, descripcion, cantidad, precioUnitario, tipo }`. Puedes conectarla a cualquier endpoint interno o agente LLM corporativo.
4. **Exportación Contable:**
   - `src/lib/export/gestoriaExport.ts` produce formatos estándar de libro de facturas emitidas, adaptable a APIs de contabilidad externa (Holded, A3, Factusol, etc.).
