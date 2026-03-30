<<<<<<< HEAD
// ══════════════════════════════════════════════════════════════
// USERS MODULE - GESTIÓN DE USUARIOS DEL SISTEMA
// ══════════════════════════════════════════════════════════

// Cache global para usuarios
window.cachedUsers = [];

// Renderizar tarjeta de usuario
function renderUserCard(user, tickets = []) {
    const userTickets = tickets.filter(t => t.solicitante_id === user.id || t.asignado_id === user.id);
    const ticketCount = userTickets.length;
    
    return `
        <div class="usr-card">
            <div class="usr-avatar">${user.nombre.charAt(0).toUpperCase()}</div>
            <div class="usr-info">
                <div class="usr-name">${user.nombre}</div>
                <div class="usr-email">${user.email}</div>
                <div class="usr-badge ${user.rol === 'admin' ? 'usr-admin' : 'usr-user'}">${user.rol}</div>
                <div class="usr-info-row">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    ${ticketCount} ${ticketCount === 1 ? 'ticket' : 'tickets'}
                </div>
                <div class="usr-info-row">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h-4"/></svg>
                    ${user.departamento || 'Sin departamento'}
                </div>
            </div>
            <div class="usr-actions">
                <button class="btn btn-sm btn-outline" onclick="editUser('${user.id}')">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-4h-4v4zm0 0l4-4m4 4v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v4z"/></svg>
                    Editar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.id}')">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116 21H8a2 2 0 01-2-2V7a2 2 0 012-2h4l2-2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9l-1.5-1.5m0 0L15 6m0 0l1.5 1.5m0 0L21 9"/></svg>
                    Eliminar
                </button>
            </div>
        </div>
    `;
}
=======
// ══════════════════════════════════════════
// USUARIOS — CRUD completo + responsive
// ══════════════════════════════════════════

let editingUserId = null;
let usuarioAEliminarId = null;
>>>>>>> 6877419d3c8d6b81ab8aa213fba1b0362f5316f1

// Renderizar lista de usuarios
function renderUsersCards(users) {
    if (!users || users.length === 0) {
        return '<p style="text-align:center;color:var(--text2);padding:40px">No hay usuarios registrados</p>';
    }
    
    return users.map(user => renderUserCard(user)).join('');
}

// Renderizar módulo de usuarios
async function renderUsers() {
<<<<<<< HEAD
    if (!isAdmin()) {
        toast('Acceso no autorizado', 'error');
        navigate('dashboard');
        return;
    }

    const el = document.getElementById('view-users');
    if (!el) return;

    showLoading();

    try {
        const users = await loadUsers();
        const tickets = await loadTickets();
        
        // Actualizar cache global
        window.cachedUsers = users || [];
        
        el.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
                <h2 style="font-family:var(--font-display);font-size:1.4rem;color:var(--verde);margin:0">Usuarios</h2>
                <button class="btn btn-success btn-sm" onclick="openModal('modal-create-user')">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Nuevo usuario
                </button>
            </div>
            <p class="section-sub">Gestión de usuarios del sistema municipal</p>
            <div class="users-grid" id="users-grid">
                ${renderUsersCards(window.cachedUsers)}
            </div>`;
        
        hideLoading();
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        toast('Error al cargar usuarios: ' + error.message, 'error');
        hideLoading();
    }
}

// Abrir modal para crear/editar usuario
function openModal(userId = null) {
    const modal = document.getElementById('modal-usuario');
    const title = document.getElementById('modal-usuario-title');
    const form = document.getElementById('form-usuario');
    
    if (!modal || !title || !form) return;
    
    // Resetear formulario
    form.reset();
    
    if (userId) {
        // Modo edición
        title.textContent = 'Editar usuario';
        const user = window.cachedUsers.find(u => u.id === userId);
        if (user) {
            document.getElementById('usr-nombre').value = user.nombre || '';
            document.getElementById('usr-email').value = user.email || '';
            document.getElementById('usr-rol').value = user.rol || 'usuario';
            document.getElementById('usr-departamento').value = user.departamento || '';
        }
    } else {
        // Modo creación
        title.textContent = 'Nuevo usuario';
    }
    
    modal.classList.remove('hidden');
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('modal-usuario');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Enviar formulario
async function submitUser() {
    const form = document.getElementById('form-usuario');
    if (!form) return;
    
    const formData = {
        nombre: document.getElementById('usr-nombre').value.trim(),
        email: document.getElementById('usr-email').value.trim(),
        rol: document.getElementById('usr-rol').value,
        departamento: document.getElementById('usr-departamento').value,
        password: document.getElementById('usr-password').value.trim()
    };
    
    // Validaciones básicas
    if (!formData.nombre) {
        toast('El nombre es obligatorio', 'error');
        return;
    }
    
    if (!formData.email) {
        toast('El email es obligatorio', 'error');
        return;
    }
    
    if (!formData.email.includes('@')) {
        toast('El email no es válido', 'error');
        return;
    }
    
    try {
        showLoading();
        
        if (window.supabaseClient) {
            // Crear en Supabase Auth
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: formData.email,
                password: formData.password || 'temp123',
                options: {
                    data: {
                        nombre: formData.nombre,
                        rol: formData.rol,
                        departamento: formData.departamento
                    }
                }
            });
            
            if (error) {
                throw error;
            }
            
            // Crear perfil en tabla usuarios
            const { error: profileError } = await window.supabaseClient
                .from('usuarios')
                .insert([{
                    id: data.user.id,
                    email: formData.email,
                    nombre: formData.nombre,
                    rol: formData.rol,
                    departamento: formData.departamento,
                    created_at: new Date().toISOString()
                }]);
            
            if (profileError) {
                throw profileError;
            }
            
            toast('Usuario creado correctamente', 'success');
            closeModal();
            await renderUsers();
            
        } else {
            toast('No hay conexión a Supabase', 'error');
        }
        
    } catch (error) {
        console.error('Error creando usuario:', error);
        toast('Error al crear usuario: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Editar usuario
function editUser(userId) {
    openModal(userId);
}

// Eliminar usuario
async function deleteUser(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) {
        return;
    }
    
    try {
        showLoading();
        
        if (window.supabaseClient) {
            const { error } = await window.supabaseClient
                .from('usuarios')
                .delete()
                .eq('id', userId);
            
            if (error) {
                throw error;
            }
            
            toast('Usuario eliminado correctamente', 'success');
            await renderUsers();
            
        } else {
            toast('No hay conexión a Supabase', 'error');
        }
        
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        toast('Error al eliminar usuario: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Exportar funciones globalmente
window.renderUsers = renderUsers;
window.openModal = openModal;
window.closeModal = closeModal;
window.submitUser = submitUser;
window.editUser = editUser;
window.deleteUser = deleteUser;

console.log('👥 Módulo de usuarios cargado');
=======
    const el = document.getElementById('view-users');
    if (!el) return;
    const usuarios = window.gUsers || [];

    el.innerHTML = `
    <style>
    .usr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px;margin-top:14px}
    .usr-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;transition:box-shadow .15s}
    .usr-card:hover{box-shadow:0 2px 14px rgba(0,0,0,.08)}
    .usr-avatar{width:42px;height:42px;border-radius:50%;background:#e8f5ee;display:flex;align-items:center;justify-content:center;font-size:.82rem;font-weight:700;color:#1a5c38;flex-shrink:0}
    .usr-badge{display:inline-block;padding:2px 9px;border-radius:20px;font-size:.7rem;font-weight:600}
    .usr-info-row{display:flex;align-items:center;gap:5px;font-size:.76rem;color:var(--text2);margin-top:4px}
    .usr-actions{display:flex;gap:6px;margin-top:12px;padding-top:10px;border-top:1px solid var(--border)}
    .usr-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}
    @media(max-width:600px){
        .usr-grid{grid-template-columns:1fr}
        .usr-toolbar{flex-direction:column;align-items:stretch}
    }
    .u-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    @media(max-width:500px){.u-form-row{grid-template-columns:1fr}}
    </style>

    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div>
            <h2 style="font-size:1.05rem;font-weight:700;margin:0;color:var(--text)">Usuarios del sistema</h2>
            <p style="font-size:.78rem;color:var(--text2);margin:3px 0 0">${usuarios.length} usuario(s) registrado(s)</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="abrirModalUsuario(null)">+ Nuevo usuario</button>
    </div>

    <div class="usr-toolbar">
        <div class="search-wrap" style="flex:1;min-width:180px;max-width:340px">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="search" id="user-search" placeholder="Buscar nombre, correo..." oninput="filtrarUsuarios(this.value)"/>
        </div>
        <select id="user-filter-rol" onchange="filtrarUsuarios(document.getElementById('user-search').value)"
            style="padding:7px 10px;border-radius:8px;border:1px solid var(--border);font-size:.82rem;background:var(--surface);color:var(--text)">
            <option value="todos">Todos los roles</option>
            <option value="admin">Administrador TI</option>
            <option value="usuario">Usuario</option>
        </select>
    </div>

    <div class="usr-grid" id="users-grid">${renderUsersCards(usuarios)}</div>

    <!-- MODAL CREAR/EDITAR USUARIO -->
    <div class="modal-overlay" id="modal-usuario" role="dialog" aria-modal="true">
        <div class="modal" style="max-width:520px;width:95vw">
            <div class="modal-header">
                <h3 id="modal-usuario-title">Nuevo usuario</h3>
                <button class="modal-close" onclick="closeModal('modal-usuario')">✕</button>
            </div>
            <div class="modal-body">
                <div class="u-form-row">
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
                <div class="u-form-row">
                    <div class="form-group">
                        <label for="u-dep">Departamento</label>
                        <select id="u-dep">
                            <option value="">— Sin departamento —</option>
                            <option>Presidencia Municipal</option><option>Tesorería</option>
                            <option>Administración</option><option>Obras Públicas</option>
                            <option>Seguridad Pública</option><option>Registro Civil</option>
                            <option>Servicios Municipales</option><option>Contraloría</option>
                            <option>TI / Sistemas</option><option>Otro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="u-cargo">Cargo / Puesto</label>
                        <input type="text" id="u-cargo" placeholder="Ej. Jefe de área"/>
                    </div>
                </div>
                <div class="form-group">
                    <label for="u-telefono">Teléfono / Extensión</label>
                    <input type="text" id="u-telefono" placeholder="Ej. 246-123-4567 ext. 101"/>
                </div>
                <div class="form-group">
                    <label for="u-pass">
                        Contraseña
                        <span id="u-pass-label" style="font-weight:400;color:var(--text3);font-size:.8rem"> (mínimo 6 caracteres) *</span>
                    </label>
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

    <!-- MODAL ELIMINAR USUARIO -->
    <div class="modal-overlay" id="modal-eliminar-usuario" role="dialog" aria-modal="true">
        <div class="modal" style="max-width:420px;width:95vw">
            <div class="modal-header">
                <h3>Eliminar usuario</h3>
                <button class="modal-close" onclick="closeModal('modal-eliminar-usuario')">✕</button>
            </div>
            <div class="modal-body">
                <p style="color:var(--text2);font-size:.88rem" id="eliminar-usuario-desc"></p>
                <div style="background:#fff1f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-top:12px;font-size:.8rem;color:#b91c1c">
                    ⚠ Esta acción no se puede deshacer. Los tickets del usuario no se eliminarán.
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-eliminar-usuario')">Cancelar</button>
                <button class="btn btn-sm" style="background:#dc2626;color:#fff;border:none;border-radius:7px;padding:7px 16px;cursor:pointer"
                    onclick="confirmarEliminarUsuario()">Sí, eliminar</button>
            </div>
        </div>
    </div>`;
}

function renderUsersCards(usuarios) {
    if (!usuarios.length) return `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3)">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="opacity:.2;margin:0 auto 10px;display:block">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p>Sin usuarios registrados.</p>
        </div>`;

    return usuarios.map(u => {
        const ini     = (u.nombre||'U').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
        const esAdmin = u.rol === 'admin';
        const esSelf  = u.id === currentUser?.id;
        const ticks   = (window.gTickets||[]).filter(t=>t.solicitante_id===u.id).length;
        return `
        <div class="usr-card">
            <div style="display:flex;align-items:flex-start;gap:11px">
                <div class="usr-avatar">${ini}</div>
                <div style="flex:1;min-width:0">
                    <div style="font-weight:700;font-size:.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                        ${u.nombre||'—'} ${esSelf?'<span style="font-size:.65rem;color:#1a5c38">(tú)</span>':''}
                    </div>
                    <span class="usr-badge" style="background:${esAdmin?'#e8f5ee':'#eff6ff'};color:${esAdmin?'#1a5c38':'#1d4ed8'};margin-top:3px;display:inline-block">
                        ${esAdmin?'Administrador TI':'Usuario'}
                    </span>
                </div>
            </div>
            <div style="margin-top:10px">
                <div class="usr-info-row">
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u.email||'—'}</span>
                </div>
                ${u.departamento?`<div class="usr-info-row">
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg>
                    <span>${u.departamento}</span></div>`:''}
                ${u.cargo?`<div class="usr-info-row">
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01"/></svg>
                    <span>${u.cargo}</span></div>`:''}
                ${u.telefono?`<div class="usr-info-row">
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    <span>${u.telefono}</span></div>`:''}
                <div class="usr-info-row">
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <span>${ticks} ticket(s)</span>
                </div>
            </div>
            <div class="usr-actions">
                <button class="btn btn-sm btn-secondary" style="flex:1;font-size:.78rem" onclick="abrirModalUsuario('${u.id}')">✏️ Editar</button>
                ${!esSelf?`<button class="btn btn-sm" style="flex:1;font-size:.78rem;background:#fef2f2;color:#dc2626;border:1px solid #fecaca" onclick="abrirConfirmarEliminarU('${u.id}')">🗑 Eliminar</button>`:''}
            </div>
        </div>`;
    }).join('');
}

function filtrarUsuarios(q) {
    const texto = (q||'').toLowerCase();
    const rol   = document.getElementById('user-filter-rol')?.value||'todos';
    let lista   = window.gUsers||[];
    if (texto) lista = lista.filter(u=>(u.nombre||'').toLowerCase().includes(texto)||(u.email||'').toLowerCase().includes(texto)||(u.departamento||'').toLowerCase().includes(texto));
    if (rol!=='todos') lista = lista.filter(u=>u.rol===rol);
    const g = document.getElementById('users-grid');
    if (g) g.innerHTML = renderUsersCards(lista);
}

function abrirModalUsuario(userId) {
    editingUserId = userId;
    const u = userId?(window.gUsers||[]).find(x=>x.id===userId):null;
    document.getElementById('modal-usuario-title').textContent = u?'Editar usuario':'Nuevo usuario';
    document.getElementById('u-submit-btn').textContent = u?'Guardar cambios':'Crear usuario';
    document.getElementById('u-nombre').value   = u?.nombre      ||'';
    document.getElementById('u-email').value    = u?.email       ||'';
    document.getElementById('u-rol').value      = u?.rol         ||'usuario';
    document.getElementById('u-dep').value      = u?.departamento||'';
    document.getElementById('u-cargo').value    = u?.cargo       ||'';
    document.getElementById('u-telefono').value = u?.telefono    ||'';
    document.getElementById('u-pass').value     = '';
    document.getElementById('u-pass-label').textContent = u?' (opcional — dejar vacío para no cambiar)':' (mínimo 6 caracteres) *';
    ['u-nombre-err','u-email-err','u-pass-err'].forEach(id=>document.getElementById(id)?.classList.remove('show'));
    openModal('modal-usuario');
}

async function submitUsuario() {
    const nombre=document.getElementById('u-nombre').value.trim();
    const email=document.getElementById('u-email').value.trim();
    const rol=document.getElementById('u-rol').value;
    const dep=document.getElementById('u-dep').value;
    const cargo=document.getElementById('u-cargo').value.trim();
    const tel=document.getElementById('u-telefono').value.trim();
    const pass=document.getElementById('u-pass').value;
    const client=getSupabaseClient();
    let valid=true;
    if(!nombre){document.getElementById('u-nombre-err').classList.add('show');valid=false;}
    else document.getElementById('u-nombre-err').classList.remove('show');
    if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){document.getElementById('u-email-err').classList.add('show');valid=false;}
    else document.getElementById('u-email-err').classList.remove('show');
    if(!editingUserId&&pass.length<6){document.getElementById('u-pass-err').classList.add('show');valid=false;}
    else document.getElementById('u-pass-err').classList.remove('show');
    if(!valid)return;
    showLoading(true);
    try{
        if(editingUserId){
            const updates={nombre,email,rol,departamento:dep,cargo,telefono:tel};
            const{error}=await client.from('usuarios').update(updates).eq('id',editingUserId);
            if(error)throw error;
            const idx=(window.gUsers||[]).findIndex(u=>u.id===editingUserId);
            if(idx!==-1)Object.assign(window.gUsers[idx],updates);
            toast(`Usuario ${nombre} actualizado.`,'success');
        }else{
            const{data:authData,error:authErr}=await client.auth.signUp({email,password:pass,options:{data:{nombre,rol,departamento:dep}}});
            if(authErr)throw authErr;
            const perfil={id:authData.user.id,nombre,email,rol,departamento:dep,cargo,telefono:tel,created_at:new Date().toISOString()};
            const{error:dbErr}=await client.from('usuarios').insert(perfil);
            if(dbErr)throw dbErr;
            (window.gUsers=window.gUsers||[]).push(perfil);
            toast(`Usuario ${nombre} creado.`,'success');
        }
        closeModal('modal-usuario');
        renderUsers();
        if(typeof buildNav==='function')buildNav();
    }catch(e){
        if(e.message?.includes('already')){document.getElementById('u-email-err').textContent='Este correo ya está registrado.';document.getElementById('u-email-err').classList.add('show');}
        else toast('Error: '+e.message,'error');
    }finally{showLoading(false);}
}

function abrirConfirmarEliminarU(userId){
    usuarioAEliminarId=userId;
    const u=(window.gUsers||[]).find(x=>x.id===userId);
    document.getElementById('eliminar-usuario-desc').innerHTML=`¿Eliminar al usuario <strong>${u?.nombre||userId}</strong>?`;
    openModal('modal-eliminar-usuario');
}

async function confirmarEliminarUsuario(){
    if(!usuarioAEliminarId)return;
    showLoading(true);
    try{
        const{error}=await getSupabaseClient().from('usuarios').delete().eq('id',usuarioAEliminarId);
        if(error)throw error;
        window.gUsers=(window.gUsers||[]).filter(u=>u.id!==usuarioAEliminarId);
        toast('Usuario eliminado.','success');
        closeModal('modal-eliminar-usuario');
        renderUsers();
        if(typeof buildNav==='function')buildNav();
    }catch(e){toast('Error: '+e.message,'error');}
    finally{showLoading(false);usuarioAEliminarId=null;}
}

window.renderUsers=renderUsers;
window.filtrarUsuarios=filtrarUsuarios;
window.abrirModalUsuario=abrirModalUsuario;
window.submitUsuario=submitUsuario;
window.abrirConfirmarEliminarU=abrirConfirmarEliminarU;
window.confirmarEliminarUsuario=confirmarEliminarUsuario;
>>>>>>> 6877419d3c8d6b81ab8aa213fba1b0362f5316f1
