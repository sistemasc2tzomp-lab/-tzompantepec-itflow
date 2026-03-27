// ══════════════════════════════════════════
// USUARIOS — CRUD completo
// Crear, editar, eliminar y listar usuarios
// Solo accesible para administradores
// ══════════════════════════════════════════

let editingUserId = null; // null = crear, string = editar

// ─────────────────────────────────────────
// RENDER PRINCIPAL
// ─────────────────────────────────────────
async function renderUsers() {
    const el = document.getElementById('view-users');
    if (!el) return;

    const usuarios = window.gUsers || [];

    el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
            <div>
                <h2 style="font-size:1.1rem;font-weight:700;color:var(--text);margin:0">Usuarios del sistema</h2>
                <p style="font-size:.83rem;color:var(--text2);margin:3px 0 0">${usuarios.length} usuario(s) registrado(s)</p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="abrirModalUsuario(null)">
                + Nuevo usuario
            </button>
        </div>

        <div class="search-wrap" style="margin-bottom:14px;max-width:360px">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="search" id="user-search" placeholder="Buscar por nombre, email o rol..."
                oninput="filtrarUsuarios(this.value)" aria-label="Buscar usuarios"/>
        </div>

        <div id="users-table-container">
            ${renderUsersTable(usuarios)}
        </div>

        <!-- MODAL CREAR / EDITAR USUARIO -->
        <div class="modal-overlay" id="modal-usuario" role="dialog" aria-modal="true">
            <div class="modal">
                <div class="modal-header">
                    <h3 id="modal-usuario-title">Nuevo usuario</h3>
                    <button class="modal-close" onclick="closeModal('modal-usuario')">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="u-nombre">Nombre completo *</label>
                            <input type="text" id="u-nombre" placeholder="Nombre Apellido"/>
                            <div class="form-error" id="u-nombre-err">El nombre es obligatorio.</div>
                        </div>
                        <div class="form-group">
                            <label for="u-rol">Rol *</label>
                            <select id="u-rol">
                                <option value="usuario">Usuario</option>
                                <option value="admin">Administrador TI</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="u-email">Correo institucional *</label>
                        <input type="email" id="u-email" placeholder="nombre@tzompantepec.gob.mx"/>
                        <div class="form-error" id="u-email-err">Correo inválido o ya registrado.</div>
                    </div>
                    <div class="form-group">
                        <label for="u-dep">Área / Departamento</label>
                        <select id="u-dep">
                            <option value="">— Sin departamento —</option>
                            <option>Presidencia Municipal</option>
                            <option>Tesorería</option>
                            <option>Administración</option>
                            <option>Obras Públicas</option>
                            <option>Seguridad Pública</option>
                            <option>Registro Civil</option>
                            <option>Servicios Municipales</option>
                            <option>Contraloría</option>
                            <option>TI / Sistemas</option>
                            <option>Otro</option>
                        </select>
                    </div>
                    <div class="form-group" id="u-pass-group">
                        <label for="u-pass">Contraseña <span id="u-pass-label">(mínimo 6 caracteres) *</span></label>
                        <input type="password" id="u-pass" placeholder="••••••••" autocomplete="new-password"/>
                        <div class="form-error" id="u-pass-err">Mínimo 6 caracteres.</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-usuario')">Cancelar</button>
                    <button class="btn btn-primary btn-sm" id="u-submit-btn" onclick="submitUsuario()">Crear usuario</button>
                </div>
            </div>
        </div>

        <!-- MODAL CONFIRMAR ELIMINACIÓN -->
        <div class="modal-overlay" id="modal-eliminar-usuario" role="dialog" aria-modal="true">
            <div class="modal">
                <div class="modal-header">
                    <h3>Eliminar usuario</h3>
                    <button class="modal-close" onclick="closeModal('modal-eliminar-usuario')">✕</button>
                </div>
                <div class="modal-body">
                    <p style="color:var(--text2);font-size:.88rem" id="eliminar-usuario-desc"></p>
                    <div style="background:#fff1f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-top:12px;font-size:.82rem;color:#b91c1c">
                        ⚠️ Esta acción no se puede deshacer. Los tickets asociados a este usuario no se eliminarán.
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-eliminar-usuario')">Cancelar</button>
                    <button class="btn btn-sm" id="confirmar-eliminar-usuario-btn"
                        style="background:#dc2626;color:#fff;border:none;border-radius:7px;padding:7px 16px;cursor:pointer;font-size:.82rem"
                        onclick="confirmarEliminarUsuario()">
                        Sí, eliminar
                    </button>
                </div>
            </div>
        </div>`;
}

// ─────────────────────────────────────────
// TABLA DE USUARIOS
// ─────────────────────────────────────────
function renderUsersTable(usuarios) {
    if (!usuarios.length) return `
        <div class="table-empty">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="opacity:.2;margin-bottom:10px">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p>No hay usuarios registrados.</p>
        </div>`;

    const ROL_STYLE = {
        admin:   { bg: '#e8f5ee', color: '#1a5c38', label: 'Administrador TI' },
        usuario: { bg: '#eff6ff', color: '#1d4ed8', label: 'Usuario' },
    };

    return `
        <div class="table-wrap">
            <table class="tickets-table">
                <thead><tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Departamento</th>
                    <th>Tickets</th>
                    <th>Acciones</th>
                </tr></thead>
                <tbody>
                    ${usuarios.map(u => {
                        const rs  = ROL_STYLE[u.rol] || ROL_STYLE.usuario;
                        const ini = (u.nombre || 'U').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
                        const ticketsCount = (window.gTickets || []).filter(t => t.solicitante_id === u.id).length;
                        const esSelf = u.id === currentUser?.id;
                        return `
                        <tr>
                            <td>
                                <div style="display:flex;align-items:center;gap:9px">
                                    <div style="width:32px;height:32px;border-radius:50%;background:var(--verde-light,#e8f5ee);
                                         display:flex;align-items:center;justify-content:center;
                                         font-size:.7rem;font-weight:700;color:var(--verde,#1a5c38);flex-shrink:0">
                                        ${ini}
                                    </div>
                                    <div>
                                        <div style="font-weight:600;font-size:.88rem">${u.nombre || '—'}</div>
                                        ${esSelf ? `<div style="font-size:.7rem;color:var(--verde,#1a5c38)">(tú)</div>` : ''}
                                    </div>
                                </div>
                            </td>
                            <td style="font-size:.82rem;color:var(--text2)">${u.email || '—'}</td>
                            <td>
                                <span style="display:inline-block;padding:2px 10px;border-radius:20px;
                                     background:${rs.bg};color:${rs.color};font-size:.75rem;font-weight:600">
                                    ${rs.label}
                                </span>
                            </td>
                            <td style="font-size:.82rem;color:var(--text2)">${u.departamento || '—'}</td>
                            <td style="font-size:.82rem;text-align:center">${ticketsCount}</td>
                            <td class="actions-cell">
                                <button class="btn btn-xs btn-secondary" onclick="abrirModalUsuario('${u.id}')">
                                    ✏️ Editar
                                </button>
                                ${!esSelf ? `
                                <button class="btn btn-xs" onclick="abrirConfirmarEliminar('${u.id}')"
                                    style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">
                                    🗑 Eliminar
                                </button>` : ''}
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

// ─────────────────────────────────────────
// FILTRAR USUARIOS
// ─────────────────────────────────────────
function filtrarUsuarios(q) {
    const texto = q.toLowerCase();
    const lista = (window.gUsers || []).filter(u =>
        (u.nombre || '').toLowerCase().includes(texto) ||
        (u.email  || '').toLowerCase().includes(texto) ||
        (u.rol    || '').toLowerCase().includes(texto) ||
        (u.departamento || '').toLowerCase().includes(texto)
    );
    const container = document.getElementById('users-table-container');
    if (container) container.innerHTML = renderUsersTable(lista);
}

// ─────────────────────────────────────────
// ABRIR MODAL CREAR / EDITAR
// ─────────────────────────────────────────
function abrirModalUsuario(userId) {
    editingUserId = userId;
    const usuario = userId ? (window.gUsers || []).find(u => u.id === userId) : null;

    document.getElementById('modal-usuario-title').textContent = usuario ? 'Editar usuario' : 'Nuevo usuario';
    document.getElementById('u-submit-btn').textContent        = usuario ? 'Guardar cambios' : 'Crear usuario';

    // Rellenar campos si es edición
    document.getElementById('u-nombre').value = usuario?.nombre      || '';
    document.getElementById('u-email').value  = usuario?.email       || '';
    document.getElementById('u-rol').value    = usuario?.rol         || 'usuario';
    document.getElementById('u-dep').value    = usuario?.departamento || '';

    // Contraseña: obligatoria al crear, opcional al editar
    const passGroup = document.getElementById('u-pass-group');
    const passLabel = document.getElementById('u-pass-label');
    document.getElementById('u-pass').value = '';
    if (usuario) {
        passLabel.textContent = '(opcional — dejar vacío para no cambiar)';
        passGroup.style.opacity = '0.8';
    } else {
        passLabel.textContent = '(mínimo 6 caracteres) *';
        passGroup.style.opacity = '1';
    }

    // Limpiar errores
    ['u-nombre-err','u-email-err','u-pass-err'].forEach(id =>
        document.getElementById(id)?.classList.remove('show')
    );

    openModal('modal-usuario');
}

// ─────────────────────────────────────────
// CREAR / ACTUALIZAR USUARIO
// ─────────────────────────────────────────
async function submitUsuario() {
    const nombre = document.getElementById('u-nombre').value.trim();
    const email  = document.getElementById('u-email').value.trim();
    const rol    = document.getElementById('u-rol').value;
    const dep    = document.getElementById('u-dep').value;
    const pass   = document.getElementById('u-pass').value;
    const client = getSupabaseClient();

    let valid = true;

    if (!nombre) {
        document.getElementById('u-nombre-err').classList.add('show'); valid = false;
    } else {
        document.getElementById('u-nombre-err').classList.remove('show');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('u-email-err').classList.add('show'); valid = false;
    } else {
        document.getElementById('u-email-err').classList.remove('show');
    }
    if (!editingUserId && pass.length < 6) {
        document.getElementById('u-pass-err').classList.add('show'); valid = false;
    } else {
        document.getElementById('u-pass-err').classList.remove('show');
    }
    if (!valid) return;

    showLoading(true);
    try {
        if (editingUserId) {
            // ── EDITAR usuario existente ──
            const updates = { nombre, email, rol, departamento: dep };
            const { error: dbErr } = await client
                .from('usuarios').update(updates).eq('id', editingUserId);
            if (dbErr) throw dbErr;

            // Actualizar caché local
            const idx = (window.gUsers || []).findIndex(u => u.id === editingUserId);
            if (idx !== -1) Object.assign(window.gUsers[idx], updates);

            toast(`Usuario ${nombre} actualizado.`, 'success');
        } else {
            // ── CREAR nuevo usuario en Auth + tabla usuarios ──
            const { data: authData, error: authErr } = await client.auth.signUp({
                email, password: pass,
                options: { data: { nombre, rol, departamento: dep } }
            });
            if (authErr) throw authErr;

            const perfil = {
                id: authData.user.id,
                nombre, email, rol,
                departamento: dep,
                created_at: new Date().toISOString()
            };
            const { error: dbErr } = await client.from('usuarios').insert(perfil);
            if (dbErr) throw dbErr;

            window.gUsers = window.gUsers || [];
            window.gUsers.push(perfil);
            toast(`Usuario ${nombre} creado. Se enviará un correo de confirmación.`, 'success');
        }

        closeModal('modal-usuario');
        renderUsers();
        if (typeof buildNav === 'function') buildNav();

    } catch(e) {
        console.error('Error al guardar usuario:', e);
        if (e.message?.includes('already registered') || e.message?.includes('already been registered')) {
            document.getElementById('u-email-err').textContent = 'Este correo ya está registrado.';
            document.getElementById('u-email-err').classList.add('show');
        } else {
            toast('Error: ' + e.message, 'error');
        }
    } finally { showLoading(false); }
}

// ─────────────────────────────────────────
// ELIMINAR USUARIO
// ─────────────────────────────────────────
let usuarioAEliminarId = null;

function abrirConfirmarEliminar(userId) {
    usuarioAEliminarId = userId;
    const u = (window.gUsers || []).find(x => x.id === userId);
    document.getElementById('eliminar-usuario-desc').innerHTML =
        `¿Estás seguro de que deseas eliminar al usuario <strong>${u?.nombre || userId}</strong>?`;
    openModal('modal-eliminar-usuario');
}

async function confirmarEliminarUsuario() {
    if (!usuarioAEliminarId) return;
    const client = getSupabaseClient();
    showLoading(true);
    try {
        const { error } = await client
            .from('usuarios').delete().eq('id', usuarioAEliminarId);
        if (error) throw error;

        window.gUsers = (window.gUsers || []).filter(u => u.id !== usuarioAEliminarId);
        toast('Usuario eliminado correctamente.', 'success');
        closeModal('modal-eliminar-usuario');
        renderUsers();
        if (typeof buildNav === 'function') buildNav();
    } catch(e) {
        console.error('Error al eliminar usuario:', e);
        toast('Error al eliminar: ' + e.message, 'error');
    } finally {
        showLoading(false);
        usuarioAEliminarId = null;
    }
}

// Exponer funciones globalmente
window.renderUsers           = renderUsers;
window.filtrarUsuarios       = filtrarUsuarios;
window.abrirModalUsuario     = abrirModalUsuario;
window.submitUsuario         = submitUsuario;
window.abrirConfirmarEliminar = abrirConfirmarEliminar;
window.confirmarEliminarUsuario = confirmarEliminarUsuario;
