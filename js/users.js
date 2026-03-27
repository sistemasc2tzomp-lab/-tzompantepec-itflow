// ══════════════════════════════════════════
// USUARIOS — CRUD completo + responsive
// ══════════════════════════════════════════

let editingUserId = null;
let usuarioAEliminarId = null;

async function renderUsers() {
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
