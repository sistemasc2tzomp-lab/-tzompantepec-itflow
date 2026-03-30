// ══════════════════════════════════════════
// UTILIDADES GLOBALES
// ══════════════════════════════════════════

// Metadata global de estados de ticket
const STATUS_META = {
    nuevo:         { label: 'Nuevo', color: '#10b981', dot: '#10b981' },
    en_asignacion: { label: 'En asignación', color: '#d97706', dot: '#f59e0b' },
    en_progreso:   { label: 'En progreso', color: '#059669', dot: '#10b981' },
    pendiente:      { label: 'Pendiente', color: '#e11d48', dot: '#f43f5e' },
    atendido:       { label: 'Atendido', color: '#16a34a', dot: '#22c55e' },
    cancelado:      { label: 'Cancelado', color: '#9ca3af', dot: '#d1d5db' },
    cerrado:        { label: 'Cerrado', color: '#6b7280', dot: '#9ca3af' },
};
// Alias para mayor robustez en caso de enums en mayúsculas o con espacios
const STATUS_ALIAS = {
    'Nuevo': 'nuevo',
    'Abierto': 'nuevo',
    'PENDIENTE': 'pendiente',
    'En proceso': 'en_progreso'
};

const PRIO_META = {
    baja: { label: 'Baja', color: '#6b7280' },
    media: { label: 'Media', color: '#2563eb' },
    alta: { label: 'Alta', color: '#d97706' },
    crítica: { label: 'Crítica', color: '#e11d48' },
};

const STATUS_TRANSITIONS = {
    nuevo: ['en_asignacion', 'pendiente', 'cancelado'],
    en_asignacion: ['en_progreso', 'pendiente', 'cancelado'],
    en_progreso: ['atendido', 'pendiente', 'cancelado'],
    pendiente: ['en_asignacion', 'en_progreso', 'cancelado'],
    atendido: ['cerrado', 'cancelado'],
    cancelado: [],
    cerrado: [],
};

// Toast notification
let toastTimeout;

function toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `show t-${type}`;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.className = '', 3500);
}

// Modal functions
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('open');
        const first = el.querySelector('button, input, select, textarea');
        if (first) setTimeout(() => first.focus(), 80);
    }
}

// Date formatting
function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function fmtDateShort(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Loading overlay
function showLoading(v) {
    document.getElementById('loading-overlay').classList.toggle('hidden', !v);
}

// Icons
function iDash(s = '16') {
    return `<svg width="${s}" height="${s}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`;
}

function iTicket(s = '16') {
    return `<svg width="${s}" height="${s}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
}

function iKanban(s = '16') {
    return `<svg width="${s}" height="${s}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>`;
}

function iUsers(s = '16') {
    return `<svg width="${s}" height="${s}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`;
}

function iAlert(s = '16') {
    return `<svg width="${s}" height="${s}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
}

function iClock(s = '16') {
    return `<svg width="${s}" height="${s}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
}

function iCheck(s = '16') {
    return `<svg width="${s}" height="${s}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
}

function iX(s = '16') {
    return `<svg width="${s}" height="${s}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
}

function iUser(s = '16') {
    return `<svg width="${s}" height="${s}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`;
}

// SQL Guide
const SQL_GUIDE_TEXT = `-- ═══════════════════════════════════════════════
-- MESA DE SERVICIOS TI — TZOMPANTEPEC
-- Ejecuta esto en Supabase > SQL Editor > New query
-- ═══════════════════════════════════════════════

create table if not exists usuarios (
  id text primary key,
  nombre text not null,
  email text unique not null,
  rol text default 'usuario',
  departamento text,
  created_at timestamptz default now()
);

create table if not exists tickets (
  id text primary key,
  titulo text not null,
  descripcion text,
  prioridad text default 'media',
  status text default 'nuevo',
  categoria text,
  departamento text,
  solicitante_id text references usuarios(id),
  asignado_id text references usuarios(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ticket_historiales (
  id bigserial primary key,
  ticket_id text references tickets(id),
  estado text,
  creado_por text references usuarios(id),
  nota text,
  created_at timestamptz default now()
);

create table if not exists comentarios (
  id bigserial primary key,
  ticket_id text references tickets(id),
  autor_id text references usuarios(id),
  comentario text,
  created_at timestamptz default now()
);

-- Habilitar Row Level Security
alter table usuarios enable row level security;
alter table tickets enable row level security;
alter table ticket_historiales enable row level security;
alter table comentarios enable row level security;

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON usuarios FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins pueden ver todos los usuarios"
  ON usuarios FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins pueden insertar usuarios"
  ON usuarios FOR INSERT
  WITH CHECK (is_admin());

-- Políticas para tickets
CREATE POLICY "Usuarios ven sus propios tickets"
  ON tickets FOR SELECT
  USING (solicitante_id = auth.uid());

CREATE POLICY "Admins ven todos los tickets"
  ON tickets FOR SELECT
  USING (is_admin());

CREATE POLICY "Usuarios pueden insertar tickets"
  ON tickets FOR INSERT
  WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "Admins pueden actualizar cualquier ticket"
  ON tickets FOR UPDATE
  USING (is_admin());

-- Similar para historial y comentarios
CREATE POLICY "Usuarios ven historial de sus tickets"
  ON ticket_historiales FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets WHERE id = ticket_id AND solicitante_id = auth.uid()
  ));

CREATE POLICY "Admins ven todo el historial"
  ON ticket_historiales FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins pueden insertar historial"
  ON ticket_historiales FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Usuarios pueden ver comentarios de sus tickets"
  ON comentarios FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tickets WHERE id = ticket_id AND solicitante_id = auth.uid()
  ));

CREATE POLICY "Admins ven todos los comentarios"
  ON comentarios FOR SELECT
  USING (is_admin());

CREATE POLICY "Usuarios pueden insertar comentarios en sus tickets"
  ON comentarios FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tickets WHERE id = ticket_id AND solicitante_id = auth.uid()
  ));

CREATE POLICY "Admins pueden insertar comentarios en cualquier ticket"
  ON comentarios FOR INSERT
  WITH CHECK (is_admin());`;

function showSQLGuide() {
    const modal = document.getElementById('modal-sql');
    const ta = document.getElementById('sql-guide-text');
    if (ta) ta.value = SQL_GUIDE_TEXT;
    if (modal) modal.classList.add('open');
}

function copySQLGuide() {
    const ta = document.getElementById('sql-guide-text');
    const text = ta ? ta.value : SQL_GUIDE_TEXT;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            toast('SQL copiado al portapapeles.', 'success');
        });
    } else {
        if (ta) {
            ta.select();
            document.execCommand('copy');
        }
        alert('SQL copiado.');
    }
}

// Mobile menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('tn-mobile-menu');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenu) {
        mobileMenu.classList.toggle('open');
    }
    
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('tn-mobile-menu');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenu) {
        mobileMenu.classList.remove('open');
    }
    
    if (sidebar) {
        sidebar.classList.remove('open');
    }
}

// Top nav functions
function showTopNav(isAdmin) {
    document.getElementById('tn-menu').style.display = 'flex';
    document.getElementById('tn-hamburger').style.display = 'flex';
    document.querySelectorAll('.tn-admin-only').forEach(el => {
        el.style.display = isAdmin ? 'flex' : 'none';
    });
    document.querySelectorAll('.tn-admin-only-mob').forEach(el => {
        el.style.display = isAdmin ? 'flex' : 'none';
    });
}

function hideTopNav() {
    document.getElementById('tn-menu').style.display = 'none';
    document.getElementById('tn-hamburger').style.display = 'none';
}

function updateTopNavActive(view) {
    document.querySelectorAll('.tn-item, .tn-mobile-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById('tn-' + view);
    if (el) el.classList.add('active');
}

// Metric card helper
function mCard(color, bg, val, label, sub, icon) {
    return `<div class="metric-card">
        <div class="metric-stripe" style="background:${color}"></div>
        <div class="metric-icon" style="background:${bg}">${icon}</div>
        <div class="metric-val" style="color:${color}">${val}</div>
        <div class="metric-label">${label}</div>
        <div class="metric-sub">${sub}</div>
    </div>`;
}

// Icon helpers
function iDash() {
    return '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>';
}

function iTicket() {
    return '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>';
}

function iKanban() {
    return '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>';
}

function iUsers() {
    return '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>';
}

function iClock() {
    return '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
}

function iCheck() {
    return '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
}

function iAlert() {
    return '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
}

// Loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Export functions
window.showLoading = showLoading;
window.mCard = mCard;
window.iDash = iDash;
window.iTicket = iTicket;
window.iKanban = iKanban;
window.iUsers = iUsers;
window.iClock = iClock;
window.iCheck = iCheck;
window.iAlert = iAlert;