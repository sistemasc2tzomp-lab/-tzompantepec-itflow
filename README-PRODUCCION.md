# ITFlow - Sistema de Mesa de Servicios
## H. Ayuntamiento de Tzompantepec

### 📋 Configuración para Producción

#### 1. Configuración de Supabase

1. **Crear cuenta en Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - Crea una cuenta o inicia sesión
   - Crea un nuevo proyecto

2. **Configurar la base de datos**
   - Ejecuta el siguiente SQL en el editor SQL de Supabase:

```sql
-- Crear tabla de usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'usuario')),
    departamento TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de tickets
CREATE TABLE tickets (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT,
    prioridad TEXT NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta', 'crítica')),
    status TEXT NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'en_progreso', 'atendido', 'cerrado', 'cancelado')),
    departamento TEXT,
    solicitante_id UUID REFERENCES usuarios(id),
    asignado_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de historial
CREATE TABLE ticket_historiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    accion TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de comentarios
CREATE TABLE comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    autor_id UUID REFERENCES usuarios(id),
    comentario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_prioridad ON tickets(prioridad);
CREATE INDEX idx_tickets_solicitante ON tickets(solicitante_id);
CREATE INDEX idx_tickets_asignado ON tickets(asignado_id);
CREATE INDEX idx_historiales_ticket ON ticket_historiales(ticket_id);
CREATE INDEX idx_comentarios_ticket ON comentarios(ticket_id);

-- Configurar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_historiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los administradores pueden ver todos los usuarios" ON usuarios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Los administradores pueden gestionar usuarios" ON usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Todos los usuarios autenticados pueden ver tickets" ON tickets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Los usuarios pueden crear tickets" ON tickets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Los administradores pueden actualizar todos los tickets" ON tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Los usuarios pueden actualizar sus propios tickets" ON tickets
    FOR UPDATE USING (solicitante_id = auth.uid());

-- Políticas similares para historial y comentarios
CREATE POLICY "Todos los usuarios autenticados pueden ver historial" ON ticket_historiales
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Todos los usuarios autenticados pueden ver comentarios" ON comentarios
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden agregar comentarios" ON comentarios
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

#### 2. Obtener Credenciales de Supabase

1. En tu proyecto Supabase:
   - Ve a **Settings** > **API**
   - Copia la **Project URL** y el **anon public key**

2. En la aplicación:
   - Ve a **Configuración** (solo visible para administradores)
   - Ingresa la URL y la key de Supabase
   - Haz clic en **Conectar**

#### 3. Crear Usuarios Iniciales

1. **Cargar el script de setup**
   - Abre la consola del navegador (F12)
   - Copia y pega el contenido del archivo `setup-users.js`
   - Presiona Enter

2. **Crear los usuarios**
   - Ejecuta: `createInitialUsers()`
   - Esto creará los siguientes usuarios:

| Email | Contraseña | Rol | Departamento |
|-------|------------|-----|-------------|
| admin@tzompantepec.gob.mx | admin123 | Admin | TI / Sistemas |
| sistemas@tzompantepec.gob.mx | sistemas123 | Admin | TI / Sistemas |
| carlos.hernandez@tzompantepec.gob.mx | user123 | Usuario | Presidencia Municipal |
| maria.lopez@tzompantepec.gob.mx | user123 | Usuario | Tesorería |
| juan.perez@tzompantepec.gob.mx | user123 | Usuario | Obras Públicas |

3. **Verificar usuarios**
   - Ejecuta: `checkExistingUsers()` para ver los usuarios creados

#### 4. Acceso al Sistema

1. **URL de acceso**: Abre `index.html` en tu servidor web
2. **Login inicial**: Usa `admin@tzompantepec.gob.mx` / `admin123`
3. **Cambiar contraseñas**: Es recomendable cambiar las contraseñas predeterminadas

#### 5. Personalización

- **Logo**: Reemplaza el archivo `assets/images/6691194a-b92d-4c1a-b170-7fe3f192779a-removebg-preview.png`
- **Colores**: Modifica `css/variables.css` para personalizar la paleta de colores
- **Departamentos**: Actualiza la lista en `js/departments.js`

### 🔧 Características

- ✅ **Gestión de Tickets**: Creación, asignación y seguimiento
- ✅ **Múltiples Roles**: Administradores y usuarios
- ✅ **Reportes**: Exportación a Excel y PDF
- ✅ **Responsive**: Funciona en desktop y móviles
- ✅ **Dashboard**: Métricas y estadísticas en tiempo real
- ✅ **Kanban**: Vista visual del flujo de tickets

### 📱 Soporte Móvil

El sistema es completamente responsive y funciona en:
- Desktop (Windows, Mac, Linux)
- Tablets (iPad, Android tablets)
- Móviles (iPhone, Android)

### 🚀 Despliegue

Para desplegar en producción:

1. **Subir archivos** a tu servidor web
2. **Configurar HTTPS** (recomendado)
3. **Conectar a Supabase** con las credenciales reales
4. **Crear usuarios** con el script de setup
5. **Probar funcionalidad** completa

### 🛠️ Mantenimiento

- **Backup**: Configura backups automáticos en Supabase
- **Monitoreo**: Usa las herramientas de monitoreo de Supabase
- **Actualizaciones**: Mantén actualizado el sistema y las dependencias

### 📞 Soporte

Para soporte técnico:
1. Revisa la consola del navegador para errores
2. Verifica la conexión a Supabase
3. Confirma que las políticas RLS estén configuradas correctamente

---

**H. Ayuntamiento de Tzompantepec**  
*Dirección de Tecnologías de la Información*
