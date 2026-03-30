// ══════════════════════════════════════════
// DEPARTAMENTOS — CRUD + Responsables
// Responsive para móvil, tablet y escritorio
// ══════════════════════════════════════════

let editingDeptoId = null;
let deptoAEliminarId = null;

async function renderDepartamentos() {
    const el = document.getElementById('view-departamentos');
    if (!el) return;

    let deptos = [];
    const client = getSupabaseClient();
    if (client) {
        const { data, error } = await client
            .from('departamentos').select('*').order('nombre');
        if (!error) deptos = data || [];
    }
    window.gDepartamentos = deptos;

    // Obtener lista de responsables (usuarios) para el select
    const usuarios = window.gUsers || [];

    el.innerHTML = `
    <style>
    .dep-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;margin-top:14px}
    .dep-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:box-shadow .15s}
    .dep-card:hover{box-shadow:0 3px 14px rgba(0,0,0,.09)}
    .dep-card-top{padding:14px 16px 10px;border-bottom:1px solid var(--border)}
    .dep-card-body{padding:12px 16px}
    .dep-stat{display:flex;flex-direction:column;align-items:center;background:var(--surface2);border-radius:8px;padding:8px 12px;flex:1;min-width:0}
    .dep-stat-val{font-size:1.2rem;font-weight:700;line-height:1}
    .dep-stat-lbl{font-size:.65rem;color:var(--text3);margin-top:3px;text-align:center}
    .dep-info-row{display:flex;align-items:flex-start;gap:7px;font-size:.78rem;color:var(--text2);margin-bottom:6px}
    .dep-actions{display:flex;gap:6px;padding:10px 16px;border-top:1px solid var(--border);background:var(--surface2)}
    .dep-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}
    @media(max-width:600px){
        .dep-grid{grid-template-columns:1fr}
        .dep-toolbar{flex-direction:column;align-items:stretch}
    }
    .d-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    @media(max-width:500px){.d-form-row{grid-template-columns:1fr}}

    /* Sección de responsables */
    .resp-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:10px;display:flex;align-items:center;gap:10px}
    .resp-avatar{width:36px;height:36px;border-radius:50%;background:#e8f5ee;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:#1a5c38;flex-shrink:0}
    </style>

    <!-- Tabs: Departamentos / Responsables -->
    <div style="display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid var(--border)">
        <button id="tab-deptos" onclick="switchDeptoTab('deptos')"
            style="padding:8px 18px;font-size:.85rem;font-weight:600;background:none;border:none;border-bottom:2px solid var(--verde,#1a5c38);margin-bottom:-2px;color:var(--verde,#1a5c38);cursor:pointer">
            Departamentos
        </button>
        <button id="tab-responsables" onclick="switchDeptoTab('responsables')"
            style="padding:8px 18px;font-size:.85rem;font-weight:500;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--text2);cursor:pointer">
            Responsables
        </button>
    </div>

    <!-- PANEL DEPARTAMENTOS -->
    <div id="panel-deptos">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px">
            <p style="font-size:.8rem;color:var(--text2);margin:0">${deptos.length} departamento(s) registrado(s)</p>
            ${isAdmin()?`<button class="btn btn-primary btn-sm" onclick="abrirModalDepto(null)">+ Nuevo departamento</button>`:''}
        </div>
        <div class="dep-toolbar">
            <div class="search-wrap" style="flex:1;min-width:180px;max-width:340px">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="search" id="depto-search" placeholder="Buscar departamento..." oninput="filtrarDeptos(this.value)"/>
            </div>
        </div>
        <div class="dep-grid" id="deptos-grid">${renderDeptosCards(deptos)}</div>
    </div>

    <!-- PANEL RESPONSABLES -->
    <div id="panel-responsables" style="display:none">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px">
            <p style="font-size:.8rem;color:var(--text2);margin:0">Asigna un responsable a cada departamento</p>
        </div>
        <div id="responsables-list">${renderResponsablesList(deptos, usuarios)}</div>
    </div>

    <!-- MODAL CREAR/EDITAR DEPARTAMENTO -->
    <div class="modal-overlay" id="modal-depto" role="dialog" aria-modal="true">
        <div class="modal" style="max-width:540px;width:95vw">
            <div class="modal-header">
                <h3 id="modal-depto-title">Nuevo departamento</h3>
                <button class="modal-close" onclick="closeModal('modal-depto')">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="d-nombre">Nombre del departamento *</label>
                    <input type="text" id="d-nombre" placeholder="Ej. Tesorería Municipal"/>
                    <div class="form-error" id="d-nombre-err">El nombre es obligatorio.</div>
                </div>
                <div class="form-group">
                    <label for="d-desc">Descripción</label>
                    <textarea id="d-desc" rows="2" style="resize:vertical" placeholder="Funciones principales..."></textarea>
                </div>
                <div class="d-form-row">
                    <div class="form-group">
                        <label for="d-responsable">Responsable / Titular</label>
                        <select id="d-responsable">
                            <option value="">— Sin responsable —</option>
                            ${usuarios.map(u=>`<option value="${u.id}">${u.nombre}${u.cargo?' — '+u.cargo:''}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="d-extension">Extensión telefónica</label>
                        <input type="text" id="d-extension" placeholder="Ej. 101"/>
                    </div>
                </div>
                <div class="d-form-row">
                    <div class="form-group">
                        <label for="d-ubicacion">Ubicación / Edificio</label>
                        <input type="text" id="d-ubicacion" placeholder="Ej. Palacio Municipal, 2do piso"/>
                    </div>
                    <div class="form-group">
                        <label for="d-email">Correo del departamento</label>
                        <input type="email" id="d-email" placeholder="depto@tzompantepec.gob.mx"/>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-depto')">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="d-submit-btn" onclick="submitDepto()">Crear departamento</button>
            </div>
        </div>
    </div>

    <!-- MODAL ASIGNAR RESPONSABLE -->
    <div class="modal-overlay" id="modal-responsable" role="dialog" aria-modal="true">
        <div class="modal" style="max-width:420px;width:95vw">
            <div class="modal-header">
                <h3>Asignar responsable</h3>
                <button class="modal-close" onclick="closeModal('modal-responsable')">✕</button>
            </div>
            <div class="modal-body">
                <p style="font-size:.85rem;color:var(--text2);margin-bottom:12px" id="resp-depto-nombre"></p>
                <div class="form-group">
                    <label for="resp-usuario">Seleccionar responsable</label>
                    <select id="resp-usuario">
                        <option value="">— Sin responsable —</option>
                        ${usuarios.map(u=>`<option value="${u.id}">${u.nombre}${u.departamento?' ('+u.departamento+')':''}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="resp-cargo">Cargo en el departamento</label>
                    <input type="text" id="resp-cargo" placeholder="Ej. Director, Jefe de área"/>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-responsable')">Cancelar</button>
                <button class="btn btn-primary btn-sm" onclick="guardarResponsable()">Guardar</button>
            </div>
        </div>
    </div>

    <!-- MODAL ELIMINAR DEPARTAMENTO -->
    <div class="modal-overlay" id="modal-eliminar-depto" role="dialog" aria-modal="true">
        <div class="modal" style="max-width:420px;width:95vw">
            <div class="modal-header">
                <h3>Eliminar departamento</h3>
                <button class="modal-close" onclick="closeModal('modal-eliminar-depto')">✕</button>
            </div>
            <div class="modal-body">
                <p style="color:var(--text2);font-size:.88rem" id="eliminar-depto-desc"></p>
                <div style="background:#fff1f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-top:12px;font-size:.8rem;color:#b91c1c">
                    ⚠ Los tickets asociados no se eliminarán.
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-eliminar-depto')">Cancelar</button>
                <button class="btn btn-sm" style="background:#dc2626;color:#fff;border:none;border-radius:7px;padding:7px 16px;cursor:pointer"
                    onclick="confirmarEliminarDepto()">Sí, eliminar</button>
            </div>
        </div>
    </div>`;
}

// ─────────────────────────────────────────
// TARJETAS DE DEPARTAMENTOS
// ─────────────────────────────────────────
function renderDeptosCards(deptos) {
    if (!deptos.length) return `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3)">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="opacity:.2;margin:0 auto 10px;display:block">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
            </svg>
            <p style="font-size:.88rem">Sin departamentos registrados.</p>
            ${isAdmin()?`<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="abrirModalDepto(null)">+ Agregar el primero</button>`:''}
        </div>`;

    const COLORES = [
        {top:'#1a5c38',light:'#e8f5ee'},{top:'#1d4ed8',light:'#eff6ff'},
        {top:'#7c3aed',light:'#f5f3ff'},{top:'#b45309',light:'#fefce8'},
        {top:'#be123c',light:'#fff1f2'},{top:'#0e7490',light:'#ecfeff'},
        {top:'#15803d',light:'#f0fdf4'},{top:'#6d28d9',light:'#ede9fe'},
        {top:'#c2410c',light:'#fff7ed'}
    ];

    return deptos.map((d, i) => {
        const c = COLORES[i % COLORES.length];
        const responsable = (window.gUsers||[]).find(u => u.id === d.responsable_id);
        const ticketsTotal  = (window.gTickets||[]).filter(t=>t.departamento===d.nombre).length;
        const ticketsActivos = (window.gTickets||[]).filter(t=>t.departamento===d.nombre&&!['cerrado','cancelado'].includes(t.status)).length;

        return `
        <div class="dep-card">
            <div class="dep-card-top" style="background:${c.light}">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
                        <div style="width:36px;height:36px;border-radius:9px;background:${c.top};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                        </div>
                        <div style="min-width:0">
                            <div style="font-weight:700;font-size:.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.nombre}</div>
                            ${d.ubicacion?`<div style="font-size:.7rem;color:var(--text3);margin-top:1px">📍 ${d.ubicacion}</div>`:''}
                        </div>
                    </div>
                    ${isAdmin()?`
                    <div style="display:flex;gap:4px;flex-shrink:0">
                        <button class="btn btn-xs btn-secondary" onclick="abrirModalDepto('${d.id}')" title="Editar" style="padding:4px 7px;font-size:.72rem">✏️</button>
                        <button class="btn btn-xs" onclick="abrirConfirmarEliminarDepto('${d.id}')" title="Eliminar"
                            style="padding:4px 7px;font-size:.72rem;background:#fef2f2;color:#dc2626;border:1px solid #fecaca">🗑</button>
                    </div>`:''}
                </div>
            </div>
            <div class="dep-card-body">
                ${d.descripcion?`<p style="font-size:.78rem;color:var(--text2);margin-bottom:10px;line-height:1.5">${d.descripcion}</p>`:''}

                <!-- Stats -->
                <div style="display:flex;gap:8px;margin-bottom:12px">
                    <div class="dep-stat">
                        <span class="dep-stat-val" style="color:${c.top}">${ticketsTotal}</span>
                        <span class="dep-stat-lbl">Total tickets</span>
                    </div>
                    <div class="dep-stat">
                        <span class="dep-stat-val" style="color:#d97706">${ticketsActivos}</span>
                        <span class="dep-stat-lbl">Activos</span>
                    </div>
                    <div class="dep-stat">
                        <span class="dep-stat-val" style="color:#16a34a">${ticketsTotal-ticketsActivos}</span>
                        <span class="dep-stat-lbl">Cerrados</span>
                    </div>
                </div>

                <!-- Info -->
                <div style="display:flex;flex-direction:column;gap:5px">
                    <div class="dep-info-row">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="flex-shrink:0;color:${c.top}"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        <span style="font-weight:500">Responsable:</span>
                        <span>${responsable?responsable.nombre:'<em style="color:var(--text3)">Sin asignar</em>'}</span>
                        ${isAdmin()?`<button onclick="abrirModalResponsable('${d.id}')"
                            style="margin-left:auto;font-size:.68rem;color:${c.top};background:none;border:none;cursor:pointer;padding:0;flex-shrink:0">
                            ${responsable?'Cambiar':'+ Asignar'}
                        </button>`:''}
                    </div>
                    ${d.extension?`<div class="dep-info-row">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1"/></svg>
                        <span>Ext. ${d.extension}</span></div>`:''}
                    ${d.email_depto?`<div class="dep-info-row">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.email_depto}</span></div>`:''}
                </div>
            </div>
        </div>`;
    }).join('');
}

// ─────────────────────────────────────────
// PANEL DE RESPONSABLES
// ─────────────────────────────────────────
function renderResponsablesList(deptos, usuarios) {
    if (!deptos.length) return `<p style="color:var(--text3);font-size:.85rem;text-align:center;padding:30px">Primero crea departamentos para asignar responsables.</p>`;

    return deptos.map(d => {
        const resp = usuarios.find(u => u.id === d.responsable_id);
        const ini  = resp ? resp.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?';
        return `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:200px">
                <div style="width:36px;height:36px;border-radius:8px;background:#e8f5ee;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:#1a5c38;flex-shrink:0">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#1a5c38" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m5-5h4"/></svg>
                </div>
                <div>
                    <div style="font-weight:600;font-size:.88rem">${d.nombre}</div>
                    ${d.ubicacion?`<div style="font-size:.72rem;color:var(--text3)">${d.ubicacion}</div>`:''}
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:160px">
                ${resp?`
                <div style="width:32px;height:32px;border-radius:50%;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#1d4ed8;flex-shrink:0">${ini}</div>
                <div>
                    <div style="font-size:.85rem;font-weight:600">${resp.nombre}</div>
                    <div style="font-size:.72rem;color:var(--text3)">${resp.cargo||resp.rol||'—'}</div>
                </div>
                `:`<span style="font-size:.82rem;color:var(--text3);font-style:italic">Sin responsable asignado</span>`}
            </div>
            ${isAdmin()?`
            <button class="btn btn-sm btn-secondary" onclick="abrirModalResponsable('${d.id}')" style="font-size:.78rem;flex-shrink:0">
                ${resp?'✏️ Cambiar':'+ Asignar'}
            </button>`:''}
        </div>`;
    }).join('');
}

// ─────────────────────────────────────────
// TABS
// ─────────────────────────────────────────
function switchDeptoTab(tab) {
    document.getElementById('panel-deptos').style.display      = tab==='deptos'      ? '' : 'none';
    document.getElementById('panel-responsables').style.display = tab==='responsables' ? '' : 'none';
    document.getElementById('tab-deptos').style.cssText         = tab==='deptos'
        ? 'padding:8px 18px;font-size:.85rem;font-weight:600;background:none;border:none;border-bottom:2px solid var(--verde,#1a5c38);margin-bottom:-2px;color:var(--verde,#1a5c38);cursor:pointer'
        : 'padding:8px 18px;font-size:.85rem;font-weight:500;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--text2);cursor:pointer';
    document.getElementById('tab-responsables').style.cssText   = tab==='responsables'
        ? 'padding:8px 18px;font-size:.85rem;font-weight:600;background:none;border:none;border-bottom:2px solid var(--verde,#1a5c38);margin-bottom:-2px;color:var(--verde,#1a5c38);cursor:pointer'
        : 'padding:8px 18px;font-size:.85rem;font-weight:500;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--text2);cursor:pointer';
}

// ─────────────────────────────────────────
// CRUD DEPARTAMENTOS
// ─────────────────────────────────────────
function filtrarDeptos(q) {
    const texto = (q||'').toLowerCase();
    const lista = (window.gDepartamentos||[]).filter(d=>
        (d.nombre||'').toLowerCase().includes(texto)||
        (d.descripcion||'').toLowerCase().includes(texto)||
        (d.ubicacion||'').toLowerCase().includes(texto)
    );
    const g = document.getElementById('deptos-grid');
    if (g) g.innerHTML = renderDeptosCards(lista);
}

function abrirModalDepto(deptoId) {
    editingDeptoId = deptoId;
    const d = deptoId?(window.gDepartamentos||[]).find(x=>x.id===deptoId):null;
    document.getElementById('modal-depto-title').textContent = d?'Editar departamento':'Nuevo departamento';
    document.getElementById('d-submit-btn').textContent = d?'Guardar cambios':'Crear departamento';
    document.getElementById('d-nombre').value      = d?.nombre       ||'';
    document.getElementById('d-desc').value        = d?.descripcion  ||'';
    document.getElementById('d-responsable').value = d?.responsable_id||'';
    document.getElementById('d-extension').value   = d?.extension    ||'';
    document.getElementById('d-ubicacion').value   = d?.ubicacion    ||'';
    document.getElementById('d-email').value       = d?.email_depto  ||'';
    document.getElementById('d-nombre-err')?.classList.remove('show');
    openModal('modal-depto');
}

async function submitDepto() {
    const nombre      = document.getElementById('d-nombre').value.trim();
    const descripcion = document.getElementById('d-desc').value.trim();
    const responsable = document.getElementById('d-responsable').value||null;
    const extension   = document.getElementById('d-extension').value.trim();
    const ubicacion   = document.getElementById('d-ubicacion').value.trim();
    const email_depto = document.getElementById('d-email').value.trim();
    const client      = getSupabaseClient();
    if (!nombre) { document.getElementById('d-nombre-err').classList.add('show'); return; }
    document.getElementById('d-nombre-err').classList.remove('show');
    showLoading(true);
    try {
        const datos = { nombre, descripcion, responsable_id:responsable, extension, ubicacion, email_depto };
        if (editingDeptoId) {
            const { error } = await client.from('departamentos').update(datos).eq('id', editingDeptoId);
            if (error) throw error;
            const idx = (window.gDepartamentos||[]).findIndex(d=>d.id===editingDeptoId);
            if (idx!==-1) Object.assign(window.gDepartamentos[idx], datos);
            toast(`Departamento "${nombre}" actualizado.`,'success');
        } else {
            const { data:nuevo, error } = await client.from('departamentos')
                .insert({...datos, created_at:new Date().toISOString()}).select().single();
            if (error) throw error;
            (window.gDepartamentos=window.gDepartamentos||[]).push(nuevo);
            toast(`Departamento "${nombre}" creado.`,'success');
        }
        closeModal('modal-depto');
        renderDepartamentos();
    } catch(e) { toast('Error: '+e.message,'error'); }
    finally { showLoading(false); }
}

function abrirConfirmarEliminarDepto(deptoId) {
    deptoAEliminarId = deptoId;
    const d = (window.gDepartamentos||[]).find(x=>x.id===deptoId);
    document.getElementById('eliminar-depto-desc').innerHTML = `¿Eliminar el departamento <strong>${d?.nombre||deptoId}</strong>?`;
    openModal('modal-eliminar-depto');
}

async function confirmarEliminarDepto() {
    if (!deptoAEliminarId) return;
    showLoading(true);
    try {
        const { error } = await getSupabaseClient().from('departamentos').delete().eq('id', deptoAEliminarId);
        if (error) throw error;
        window.gDepartamentos = (window.gDepartamentos||[]).filter(d=>d.id!==deptoAEliminarId);
        toast('Departamento eliminado.','success');
        closeModal('modal-eliminar-depto');
        renderDepartamentos();
    } catch(e) { toast('Error: '+e.message,'error'); }
    finally { showLoading(false); deptoAEliminarId=null; }
}

// ─────────────────────────────────────────
// ASIGNAR RESPONSABLE
// ─────────────────────────────────────────
let asignandoDeptoId = null;

function abrirModalResponsable(deptoId) {
    asignandoDeptoId = deptoId;
    const d = (window.gDepartamentos||[]).find(x=>x.id===deptoId);
    document.getElementById('resp-depto-nombre').textContent = `Departamento: ${d?.nombre||''}`;
    document.getElementById('resp-usuario').value = d?.responsable_id||'';
    document.getElementById('resp-cargo').value   = '';
    const resp = (window.gUsers||[]).find(u=>u.id===d?.responsable_id);
    if (resp) document.getElementById('resp-cargo').value = resp.cargo||'';
    openModal('modal-responsable');
}

async function guardarResponsable() {
    if (!asignandoDeptoId) return;
    const userId = document.getElementById('resp-usuario').value||null;
    const cargo  = document.getElementById('resp-cargo').value.trim();
    const client = getSupabaseClient();
    showLoading(true);
    try {
        // Actualizar departamento con responsable
        const { error:depErr } = await client.from('departamentos')
            .update({ responsable_id: userId }).eq('id', asignandoDeptoId);
        if (depErr) throw depErr;

        // Si hay un usuario seleccionado y tiene cargo, actualizar su cargo también
        if (userId && cargo) {
            await client.from('usuarios').update({ cargo }).eq('id', userId);
            const idx = (window.gUsers||[]).findIndex(u=>u.id===userId);
            if (idx!==-1) window.gUsers[idx].cargo = cargo;
        }

        const idx = (window.gDepartamentos||[]).findIndex(d=>d.id===asignandoDeptoId);
        if (idx!==-1) window.gDepartamentos[idx].responsable_id = userId;

        toast('Responsable asignado correctamente.','success');
        closeModal('modal-responsable');
        renderDepartamentos();
    } catch(e) { toast('Error: '+e.message,'error'); }
    finally { showLoading(false); asignandoDeptoId=null; }
}

// Exponer globalmente
window.renderDepartamentos        = renderDepartamentos;
window.switchDeptoTab             = switchDeptoTab;
window.filtrarDeptos              = filtrarDeptos;
window.abrirModalDepto            = abrirModalDepto;
window.submitDepto                = submitDepto;
window.abrirConfirmarEliminarDepto = abrirConfirmarEliminarDepto;
window.confirmarEliminarDepto     = confirmarEliminarDepto;
window.abrirModalResponsable      = abrirModalResponsable;
window.guardarResponsable         = guardarResponsable;
