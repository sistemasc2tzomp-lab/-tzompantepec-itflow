// ══════════════════════════════════════════
// GESTIÓN DE TICKETS — versión mejorada
// Agrega: múltiples fotos, previsualización,
// galería en detalle, cambio de estado mejorado
// Compatible con supabase.js existente
// ══════════════════════════════════════════

let ticketFilter = { status: 'all', prio: 'all', search: '', page: 1 };
let currentAssignTicketId = null;
let fotosSeleccionadas = []; // arreglo de { file, preview, nombre, tamanio }

// STATUS_META y PRIO_META definidos en app.js — no redeclarar aquí

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function getUserById(userId) {
    return (window.gUsers || []).find(u => u.id === userId) || null;
}
function getUserName(userId) {
    const u = getUserById(userId);
    return u ? u.nombre : '—';
}
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─────────────────────────────────────────
// RENDER PRINCIPAL VISTA TICKETS
// ─────────────────────────────────────────
async function renderTickets() {
    const el = document.getElementById('view-tickets');
    const admins = (window.gUsers || []).filter(u => u.rol === 'admin');

    const adminOptions = isAdmin() ? `
        <select class="filter-select" id="filter-assignee" onchange="onFilterChange()">
            <option value="all">Todos los técnicos</option>
            <option value="unassigned">Sin asignar</option>
            ${admins.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}
        </select>` : '';

    el.innerHTML = `
        <div class="toolbar">
            <div class="search-wrap">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="search" id="ticket-search" placeholder="Buscar por título, ID, departamento..."
                    oninput="onSearchChange(this.value)" aria-label="Buscar"/>
            </div>
            <select class="filter-select" id="filter-status" onchange="onFilterChange()">
                <option value="all">Todos los estados</option>
                ${Object.entries(STATUS_META).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
            </select>
            <select class="filter-select" id="filter-prio" onchange="onFilterChange()">
                <option value="all">Todas las prioridades</option>
                ${Object.entries(PRIO_META).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
            </select>
            ${adminOptions}
        </div>
        <div id="ticket-table-container"></div>
        <div id="pagination-container"></div>`;

    renderTicketTable();
}

function onSearchChange(v) { ticketFilter.search = v; ticketFilter.page = 1; renderTicketTable(); }
function onFilterChange() {
    ticketFilter.status   = document.getElementById('filter-status')?.value   || 'all';
    ticketFilter.prio     = document.getElementById('filter-prio')?.value     || 'all';
    ticketFilter.assignee = isAdmin() ? document.getElementById('filter-assignee')?.value || 'all' : null;
    ticketFilter.page = 1;
    renderTicketTable();
}

function getFilteredTickets() {
    let list = [...(window.gTickets || [])];
    if (!isAdmin()) list = list.filter(t => t.solicitante_id === currentUser.id);
    if (ticketFilter.status !== 'all')  list = list.filter(t => t.status === ticketFilter.status);
    if (ticketFilter.prio   !== 'all')  list = list.filter(t => t.prioridad === ticketFilter.prio);
    if (ticketFilter.assignee && ticketFilter.assignee !== 'all') {
        if (ticketFilter.assignee === 'unassigned') list = list.filter(t => !t.asignado_id);
        else list = list.filter(t => t.asignado_id === ticketFilter.assignee);
    }
    if (ticketFilter.search) {
        const q = ticketFilter.search.toLowerCase();
        list = list.filter(t =>
            (t.titulo||'').toLowerCase().includes(q) ||
            (t.id||'').toLowerCase().includes(q) ||
            (t.departamento||'').toLowerCase().includes(q)
        );
    }
    return list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
}

function renderTicketTable() {
    const PER_PAGE = 10;
    const all   = getFilteredTickets();
    const total = all.length;
    const pages = Math.ceil(total / PER_PAGE) || 1;
    if (ticketFilter.page > pages) ticketFilter.page = pages;

    const slice = all.slice((ticketFilter.page-1)*PER_PAGE, ticketFilter.page*PER_PAGE);
    document.getElementById('ticket-table-container').innerHTML = renderTicketTableInner(slice, isAdmin());

    const pag = document.getElementById('pagination-container');
    if (!pag || pages <= 1) { if (pag) pag.innerHTML = ''; return; }
    let html = `<div class="pagination">`;
    html += `<button class="page-btn" onclick="setPage(${ticketFilter.page-1})" ${ticketFilter.page===1?'disabled':''}>‹</button>`;
    for (let i=1; i<=pages; i++) html += `<button class="page-btn ${i===ticketFilter.page?'active':''}" onclick="setPage(${i})">${i}</button>`;
    html += `<button class="page-btn" onclick="setPage(${ticketFilter.page+1})" ${ticketFilter.page===pages?'disabled':''}>›</button></div>`;
    pag.innerHTML = html;
}

function setPage(p) { ticketFilter.page = p; renderTicketTable(); }

function renderTicketTableInner(tickets, showAdmin) {
    if (!tickets.length) return `
        <div class="table-empty">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="opacity:.2;margin-bottom:10px">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p>No se encontraron tickets.</p>
        </div>`;

    return `<div class="table-wrap"><table class="tickets-table">
        <thead><tr>
            <th>ID</th><th>Título</th><th>Prioridad</th><th>Estado</th>
            ${showAdmin ? '<th>Solicitante</th><th>Asignado</th>' : ''}
            <th>Fotos</th><th>Fecha</th><th>Acciones</th>
        </tr></thead>
        <tbody>
            ${tickets.map(t => {
                const solName  = getUserName(t.solicitante_id);
                const asig     = t.asignado_id ? getUserById(t.asignado_id) : null;
                const asigName = asig ? asig.nombre : null;
                const ini      = asig ? asig.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : null;

                // Contar fotos: imagen_url legacy + fotos_urls array
                const fotosExtra = Array.isArray(t.fotos_urls) ? t.fotos_urls.length : 0;
                const totalFotos = (t.imagen_url ? 1 : 0) + fotosExtra;
                const fotosCell  = totalFotos > 0
                    ? `<span style="font-size:.8rem;color:var(--verde-med);font-weight:500;cursor:pointer"
                         onclick="event.stopPropagation();abrirGaleriaRapida('${t.id}')"
                         title="Ver ${totalFotos} foto(s)">📷 ${totalFotos}</span>`
                    : `<span style="color:var(--text3)">—</span>`;

                return `<tr onclick="openTicketDetail('${t.id}')" tabindex="0"
                    onkeydown="if(event.key==='Enter')openTicketDetail('${t.id}')">
                    <td class="ticket-id-col" style="font-family:var(--font-mono);font-size:.72rem">${t.id}</td>
                    <td class="ticket-title-col">
                        <div style="font-weight:500">${t.titulo}</div>
                        <div class="ticket-subtitle">${t.categoria||''}${t.departamento?' · '+t.departamento:''}</div>
                    </td>
                    <td><span class="badge badge-${t.prioridad}">${PRIO_META[t.prioridad]?.label||t.prioridad}</span></td>
                    <td><span class="badge badge-${t.status}">${STATUS_META[t.status]?.label||t.status}</span></td>
                    ${showAdmin ? `
                        <td style="font-size:.82rem">${solName}</td>
                        <td>${asigName ? `<div style="display:flex;align-items:center;gap:5px">
                            <div class="kcard-ava" style="width:22px;height:22px;font-size:.58rem">${ini}</div>
                            <span style="font-size:.8rem">${asigName.split(' ')[0]}</span>
                        </div>` : `<span style="color:var(--text3);font-size:.78rem">—</span>`}</td>` : ''}
                    <td style="text-align:center">${fotosCell}</td>
                    <td style="font-size:.76rem;color:var(--text3);font-family:var(--font-mono)">${fmtDateShort(t.created_at)}</td>
                    <td class="actions-cell" onclick="event.stopPropagation()">
                        <button class="btn btn-xs btn-secondary" onclick="openTicketDetail('${t.id}')">Ver</button>
                        ${isAdmin() && !t.asignado_id && t.status === 'nuevo'
                            ? `<button class="btn btn-xs btn-primary" onclick="openAssignModal('${t.id}')">Asignar</button>`
                            : ''}
                    </td>
                </tr>`;
            }).join('')}
        </tbody>
    </table></div>`;
}

// ─────────────────────────────────────────
// DETALLE DEL TICKET
// ─────────────────────────────────────────
async function openTicketDetail(id) {
    const t = (window.gTickets || []).find(x => x.id === id);
    if (!t) return;
<<<<<<< HEAD

    showLoading(true);
    let history = [], comments = [];

    try {
        const client = getSupabaseClient();
        if (client) {
            const [histRes, commRes] = await Promise.all([
                client.from('ticket_historiales').select('*').eq('ticket_id', id).order('created_at'),
                client.from('comentarios').select('*').eq('ticket_id', id).order('created_at')
            ]);
            history  = histRes.data  || [];
            comments = commRes.data  || [];
        }
    } catch(e) {
        console.error('Error cargando detalle:', e);
    }

    // Reunir todas las fotos del ticket
=======

    showLoading(true);
    let history = [], comments = [];

    try {
        const client = getSupabaseClient();
        if (client) {
            const [histRes, commRes] = await Promise.all([
                client.from('ticket_historiales').select('*').eq('ticket_id', id).order('created_at'),
                client.from('comentarios').select('*').eq('ticket_id', id).order('created_at')
            ]);
            history  = histRes.data  || [];
            comments = commRes.data  || [];
        }
    } catch(e) {
        console.error('Error cargando detalle:', e);
    }

>>>>>>> 6877419d3c8d6b81ab8aa213fba1b0362f5316f1
    const todasFotos = [];
    if (t.imagen_url) todasFotos.push(t.imagen_url);
    if (Array.isArray(t.fotos_urls)) todasFotos.push(...t.fotos_urls);

    const galeriaHtml = todasFotos.length > 0 ? `
        <div style="margin-bottom:6px;font-size:.78rem;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px">
            Fotografías adjuntas (${todasFotos.length})
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
            ${todasFotos.map((url, i) => `
                <div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;
                     border:1px solid var(--border);cursor:pointer;flex-shrink:0"
<<<<<<< HEAD
                     onclick="abrirVisorFoto('${url}','${t.titulo}')" title="Ver foto ${i+1}">
                    <img src="${url}" alt="Foto ${i+1}"
                         style="width:100%;height:100%;object-fit:cover"
                         onerror="this.parentElement.innerHTML='<div style=&quot;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--surface2);font-size:.7rem;color:var(--text3)&quot;>Error</div>'"/>
                    <div style="position:absolute;inset:0;background:rgba(0,0,0,0);transition:background .15s"
                         onmouseenter="this.style.background='rgba(0,0,0,0.25)'"
                         onmouseleave="this.style.background='rgba(0,0,0,0)'">
                        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                              color:#fff;font-size:16px;opacity:0;transition:opacity .15s"
                              onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0'">🔍</span>
                    </div>
                </div>`).join('')}
        </div>` : '';

    const canChangeStatus = isAdmin();
    const statusButtons   = canChangeStatus ? `
        <div style="margin-bottom:16px">
            <div style="font-size:.78rem;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">
                Cambiar estado
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${Object.entries(STATUS_META).map(([k,v]) => {
                    const activo = t.status === k;
                    return `<button
                        onclick="changeTicketStatus('${t.id}','${k}')"
                        style="padding:6px 14px;border-radius:20px;font-size:11px;font-weight:500;cursor:${activo?'default':'pointer'};
                               border:${activo?'2px':'1px'} solid ${v.color};
                               background:${activo?v.color:'transparent'};
                               color:${activo?'#fff':v.color};
                               opacity:${activo?1:0.7};transition:all .15s"
                        ${activo ? 'disabled' : ''}
                        onmouseenter="if(!this.disabled)this.style.opacity='1'"
                        onmouseleave="if(!this.disabled)this.style.opacity='0.7'">
                        ${activo ? '✓ ' : ''}${v.label}
=======
                     onclick="abrirVisorFoto('${url}','${t.titulo.replace(/'/g, "\\'")}')" title="Ver foto ${i+1}">
                     <img src="${url}" alt="Foto ${i+1}"
                          style="width:100%;height:100%;object-fit:cover"
                          onerror="this.parentElement.innerHTML='<div style=&quot;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--surface2);font-size:.7rem;color:var(--text3)&quot;>Error</div>'"/>
                </div>`).join('')}
        </div>` : '';

    const trans     = STATUS_TRANSITIONS[t.status] || [];
    const isOwner   = t.solicitante_id === currentUser?.id;
    let nextPossible = [];

    if (isAdmin()) {
        nextPossible = trans;
    } else if (isOwner && ['nuevo', 'pendiente'].includes(t.status)) {
        nextPossible = ['cancelado'];
    }

    const statusButtons = nextPossible.length > 0 ? `
        <div style="margin-bottom:24px; padding:15px; background:var(--surface2); border-radius:12px; border:1px solid var(--border)">
            <div style="font-size:.78rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                Gestión de Flujo / Acciones Disponibles
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                ${nextPossible.map(k => {
                    const v = STATUS_META[k] || { color: '#6b7280', label: k };
                    return `<button class="btn btn-sm" onclick="changeTicketStatus('${t.id}','${k}')"
                        style="background:transparent; border:1.8px solid ${v.color}; color:${v.color}; border-radius:10px; font-weight:700; font-size:.72rem; padding:8px 16px; transition:all 0.25s; cursor:pointer;"
                        onmouseenter="this.style.background='${v.color}'; this.style.color='#fff';"
                        onmouseleave="this.style.background='transparent'; this.style.color='${v.color}';">
                        ${k === 'cancelado' ? '✕ Cancelar ticket' : '✅ Mover a ' + v.label}
>>>>>>> 6877419d3c8d6b81ab8aa213fba1b0362f5316f1
                    </button>`;
                }).join('')}
            </div>
        </div>` : '';

    const historyHtml = history.length ? `
        <div style="font-size:.78rem;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">
            Historial
        </div>
        <div style="position:relative;padding-left:18px;margin-bottom:16px">
            <div style="position:absolute;left:5px;top:4px;bottom:4px;width:1px;background:var(--border)"></div>
            ${history.map(h => `
                <div style="position:relative;padding-bottom:12px">
                    <div style="position:absolute;left:-16px;top:3px;width:8px;height:8px;
                         border-radius:50%;background:var(--verde-med);border:2px solid var(--surface)"></div>
                    <div style="font-size:.8rem;color:var(--text)">${h.nota || 'Cambio de estado'}</div>
                    <div style="font-size:.72rem;color:var(--text3);margin-top:2px;display:flex;gap:8px">
                        <span>${fmtDate(h.created_at)}</span>
                        <span>por ${getUserName(h.creado_por)}</span>
                    </div>
                </div>`).join('')}
        </div>` : '';

    const commentsHtml = `
        <div style="font-size:.78rem;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">
            Comentarios (${comments.length})
        </div>
        <div id="comments-list-${t.id}" style="margin-bottom:12px">
            ${comments.length ? comments.map(c => {
                const esPropio = c.autor_id === currentUser?.id;
                return `<div style="display:flex;flex-direction:column;align-items:${esPropio?'flex-end':'flex-start'};margin-bottom:10px">
                    <div style="font-size:.72rem;color:var(--text3);margin-bottom:3px">
                        ${getUserName(c.autor_id)} · ${fmtDateShort(c.created_at)}
                    </div>
                    <div style="max-width:80%;padding:8px 12px;border-radius:${esPropio?'12px 12px 4px 12px':'12px 12px 12px 4px'};
                         background:${esPropio?'var(--verde)':'var(--surface2)'};
                         color:${esPropio?'#fff':'var(--text)'};font-size:.84rem;line-height:1.5">
                        ${c.comentario}
                    </div>
                </div>`;
            }).join('') : `<p style="font-size:.82rem;color:var(--text3);margin-bottom:10px">Sin comentarios aún.</p>`}
        </div>
        ${t.status !== 'cerrado' ? `
            <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">
                <textarea id="new-comment-${t.id}" rows="2"
                    placeholder="Escribe un comentario... (Enter + Ctrl para enviar)"
                    style="width:100%;padding:9px 11px;border:none;resize:none;font-size:.84rem;
                           font-family:inherit;color:var(--text);background:var(--surface);outline:none"
                    onkeydown="if(event.ctrlKey&&event.key==='Enter')addComment('${t.id}')"></textarea>
                <div style="display:flex;justify-content:flex-end;padding:6px 10px;
                     background:var(--surface2);border-top:1px solid var(--border)">
                    <button class="btn btn-primary btn-sm" onclick="addComment('${t.id}')">
                        Enviar comentario
                    </button>
                </div>
            </div>` : ''}`;

<<<<<<< HEAD
    // Armar el body del modal
    document.getElementById('td-id').textContent    = t.id;
=======
    // UI Updates
    document.getElementById('td-id').textContent = t.id;
>>>>>>> 6877419d3c8d6b81ab8aa213fba1b0362f5316f1
    document.getElementById('td-title').textContent = t.titulo;
    document.getElementById('td-body').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;font-size:.84rem">
            <div><span style="color:var(--text3)">Estado:</span>
                <span class="badge badge-${t.status}" style="margin-left:6px">${STATUS_META[t.status]?.label||t.status}</span>
            </div>
            <div><span style="color:var(--text3)">Prioridad:</span>
                <span class="badge badge-${t.prioridad}" style="margin-left:6px">${PRIO_META[t.prioridad]?.label||t.prioridad}</span>
            </div>
            <div><span style="color:var(--text3)">Departamento:</span>
                <strong style="margin-left:6px">${t.departamento||'—'}</strong>
            </div>
            <div><span style="color:var(--text3)">Solicitante:</span>
                <strong style="margin-left:6px">${getUserName(t.solicitante_id)}</strong>
            </div>
            <div><span style="color:var(--text3)">Técnico:</span>
                <strong style="margin-left:6px">${t.asignado_id ? getUserName(t.asignado_id) : 'Sin asignar'}</strong>
            </div>
            <div><span style="color:var(--text3)">Creado:</span>
                <strong style="margin-left:6px;font-family:var(--font-mono);font-size:.76rem">${fmtDate(t.created_at)}</strong>
            </div>
        </div>
<<<<<<< HEAD

        <div style="margin-bottom:16px">
            <div style="font-size:.78rem;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">
                Descripción
            </div>
            <p style="font-size:.86rem;line-height:1.65;color:var(--text)">${t.descripcion || '—'}</p>
        </div>

=======
        <div style="margin-bottom:16px">
            <div style="font-size:.78rem;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Descripción</div>
            <p style="font-size:.86rem;line-height:1.65;color:var(--text)">${t.descripcion || '—'}</p>
        </div>
>>>>>>> 6877419d3c8d6b81ab8aa213fba1b0362f5316f1
        ${galeriaHtml}
        ${statusButtons}
        ${historyHtml}
        ${commentsHtml}`;

    openModal('modal-ticket-detail');
    showLoading(false);
}

// ─────────────────────────────────────────
// CAMBIO DE ESTADO
// ─────────────────────────────────────────
async function changeTicketStatus(ticketId, nuevoStatus) {
    const client = getSupabaseClient();
    if (!client) return toast('Sin conexión a Supabase.', 'error');

    showLoading(true);
    try {
        const { error } = await client
            .from('tickets')
            .update({ status: nuevoStatus, updated_at: new Date().toISOString() })
            .eq('id', ticketId);
        if (error) throw error;

        // Registrar en historial
        await client.from('ticket_historiales').insert({
            ticket_id:  ticketId,
            estado:     nuevoStatus,
            creado_por: currentUser.id,
            nota:       `Estado cambiado a: ${STATUS_META[nuevoStatus]?.label || nuevoStatus}`,
            created_at: new Date().toISOString()
        });

        // Actualizar caché local
        const idx = (window.gTickets || []).findIndex(t => t.id === ticketId);
        if (idx !== -1) window.gTickets[idx].status = nuevoStatus;

        toast(`Estado actualizado a: ${STATUS_META[nuevoStatus]?.label || nuevoStatus}`, 'success');
        closeModal('modal-ticket-detail');
        navigate(typeof currentView !== 'undefined' ? currentView : 'tickets');
    } catch(e) {
        console.error('Error al cambiar estado:', e);
        toast('Error: ' + e.message, 'error');
    } finally { showLoading(false); }
}

// ─────────────────────────────────────────
// ASIGNAR TICKET
// ─────────────────────────────────────────
async function openAssignModal(ticketId) {
    currentAssignTicketId = ticketId;
    const t = (window.gTickets || []).find(x => x.id === ticketId);
    if (!t) return;
    document.getElementById('assign-desc').textContent = `Ticket: ${t.titulo}`;
    const sel  = document.getElementById('assign-tech');
    const admins = (window.gUsers || []).filter(u => u.rol === 'admin');
    sel.innerHTML = admins.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('');
    openModal('modal-assign');
}

async function confirmAssign() {
    const client = getSupabaseClient();
    if (!client || !currentAssignTicketId) return;

    const techId = document.getElementById('assign-tech').value;
    const note   = document.getElementById('assign-note').value.trim();
    showLoading(true);
    try {
        const { error } = await client
            .from('tickets')
            .update({ asignado_id: techId, status: 'en_progreso', updated_at: new Date().toISOString() })
            .eq('id', currentAssignTicketId);
        if (error) throw error;

        await client.from('ticket_historiales').insert({
            ticket_id:  currentAssignTicketId,
            estado:     'en_progreso',
            creado_por: currentUser.id,
            nota:       note || `Asignado a ${getUserName(techId)}`,
            created_at: new Date().toISOString()
        });

        const idx = (window.gTickets || []).findIndex(t => t.id === currentAssignTicketId);
        if (idx !== -1) {
            window.gTickets[idx].asignado_id = techId;
            window.gTickets[idx].status      = 'en_progreso';
        }

        closeModal('modal-assign');
        toast('Ticket asignado correctamente.', 'success');
        navigate(typeof currentView !== 'undefined' ? currentView : 'tickets');
    } catch(e) {
        console.error('Error al asignar:', e);
        toast('Error: ' + e.message, 'error');
    } finally { showLoading(false); }
}

// ─────────────────────────────────────────
// CREAR NUEVO TICKET CON MÚLTIPLES FOTOS
// ─────────────────────────────────────────

/** Abre el modal y resetea el formulario */
function openNewTicketModal() {
    fotosSeleccionadas = [];
    const form = document.getElementById('modal-new-ticket');
    if (!form) return;
    // Resetear campos
    ['nt-title','nt-dep','nt-accion'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['nt-title-err','nt-accion-err'].forEach(id => {
        document.getElementById(id)?.classList.remove('show');
    });
    actualizarPrevisualizacion();
    openModal('modal-new-ticket');
}

/**
 * Maneja la selección de múltiples fotos
 * Llamado por: oninput en el input[type=file] del modal
 */
function onFotosSeleccionadas(input) {
    const MAX_FOTOS = 5;
    const MAX_MB    = 5;
    const TIPOS     = ['image/jpeg','image/png','image/webp'];

    const archivos = Array.from(input.files || []);
    let errores = [];

    archivos.forEach(file => {
        if (fotosSeleccionadas.length >= MAX_FOTOS) {
            errores.push(`Máximo ${MAX_FOTOS} fotos permitidas.`);
            return;
        }
        if (!TIPOS.includes(file.type)) {
            errores.push(`"${file.name}": tipo no permitido (usa JPG, PNG o WebP).`);
            return;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            errores.push(`"${file.name}": supera ${MAX_MB} MB.`);
            return;
        }
        fotosSeleccionadas.push({
            file,
            preview: URL.createObjectURL(file),
            nombre:  file.name,
            tamanio: file.size,
        });
    });

    if (errores.length) toast(errores[0], 'error');
    actualizarPrevisualizacion();
    input.value = ''; // resetear para permitir volver a seleccionar
}

/** Elimina una foto de la previsualización */
function quitarFoto(idx) {
    URL.revokeObjectURL(fotosSeleccionadas[idx]?.preview);
    fotosSeleccionadas.splice(idx, 1);
    actualizarPrevisualizacion();
}

/** Renderiza las miniaturas de fotos seleccionadas */
function actualizarPrevisualizacion() {
    const container = document.getElementById('fotos-preview');
    if (!container) return;

    if (!fotosSeleccionadas.length) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
            ${fotosSeleccionadas.map((f, i) => `
                <div style="position:relative;width:68px;height:68px;border-radius:8px;
                     overflow:hidden;border:1px solid var(--border);flex-shrink:0">
                    <img src="${f.preview}" alt="${f.nombre}"
                         style="width:100%;height:100%;object-fit:cover"/>
                    <button onclick="quitarFoto(${i})"
                        style="position:absolute;top:2px;right:2px;width:18px;height:18px;
                               border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;
                               border:none;font-size:10px;cursor:pointer;display:flex;
                               align-items:center;justify-content:center;line-height:1"
                        title="Quitar foto">✕</button>
                    <div style="position:absolute;bottom:0;left:0;right:0;padding:2px 4px;
                         background:rgba(0,0,0,0.5);color:#fff;font-size:9px;
                         white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        ${formatBytes(f.tamanio)}
                    </div>
                </div>`).join('')}
        </div>`;
}

/**
 * Sube una foto al bucket de Supabase Storage
 * @param {File} file
 * @param {string} ticketId
 * @returns {Promise<string>} URL pública de la foto
 */
async function subirFoto(file, ticketId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Sin conexión');

    const ext      = file.name.split('.').pop().toLowerCase();
    const filename = `${ticketId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await client.storage
        .from('ticket-fotos')
        .upload(filename, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data } = client.storage.from('ticket-fotos').getPublicUrl(filename);
    return data.publicUrl;
}

/** Envía el formulario de nuevo ticket */
async function submitNewTicket() {
    const title  = document.getElementById('nt-title')?.value?.trim();
    const accion = document.getElementById('nt-accion')?.value?.trim();
    let valid = true;

    if (!title)  { document.getElementById('nt-title-err')?.classList.add('show');  valid = false; }
    else           document.getElementById('nt-title-err')?.classList.remove('show');
    if (!accion) { document.getElementById('nt-accion-err')?.classList.add('show'); valid = false; }
    else           document.getElementById('nt-accion-err')?.classList.remove('show');
    if (!valid) return;

    showLoading(true);
    try {
        const client = getSupabaseClient();

        // 1. Crear ticket (sin fotos aún)
        const { data: newTicket, error } = await client
            .from('tickets')
            .insert({
                titulo:         title,
                descripcion:    accion,
                prioridad:      document.getElementById('nt-prio')?.value || 'media',
                categoria:      document.getElementById('nt-cat')?.value  || '',
                departamento:   document.getElementById('nt-dep')?.value  || '',
                solicitante_id: currentUser.id,
<<<<<<< HEAD
                status:         'nuevo',
=======
                status:         'Nuevo', // Capitalized to match DB enums often created as Nuevo
>>>>>>> 6877419d3c8d6b81ab8aa213fba1b0362f5316f1
                imagen_url:     null,
                fotos_urls:     [],
                created_at:     new Date().toISOString(),
                updated_at:     new Date().toISOString()
            })
            .select()
            .single();
        if (error) throw error;

        // 2. Subir fotos en paralelo
        let urlsSubidas = [];
        if (fotosSeleccionadas.length > 0) {
            toast(`Subiendo ${fotosSeleccionadas.length} foto(s)...`, 'info');
            const resultados = await Promise.allSettled(
                fotosSeleccionadas.map(f => subirFoto(f.file, newTicket.id))
            );
            urlsSubidas = resultados
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value);

            const fallidas = resultados.filter(r => r.status === 'rejected').length;
            if (fallidas > 0) toast(`${fallidas} foto(s) no se pudieron subir.`, 'error');
        }

        // 3. Actualizar ticket con las URLs de fotos
        if (urlsSubidas.length > 0) {
            const imagenUrl  = urlsSubidas[0];              // compatibilidad legacy
            const fotosExtra = urlsSubidas.slice(1);
            await client.from('tickets').update({
                imagen_url: imagenUrl,
                fotos_urls: fotosExtra,
            }).eq('id', newTicket.id);
            newTicket.imagen_url = imagenUrl;
            newTicket.fotos_urls = fotosExtra;
        }

        // 4. Registrar en historial
        await client.from('ticket_historiales').insert({
            ticket_id:  newTicket.id,
            estado:     'nuevo',
            creado_por: currentUser.id,
            nota:       'Ticket creado',
            created_at: new Date().toISOString()
        });

        // 5. Actualizar caché local
        window.gTickets.unshift(newTicket);
        fotosSeleccionadas = [];

        closeModal('modal-new-ticket');
        toast(`Ticket ${newTicket.id} creado${urlsSubidas.length ? ` con ${urlsSubidas.length} foto(s)` : ''}.`, 'success');
        navigate(typeof currentView !== 'undefined' ? currentView : 'tickets');
        if (typeof buildNav === 'function') buildNav();

    } catch(e) {
        console.error('Error al crear ticket:', e);
        toast('Error al crear ticket: ' + e.message, 'error');
    } finally { showLoading(false); }
}

// ─────────────────────────────────────────
// VISOR DE FOTOS
// ─────────────────────────────────────────

/** Abre una foto en pantalla completa */
function abrirVisorFoto(url, titulo) {
    // Eliminar visor anterior si existe
    document.getElementById('visor-foto-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'visor-foto-overlay';
    overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.88);
        display:flex;align-items:center;justify-content:center;
        z-index:9999;padding:20px;cursor:zoom-out`;
    overlay.onclick = () => overlay.remove();

    overlay.innerHTML = `
        <div style="position:relative;max-width:90vw;max-height:90vh" onclick="event.stopPropagation()">
            <img src="${url}" alt="${titulo}"
                 style="max-width:90vw;max-height:85vh;border-radius:8px;object-fit:contain;display:block"/>
            <div style="text-align:center;color:rgba(255,255,255,.6);font-size:.78rem;margin-top:8px">
                ${titulo} · Clic fuera para cerrar
            </div>
            <button onclick="document.getElementById('visor-foto-overlay').remove()"
                style="position:absolute;top:-10px;right:-10px;width:28px;height:28px;border-radius:50%;
                       background:rgba(255,255,255,.15);border:none;color:#fff;font-size:14px;
                       cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
        </div>`;

    document.body.appendChild(overlay);
}

/** Abre galería rápida desde la tabla (solo las fotos del ticket) */
function abrirGaleriaRapida(ticketId) {
    const t = (window.gTickets || []).find(x => x.id === ticketId);
    if (!t) return;
    const fotos = [];
    if (t.imagen_url) fotos.push(t.imagen_url);
    if (Array.isArray(t.fotos_urls)) fotos.push(...t.fotos_urls);
    if (!fotos.length) return;
    if (fotos.length === 1) { abrirVisorFoto(fotos[0], t.titulo); return; }

    document.getElementById('visor-foto-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'visor-foto-overlay';
    overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.88);
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        z-index:9999;padding:20px`;
    overlay.onclick = () => overlay.remove();

    overlay.innerHTML = `
        <div onclick="event.stopPropagation()" style="text-align:center">
            <div style="color:rgba(255,255,255,.5);font-size:.78rem;margin-bottom:12px">
                ${t.titulo} · ${fotos.length} fotos · Clic fuera para cerrar
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:90vw">
                ${fotos.map((url, i) => `
                    <img src="${url}" alt="Foto ${i+1}"
                         onclick="event.stopPropagation();abrirVisorFoto('${url}','${t.titulo}')"
                         style="width:120px;height:120px;object-fit:cover;border-radius:8px;
                                cursor:zoom-in;border:2px solid transparent;transition:border-color .15s"
                         onmouseenter="this.style.borderColor='#fff'"
                         onmouseleave="this.style.borderColor='transparent'"/>`).join('')}
            </div>
        </div>`;

    document.body.appendChild(overlay);
}

// ─────────────────────────────────────────
// COMENTARIOS
// ─────────────────────────────────────────
async function addComment(ticketId) {
    const ta   = document.getElementById('new-comment-' + ticketId);
    const text = ta?.value?.trim();
    if (!text) { toast('Escribe un comentario.', 'error'); return; }

    showLoading(true);
    try {
        const client = getSupabaseClient();
        const { data: newComment, error } = await client
            .from('comentarios')
            .insert({
                ticket_id:  ticketId,
                autor_id:   currentUser.id,
                comentario: text,
                created_at: new Date().toISOString()
            })
            .select().single();
        if (error) throw error;

        ta.value = '';
        window.gComments.push(newComment);

        const cl = document.getElementById('comments-list-' + ticketId);
        if (cl) {
            const comments = (window.gComments || []).filter(c => c.ticket_id === ticketId);
            cl.innerHTML = comments.map(c => {
                const esPropio = c.autor_id === currentUser?.id;
                return `<div style="display:flex;flex-direction:column;align-items:${esPropio?'flex-end':'flex-start'};margin-bottom:10px">
                    <div style="font-size:.72rem;color:var(--text3);margin-bottom:3px">
                        ${getUserName(c.autor_id)} · ${fmtDateShort(c.created_at)}
                    </div>
                    <div style="max-width:80%;padding:8px 12px;
                         border-radius:${esPropio?'12px 12px 4px 12px':'12px 12px 12px 4px'};
                         background:${esPropio?'var(--verde)':'var(--surface2)'};
                         color:${esPropio?'#fff':'var(--text)'};font-size:.84rem;line-height:1.5">
                        ${c.comentario}
                    </div>
                </div>`;
            }).join('');
        }
        toast('Comentario agregado.', 'success');
    } catch(e) {
        console.error('Error al agregar comentario:', e);
        toast('Error: ' + e.message, 'error');
    } finally { showLoading(false); }
}

// ─────────────────────────────────────────
// MIS TICKETS (usuario normal)
// ─────────────────────────────────────────
async function renderMyTickets() {
    const el  = document.getElementById('view-my-tickets');
    const myT = (window.gTickets || []).filter(t => t.solicitante_id === currentUser.id);

    el.innerHTML = `
        <p class="section-sub">Historial completo de tus solicitudes de soporte TI</p>
        <div class="tab-bar">
            <button class="tab active" onclick="setMyFilter('all',this)">Todos (${myT.length})</button>
            <button class="tab" onclick="setMyFilter('nuevo',this)">Nuevos</button>
            <button class="tab" onclick="setMyFilter('en_progreso',this)">En progreso</button>
            <button class="tab" onclick="setMyFilter('pendiente',this)">Pendientes</button>
            <button class="tab" onclick="setMyFilter('atendido',this)">Atendidos</button>
            <button class="tab" onclick="setMyFilter('cerrado',this)">Cerrados</button>
        </div>
        <div id="my-tickets-inner">${renderMyTicketsInner(myT)}</div>`;
}

function setMyFilter(status, btn) {
    document.querySelectorAll('#view-my-tickets .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const myT      = (window.gTickets || []).filter(t => t.solicitante_id === currentUser.id);
    const filtered = status === 'all' ? myT : myT.filter(t => t.status === status);
    document.getElementById('my-tickets-inner').innerHTML = renderMyTicketsInner(filtered);
}

function renderMyTicketsInner(tickets) {
    if (!tickets.length) return `
        <div class="empty-state">
            <h3>Sin tickets en este estado</h3>
            <p>Aún no tienes solicitudes aquí.</p>
        </div>`;

    return tickets.sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).map(t => {
        const asig       = t.asignado_id ? getUserById(t.asignado_id) : null;
        const totalFotos = (t.imagen_url ? 1 : 0) + (Array.isArray(t.fotos_urls) ? t.fotos_urls.length : 0);
        return `
            <div class="panel" style="margin-bottom:10px;cursor:pointer"
                 onclick="openTicketDetail('${t.id}')" tabindex="0"
                 onkeydown="if(event.key==='Enter')openTicketDetail('${t.id}')">
                <div class="panel-body">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:.7rem;color:var(--verde-med);margin-bottom:4px">${t.id}</div>
                            <div style="font-weight:600;font-size:.93rem;margin-bottom:6px">${t.titulo}</div>
                            <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
                                <span class="badge badge-${t.status}">${STATUS_META[t.status]?.label||t.status}</span>
                                <span class="badge badge-${t.prioridad}">${PRIO_META[t.prioridad]?.label||t.prioridad}</span>
                                ${totalFotos > 0
                                    ? `<span style="font-size:.72rem;color:var(--verde-med);cursor:pointer"
                                         onclick="event.stopPropagation();abrirGaleriaRapida('${t.id}')"
                                         title="Ver fotos">📷 ${totalFotos}</span>`
                                    : ''}
                            </div>
                        </div>
                        <div style="text-align:right;font-size:.76rem;color:var(--text3)">
                            <div style="margin-bottom:3px;font-family:var(--font-mono)">${fmtDateShort(t.created_at)}</div>
                            <div>${asig
                                ? `Técnico: <strong style="color:var(--text2)">${asig.nombre.split(' ')[0]}</strong>`
                                : 'Sin asignar'}</div>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// ─────────────────────────────────────────
<<<<<<< HEAD
// AGREGAR CAMPO DE FOTOS AL MODAL HTML
// Se llama una vez al cargar la app para
// inyectar el input de fotos en el modal
// de nuevo ticket existente en index.html
// ─────────────────────────────────────────
function inyectarCampoFotos() {
    // Buscar el campo de imagen_url original
    const imagenGroup = document.getElementById('nt-imagen')?.closest('.form-group');
    if (!imagenGroup) return;

    // Reemplazarlo con el nuevo campo multi-fotos
    imagenGroup.innerHTML = `
        <label>Fotografías <span style="font-weight:400;color:var(--text3)">(opcional · máx. 5 imágenes, 5 MB c/u)</span></label>
        <div id="zona-fotos" style="border:1.5px dashed var(--border);border-radius:8px;padding:18px;
             text-align:center;cursor:pointer;transition:border-color .15s,background .15s"
             onclick="document.getElementById('input-fotos-multiple').click()"
             ondragover="event.preventDefault();this.style.borderColor='var(--verde)';this.style.background='var(--surface2)'"
             ondragleave="this.style.borderColor='var(--border)';this.style.background=''"
             ondrop="event.preventDefault();this.style.borderColor='var(--border)';this.style.background='';
                     onFotosSeleccionadas({files:event.dataTransfer.files})">
            <div style="font-size:22px;margin-bottom:6px">📷</div>
            <div style="font-size:.82rem;color:var(--text2)">
                Arrastra fotos aquí o <span style="color:var(--verde);font-weight:500">haz clic para seleccionar</span>
            </div>
            <div style="font-size:.73rem;color:var(--text3);margin-top:3px">JPG, PNG, WebP</div>
        </div>
        <input type="file" id="input-fotos-multiple" multiple
               accept="image/jpeg,image/png,image/webp"
               style="display:none"
               onchange="onFotosSeleccionadas(this)">
        <div id="fotos-preview"></div>`;
}

// Inyectar el campo cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inyectarCampoFotos);
} else {
    inyectarCampoFotos();
}

// ─────────────────────────────────────────
=======
>>>>>>> 6877419d3c8d6b81ab8aa213fba1b0362f5316f1
// TAMBIÉN agregar columna fotos_urls a la
// tabla tickets si no existe (SQL a ejecutar
// manualmente en Supabase):
//
// alter table public.tickets
//   add column if not exists fotos_urls text[] default '{}';
// ─────────────────────────────────────────
