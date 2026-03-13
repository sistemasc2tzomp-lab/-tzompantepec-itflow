-- ════════════════════════════════════════════════════════════════
-- BASE DE DATOS ITFLOW - H. AYUNTAMIENTO TZOMPANTEPEC
-- ════════════════════════════════════════════════════════════════

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'usuario')),
    departamento TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de tickets
CREATE TABLE IF NOT EXISTS tickets (
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
CREATE TABLE IF NOT EXISTS ticket_historiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    accion TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    autor_id UUID REFERENCES usuarios(id),
    comentario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_prioridad ON tickets(prioridad);
CREATE INDEX IF NOT EXISTS idx_tickets_solicitante ON tickets(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_tickets_asignado ON tickets(asignado_id);
CREATE INDEX IF NOT EXISTS idx_historiales_ticket ON ticket_historiales(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_ticket ON comentarios(ticket_id);

-- Configurar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_historiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para usuarios
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

-- Políticas para tickets
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

-- Políticas para historial y comentarios
CREATE POLICY "Todos los usuarios autenticados pueden ver historial" ON ticket_historiales
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden agregar historial" ON ticket_historiales
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Todos los usuarios autenticados pueden ver comentarios" ON comentarios
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden agregar comentarios" ON comentarios
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar timestamp en tickets
CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ════════════════════════════════════════════════════════════════
-- COMPLETADO - BASE DE DATOS LISTA PARA USAR
-- ════════════════════════════════════════════════════════════════
