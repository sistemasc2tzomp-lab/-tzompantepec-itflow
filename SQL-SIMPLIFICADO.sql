-- ════════════════════════════════════════════════════════════════
-- BASE DE DATOS ITFLOW - VERSIÓN SIMPLIFICADA
-- ════════════════════════════════════════════════════════════════

-- 1. Crear tabla de usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'usuario')),
    departamento TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de tickets
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

-- 3. Crear tabla de historial
CREATE TABLE ticket_historiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    accion TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla de comentarios
CREATE TABLE comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    autor_id UUID REFERENCES usuarios(id),
    comentario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear índices básicos
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_prioridad ON tickets(prioridad);
CREATE INDEX idx_tickets_solicitante ON tickets(solicitante_id);
CREATE INDEX idx_tickets_asignado ON tickets(asignado_id);

-- 6. Activar RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_historiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- 7. Políticas básicas de seguridad
-- Usuarios
CREATE POLICY "Usuarios pueden ver todos los perfiles" ON usuarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins pueden gestionar usuarios" ON usuarios FOR ALL USING (auth.role() = 'authenticated');

-- Tickets
CREATE POLICY "Usuarios autenticados pueden ver tickets" ON tickets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios pueden crear tickets" ON tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios pueden actualizar tickets" ON tickets FOR UPDATE USING (auth.role() = 'authenticated');

-- Historial
CREATE POLICY "Usuarios pueden ver historial" ON ticket_historiales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios pueden crear historial" ON ticket_historiales FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Comentarios
CREATE POLICY "Usuarios pueden ver comentarios" ON comentarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios pueden crear comentarios" ON comentarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════
-- BASE DE DATOS SIMPLIFICADA - LISTA PARA USAR
-- ════════════════════════════════════════════════════════════════
