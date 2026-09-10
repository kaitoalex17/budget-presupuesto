# 🚀 Guía de Despliegue en Portainer (Linux) con GitHub

Esta guía explica cómo desplegar y mantener actualizada la aplicación en tu servidor Linux utilizando **Portainer** y el repositorio de GitHub: `https://github.com/kaitoalex17/budget-presupuesto`.

---

## Opción 1: Despliegue Automático con Portainer Stacks (Recomendado)

Esta opción conecta Portainer directamente con tu repositorio de GitHub, permitiendo reconstruir o actualizar el contenedor con un solo clic o mediante webhooks.

### Paso 1: Crear el Stack en Portainer
1. Abre tu panel de **Portainer**.
2. Ve al entorno deseado (ej. `local` o tu Docker environment).
3. En el menú lateral izquierdo, haz clic en **Stacks** y luego en **+ Add stack**.
4. Asigna un nombre al stack, por ejemplo: `budget-presupuesto`.

### Paso 2: Seleccionar Método de Repositorio Git
1. En la sección **Build method**, selecciona **Repository**.
2. Configura los campos:
   - **Repository URL**: `https://github.com/kaitoalex17/budget-presupuesto.git`
   - **Repository reference**: `refs/heads/main` (o la rama que uses)
   - **Compose path**: `docker-compose.yml`
3. Si el repositorio es privado, activa **Authentication** e introduce tu usuario de GitHub y un **Personal Access Token (PAT)** con permisos de lectura.

### Paso 3: Variables de Entorno (Environment variables)
Añade las siguientes variables en la sección **Environment variables** de Portainer:
- `JWT_SECRET`: Una clave secreta larga y aleatoria (ej. `super-clave-secreta-saas-presupuesto-2026`).
- `NEXT_PUBLIC_APP_URL`: La URL pública por la que accederás a la aplicación (ej. `http://tu-ip:3000` o `https://presupuestos.tudominio.com`).
- `OPENAI_API_KEY`: *(Opcional)* Clave de OpenAI si deseas usar la generación de partidas por IA.

### Paso 4: Desplegar el Stack
1. Haz clic en el botón inferior **Deploy the stack**.
2. Portainer clonará el repositorio, construirá la imagen Docker multi-stage optimizada y levantará el contenedor.
3. El volumen persistente `budget_data` guardará automáticamente la base de datos SQLite y tus presupuestos en `/var/lib/docker/volumes/...` de forma segura, incluso si reinicias o actualizas el contenedor.

---

## Opción 2: Actualización Automática / Redeploy

Cuando hagas cambios en el código y los subas a GitHub (`git push origin main`):
1. Entra en Portainer a tu stack `budget-presupuesto`.
2. Ve a la pestaña **Editor**.
3. Haz clic en **Pull and redeploy**.
4. Marca la opción **Re-pull image and update the stack**.
5. ¡Listo! La versión más reciente estará en ejecución sin perder ningún dato ni presupuesto.

---

## Credenciales de Acceso Iniciales

Tras el primer despliegue, el sistema ejecuta el script de seed automático:
- **Panel de Administración:**
  - URL: `http://tu-servidor:3000/login`
  - Email: `admin@presupuesto.local`
  - Contraseña: `AdminPassword2026!`
- **Usuario SaaS de Demostración:**
  - Email: `demo@empresa.com`
  - Contraseña: `DemoPassword2026!`
  - Incluye clientes, catálogo de conceptos precargados y presupuestos de ejemplo para probar de inmediato.
