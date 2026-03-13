// ══════════════════════════════════════════
// TABLERO KANBAN
// ══════════════════════════════════════════

async function renderKanban() {
    const el = document.getElementById('view-kanban');
    
    showLoading(true);
    
    // Cargar tickets y usuarios
    const tickets = await loadTickets();
    const users = await loadUsers();
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);
    
    showLoading(false);
    
    el.innerHTML = `
        <p class="section-sub">Vista de flujo completo de tickets</p>
        <div class="kanban">
            ${Object.entries(STATUS_META).map(([key, meta]) => {
                const cols = tickets.filter(t => isAdmin() ? t.status === key : t.solicitante_id === currentUser.id && t.status === key);
                return `<div class="kol">
                    <div class="kol-head">
                        <div class="kol-title"><div class="kol-dot" style="background:${meta.dot}"></div>${meta.label}</div>
                        <span class="kol-count">${cols.length}</span>
                    </div>
                    <div class="kol-cards">
                        ${cols.length === 0 ? `<div class="kcard-empty">Sin tickets</div>` :
                            cols.map(t => {
                                const asig = t.asignado_id ? userMap[t.asignado_id] : null;
                                const ini = asig ? asig.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '—';
                                return `<div class="kcard" onclick="openTicketDetail('${t.id}')" tabindex="0" onkeydown="if(event.key==='Enter')openTicketDetail('${t.id}')">
                                    <div class="kcard-id">${t.id}</div>
                                    <div class="kcard-title">${t.titulo}</div>
                                    <div class="kcard-foot">
                                        <span class="badge badge-${t.prioridad}">${PRIO_META[t.prioridad]?.label || t.prioridad}</span>
                                        <div class="kcard-ava" title="${asig ? asig.nombre : 'Sin asignar'}">${ini}</div>
                                    </div>
                                </div>`;
                            }).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
}