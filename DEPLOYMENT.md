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
- **Name:** `inventory-backend`
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
ACCESS_TOKEN_SECRET=dfb6142abb974a046a6af857f7c2d0dbfe0039d19ab15b97e5fd7b8af36bab911ae16ada15ca4512ac7ba0487e85cf1460e617eaf28c1621112d89ac22ca69f6
REFRESH_TOKEN_SECRET=6278b0cc016e83a96494cb705d353f605df86fa627fccb0116b2fbd47f471b091ef52c60ecd403b26c7d56c95ea0c7169b73741dab91141ae5d2629d8f73c789
EMAIL_USER=juanportillo.0509@gmail.com
EMAIL_PASS=xpdl qfcq vbkh oppv
SENIOR_ADMIN_EMAIL=juanportillo.0509@gmail.com
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
4. **Value:** Pegar la URL de PostgreSQL que copiaste antes
5. **Hacer clic en "Save Changes"**

### 3.5 Crear el Backend
- **Hacer clic en "Create Web Service"**
- **Esperar** a que se despliegue (5-10 minutos)

### 3.6 Obtener URL del Backend
1. **Una vez desplegado, copiar la URL**
   ```
   https://inventory-backend-abc123.onrender.com
   ```
2. **Guardar esta URL** - la necesitarás para el frontend

## 🎨 **Paso 4: Configurar Frontend**

### 4.1 Actualizar configuración del frontend
**Editar `frontend/src/environments/environment.prod.ts`:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend-url-real.onrender.com/api'
};
```

**Reemplazar `tu-backend-url-real.onrender.com`** con la URL real de tu backend.

### 4.2 Actualizar CORS en el backend
**Editar `backend/app.js`** en la sección CORS:
```javascript
// Permitir tu dominio específico (reemplazar con tu URL)
if (origin === 'https://tu-frontend-url-real.onrender.com') {
  return callback(null, true);
}
```

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
   https://inventory-frontend-abc123.onrender.com
   ```
2. **Esta será la URL principal** de tu aplicación

## 🔄 **Paso 6: Verificar el Deployment**

### 6.1 Verificar Backend
1. **Visitar:** `https://tu-backend-url.onrender.com/api/health`
2. **Deberías ver:**
   ```json
   {
     "status": "OK",
     "message": "Inventory System API is running",
     "timestamp": "2025-07-19T..."
   }
   ```

### 6.2 Verificar Frontend
1. **Visitar:** `https://tu-frontend-url.onrender.com`
2. **Deberías ver** la página de login de tu aplicación

### 6.3 Verificar Base de Datos
1. **En el dashboard de Render**
2. **Ir a tu base de datos PostgreSQL**
3. **Verificar** que las tablas se crearon automáticamente

## 🔧 **Paso 7: Configuración Final**

### 7.1 Actualizar CORS con URL real del frontend
**Editar `backend/app.js`** con la URL real:
```javascript
if (origin === 'https://inventory-frontend-abc123.onrender.com') {
  return callback(null, true);
}
```

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
- **Frontend:** `https://inventory-frontend-abc123.onrender.com`
- **Backend:** `https://inventory-backend-abc123.onrender.com`
- **API Health:** `https://inventory-backend-abc123.onrender.com/api/health`

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