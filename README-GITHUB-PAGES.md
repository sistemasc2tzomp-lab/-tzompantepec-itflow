# 🌐 ITFlow en GitHub Pages

## 📋 Información del Despliegue

**URL del Sistema:** https://sistemasc2tzomp-lab.github.io/-tzompantepec-itflow/

## 🚀 Configuración Realizada

### ✅ Archivos de Configuración

1. **`.nojekyll`** - Desactiva Jekyll para GitHub Pages
2. **`base href`** - Configurado para subdirectorio `/-tzompantepec-itflow/`
3. **Rutas relativas** - Todos los recursos apuntan correctamente

### 🔧 Características Activadas

- ✅ **HTTPS gratuito** por GitHub
- ✅ **CDN global** por GitHub Pages
- ✅ **Dominio personalizado** disponible
- ✅ **Despliegue automático** con cada push

## 📱 Acceso al Sistema

### 🔑 Credenciales Iniciales

| Rol | Email | Contraseña | Departamento |
|-----|-------|------------|-------------|
| Admin | admin@tzompantepec.gob.mx | admin123 | TI / Sistemas |
| Usuario | carlos.hernandez@tzompantepec.gob.mx | user123 | Presidencia Municipal |
| Usuario | maria.lopez@tzompantepec.gob.mx | user123 | Tesorería |

## ⚙️ Configuración de Supabase

### Paso 1: Configurar Base de Datos

1. **Ve a tu proyecto Supabase**
2. **Ejecuta el SQL** del archivo `README-PRODUCCION.md`
3. **Verifica tablas creadas**

### Paso 2: Obtener Credenciales

1. **En Supabase Dashboard > Settings > API**
2. **Copia Project URL y anon public key**

### Paso 3: Configurar en el Sistema

1. **Ingresa al sistema** con credenciales de admin
2. **Ve a Configuración**
3. **Ingresa URL y key de Supabase**
4. **Haz clic en Conectar**

### Paso 4: Crear Usuarios

1. **Abre consola del navegador (F12)**
2. **Carga el script setup-users.js**
3. **Ejecuta `createInitialUsers()`**

## 🎯 Flujo de Trabajo

### Para Usuarios Normales

1. **Ingresar con sus credenciales**
2. **Crear nuevos tickets**
3. **Ver sus tickets asignados**
4. **Ver historial y comentarios**

### Para Administradores

1. **Gestión completa de tickets**
2. **Asignación de tickets**
3. **Reportes y estadísticas**
4. **Gestión de usuarios**
5. **Configuración del sistema**

## 📊 Características del Sistema

### 🎨 Interfaz

- **100% Responsive** - Funciona en desktop y móviles
- **Dashboard interactivo** - Métricas en tiempo real
- **Kanban visual** - Arrastrar y soltar tickets
- **Reportes avanzados** - Exportación Excel/PDF

### 🔧 Funcionalidades

- **Gestión de tickets** - Creación, seguimiento, cierre
- **Sistema de roles** - Admin y usuarios
- **Departamentos** - Organización por área
- **Historial completo** - Auditoría de cambios
- **Notificaciones** - Toast messages

### 📱 Módulos

- **Dashboard** - Vista general y métricas
- **Tickets** - Gestión principal
- **Kanban** - Vista visual
- **Usuarios** - Administración de personal
- **Reportes** - Exportación y análisis
- **Departamentos** - Estadísticas por área
- **Configuración** - Sistema y Supabase

## 🚨 Notas Importantes

### 🔒 Seguridad

- **HTTPS activado** por defecto
- **Autenticación con Supabase Auth**
- **Row Level Security (RLS)** configurado
- **Roles y permisos definidos**

### 📈 Monitoreo

- **GitHub Pages Analytics** disponible
- **Supabase Dashboard** para monitoreo de DB
- **Console logs** para debugging

### 🔄 Actualizaciones

- **Despliegue automático** con cada push a main
- **Versionado con Git**
- **Rollback fácil** con Git history

## 🛠️ Mantenimiento

### Tareas Mensuales

1. **Revisar métricas de uso**
2. **Limpiar tickets antiguos**
3. **Actualizar usuarios si es necesario**
4. **Verificar backups en Supabase**

### Soporte

- **Issues en GitHub** para reportar problemas
- **Documentación completa** en README.md
- **Scripts de setup** para configuración

---

## 🎉 ¡Sistema en Producción!

El sistema ITFlow está completamente funcional en:

**🌐 https://sistemasc2tzomp-lab.github.io/-tzompantepec-itflow/**

*H. Ayuntamiento de Tzompantepec - Dirección de TI*
