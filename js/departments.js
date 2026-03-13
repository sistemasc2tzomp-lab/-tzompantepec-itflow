// ══════════════════════════════════════════
// DEPARTAMENTOS
// ══════════════════════════════════════════

const DEPARTAMENTOS = [
    'Presidencia Municipal',
    'Tesorería',
    'Administración',
    'Obras Públicas',
    'Seguridad Pública',
    'Registro Civil',
    'Servicios Municipales',
    'Contraloría',
    'Comunicación Social',
    'TI / Sistemas'
];

async function renderDepartamentos() {
    const el = document.getElementById('view-departamentos');
    
    showLoading(true);
    const tickets = await loadTickets();
    const users = await loadUsers();
    showLoading(false);
    
    el.innerHTML = '<h2 style="font-family:var(--font-display);font-size:1.4rem;color:var(--verde);margin-bottom:6px">Departamentos</h2>' +
        '<p class="section-sub">Áreas del H. Ayuntamiento de Tzompantepec</p>' +
        '<div class="dept-grid">' +
        DEPARTAMENTOS.map(dep => {
            const deptTickets = tickets.filter(t => t.departamento === dep);
            const active = deptTickets.filter(t => !['cerrado', 'cancelado'].includes(t.status));
            const deptUsers = users.filter(u => u.departamento === dep);
            
            return '<div class="dept-card">' +
                '<div class="dept-card-header">' +
                '<div class="dept-icon"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--verde)" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>' +
                '<div><div class="dept-name">' + dep + '</div>' +
                '<div style="font-size:.73rem;color:var(--text3);">' + deptUsers.length + ' usuario(s)</div></div>' +
                '</div>' +
                '<div class="dept-stats">' +
                '<div class="dept-stat"><div class="dept-stat-val">' + deptTickets.length + '</div><div class="dept-stat-label">Tickets</div></div>' +
                '<div class="dept-stat"><div class="dept-stat-val" style="color:var(--tierra)">' + active.length + '</div><div class="dept-stat-label">Activos</div></div>' +
                '<div class="dept-stat"><div class="dept-stat-val" style="color:var(--success)">' + (deptTickets.length - active.length) + '</div><div class="dept-stat-label">Cerrados</div></div>' +
                '</div>' +
                '</div>';
        }).join('') +
        '</div>';
}