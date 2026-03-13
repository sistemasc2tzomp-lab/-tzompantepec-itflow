-- ════════════════════════════════════════════════════════════════
-- BASE DE DATOS ITFLOW - VERSIÓN MÍNIMA (SIN RLS)
-- ════════════════════════════════════════════════════════════════

-- 1. Tabla de usuarios básica
CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'usuario',
    departamento TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de tickets básica
CREATE TABLE tickets (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT,
    prioridad TEXT NOT NULL DEFAULT 'media',
    status TEXT NOT NULL DEFAULT 'nuevo',
    departamento TEXT,
    solicitante_id UUID,
    asignado_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de historial simple
CREATE TABLE ticket_historiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT NOT NULL,
    usuario_id UUID,
    accion TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de comentarios simple
CREATE TABLE comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT NOT NULL,
    autor_id UUID,
    comentario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Índices básicos
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_prioridad ON tickets(prioridad);

-- ════════════════════════════════════════════════════════════════
-- BASE DE DATOS MÍNIMA - LISTA PARA PROBAR
-- ════════════════════════════════════════════════════════════════
