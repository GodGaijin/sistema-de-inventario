# Sistema de Inventario - Manual de Uso

## Descripción General

Este es un sistema completo de inventario desarrollado con **Node.js/Express/SQLite** en el backend y **Angular 18** en el frontend. El sistema permite gestionar productos, categorías, distribuidores, auditoría de acciones y gestión de usuarios con diferentes niveles de permisos.

## Características Principales

### 🔐 Autenticación y Roles
- **Registro de usuarios** con validación de contraseñas y email
- **Inicio de sesión** con tokens JWT
- **Tres roles de usuario:**
  - **Usuario regular**: Solo puede ver datos
  - **Administrador**: Puede crear, editar, eliminar y ver auditoría
  - **Administrador Senior**: Gestión completa de usuarios y sistema
- **Recuperación de contraseña** por email (excepto para admin senior)
- **Gestión de roles** solo por administradores senior

### ⚡ Tecnología Angular 18
- **Angular 18** con componentes standalone
- **Signals reactivos** para estado global
- **Notificaciones instantáneas** con sistema global
- **Componentes standalone** para mejor modularidad
- **Zone.js** para detección de cambios automática

### 📦 Gestión de Productos
- **Ver lista** de todos los productos
- **Crear nuevos productos** (solo admin)
- **Editar productos** existentes (solo admin)
- **Eliminar productos** (solo admin)
- **Filtros por categoría y distribuidor**
- **Descarga de PDF** con lista de productos

### 📂 Gestión de Categorías
- **Ver lista** de todas las categorías
- **Crear nuevas categorías** (solo admin)
- **Editar categorías** existentes (solo admin)
- **Eliminar categorías** (solo admin)
- **Descarga de PDF** con lista de categorías

### 🏢 Gestión de Distribuidores
- **Ver lista** de todos los distribuidores
- **Crear nuevos distribuidores** (solo admin)
- **Editar distribuidores** existentes (solo admin)
- **Eliminar distribuidores** (solo admin)
- **Campos incluidos:** Nombre, email, teléfono, RIF, ubicación
- **Descarga de PDF** con lista de distribuidores

### 📊 Datos del Comercio
- **Ver información** del comercio
- **Editar datos** del comercio (solo admin)
- **Campos editables:** Nombre, dirección, teléfono, email, RIF

### 👥 Gestión de Usuarios (Solo Admin Senior)
- **Ver lista** de todos los usuarios registrados
- **Cambiar roles** de usuarios (regular a admin)
- **Gestión de permisos** del sistema

### 🛠️ Gestión de Base de Datos (Solo Admin Senior)
- **Guardar backup** del estado actual de la base de datos
- **Restaurar backup** desde un punto anterior guardado
- **Eliminar backups** antiguos para liberar espacio
- **Actualización automática** de la lista de backups cada 10 segundos
- **Backups automáticos** antes de acciones destructivas

### 📋 Auditoría
- **Ver registro** de todas las acciones realizadas
- **Filtros por fecha** y tipo de acción
- **Solo visible para administradores**
- **Registro automático** de todas las operaciones CRUD

## Instalación y Configuración

### Requisitos Previos

⚠️ **IMPORTANTE:** Antes de continuar, asegúrate de tener Node.js instalado en tu sistema. Sin Node.js, ningún comando funcionará correctamente.

- **Node.js** v18 o superior (recomendado)
- **npm** (incluido con Node.js)
- **Angular CLI** (se instalará automáticamente)

#### Instalación de Node.js

**Windows:**
1. Ve a [nodejs.org](https://nodejs.org/)
2. Descarga la versión LTS (Long Term Support)
3. Ejecuta el instalador y sigue las instrucciones
4. Verifica la instalación abriendo PowerShell y ejecutando:
   ```bash
   node --version
   npm --version
   ```

**macOS:**
1. Opción 1 - Descarga directa:
   - Ve a [nodejs.org](https://nodejs.org/)
   - Descarga la versión LTS para macOS
   - Ejecuta el instalador

2. Opción 2 - Con Homebrew:
   ```bash
   brew install node
   ```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verificación:**
Después de la instalación, verifica que todo esté funcionando:
```bash
node --version  # Debe mostrar v18.x.x o superior
npm --version   # Debe mostrar la versión de npm
```

### 1. Clonar/Descargar el Proyecto
```bash
# Navegar a la carpeta del proyecto
cd pagina-javascript-angular
```

### 2. Configurar el Backend
```bash
# Entrar a la carpeta backend
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno (OBLIGATORIO)
# Lee CONFIGURACION.md para instrucciones detalladas
# Para desarrollo local: cp .env_template config.env
# Para producción: Configurar variables en Render
```

### 3. Configurar el Frontend
```bash
# Entrar a la carpeta frontend
cd frontend

# Instalar dependencias
npm install
```

### 4. Configurar Variables de Entorno (IMPORTANTE)

**⚠️ OBLIGATORIO:** Antes de ejecutar el sistema, debes configurar las variables de entorno:

#### Para Desarrollo Local:
1. **Lee la guía completa:** `backend/CONFIGURACION.md`
2. **Copia la plantilla:**
   ```bash
   cd backend
   cp .env_template config.env
   ```
3. **Edita `config.env`** con tus propias variables
4. **Configura Gmail** para el envío de correos
5. **Genera JWT secrets** seguros

#### Para Producción (Render):
1. **Configurar variables en Render Dashboard**
2. **Usar `render.yaml`** para configuración automática
3. **Ver `DEPLOYMENT.md`** para instrucciones detalladas

**📖 Documentación detallada:** 
- Desarrollo: `backend/CONFIGURACION.md`
- Producción: `DEPLOYMENT.md`

## 🚀 Tecnología Angular 18

### Características Implementadas
- **StateService con Signals**: Estado global reactivo
- **Notificaciones en tiempo real**: Sistema de alertas automático
- **Componentes standalone**: Mejor modularidad y rendimiento
- **Zone.js**: Detección de cambios automática
- **Gestión de base de datos reactiva**: Actualización automática cada 10 segundos

## Ejecución del Sistema

### 1. Iniciar el Backend
```bash
# Desde la carpeta backend
cd backend
node app.js
```
El servidor se ejecutará en: `http://localhost:3001`

### 2. Iniciar el Frontend
```bash
# Desde la carpeta frontend (en otra terminal)
cd frontend
ng serve
```
La aplicación se abrirá en: `http://localhost:4200`

## Manual de Uso por Funcionalidad

### 🔐 Registro e Inicio de Sesión

#### Registro de Usuario
1. Ir a la página de login
2. Hacer clic en "Registrarse"
3. Completar el formulario:
   - **Usuario:** Nombre de usuario deseado
   - **Email:** Correo electrónico válido
   - **Contraseña:** Mínimo una letra, un número y un carácter especial
4. Hacer clic en "Registrarse"

**⚠️ Importante:** Todos los usuarios nuevos se registran automáticamente con rol de **"Usuario Regular"**. Solo un **Administrador Senior** puede cambiar el rol a "Administrador".

#### Recuperación de Contraseña
1. En la página de login, hacer clic en "¿Olvidaste tu contraseña?"
2. Ingresar el email registrado
3. Revisar el correo electrónico para el enlace de recuperación
4. Seguir las instrucciones para crear una nueva contraseña

**⚠️ Nota:** La recuperación de contraseña no está disponible para cuentas de Administrador Senior.

#### Inicio de Sesión
1. Ir a la página de login
2. Ingresar usuario y contraseña
3. Hacer clic en "Iniciar Sesión"

### 📦 Gestión de Productos

#### Ver Productos
1. Iniciar sesión
2. Hacer clic en "Productos" en el menú
3. Ver la lista de productos con sus categorías y distribuidores

#### Crear Producto (Solo Admin)
1. Hacer clic en "Agregar Producto"
2. Completar el formulario:
   - **Nombre:** Nombre del producto
   - **Descripción:** Descripción del producto
   - **Precio:** Precio en formato numérico
   - **Stock:** Cantidad disponible
   - **Categoría:** Seleccionar de la lista
   - **Distribuidor:** Seleccionar de la lista
3. Hacer clic en "Guardar"

#### Editar Producto (Solo Admin)
1. En la lista de productos, hacer clic en "Editar"
2. Modificar los campos necesarios
3. Hacer clic en "Actualizar"

#### Eliminar Producto (Solo Admin)
1. En la lista de productos, hacer clic en "Eliminar"
2. Confirmar la eliminación

#### Descargar PDF de Productos
1. Hacer clic en "Descargar PDF"
2. El archivo se descargará automáticamente

### 📂 Gestión de Categorías

#### Ver Categorías
1. Hacer clic en "Categorías" en el menú
2. Ver la lista de todas las categorías

#### Crear Categoría (Solo Admin)
1. Hacer clic en "Agregar Categoría"
2. Ingresar el nombre de la categoría
3. Hacer clic en "Guardar"

#### Editar Categoría (Solo Admin)
1. Hacer clic en "Editar" en la categoría deseada
2. Modificar el nombre
3. Hacer clic en "Actualizar"

#### Eliminar Categoría (Solo Admin)
1. Hacer clic en "Eliminar" en la categoría deseada
2. Confirmar la eliminación

#### Descargar PDF de Categorías
1. Hacer clic en "Descargar PDF"
2. El archivo se descargará automáticamente

### 🏢 Gestión de Distribuidores

#### Ver Distribuidores
1. Hacer clic en "Distribuidores" en el menú
2. Ver la lista de todos los distribuidores

#### Crear Distribuidor (Solo Admin)
1. Hacer clic en "Agregar Distribuidor"
2. Completar el formulario:
   - **Nombre:** Nombre del distribuidor
   - **Email:** Email válido
   - **Teléfono:** Número de teléfono
   - **RIF:** Número de identificación fiscal
   - **Ubicación:** Dirección o ubicación
3. Hacer clic en "Guardar"

#### Editar Distribuidor (Solo Admin)
1. Hacer clic en "Editar" en el distribuidor deseado
2. Modificar los campos necesarios
3. Hacer clic en "Actualizar"

#### Eliminar Distribuidor (Solo Admin)
1. Hacer clic en "Eliminar" en el distribuidor deseado
2. Confirmar la eliminación

#### Descargar PDF de Distribuidores
1. Hacer clic en "Descargar PDF"
2. El archivo se descargará automáticamente

### 📊 Datos del Comercio

#### Ver Datos del Comercio
1. Hacer clic en "Datos del Comercio" en el menú
2. Ver la información actual del comercio

#### Editar Datos del Comercio (Solo Admin)
1. Hacer clic en "Editar"
2. Modificar los campos:
   - **Nombre del Comercio**
   - **Dirección**
   - **Teléfono**
   - **Email**
   - **RIF**
3. Hacer clic en "Guardar"

### 📋 Auditoría (Solo Admin)

#### Ver Registro de Auditoría
1. Hacer clic en "Auditoría" en el menú
2. Ver la lista de todas las acciones realizadas
3. Los registros incluyen:
   - **Fecha y hora** de la acción
   - **Usuario** que realizó la acción
   - **Tipo de acción** (crear, editar, eliminar)
   - **Entidad** afectada (producto, categoría, etc.)
   - **Detalles** de la acción

### 👥 Gestión de Usuarios (Solo Admin Senior)

#### Ver Usuarios
1. Hacer clic en "Gestión de Usuarios" en el menú
2. Ver la lista de todos los usuarios registrados
3. Información mostrada:
   - **ID:** Identificador único del usuario
   - **Usuario:** Nombre de usuario
   - **Email:** Correo electrónico
   - **Rol:** Rol actual (Usuario, Administrador, Admin Senior)
   - **Acciones:** Cambiar rol (solo para usuarios no senior_admin)

#### Cambiar Rol de Usuario
1. En la lista de usuarios, usar el selector de rol
2. Seleccionar el nuevo rol deseado (Usuario o Administrador)
3. El cambio se aplica automáticamente

**⚠️ Restricciones:**
- Solo se pueden cambiar roles de **Usuario** a **Administrador** y viceversa
- **No se puede cambiar** el rol de un Administrador Senior
- **No se puede cambiar** el rol del usuario actual

### 🛠️ Gestión de Base de Datos (Solo Admin Senior)

#### Guardar Backup
1. Hacer clic en "🛠️ Gestión de Base de Datos" en el menú
2. Hacer clic en "💾 Guardar Backup"
3. El sistema creará una copia de seguridad con timestamp

#### Restaurar Backup
1. En el panel de gestión, seleccionar un backup de la lista
2. Hacer clic en "🔄 Restaurar"
3. Confirmar la acción (se creará un backup automático del estado actual)

#### Gestionar Backups
- **Ver lista** de todos los backups disponibles (se actualiza automáticamente cada 10 segundos)
- **Eliminar backups** antiguos para liberar espacio
- **Información detallada** de cada backup (tamaño, fecha)
- **Botón "Volver al Inicio"** para regresar al dashboard

## Funciones Técnicas

### 🔄 Cerrar Sesión
1. Hacer clic en "Cerrar Sesión" en el menú
2. Serás redirigido a la página de login

### 📱 Diseño Responsivo
- La aplicación se adapta a diferentes tamaños de pantalla
- Funciona en móviles, tablets y computadoras

### ⚡ Validaciones
- **Contraseñas:** Mínimo una letra, un número y un carácter especial
- **Emails:** Formato válido de email (requerido para registro)
- **Campos requeridos:** Marcados con asterisco (*)
- **Precios:** Solo números válidos
- **Usuarios únicos:** No se permiten nombres de usuario duplicados
- **Emails únicos:** No se permiten emails duplicados

### 🛡️ Seguridad
- **Tokens JWT** para autenticación
- **Protección de rutas** según el rol del usuario
- **Validación de datos** en frontend y backend
- **Auditoría automática** de todas las acciones
- **Recuperación de contraseña** por email seguro (excepto admin senior)
- **Variables de entorno** para configuración segura
- **Backups automáticos** antes de acciones destructivas
- **Confirmaciones múltiples** para operaciones críticas
- **Gestión de roles restringida** solo a administradores senior
- **Validación de emails únicos** en el registro

## Solución de Problemas

### Error de Conexión
- Verificar que el backend esté ejecutándose en el puerto 3001
- Verificar que el frontend esté ejecutándose en el puerto 4200

### Error de Autenticación
- Verificar que el usuario y contraseña sean correctos
- Si olvidaste la contraseña, usa la función de recuperación
- Verificar que las variables de entorno estén configuradas correctamente
- **Usuario por defecto:** `admin_senior` (se crea automáticamente al iniciar el sistema)

### Error al Crear/Editar/Eliminar
- Verificar que tengas permisos de administrador
- Verificar que todos los campos requeridos estén completos

### Error al Descargar PDF
- Verificar que el navegador permita descargas
- Verificar que no haya bloqueadores de pop-ups activos

## Estructura del Proyecto

```
pagina-javascript-angular/
├── .gitignore              # Archivos excluidos del repositorio
├── README.md               # Este archivo
├── backend/                # Servidor Node.js/Express
│   ├── app.js              # Servidor principal
│   ├── package.json        # Dependencias del backend
│   ├── .env_template       # Plantilla de configuración
│   ├── CONFIGURACION.md    # Guía de configuración
│   ├── db/                 # Base de datos SQLite
│   │   ├── inventory.db    # Base de datos principal
│   │   └── backups/        # Directorio de backups
│   ├── routes/             # Rutas de la API
│   ├── controllers/        # Controladores
│   ├── models/             # Modelos de datos
│   ├── middlewares/        # Middlewares
│   └── services/           # Servicios (email, etc.)
└── frontend/               # Aplicación Angular
    ├── angular.json        # Configuración de Angular
    ├── package.json        # Dependencias del frontend
    ├── src/                # Código fuente
    │   ├── app/            # Componentes y servicios
    │   │   ├── components/ # Componentes de la aplicación
    │   │   ├── services/   # Servicios (API, Auth)
    │   │   └── guards/     # Guards de autenticación
    │   ├── assets/         # Recursos estáticos
    │   └── styles.css      # Estilos globales
    └── tsconfig.json       # Configuración TypeScript
```

## Comandos Útiles

### Backend
```bash
cd backend
npm install          # Instalar dependencias
node app.js          # Ejecutar servidor
```

### Frontend
```bash
cd frontend
npm install          # Instalar dependencias
ng serve             # Ejecutar en desarrollo
ng build             # Construir para producción
```

## 🔧 Configuración Avanzada

### Sistema de Roles y Permisos

#### Roles Disponibles
1. **Usuario Regular (user)**
   - Solo puede ver datos (productos, categorías, distribuidores)
   - No puede crear, editar o eliminar
   - No puede acceder a auditoría ni gestión de usuarios

2. **Administrador (admin)**
   - Puede ver todos los datos
   - Puede crear, editar y eliminar productos, categorías y distribuidores
   - Puede ver el registro de auditoría
   - Puede editar datos del comercio
   - No puede gestionar usuarios ni base de datos

3. **Administrador Senior (senior_admin)**
   - Todos los permisos de administrador
   - Puede gestionar usuarios (cambiar roles)
   - Puede gestionar la base de datos (backups, restauración)
   - Acceso completo al sistema

#### Gestión de Roles
- **Registro automático:** Todos los usuarios nuevos se registran como "Usuario Regular"
- **Promoción:** Solo un Administrador Senior puede cambiar el rol a "Administrador"
- **Restricciones:** No se puede cambiar el rol de un Administrador Senior
- **Seguridad:** No se puede cambiar el rol del usuario actual

### Variables de Entorno
El sistema utiliza variables de entorno para la configuración segura. Consulta `backend/CONFIGURACION.md` para instrucciones detalladas.

### Gestión de Base de Datos
- **Backups automáticos**: Se crean en `backend/db/backups/`
- **Restauración segura**: Verificación de integridad antes de restaurar
- **Auditoría completa**: Todas las acciones se registran
- **Confirmaciones**: Múltiples confirmaciones para acciones destructivas
- **Actualización automática**: La lista de backups se actualiza cada 10 segundos sin mostrar mensajes

### Base de Datos
- **SQLite**: Base de datos local para desarrollo
- **Migración**: Para producción, considera migrar a PostgreSQL o MySQL
- **Backup**: Realiza copias de seguridad regulares de `backend/db/inventory.db`

## 📞 Contacto y Soporte

Para reportar problemas o solicitar nuevas funcionalidades:
1. Verifica la configuración de variables de entorno
2. Revisa los logs del servidor
3. Consulta la documentación de configuración