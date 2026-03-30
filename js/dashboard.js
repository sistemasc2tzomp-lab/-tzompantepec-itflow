// ══════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════

async function renderDashboard() {
    const el = document.getElementById('view-dashboard');
    
    showLoading(true);
    
    // Cargar datos necesarios
    const allTickets = await loadTickets();
    const tickets = isAdmin() ? allTickets : allTickets.filter(t => t.solicitante_id === currentUser.id);
    const users = await loadUsers();
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);
    
    // Cargar historial reciente
    let recentHistory = [];
    if (isSupabaseConnected()) {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('ticket_historiales')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (!error) recentHistory = data || [];
    } else {
        // Modo demo - usar caché local
        recentHistory = window.gHistories.slice(0, 5);
    }
    
    showLoading(false);
    
    if (isAdmin()) {
        renderAdminDashboard(el, tickets, userMap, recentHistory);
    } else {
        renderUserDashboard(el, tickets, userMap);
    }
}

function renderAdminDashboard(el, tickets, userMap, recentHistory) {
    const counts = {};
    Object.keys(STATUS_META).forEach(s => counts[s] = tickets.filter(x => x.status === s).length);
    
    const active = tickets.filter(x => !['cerrado', 'cancelado'].includes(x.status)).length;
    const critical = tickets.filter(x => x.prioridad === 'crítica' && !['cerrado', 'cancelado', 'atendido'].includes(x.status)).length;
    const unassigned = tickets.filter(x => !x.asignado_id && x.status === 'nuevo').length;
    const myOpen = tickets.filter(x => x.asignado_id === currentUser.id && !['cerrado', 'cancelado', 'atendido'].includes(x.status)).length;

    el.innerHTML = `
        <h2 style="font-family:var(--font-display);font-size:1.5rem;color:var(--verde);margin-bottom:4px">
            Bienvenido, ${currentUser.nombre.split(' ')[0]}
        </h2>
        <p class="section-sub">Resumen operativo — H. Ayuntamiento de Tzompantepec</p>

        <div class="metrics-grid">
            ${mCard('#1a5c3a', '#e8f5ee', active, 'Tickets activos', 'En curso', iTicket('18'))}
            ${mCard('#c0392b', '#fff1f2', critical, 'Críticos', 'Atención inmediata', iAlert('18'))}
            ${mCard('#d97706', '#fffbeb', unassigned, 'Sin asignar', 'Requieren técnico', iClock('18'))}
            ${mCard('#1f618d', '#eff6ff', myOpen, 'Mis asignados', 'Asignados a mí', iUser('18'))}
            ${mCard('#16a34a', '#f0fdf4', counts.atendido || 0, 'Atendidos', 'Resueltos', iCheck('18'))}
            ${mCard('#6b7280', '#f3f4f6', counts.cerrado || 0, 'Cerrados', 'Finalizados', iX('18'))}
        </div>

        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-card-title">${iTicket('16')} Distribución por estado</div>
                <div class="chart-wrap"><canvas id="chart-status"></canvas></div>
            </div>
            <div class="chart-card">
                <div class="chart-card-title">${iAlert('16')} Tickets por prioridad</div>
                <div class="chart-wrap"><canvas id="chart-prio"></canvas></div>
            </div>
        </div>

        <div class="grid-2">
            <div class="panel">
                <div class="panel-header">
                    <div class="panel-title">${iClock('15')} Actividad reciente</div>
                </div>
                <div class="panel-body" style="padding-top:8px">
                    <div class="activity-feed">
                        ${recentHistory.length === 0 ? '<p style="color:var(--text3);padding:10px">No hay actividad reciente</p>' :
                            recentHistory.map(h => {
                                const ticket = tickets.find(t => t.id === h.ticket_id);
                                const actor = userMap[h.creado_por];
                                const sm = STATUS_META[h.estado] || { dot: '#999', label: h.estado };
                                return `<div class="activity-item">
                                    <div class="activity-dot" style="background:${sm.dot}"></div>
                                    <div>
                                        <div class="activity-text"><strong>${actor?.nombre || '—'}</strong> → <span style="color:${sm.color}">${sm.label}</span> en <strong>${ticket?.id || h.ticket_id}</strong></div>
                                        <div class="activity-time">${fmtDate(h.created_at)}</div>
                                    </div>
                                </div>`;
                            }).join('')}
                    </div>
                </div>
            </div>

            <div class="panel">
                <div class="panel-header">
                    <div class="panel-title">${iTicket('15')} Tickets sin asignar</div>
                    <button class="btn btn-sm btn-outline-verde" onclick="navigate('tickets')">Ver todos</button>
                </div>
                <div class="panel-body" style="padding:0">
                    ${renderTicketTableInner(tickets.filter(x => x.status === 'nuevo' && !x.asignado_id), true)}
                </div>
            </div>
        </div>`;

    setTimeout(() => {
        renderChartStatus(counts);
        renderChartPrio(tickets);
    }, 80);
}

function renderChartStatus(counts) {
    const ctx = document.getElementById('chart-status');
    if (!ctx) return;
    
    if (dashCharts.status) dashCharts.status.destroy();
    
    const labels = Object.values(STATUS_META).map(s => s.label);
    const data = Object.keys(STATUS_META).map(k => counts[k] || 0);
    const colors = Object.values(STATUS_META).map(s => s.dot);
    
    dashCharts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { family: 'DM Sans', size: 11 },
                        color: '#5a5548',
                        boxWidth: 12
                    }
                }
            }
        }
    });
}

function renderChartPrio(tickets) {
    const ctx = document.getElementById('chart-prio');
    if (!ctx) return;
    
    if (dashCharts.prio) dashCharts.prio.destroy();
    
    const statuses = Object.keys(STATUS_META);
    const priorities = ['baja', 'media', 'alta', 'crítica'];
    
    const datasets = priorities.map(p => ({
        label: PRIO_META[p].label,
        data: statuses.map(s => tickets.filter(t => t.prioridad === p && t.status === s).length),
        backgroundColor: PRIO_META[p].color + '99',
        borderColor: PRIO_META[p].color,
        borderWidth: 1,
    }));
    
    dashCharts.prio = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: statuses.map(s => STATUS_META[s].label),
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'DM Sans', size: 10 },
                        color: '#5a5548',
                        boxWidth: 10
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: '#9a9082', font: { size: 10, family: 'DM Sans' } },
                    grid: { color: 'rgba(0,0,0,0.04)' }
                },
                y: {
                    stacked: true,
                    ticks: { color: '#9a9082', font: { size: 10, family: 'DM Sans' } },
                    grid: { color: 'rgba(0,0,0,0.06)' }
                }
            }
        }
    });
}

function renderUserDashboard(el, tickets, userMap) {
    const myT = tickets.filter(t => t.solicitante_id === currentUser.id);
    const active = myT.filter(x => !['cerrado', 'cancelado'].includes(x.status));
    const counts = {};
    Object.keys(STATUS_META).forEach(s => counts[s] = myT.filter(x => x.status === s).length);

    el.innerHTML = `
        <h2 style="font-family:var(--font-display);font-size:1.4rem;color:var(--verde);margin-bottom:4px">
            Hola, ${currentUser.nombre.split(' ')[0]}
        </h2>
        <p class="section-sub">Estado de tus solicitudes de soporte — ${currentUser.departamento || ''}</p>
        <div class="metrics-grid">
            ${mCard('#1a5c3a', '#e8f5ee', active.length, 'Activos', 'En curso', iTicket('18'))}
            ${mCard('#16a34a', '#f0fdf4', counts.atendido || 0, 'Atendidos', 'Resueltos', iCheck('18'))}
            ${mCard('#e11d48', '#fff1f2', counts.pendiente || 0, 'Pendientes', 'En espera', iClock('18'))}
            ${mCard('#6b7280', '#f3f4f6', counts.cerrado || 0, 'Cerrados', 'Finalizados', iX('18'))}
        </div>
        <div class="panel">
            <div class="panel-header">
                <div class="panel-title">${iTicket('15')} Mis tickets recientes</div>
                <button class="btn btn-sm btn-outline-verde" onclick="navigate('my-tickets')">Ver todos</button>
            </div>
            <div class="panel-body" style="padding:0">
                ${renderTicketTableInner(myT.slice(0, 5), false)}
            </div>
        </div>`;
}