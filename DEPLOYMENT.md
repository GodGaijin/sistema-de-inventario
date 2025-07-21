# 🚀 Guía Completa de Deployment en Render

## 📋 Resumen de lo que vamos a desplegar

```
Frontend (Static Site) → Backend (Node.js) → PostgreSQL (Base de Datos)
```

## 🎯 **Paso 1: Preparar el Repositorio**

### 1.1 Subir código a GitHub
```bash
# En tu repositorio local
git add .
git commit -m "Configuración completa para Render con PostgreSQL"
git push origin main
```

### 1.2 Verificar que tienes estos archivos:
- ✅ `render.yaml` - Configuración automática
- ✅ `backend/models/database.js` - Base de datos híbrida
- ✅ `backend/models/userModelNew.js` - Modelo de usuario
- ✅ `frontend/src/environments/environment.prod.ts` - Configuración producción
- ✅ `DEPLOYMENT.md` - Esta guía

## 🗄️ **Paso 2: Crear PostgreSQL en Render**

### 2.1 Ir a Render
1. **Abrir [render.com](https://render.com)**
2. **Crear cuenta** o iniciar sesión
3. **Hacer clic en "New +"**
4. **Seleccionar "PostgreSQL"**

### 2.2 Configurar PostgreSQL
- **Name:** `inventory-db`
- **Database:** `inventory`
- **User:** `inventory_user`
- **Plan:** `Free`
- **Region:** Cerca de tu ubicación

### 2.3 Crear la base de datos
- **Hacer clic en "Create Database"**
- **Esperar** a que se cree (2-3 minutos)

### 2.4 Obtener la URL de PostgreSQL
1. **Hacer clic en tu base de datos** `inventory-db`
2. **Ir a la pestaña "Connections"**
3. **Copiar la "External Database URL"**
   ```
   postgresql://inventory_user:password@host:port/inventory
   ```
4. **Guardar esta URL** - la necesitarás después

## 🔧 **Paso 3: Crear Backend en Render**

### 3.1 Crear Web Service
1. **Hacer clic en "New +"**
2. **Seleccionar "Web Service"**
3. **Conectar tu repositorio de GitHub**

### 3.2 Configurar Backend
- **Name:** `sistema-de-inventario`
- **Environment:** `Node`
- **Region:** Misma que PostgreSQL
- **Branch:** `main`
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `node app.js`
- **Plan:** `Free`

### 3.3 Configurar Variables de Entorno
**Agregar estas variables:**

```env
NODE_ENV=production
PORT=10000
ACCESS_TOKEN_SECRET=EJEMPLO_DE_TOKEN_SECRETO
REFRESH_TOKEN_SECRET=EJEMPLO_DE_TOKEN_SECRETO
EMAIL_USER=tu_email@tu_dominio.com
EMAIL_PASS=abcd efgh ijkl mnop
SENIOR_ADMIN_EMAIL=tu_email@tu_dominio.com
SENIOR_ADMIN_USERNAME=admin_senior
```

**⚠️ IMPORTANTE:** 
- Estas variables ya están configuradas en el `render.yaml` para deployment automático
- Si usas el método manual, usa estos valores exactos
- El sistema ya no depende de `config.env` en producción

### 3.4 Conectar PostgreSQL al Backend
1. **En la sección "Environment Variables"**
2. **Hacer clic en "Add Environment Variable"**
3. **Key:** `DATABASE_URL`
4. **Value:** `postgresql://admin:hCINTLj7YG0OfieH4dXoelOAlZKAyZVP@dpg-d1tu7a3e5dus73e0sau0-a.oregon-postgres.render.com/inventory_db_u4cl`
5. **Hacer clic en "Save Changes"**

**✅ URL configurada automáticamente en render.yaml**

### 3.5 Crear el Backend
- **Hacer clic en "Create Web Service"**
- **Esperar** a que se despliegue (5-10 minutos)

### 3.6 Obtener URL del Backend
1. **Una vez desplegado, copiar la URL**
   ```
   https://sistema-de-inventario-tavd.onrender.com
   ```
2. **Guardar esta URL** - la necesitarás para el frontend

## 🎨 **Paso 4: Configurar Frontend**

### 4.1 Actualizar configuración del frontend
**Editar `frontend/src/environments/environment.prod.ts`:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://sistema-de-inventario-tavd.onrender.com/api'
};
```

**✅ URL configurada:** `https://sistema-de-inventario-tavd.onrender.com`

### 4.2 Actualizar CORS en el backend
**Editar `backend/app.js`** en la sección CORS:
```javascript
// Permitir tu dominio específico del frontend
if (origin === 'https://inventory-frontend-2syh.onrender.com') {
  return callback(null, true);
}
```

**✅ URL configurada:** `https://inventory-frontend-2syh.onrender.com`

### 4.3 Commit y push de los cambios
```bash
git add .
git commit -m "Actualizar URLs para producción"
git push origin main
```

## 🌐 **Paso 5: Crear Frontend en Render**

### 5.1 Crear Static Site
1. **Hacer clic en "New +"**
2. **Seleccionar "Static Site"**
3. **Conectar tu repositorio de GitHub**

### 5.2 Configurar Frontend
- **Name:** `inventory-frontend`
- **Environment:** `Static Site`
- **Region:** Misma que los otros servicios
- **Branch:** `main`
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist/inventory-system`
- **Plan:** `Free`

### 5.3 Crear el Frontend
- **Hacer clic en "Create Static Site"**
- **Esperar** a que se despliegue (3-5 minutos)

### 5.4 Obtener URL del Frontend
1. **Una vez desplegado, copiar la URL**
   ```
   https://inventory-frontend-2syh.onrender.com
   ```
2. **Esta será la URL principal** de tu aplicación

## 🔄 **Paso 6: Verificar el Deployment**

### 6.1 Verificar Backend
1. **Visitar:** `https://sistema-de-inventario-tavd.onrender.com/api/health`
2. **Deberías ver:**
   ```json
   {
     "status": "OK",
     "message": "Inventory System API is running",
     "timestamp": "2025-07-19T..."
   }
   ```

### 6.2 Verificar Frontend
1. **Visitar:** `https://inventory-frontend-2syh.onrender.com`
2. **Deberías ver** la página de login de tu aplicación

### 6.3 Verificar Base de Datos
1. **En el dashboard de Render**
2. **Ir a tu base de datos PostgreSQL**
3. **Verificar** que las tablas se crearon automáticamente

## 🔧 **Paso 7: Configuración Final**

### 7.1 Actualizar CORS con URL real del frontend
**Editar `backend/app.js`** con la URL real:
```javascript
if (origin === 'https://inventory-frontend-2syh.onrender.com') {
  return callback(null, true);
}
```

**✅ URL configurada:** `https://inventory-frontend-2syh.onrender.com`

### 7.2 Commit y push final
```bash
git add .
git commit -m "Configuración final de CORS"
git push origin main
```

### 7.3 Verificar que todo funciona
1. **Ir a tu frontend**
2. **Intentar registrarse** con un usuario
3. **Verificar** que se guarda en la base de datos
4. **Probar** todas las funcionalidades

## 🚨 **Solución de Problemas**

### Error: "Cannot connect to database"
- **Verificar** que `DATABASE_URL` esté configurada correctamente
- **Verificar** que PostgreSQL esté activo
- **Revisar logs** del backend en Render

### Error: "CORS error"
- **Verificar** que la URL del frontend esté en la configuración CORS
- **Actualizar** `backend/app.js` con la URL correcta
- **Hacer commit y push** de los cambios

### Error: "API not found"
- **Verificar** que la URL del backend esté correcta en `environment.prod.ts`
- **Verificar** que el backend esté desplegado correctamente
- **Revisar** el health check endpoint

### Error: "Build failed"
- **Verificar** que todas las dependencias estén en `package.json`
- **Revisar logs** de build en Render
- **Verificar** que el comando de build sea correcto

## 📊 **URLs Finales**

### Tu aplicación estará disponible en:
- **Frontend:** `https://inventory-frontend-2syh.onrender.com`
- **Backend:** `https://sistema-de-inventario-tavd.onrender.com`
- **API Health:** `https://sistema-de-inventario-tavd.onrender.com/api/health`

### Credenciales por defecto:
- **Usuario:** `admin_senior`
- **Contraseña:** Se enviará por email al email configurado

## 🔄 **Actualizaciones Futuras**

Para actualizar tu aplicación:
1. **Hacer cambios** en tu código local
2. **Commit y push** a GitHub
3. **Render detectará** automáticamente los cambios
4. **Reconstruirá** y desplegará automáticamente

## 📞 **Soporte**

Si tienes problemas:
1. **Revisar logs** en el dashboard de Render
2. **Verificar variables de entorno**
3. **Comprobar URLs** en la configuración
4. **Revisar CORS** si hay errores de conexión

## 🎉 **¡Listo!**

Tu sistema de inventario estará completamente desplegado con:
- ✅ **Frontend** funcionando en Render
- ✅ **Backend** conectado a PostgreSQL
- ✅ **Datos persistentes** y confiables
- ✅ **SSL gratuito** y HTTPS
- ✅ **Deployment automático** desde GitHub

¡Tu aplicación estará lista para usar en producción! 🚀 