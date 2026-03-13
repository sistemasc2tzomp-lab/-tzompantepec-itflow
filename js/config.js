// ══════════════════════════════════════════
// CONFIGURACIÓN
// ══════════════════════════════════════════

async function renderConfig() {
    if (!isAdmin()) {
        toast('Acceso no autorizado', 'error');
        navigate('dashboard');
        return;
    }
    
    const el = document.getElementById('view-config');
    
    showLoading(true);
    const users = await loadUsers();
    showLoading(false);
    
    const adminCount = users.filter(u => u.rol === 'admin').length;
    const userCount = users.filter(u => u.rol !== 'admin').length;
    
    el.innerHTML = '<h2 style="font-family:var(--font-display);font-size:1.4rem;color:var(--verde);margin-bottom:6px">Configuración</h2>' +
        '<p class="section-sub">Parámetros del sistema — Solo administradores</p>' +

        '<div class="config-section"><h3>🔌 Conexión a Base de Datos</h3>' +
        '<div class="config-grid">' +
        '<div class="config-card">' +
        '<div class="config-card-icon"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4-8 4m16 0c0 2.21-3.582 4-8 4"/></svg></div>' +
        '<div class="config-card-body">' +
        '<div class="config-card-title">Supabase URL</div>' +
        '<div class="config-card-desc">URL del proyecto Supabase activo</div>' +
        '<div style="font-family:var(--font-mono);font-size:.72rem;color:var(--verde-med);background:var(--verde-pale);padding:6px 10px;border-radius:6px;word-break:break-all">' + (localStorage.getItem('supa_url') || 'No configurado') + '</div>' +
        '</div>' +
        '</div>' +
        '<div class="config-card">' +
        '<div class="config-card-icon"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div>' +
        '<div class="config-card-body">' +
        '<div class="config-card-title">Estado de conexión</div>' +
        '<div class="config-card-desc">Estado actual de Supabase</div>' +
        '<span class="badge" style="background:' + (isSupabaseConnected() ? '#f0fdf4' : '#fff1f2') + ';color:' + (isSupabaseConnected() ? '#16a34a' : '#e11d48') + ';border:1px solid ' + (isSupabaseConnected() ? '#bbf7d0' : '#fecdd3') + '">' + (isSupabaseConnected() ? '● Conectado' : '● Desconectado') + '</span>' +
        '</div>' +
        '</div>' +
        '</div></div>' +

        '<div class="config-section"><h3>👥 Usuarios del sistema</h3>' +
        '<div class="config-grid">' +
        '<div class="config-card">' +
        '<div class="config-card-icon"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>' +
        '<div class="config-card-body">' +
        '<div class="config-card-title">Total de usuarios registrados</div>' +
        '<div class="config-card-desc">Administradores y usuarios del sistema</div>' +
        '<div style="display:flex;gap:12px;margin-top:8px">' +
        '<div><span style="font-family:var(--font-display);font-size:1.4rem;color:var(--verde)">' + adminCount + '</span><span style="font-size:.72rem;color:var(--text3);margin-left:4px">Admins</span></div>' +
        '<div><span style="font-family:var(--font-display);font-size:1.4rem;color:var(--tierra)">' + userCount + '</span><span style="font-size:.72rem;color:var(--text3);margin-left:4px">Usuarios</span></div>' +
        '</div>' +
        '<button class="btn btn-sm btn-primary" style="margin-top:12px" onclick="navigate(&quot;users&quot;)">Gestionar usuarios</button>' +
        '</div>' +
        '</div>' +
        '</div></div>' +

        '<div class="config-section"><h3>🏛️ Información institucional</h3>' +
        '<div class="config-card" style="max-width:500px">' +
        '<div class="config-card-body">' +
        '<div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">' +
        '<img src="' + document.getElementById('navbar-logo-gob')?.src + '" style="height:48px;width:auto" alt="Logo"/>' +
        '<img src="' + document.getElementById('navbar-logo-sis')?.src + '" style="height:48px;width:auto" alt="Logo Sistemas"/>' +
        '</div>' +
        '<table style="font-size:.84rem;width:100%;border-collapse:collapse">' +
        '<tr><td style="color:var(--text2);padding:5px 0;width:140px">Municipio</td><td style="font-weight:600">Tzompantepec</td></tr>' +
        '<tr><td style="color:var(--text2);padding:5px 0">Estado</td><td style="font-weight:600">Tlaxcala</td></tr>' +
        '<tr><td style="color:var(--text2);padding:5px 0">Sistema</td><td style="font-weight:600">Mesa de Servicios TI v2.0</td></tr>' +
        '<tr><td style="color:var(--text2);padding:5px 0">Área responsable</td><td style="font-weight:600">Dirección de Sistemas - C2</td></tr>' +
        '</table>' +
        '</div>' +
        '</div></div>';
}