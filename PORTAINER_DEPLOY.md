# 🚀 Guía de Despliegue en Portainer (Linux) con GitHub y Puertos Personalizados

Esta guía explica cómo desplegar y mantener actualizada la aplicación en tu servidor Linux utilizando **Portainer** y el repositorio de GitHub: `https://github.com/kaitoalex17/budget-presupuesto`.

---

## 🔌 Puertos Asignados (25 puertos por encima de los estándar)

- **Portal Web (SaaS / App):** Puerto **`3025`** *(3000 + 25)*  
  Acceso: `http://<ip-servidor>:3025`
- **Base de Datos (PostgreSQL):** Puerto **`5457`** *(5432 + 25)*  
  Conexión externa: `postgresql://budget_user:budget_password_2026@<ip-servidor>:5457/budget_db`

---

## Opción 1: Despliegue Automático con Portainer Stacks (Recomendado)

### Paso 1: Crear el Stack en Portainer
1. Abre tu panel de **Portainer**.
2. Ve al entorno deseado (ej. `local` o tu Docker environment).
3. En el menú lateral izquierdo, haz clic en **Stacks** y luego en **+ Add stack**.
4. Asigna un nombre al stack, por ejemplo: `budget-presupuesto`.

### Paso 2: Seleccionar Método de Repositorio Git
1. En la sección **Build method**, selecciona **Repository**.
2. Configura los campos:
   - **Repository URL**: `https://github.com/kaitoalex17/budget-presupuesto.git`
   - **Repository reference**: `refs/heads/main`
   - **Compose path**: `docker-compose.yml`

### Paso 3: Variables de Entorno en Portainer
Puedes personalizar las contraseñas si lo deseas en **Environment variables**:
- `PORT`: `3025`
- `NEXT_PUBLIC_APP_URL`: `http://<ip-tu-servidor>:3025`
- `DB_PASSWORD`: `tu_clave_segura_de_bd`
- `JWT_SECRET`: `tu_clave_secreta_jwt_larga`
- `OPENAI_API_KEY`: *(Opcional)* Clave de OpenAI para la IA.

### Paso 4: Desplegar el Stack
1. Haz clic en **Deploy the stack**.
2. Portainer iniciará:
   - El contenedor de PostgreSQL en el puerto **5457**.
   - El contenedor del portal SaaS en el puerto **3025**.
3. Ambos servicios cuentan con volúmenes persistentes (`budget_db_data`), por lo que no se perderá ningún dato tras reiniciar o actualizar.

---

## Opción 2: Actualización Automática / Redeploy

Cuando hagas cambios y subas código a GitHub (`git push origin main`):
1. Entra en Portainer a tu stack `budget-presupuesto`.
2. Ve a la pestaña **Editor**.
3. Haz clic en **Pull and redeploy**.
4. Marca la opción **Re-pull image and update the stack**.
5. ¡Listo! La versión actualizada estará corriendo en el puerto `3025`.

---

## Credenciales de Acceso Iniciales

- **Panel de Administración (Gestión de usuarios y créditos):**
  - URL: `http://<ip-servidor>:3025/login`
  - Email: `admin@presupuesto.local`
  - Contraseña: `AdminPassword2026!`
- **Usuario SaaS de Demostración:**
  - Email: `demo@empresa.com`
  - Contraseña: `DemoPassword2026!`
