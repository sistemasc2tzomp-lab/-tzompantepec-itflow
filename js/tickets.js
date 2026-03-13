// ══════════════════════════════════════════
// GESTIÓN DE TICKETS
// ══════════════════════════════════════════

let ticketFilter = { status: 'all', prio: 'all', search: '', page: 1 };

/**
 * Obtiene un usuario por su ID (usando gUsers)
 * @param {string} userId - ID del usuario
 * @returns {Object|null} - Datos del usuario o null
 */
function getUserById(userId) {
    return gUsers.find(u => u.id === userId) || null;
}

/**
 * Obtiene el nombre de un usuario por su ID
 * @param {string} userId - ID del usuario
 * @returns {string} - Nombre del usuario o '—' si no existe
 */
function getUserName(userId) {
    const user = getUserById(userId);
    return user ? user.nombre : '—';
}

/**
 * Renderiza los comentarios de un ticket
 * @param {string} ticketId - ID del ticket
 * @returns {string} - HTML con los comentarios
 */
function renderComments(ticketId) {
    const comments = gComments.filter(c => c.ticket_id === ticketId);
    
    if (comments.length === 0) {
        return '<p style="color:var(--text3);font-size:.83rem;margin-bottom:10px">Sin comentarios aún.</p>';
    }
    
    return comments.map(c => {
        const autor = gUsers.find(u => u.id === c.autor_id);
        return `<div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${autor?.nombre || '—'}</span>
                <span class="comment-time">${fmtDate(c.created_at)}</span>
            </div>
            <div class="comment-body">${c.comentario}</div>
        </div>`;
    }).join('');
}

async function renderTickets() {
    const el = document.getElementById('view-tickets');
    
    // Obtener lista de técnicos (admins)
    const admins = gUsers.filter(u => u.rol === 'admin');
    
    const adminOptions = isAdmin() ? `
        <select class="filter-select" id="filter-assignee" onchange="onFilterChange()">
            <option value="all">Todos los técnicos</option>
            <option value="unassigned">Sin asignar</option>
            ${admins.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}
        </select>
    ` : '';
    
    el.innerHTML = `
        <div class="toolbar">
            <div class="search-wrap">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="search" id="ticket-search" placeholder="Buscar por título, ID..." oninput="onSearchChange(this.value)" aria-label="Buscar"/>
            </div>
            <select class="filter-select" id="filter-status" onchange="onFilterChange()">
                <option value="all">Todos los estados</option>
                ${Object.entries(STATUS_META).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}
            </select>
            <select class="filter-select" id="filter-prio" onchange="onFilterChange()">
                <option value="all">Todas las prioridades</option>
                ${Object.entries(PRIO_META).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}
            </select>
            ${adminOptions}
        </div>
        <div id="ticket-table-container"></div>
        <div id="pagination-container"></div>`;
    
    renderTicketTable();
}

function onSearchChange(v) {
    ticketFilter.search = v;
    ticketFilter.page = 1;
    renderTicketTable();
}

function onFilterChange() {
    ticketFilter.status = document.getElementById('filter-status')?.value || 'all';
    ticketFilter.prio = document.getElementById('filter-prio')?.value || 'all';
    ticketFilter.assignee = isAdmin() ? document.getElementById('filter-assignee')?.value || 'all' : null;
    ticketFilter.page = 1;
    renderTicketTable();
}

function getFilteredTickets() {
    let list = [...gTickets];
    
    if (!isAdmin()) {
        list = list.filter(t => t.solicitante_id === currentUser.id);
    }
    
    if (ticketFilter.status !== 'all') {
        list = list.filter(t => t.status === ticketFilter.status);
    }
    
    if (ticketFilter.prio !== 'all') {
        list = list.filter(t => t.prioridad === ticketFilter.prio);
    }
    
    if (ticketFilter.assignee && ticketFilter.assignee !== 'all') {
        if (ticketFilter.assignee === 'unassigned') {
            list = list.filter(t => !t.asignado_id);
        } else {
            list = list.filter(t => t.asignado_id === ticketFilter.assignee);
        }
    }
    
    if (ticketFilter.search) {
        const q = ticketFilter.search.toLowerCase();
        list = list.filter(t => 
            t.titulo.toLowerCase().includes(q) || 
            t.id.toLowerCase().includes(q)
        );
    }
    
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function renderTicketTable() {
    const PER_PAGE = 10;
    const all = getFilteredTickets();
    const total = all.length;
    const pages = Math.ceil(total / PER_PAGE) || 1;
    
    if (ticketFilter.page > pages) ticketFilter.page = pages;
    
    const slice = all.slice((ticketFilter.page - 1) * PER_PAGE, ticketFilter.page * PER_PAGE);
    document.getElementById('ticket-table-container').innerHTML = renderTicketTableInner(slice, isAdmin());
    
    const pag = document.getElementById('pagination-container');
    if (!pag || pages <= 1) {
        if (pag) pag.innerHTML = '';
        return;
    }
    
    let html = `<div class="pagination">`;
    html += `<button class="page-btn" onclick="setPage(${ticketFilter.page - 1})" ${ticketFilter.page === 1 ? 'disabled' : ''}>‹</button>`;
    for (let i = 1; i <= pages; i++) {
        html += `<button class="page-btn ${i === ticketFilter.page ? 'active' : ''}" onclick="setPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" onclick="setPage(${ticketFilter.page + 1})" ${ticketFilter.page === pages ? 'disabled' : ''}>›</button>`;
    html += `</div>`;
    pag.innerHTML = html;
}

function setPage(p) {
    ticketFilter.page = p;
    renderTicketTable();
}

function renderTicketTableInner(tickets, showAdmin) {
    if (!tickets.length) {
        return `<div class="table-empty">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="opacity:.2;margin-bottom:10px">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p>No se encontraron tickets.</p>
        </div>`;
    }
    
    return `<div class="table-wrap">
        <table class="tickets-table">
            <thead>
                <tr>
                    <th>ID</th><th>Título</th><th>Prioridad</th><th>Estado</th>
                    ${showAdmin ? '<th>Solicitante</th><th>Asignado</th>' : ''}
                    <th>Fecha</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${tickets.map(t => {
                    const solName = getUserName(t.solicitante_id);
                    const asig = t.asignado_id ? getUserById(t.asignado_id) : null;
                    const asigName = asig ? asig.nombre : null;
                    const ini = asig ? asig.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : null;
                    
                    return `<tr onclick="openTicketDetail('${t.id}')" tabindex="0" onkeydown="if(event.key==='Enter')openTicketDetail('${t.id}')">
                        <td class="ticket-id-col">${t.id}</td>
                        <td class="ticket-title-col">
                            <div>${t.titulo}</div>
                            <div class="ticket-subtitle">${t.categoria || ''}${t.departamento ? ' · ' + t.departamento : ''}</div>
                        </td>
                        <td><span class="badge badge-${t.prioridad}">${PRIO_META[t.prioridad]?.label || t.prioridad}</span></td>
                        <td><span class="badge badge-${t.status}">${STATUS_META[t.status]?.label || t.status}</span></td>
                        ${showAdmin ? `
                            <td style="font-size:.82rem">${solName}</td>
                            <td>${asigName ? `<div style="display:flex;align-items:center;gap:5px">
                                <div class="kcard-ava" style="width:22px;height:22px;font-size:.58rem">${ini}</div>
                                <span style="font-size:.8rem">${asigName.split(' ')[0]}</span>
                            </div>` : `<span style="color:var(--text3);font-size:.78rem">—</span>`}</td>
                        ` : ''}
                        <td style="font-size:.76rem;color:var(--text3);font-family:var(--font-mono)">${fmtDateShort(t.created_at)}</td>
                        <td class="actions-cell" onclick="event.stopPropagation()">
                            <button class="btn btn-xs btn-secondary" onclick="openTicketDetail('${t.id}')">Ver</button>
                            ${isAdmin() && !t.asignado_id && t.status === 'nuevo' ? `<button class="btn btn-xs btn-primary" onclick="openAssignModal('${t.id}')">Asignar</button>` : ''}
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>`;
}

async function openTicketDetail(id) {
    const t = gTickets.find(x => x.id === id);
    if (!t) return;
    
    showLoading(true);
    
    // Cargar historial y comentarios específicos de este ticket
    let history = [];
    let comments = [];
    
    try {
        if (supabase) {
            const [histRes, commRes] = await Promise.all([
                supabase.from('ticket_historiales').select('*').eq('ticket_id', id).order('created_at'),
                supabase.from('comentarios').select('*').eq('ticket_id', id).order('created_at')
            ]);
            
            if (!histRes.error) history = histRes.data || [];
            if (!commRes.error) comments = commRes.data || [];
        }
    } catch (e) {
        console.error('Error cargando detalles:', e);
    }
    
    showLoading(false);
    
    const solName = getUserName(t.solicitante_id);
    const asig = t.asignado_id ? getUserById(t.asignado_id) : null;
    const asigName = asig ? asig.nombre : null;
    const transitions = isAdmin() ? STATUS_TRANSITIONS[t.status] || [] : [];

    document.getElementById('td-id').textContent = t.id;
    document.getElementById('td-title').textContent = t.titulo;
    
    document.getElementById('td-body').innerHTML = `
        <div class="detail-grid">
            <div>
                <div class="detail-section">
                    <h4>Descripción del problema</h4>
                    <div class="detail-accion">${t.descripcion || 'Sin descripción.'}</div>
                </div>
                <div class="detail-section">
                    <div style="display:flex;gap:10px;flex-wrap:wrap">
                        ${dField('Estado', `<span class="badge badge-${t.status}">${STATUS_META[t.status]?.label || t.status}</span>`)}
                        ${dField('Prioridad', `<span class="badge badge-${t.prioridad}">${PRIO_META[t.prioridad]?.label || t.prioridad}</span>`)}
                        ${dField('Categoría', t.categoria || '—')}
                        ${dField('Departamento', t.departamento || '—')}
                        ${dField('Solicitante', solName)}
                        ${dField('Asignado a', asigName || '<span style="color:var(--text3)">Sin asignar</span>')}
                        ${dField('Creado', `<span style="font-family:var(--font-mono);font-size:.8rem">${fmtDate(t.created_at)}</span>`)}
                        ${dField('Actualizado', `<span style="font-family:var(--font-mono);font-size:.8rem">${fmtDate(t.updated_at)}</span>`)}
                    </div>
                </div>
                ${isAdmin() && transitions.length ? `
                <div class="detail-section">
                    <h4>Cambiar estado</h4>
                    <div class="status-btns">
                        <button class="status-btn current" disabled>${STATUS_META[t.status]?.label || t.status}</button>
                        ${transitions.map(s => `<button class="status-btn" onclick="changeStatus('${t.id}','${s}')">${STATUS_META[s]?.label || s}</button>`).join('')}
                    </div>
                    ${!t.asignado_id ? `<button class="btn btn-sm btn-primary" style="margin-top:10px" onclick="openAssignModal('${t.id}');closeModal('modal-ticket-detail')">Asignar técnico</button>` : ''}
                </div>` : ''}
                <div class="detail-section">
                    <h4>Comentarios (${comments.length})</h4>
                    <div id="comments-list-${id}">
                        ${comments.length === 0 ? `<p style="color:var(--text3);font-size:.83rem;margin-bottom:10px">Sin comentarios aún.</p>` : ''}
                        ${comments.map(c => {
                            const autorName = getUserName(c.autor_id);
                            return `<div class="comment-item">
                                <div class="comment-header">
                                    <span class="comment-author">${autorName}</span>
                                    <span class="comment-time">${fmtDate(c.created_at)}</span>
                                </div>
                                <div class="comment-body">${c.comentario}</div>
                            </div>`;
                        }).join('')}
                    </div>
                    <textarea id="new-comment-${id}" placeholder="Agregar comentario..." style="width:100%;padding:10px 12px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:var(--font-body);font-size:.84rem;outline:none;resize:vertical;min-height:68px;margin-top:10px"></textarea>
                    <button class="btn btn-sm btn-outline-verde" style="margin-top:7px" onclick="addComment('${id}')">Agregar comentario</button>
                </div>
            </div>
            <div>
                <div class="panel">
                    <div class="panel-header"><div class="panel-title">Historial</div></div>
                    <div class="panel-body" style="padding-top:10px">
                        ${history.length === 0 ? `<p style="color:var(--text3);font-size:.8rem">Sin historial.</p>` :
                            `<div class="timeline">${history.map(h => {
                                const actorName = getUserName(h.creado_por);
                                const sm = STATUS_META[h.estado] || { dot: '#999', color: '#999', label: h.estado };
                                return `<div class="timeline-item">
                                    <div class="timeline-dot" style="background:${sm.dot}"></div>
                                    <div class="timeline-content">
                                        <div class="tl-status" style="color:${sm.color}">${sm.label}</div>
                                        <div class="tl-meta">${actorName} · ${fmtDate(h.created_at)}</div>
                                        ${h.nota ? `<div class="tl-meta" style="font-style:italic;margin-top:2px">"${h.nota}"</div>` : ''}
                                    </div>
                                </div>`;
                            }).join('')}</div>`}
                    </div>
                </div>
            </div>
        </div>`;
    
    openModal('modal-ticket-detail');
}

function dField(label, val) {
    return `<div class="detail-field"><label>${label}</label><value>${val}</value></div>`;
}

/**
 * Cambia el estado de un ticket
 * @param {string} ticketId - ID del ticket
 * @param {string} newStatus - Nuevo estado
 */
async function changeStatus(ticketId, newStatus) {
    showLoading(true);
    try {
        // Actualizar ticket en Supabase
        const { error: updateError } = await supabase
            .from('tickets')
            .update({ 
                status: newStatus, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', ticketId);
            
        if (updateError) throw updateError;

        // Insertar en historial
        const { error: histError } = await supabase
            .from('ticket_historiales')
            .insert({
                ticket_id: ticketId,
                estado: newStatus,
                creado_por: currentUser.id,
                nota: `Cambio de estado a ${STATUS_META[newStatus]?.label || newStatus}`,
                created_at: new Date().toISOString()
            });
            
        if (histError) throw histError;

        // Actualizar caché local (gTickets)
        const ticket = gTickets.find(t => t.id === ticketId);
        if (ticket) {
            ticket.status = newStatus;
            ticket.updated_at = new Date().toISOString();
        }
        
        // Actualizar caché local (gHistories)
        gHistories.push({
            id: Date.now(),
            ticket_id: ticketId,
            estado: newStatus,
            creado_por: currentUser.id,
            nota: `Cambio de estado a ${STATUS_META[newStatus]?.label || newStatus}`,
            created_at: new Date().toISOString()
        });

        closeModal('modal-ticket-detail');
        toast(`Estado cambiado a ${STATUS_META[newStatus]?.label || newStatus}`, 'success');
        
        // Refrescar la vista actual
        navigate(currentView);
        buildNav();
        document.getElementById('nav-' + currentView)?.classList.add('active');
        
    } catch (e) {
        console.error('Error al cambiar estado:', e);
        toast('Error al cambiar estado: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Agrega un comentario a un ticket
 * @param {string} ticketId - ID del ticket
 */
async function addComment(ticketId) {
    const ta = document.getElementById('new-comment-' + ticketId);
    const text = ta?.value?.trim();
    
    if (!text) {
        toast('Escribe un comentario.', 'error');
        return;
    }

    showLoading(true);
    try {
        // Insertar comentario en Supabase
        const { data: newComment, error } = await supabase
            .from('comentarios')
            .insert({
                ticket_id: ticketId,
                autor_id: currentUser.id,
                comentario: text,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) throw error;

        // Limpiar textarea
        ta.value = '';
        
        // Actualizar caché local
        gComments.push(newComment);
        
        // Actualizar la lista de comentarios si el modal está abierto
        const commentsList = document.getElementById('comments-list-' + ticketId);
        if (commentsList) {
            commentsList.innerHTML = renderComments(ticketId);
        }
        
        toast('Comentario agregado.', 'success');
        
    } catch (e) {
        console.error('Error al agregar comentario:', e);
        toast('Error al agregar comentario: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

function openNewTicketModal() {
    ['nt-title', 'nt-accion'].forEach(id => document.getElementById(id).value = '');
    ['nt-title-err', 'nt-accion-err'].forEach(id => document.getElementById(id).classList.remove('show'));
    openModal('modal-new-ticket');
    setTimeout(() => document.getElementById('nt-title').focus(), 120);
}

/**
 * Crea un nuevo ticket
 */
async function submitNewTicket() {
    const title = document.getElementById('nt-title').value.trim();
    const accion = document.getElementById('nt-accion').value.trim();
    let valid = true;
    
    if (!title) {
        document.getElementById('nt-title-err').classList.add('show');
        valid = false;
    } else {
        document.getElementById('nt-title-err').classList.remove('show');
    }
    
    if (!accion) {
        document.getElementById('nt-accion-err').classList.add('show');
        valid = false;
    } else {
        document.getElementById('nt-accion-err').classList.remove('show');
    }
    
    if (!valid) return;

    showLoading(true);
    try {
        // Insertar ticket (el ID se genera automáticamente por la base de datos)
        const { data: newTicket, error } = await supabase
            .from('tickets')
            .insert({
                titulo: title,
                descripcion: accion,
                prioridad: document.getElementById('nt-prio').value,
                categoria: document.getElementById('nt-cat').value,
                departamento: document.getElementById('nt-dep').value,
                solicitante_id: currentUser.id,
                status: 'nuevo',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Insertar en historial
        const { error: histError } = await supabase
            .from('ticket_historiales')
            .insert({
                ticket_id: newTicket.id,
                estado: 'nuevo',
                creado_por: currentUser.id,
                nota: 'Ticket creado',
                created_at: new Date().toISOString()
            });
        if (histError) throw histError;

        // Actualizar caché local
        gTickets.unshift(newTicket);
        gHistories.push({
            id: Date.now(),
            ticket_id: newTicket.id,
            estado: 'nuevo',
            creado_por: currentUser.id,
            nota: 'Ticket creado',
            created_at: new Date().toISOString()
        });

        closeModal('modal-new-ticket');
        toast(`Ticket ${newTicket.id} creado.`, 'success');
        navigate(currentView);
        buildNav();
        document.getElementById('nav-' + currentView)?.classList.add('active');
        
    } catch (e) {
        console.error('Error al crear ticket:', e);
        toast('Error al crear ticket: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function openAssignModal(ticketId) {
    currentAssignTicketId = ticketId;
    const t = gTickets.find(x => x.id === ticketId);
    document.getElementById('assign-desc').textContent = `${ticketId}: ${t?.titulo || ''}`;
    
    // Obtener admins
    const admins = gUsers.filter(u => u.rol === 'admin');
    
    document.getElementById('assign-tech').innerHTML = admins.map(a => 
        `<option value="${a.id}">${a.nombre}</option>`
    ).join('');
    
    document.getElementById('assign-note').value = '';
    openModal('modal-assign');
}

/**
 * Confirma la asignación de un ticket a un técnico
 */
async function confirmAssign() {
    const techId = document.getElementById('assign-tech').value;
    const note = document.getElementById('assign-note').value.trim();
    const ticketId = currentAssignTicketId;
    
    if (!ticketId) {
        toast('Error: ID de ticket no válido', 'error');
        return;
    }

    showLoading(true);
    try {
        // Buscar ticket en caché local
        const ticket = gTickets.find(t => t.id === ticketId);
        if (!ticket) throw new Error('Ticket no encontrado');

        // Determinar nuevo estado (si era nuevo, pasa a en_asignacion)
        const newStatus = ticket.status === 'nuevo' ? 'en_asignacion' : ticket.status;

        // Actualizar ticket en Supabase
        const { error: updateError } = await supabase
            .from('tickets')
            .update({ 
                asignado_id: techId, 
                status: newStatus, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', ticketId);
            
        if (updateError) throw updateError;

        // Obtener nombre del técnico
        const techName = getUserName(techId);
        
        // Insertar en historial
        const { error: histError } = await supabase
            .from('ticket_historiales')
            .insert({
                ticket_id: ticketId,
                estado: newStatus,
                creado_por: currentUser.id,
                nota: note || `Asignado a ${techName}`,
                created_at: new Date().toISOString()
            });
            
        if (histError) throw histError;

        // Actualizar caché local
        ticket.asignado_id = techId;
        ticket.status = newStatus;
        ticket.updated_at = new Date().toISOString();
        
        gHistories.push({
            id: Date.now(),
            ticket_id: ticketId,
            estado: newStatus,
            creado_por: currentUser.id,
            nota: note || `Asignado a ${techName}`,
            created_at: new Date().toISOString()
        });

        closeModal('modal-assign');
        toast(`Asignado a ${techName}.`, 'success');
        
        // Refrescar la vista actual
        navigate(currentView);
        buildNav();
        document.getElementById('nav-' + currentView)?.classList.add('active');
        
    } catch (e) {
        console.error('Error al asignar ticket:', e);
        toast('Error al asignar: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function renderMyTickets() {
    const el = document.getElementById('view-my-tickets');
    const myT = gTickets.filter(t => t.solicitante_id === currentUser.id);
    
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
    const myT = gTickets.filter(t => t.solicitante_id === currentUser.id);
    const filtered = status === 'all' ? myT : myT.filter(t => t.status === status);
    document.getElementById('my-tickets-inner').innerHTML = renderMyTicketsInner(filtered);
}

function renderMyTicketsInner(tickets) {
    if (!tickets.length) {
        return `<div class="empty-state">
            <h3>Sin tickets en este estado</h3>
            <p>Aún no tienes solicitudes aquí.</p>
        </div>`;
    }
    
    return tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(t => {
        const asig = t.asignado_id ? getUserById(t.asignado_id) : null;
        return `<div class="panel" style="margin-bottom:10px;cursor:pointer" onclick="openTicketDetail('${t.id}')" tabindex="0" onkeydown="if(event.key==='Enter')openTicketDetail('${t.id}')">
            <div class="panel-body">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
                    <div>
                        <div style="font-family:var(--font-mono);font-size:.7rem;color:var(--verde-med);margin-bottom:4px">${t.id}</div>
                        <div style="font-weight:700;font-size:.93rem;margin-bottom:6px">${t.titulo}</div>
                        <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
                            <span class="badge badge-${t.status}">${STATUS_META[t.status]?.label || t.status}</span>
                            <span class="badge badge-${t.prioridad}">${PRIO_META[t.prioridad]?.label || t.prioridad}</span>
                            ${t.categoria ? `<span style="font-size:.73rem;color:var(--text3)">${t.categoria}</span>` : ''}
                        </div>
                    </div>
                    <div style="text-align:right;font-size:.76rem;color:var(--text3)">
                        <div style="margin-bottom:3px;font-family:var(--font-mono)">${fmtDateShort(t.created_at)}</div>
                        <div>${asig ? `Técnico: <strong style="color:var(--text2)">${asig.nombre.split(' ')[0]}</strong>` : 'Sin asignar'}</div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}