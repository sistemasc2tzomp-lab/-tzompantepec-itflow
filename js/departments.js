// ══════════════════════════════════════════
// DEPARTAMENTOS
// ══════════════════════════════════════════

const DEPARTAMENTOS = [
    'Presidencia Municipal',
    'Secretaría del Ayuntamiento',
    'Tesorería',
    'Administración',
    'Recursos Humanos',
    'Obras Públicas',
    'Seguridad Pública',
    'Registro Civil',
    'Servicios Municipales',
    'Contraloría',
    'Comunicación Social',
    'Desarrollo Social',
    'Desarrollo Económico',
    'Medio Ambiente',
    'Jurídico',
    'TI / Sistemas'
];

// Íconos por departamento
const DEPT_ICONS = {
    'Presidencia Municipal':    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    'Tesorería':                'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    'Seguridad Pública':        'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    'TI / Sistemas':            'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    'default':                  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
};

function getDeptIcon(dep) {
    return DEPT_ICONS[dep] || DEPT_ICONS['default'];
}

async function renderDepartamentos() {
    const el = document.getElementById('view-departamentos');

    showLoading(true);
    const tickets = await loadTickets();
    const users   = await loadUsers();
    showLoading(false);

    // Totales globales
    const totalTickets = tickets.length;
    const totalActivos = tickets.filter(t => !['cerrado','cancelado'].includes(t.status)).length;
    const totalCerrados = tickets.filter(t => t.status === 'cerrado').length;

    el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:10px">
        <h2 style="font-family:var(--font-display);font-size:1.4rem;color:var(--verde);margin:0">Departamentos</h2>
    </div>
    <p class="section-sub">Áreas del H. Ayuntamiento de Tzompantepec — ${DEPARTAMENTOS.length} departamentos</p>

    <!-- Resumen global -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px">
        ${[
            { label:'Total tickets', val: totalTickets, color:'var(--verde)' },
            { label:'Activos', val: totalActivos, color:'var(--tierra)' },
            { label:'Cerrados', val: totalCerrados, color:'var(--success)' },
            { label:'Departamentos', val: DEPARTAMENTOS.length, color:'var(--verde-med)' }
        ].map(s => `
            <div class="panel" style="text-align:center;padding:14px 10px">
                <div style="font-family:var(--font-display);font-size:1.8rem;color:${s.color}">${s.val}</div>
                <div style="font-size:.74rem;color:var(--text3);margin-top:2px">${s.label}</div>
            </div>`).join('')}
    </div>

    <!-- Grid de departamentos -->
    <div class="dept-grid">
        ${DEPARTAMENTOS.map(dep => {
            const deptTickets = tickets.filter(t => t.departamento === dep);
            const active      = deptTickets.filter(t => !['cerrado','cancelado'].includes(t.status));
            const cerrados    = deptTickets.filter(t => t.status === 'cerrado');
            const criticos    = deptTickets.filter(t => t.prioridad === 'crítica' && !['cerrado','cancelado'].includes(t.status));
            const deptUsers   = users.filter(u => u.departamento === dep);
            const icon        = getDeptIcon(dep);
            const pct         = deptTickets.length > 0 ? Math.round((cerrados.length / deptTickets.length) * 100) : 0;

            return `<div class="dept-card">
                <div class="dept-card-header">
                    <div class="dept-icon">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--verde)" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="${icon}"/>
                        </svg>
                    </div>
                    <div>
                        <div class="dept-name">${dep}</div>
                        <div style="font-size:.72rem;color:var(--text3)">${deptUsers.length} usuario${deptUsers.length !== 1 ? 's' : ''}</div>
                    </div>
                    ${criticos.length > 0 ? `<span class="badge badge-crítica" style="margin-left:auto;font-size:.68rem">${criticos.length} crítico${criticos.length > 1 ? 's' : ''}</span>` : ''}
                </div>

                <div class="dept-stats">
                    <div class="dept-stat"><div class="dept-stat-val">${deptTickets.length}</div><div class="dept-stat-label">Total</div></div>
                    <div class="dept-stat"><div class="dept-stat-val" style="color:var(--tierra)">${active.length}</div><div class="dept-stat-label">Activos</div></div>
                    <div class="dept-stat"><div class="dept-stat-val" style="color:var(--success)">${cerrados.length}</div><div class="dept-stat-label">Cerrados</div></div>
                </div>

                ${deptTickets.length > 0 ? `
                <div style="margin-top:10px">
                    <div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--text3);margin-bottom:3px">
                        <span>Resolución</span><span>${pct}%</span>
                    </div>
                    <div style="background:var(--surface2);border-radius:4px;height:5px;overflow:hidden">
                        <div style="background:var(--verde);height:100%;width:${pct}%;transition:width .4s ease;border-radius:4px"></div>
                    </div>
                </div>` : ''}

                ${deptUsers.length > 0 ? `
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
                    <div style="font-size:.7rem;color:var(--text3);margin-bottom:5px">Usuarios</div>
                    <div style="display:flex;flex-wrap:wrap;gap:4px">
                        ${deptUsers.slice(0,4).map(u => {
                            const ini = u.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
                            return `<div class="kcard-ava" style="width:24px;height:24px;font-size:.6rem;title='${u.nombre}'">${ini}</div>`;
                        }).join('')}
                        ${deptUsers.length > 4 ? `<div class="kcard-ava" style="width:24px;height:24px;font-size:.6rem;background:var(--surface2);color:var(--text3)">+${deptUsers.length-4}</div>` : ''}
                    </div>
                </div>` : ''}
            </div>`;
        }).join('')}
    </div>`;
}
