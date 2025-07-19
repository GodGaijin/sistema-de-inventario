# 🔧 Configuración de Variables de Entorno

Este archivo te guía paso a paso para configurar las variables de entorno necesarias para el sistema de inventario.

## 📋 Nota Importante

**Para Desarrollo Local:** Usa `config.env` (instrucciones abajo)
**Para Producción (Render):** Las variables se configuran automáticamente desde `render.yaml`

## 📋 Pasos de Configuración

### 1. Crear el archivo de configuración

1. **Copia la plantilla:**
   ```bash
   cp .env_template config.env
   ```

2. **Edita el archivo `config.env`** con tus propias variables

### 2. Configurar JWT Secrets

Los JWT secrets son claves secretas para firmar los tokens de autenticación.

**Opción A: Generar automáticamente (Recomendado)**
```bash
# En la terminal, ejecuta estos comandos:
node -e "console.log('ACCESS_TOKEN_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

**Opción B: Crear manualmente**
- Usa cadenas largas y complejas (mínimo 32 caracteres)
- Incluye letras, números y símbolos
- Ejemplo: `ACCESS_TOKEN_SECRET=mi_super_secreto_muy_largo_y_complejo_2024`

### 3. Configurar Email (Gmail)

Para que el sistema pueda enviar correos electrónicos, necesitas configurar Gmail.

#### Paso 1: Habilitar verificación en 2 pasos
1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Seguridad → Verificación en 2 pasos
3. Activa la verificación en 2 pasos si no está activada

#### Paso 2: Generar contraseña de aplicación
1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Seguridad → Verificación en 2 pasos → Contraseñas de aplicación
3. Selecciona "Otra" y nombra tu aplicación (ej: "Sistema de Inventario")
4. Copia la contraseña generada (16 caracteres)

#### Paso 3: Configurar en config.env
```env
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion_de_16_caracteres
```

### 4. Configurar Administrador Senior

El administrador senior tiene acceso completo a todas las funciones del sistema.

```env
SENIOR_ADMIN_EMAIL=admin@tudominio.com
SENIOR_ADMIN_USERNAME=admin_senior
```

### 5. Configurar Puerto (Opcional)

Por defecto el servidor usa el puerto 3001. Puedes cambiarlo si es necesario:

```env
PORT=3001
```

## 🔒 Seguridad

### ❌ NUNCA hagas esto:
- Subir `config.env` a GitHub
- Usar tu contraseña normal de Gmail
- Compartir tus secrets con nadie
- Usar secrets débiles o predecibles

### ✅ SÍ debes hacer esto:
- Mantener `config.env` en `.gitignore`
- Usar contraseñas de aplicación para Gmail
- Generar secrets únicos y seguros
- Cambiar los secrets regularmente

## 📝 Ejemplo de config.env

```env
# ========================================
# CONFIGURACIÓN DE VARIABLES DE ENTORNO
# ========================================

# JWT Secrets
ACCESS_TOKEN_SECRET=tu_access_token_secret_aqui_genera_uno_seguro
REFRESH_TOKEN_SECRET=tu_refresh_token_secret_aqui_genera_uno_seguro

# Puerto del servidor
PORT=3001

# Configuración de Gmail
EMAIL_USER=miempresa@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop

# Administrador Senior
SENIOR_ADMIN_EMAIL=admin@miempresa.com
SENIOR_ADMIN_USERNAME=admin_senior
```

## 🚨 Solución de Problemas

### Error: "Invalid login"
- Verifica que el email y contraseña de Gmail sean correctos
- Asegúrate de usar una contraseña de aplicación, no tu contraseña normal
- Verifica que la verificación en 2 pasos esté activada

### Error: "JWT secret not provided"
- Verifica que ACCESS_TOKEN_SECRET y REFRESH_TOKEN_SECRET estén configurados
- Asegúrate de que el archivo se llame exactamente `config.env`

### Error: "Port already in use"
- Cambia el puerto en la variable PORT
- O termina el proceso que está usando el puerto 3001

## 🔄 Actualización de Configuración

Si necesitas cambiar la configuración:

1. **Edita el archivo `config.env`**
2. **Reinicia el servidor:**
   ```bash
   # Detén el servidor (Ctrl+C)
   # Vuelve a iniciarlo
   node app.js
   ```

## 📞 Soporte

Si tienes problemas con la configuración:
1. Verifica que todos los pasos se hayan seguido correctamente
2. Revisa que el archivo `config.env` esté en el directorio `backend`
3. Asegúrate de que no haya espacios extra en las variables
4. Verifica que las contraseñas de aplicación sean correctas 