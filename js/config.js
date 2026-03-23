// ══════════════════════════════════════════
// CONFIGURACIÓN DEL SISTEMA
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
    const userCount  = users.filter(u => u.rol !== 'admin').length;
    const supaUrl    = localStorage.getItem('supa_url') || '';
    const supaKey    = localStorage.getItem('supa_key') || '';
    const connected  = isSupabaseConnected();

    el.innerHTML = `
    <h2 style="font-family:var(--font-display);font-size:1.4rem;color:var(--verde);margin-bottom:6px">Configuración</h2>
    <p class="section-sub">Parámetros del sistema — Solo administradores</p>

    <!-- CONEXIÓN A SUPABASE -->
    <div class="config-section">
        <h3>🔌 Conexión a Base de Datos (Supabase)</h3>
        <div class="config-grid">
            <div class="config-card" style="grid-column:1/-1">
                <div class="config-card-body">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
                        <span class="badge" style="background:${connected?'#f0fdf4':'#fff1f2'};color:${connected?'#16a34a':'#e11d48'};border:1px solid ${connected?'#bbf7d0':'#fecdd3'};font-size:.8rem;padding:4px 12px">
                            ${connected ? '● Conectado' : '● Desconectado'}
                        </span>
                        <span style="font-size:.8rem;color:var(--text3)">${supaUrl ? supaUrl.replace('https://','').split('.')[0]+'.supabase.co' : 'Sin configurar'}</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
                        <div>
                            <label style="font-size:.78rem;color:var(--text2);margin-bottom:4px;display:block">URL del proyecto Supabase</label>
                            <input type="text" id="cfg-supa-url" value="${supaUrl}" placeholder="https://xxxx.supabase.co"
                                style="width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:.84rem;font-family:var(--font-mono)"/>
                        </div>
                        <div>
                            <label style="font-size:.78rem;color:var(--text2);margin-bottom:4px;display:block">Anon Public Key</label>
                            <input type="password" id="cfg-supa-key" value="${supaKey}" placeholder="eyJhbGci..."
                                style="width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:.84rem;font-family:var(--font-mono)"/>
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap">
                        <button class="btn btn-primary btn-sm" onclick="saveSupabaseConfig()">💾 Guardar y conectar</button>
                        <button class="btn btn-sm btn-ghost" onclick="clearSupabaseConfig()">🗑️ Limpiar credenciales</button>
                        <button class="btn btn-sm" style="background:rgba(200,150,42,0.15);color:var(--tierra);border:1px solid rgba(200,150,42,0.3)" onclick="showSQLGuide()">📋 Ver SQL de tablas</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- USUARIOS -->
    <div class="config-section">
        <h3>👥 Usuarios del sistema</h3>
        <div class="config-grid">
            <div class="config-card">
                <div class="config-card-icon"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
                <div class="config-card-body">
                    <div class="config-card-title">Usuarios registrados</div>
                    <div class="config-card-desc">Administradores y operadores del sistema</div>
                    <div style="display:flex;gap:16px;margin-top:10px">
                        <div><span style="font-family:var(--font-display);font-size:1.5rem;color:var(--verde)">${adminCount}</span><span style="font-size:.72rem;color:var(--text3);margin-left:4px">Admins</span></div>
                        <div><span style="font-family:var(--font-display);font-size:1.5rem;color:var(--tierra)">${userCount}</span><span style="font-size:.72rem;color:var(--text3);margin-left:4px">Usuarios</span></div>
                    </div>
                    <button class="btn btn-sm btn-primary" style="margin-top:12px" onclick="navigate('users')">Gestionar usuarios</button>
                </div>
            </div>
            <div class="config-card">
                <div class="config-card-icon"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div>
                <div class="config-card-body">
                    <div class="config-card-title">Seguridad</div>
                    <div class="config-card-desc">Autenticación vía Supabase Auth</div>
                    <div style="margin-top:10px;font-size:.8rem;color:var(--text2)">Usuarios gestionados en<br><strong>Supabase → Authentication → Users</strong></div>
                </div>
            </div>
        </div>
    </div>

    <!-- DEPARTAMENTOS -->
    <div class="config-section">
        <h3>🏛️ Departamentos activos</h3>
        <div class="config-card" style="max-width:640px">
            <div class="config-card-body">
                <div class="config-card-desc" style="margin-bottom:12px">Áreas municipales registradas en el sistema</div>
                <div style="display:flex;flex-wrap:wrap;gap:7px">
                    ${(typeof DEPARTAMENTOS !== 'undefined' ? DEPARTAMENTOS : []).map(d =>
                        `<span style="background:var(--verde-pale);color:var(--verde-dark);border:1px solid var(--verde-soft);border-radius:20px;padding:3px 12px;font-size:.78rem">${d}</span>`
                    ).join('')}
                </div>
                <button class="btn btn-sm btn-outline-verde" style="margin-top:14px" onclick="navigate('departamentos')">Ver estadísticas por departamento</button>
            </div>
        </div>
    </div>

    <!-- INFORMACIÓN INSTITUCIONAL -->
    <div class="config-section">
        <h3>ℹ️ Información institucional</h3>
        <div class="config-card" style="max-width:480px">
            <div class="config-card-body">
                <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">
                    <img src="${document.getElementById('navbar-logo-gob')?.src}" style="height:48px;width:auto" alt="Logo"/>
                    <img src="${document.getElementById('navbar-logo-sis')?.src}" style="height:48px;width:auto" alt="Logo Sistemas"/>
                </div>
                <table style="font-size:.84rem;width:100%;border-collapse:collapse">
                    <tr><td style="color:var(--text2);padding:5px 0;width:150px">Municipio</td><td style="font-weight:600">Tzompantepec</td></tr>
                    <tr><td style="color:var(--text2);padding:5px 0">Estado</td><td style="font-weight:600">Tlaxcala, México</td></tr>
                    <tr><td style="color:var(--text2);padding:5px 0">Sistema</td><td style="font-weight:600">Mesa de Servicios TI v2.0</td></tr>
                    <tr><td style="color:var(--text2);padding:5px 0">Área responsable</td><td style="font-weight:600">Dirección de Sistemas - C2</td></tr>
                </table>
            </div>
        </div>
    </div>`;
}

async function saveSupabaseConfig() {
    const url = document.getElementById('cfg-supa-url').value.trim().replace(/\/$/, '');
    const key = document.getElementById('cfg-supa-key').value.trim();
    if (!url || !key) { toast('Ingresa URL y Key de Supabase.', 'error'); return; }
    document.getElementById('supa-url').value = url;
    document.getElementById('supa-key').value = key;
    await connectSupabase();
    renderConfig();
}

function clearSupabaseConfig() {
    if (!confirm('¿Limpiar credenciales? Se cerrará la sesión actual.')) return;
    localStorage.removeItem('supa_url');
    localStorage.removeItem('supa_key');
    doLogout();
}
