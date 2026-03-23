// ══════════════════════════════════════════
// REPORTES DEL SISTEMA
// ══════════════════════════════════════════

async function renderReportes() {
    if (!isAdmin()) {
        toast('Acceso no autorizado', 'error');
        navigate('dashboard');
        return;
    }

    const el = document.getElementById('view-reportes');
    showLoading(true);
    await loadFromSupabase();
    showLoading(false);

    const tickets  = window.gTickets  || [];
    const users    = window.gUsers    || [];
    const histories= window.gHistories|| [];

    // ── Métricas globales ──────────────────
    const total     = tickets.length;
    const abiertos  = tickets.filter(t => !['cerrado','cancelado'].includes(t.status)).length;
    const cerrados  = tickets.filter(t => t.status === 'cerrado').length;
    const cancelados= tickets.filter(t => t.status === 'cancelado').length;
    const criticos  = tickets.filter(t => t.prioridad === 'crítica' && !['cerrado','cancelado'].includes(t.status)).length;
    const sinAsignar= tickets.filter(t => !t.asignado_id && !['cerrado','cancelado'].includes(t.status)).length;
    const tasaRes   = total > 0 ? Math.round((cerrados/total)*100) : 0;

    // ── Tickets por estado ─────────────────
    const porEstado = Object.entries(STATUS_META).map(([k,v]) => ({
        label: v.label, count: tickets.filter(t => t.status === k).length, color: v.color || v.dot
    })).filter(x => x.count > 0);

    // ── Tickets por prioridad ──────────────
    const porPrio = Object.entries(PRIO_META).map(([k,v]) => ({
        label: v.label, count: tickets.filter(t => t.prioridad === k).length
    })).filter(x => x.count > 0);

    // ── Tickets por departamento ───────────
    const porDepto = (typeof DEPARTAMENTOS !== 'undefined' ? DEPARTAMENTOS : []).map(dep => ({
        dep,
        total:    tickets.filter(t => t.departamento === dep).length,
        activos:  tickets.filter(t => t.departamento === dep && !['cerrado','cancelado'].includes(t.status)).length,
        cerrados: tickets.filter(t => t.departamento === dep && t.status === 'cerrado').length
    })).filter(x => x.total > 0).sort((a,b) => b.total - a.total);

    // ── Tickets por técnico ────────────────
    const tecnicos = users.filter(u => u.rol === 'admin');
    const porTecnico = tecnicos.map(u => ({
        nombre:    u.nombre,
        email:     u.email,
        asignados: tickets.filter(t => t.asignado_id === u.id).length,
        activos:   tickets.filter(t => t.asignado_id === u.id && !['cerrado','cancelado'].includes(t.status)).length,
        cerrados:  tickets.filter(t => t.asignado_id === u.id && t.status === 'cerrado').length
    })).sort((a,b) => b.asignados - a.asignados);

    // ── Actividad reciente (7 días) ────────
    const hace7 = new Date(); hace7.setDate(hace7.getDate()-7);
    const recientes = tickets.filter(t => new Date(t.created_at) > hace7).length;

    el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:10px">
        <div>
            <h2 style="font-family:var(--font-display);font-size:1.4rem;color:var(--verde);margin:0">Reportes</h2>
            <p class="section-sub" style="margin-top:2px">Repositorio de datos del sistema — ${new Date().toLocaleDateString('es-MX',{dateStyle:'long'})}</p>
        </div>
        <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-outline-verde" onclick="exportReportExcel()">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Exportar Excel
            </button>
            <button class="btn btn-sm btn-outline-verde" onclick="exportReportPDF()">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                Exportar PDF
            </button>
        </div>
    </div>

    <!-- KPIs principales -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:24px">
        ${[
            { label:'Total tickets',    val: total,     color:'var(--verde)',     icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2' },
            { label:'Abiertos',         val: abiertos,  color:'var(--tierra)',    icon:'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label:'Cerrados',         val: cerrados,  color:'#16a34a',          icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label:'Tasa resolución',  val: tasaRes+'%', color:'var(--verde-med)', icon:'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { label:'Críticos activos', val: criticos,  color:'#e11d48',          icon:'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            { label:'Sin asignar',      val: sinAsignar,color:'#d97706',          icon:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { label:'Últimos 7 días',   val: recientes, color:'var(--verde)',      icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { label:'Usuarios',         val: users.length, color:'var(--verde-med)', icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' }
        ].map(k => `
            <div class="panel" style="text-align:center;padding:14px 8px">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="${k.color}" stroke-width="2" style="margin-bottom:6px">
                    <path stroke-linecap="round" stroke-linejoin="round" d="${k.icon}"/>
                </svg>
                <div style="font-family:var(--font-display);font-size:1.6rem;color:${k.color};line-height:1">${k.val}</div>
                <div style="font-size:.7rem;color:var(--text3);margin-top:3px">${k.label}</div>
            </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">

        <!-- Por estado -->
        <div class="panel">
            <div class="panel-header"><div class="panel-title">Distribución por estado</div></div>
            <div class="panel-body">
                ${porEstado.map(s => `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
                    <div style="flex:1">
                        <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:3px">
                            <span style="color:var(--text2)">${s.label}</span>
                            <span style="font-weight:600;color:var(--text)">${s.count}</span>
                        </div>
                        <div style="background:var(--surface2);border-radius:4px;height:6px">
                            <div style="background:${s.color};height:100%;width:${total>0?Math.round((s.count/total)*100):0}%;border-radius:4px;transition:width .4s"></div>
                        </div>
                    </div>
                    <span style="font-size:.72rem;color:var(--text3);width:30px;text-align:right">${total>0?Math.round((s.count/total)*100):0}%</span>
                </div>`).join('')}
            </div>
        </div>

        <!-- Por prioridad -->
        <div class="panel">
            <div class="panel-header"><div class="panel-title">Distribución por prioridad</div></div>
            <div class="panel-body">
                ${porPrio.map(p => `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
                    <div style="flex:1">
                        <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:3px">
                            <span style="color:var(--text2)">${p.label}</span>
                            <span style="font-weight:600">${p.count}</span>
                        </div>
                        <div style="background:var(--surface2);border-radius:4px;height:6px">
                            <div style="background:var(--verde);height:100%;width:${total>0?Math.round((p.count/total)*100):0}%;border-radius:4px;transition:width .4s"></div>
                        </div>
                    </div>
                    <span style="font-size:.72rem;color:var(--text3);width:30px;text-align:right">${total>0?Math.round((p.count/total)*100):0}%</span>
                </div>`).join('')}
                ${porPrio.length===0 ? '<p style="color:var(--text3);font-size:.83rem">Sin datos.</p>' : ''}
            </div>
        </div>
    </div>

    <!-- Por departamento -->
    <div class="panel" style="margin-bottom:16px">
        <div class="panel-header"><div class="panel-title">Tickets por departamento</div></div>
        <div class="panel-body">
            ${porDepto.length === 0 ? '<p style="color:var(--text3);font-size:.83rem">Sin tickets registrados.</p>' : `
            <div class="table-wrap">
                <table class="tickets-table" style="font-size:.82rem">
                    <thead><tr>
                        <th>Departamento</th>
                        <th style="text-align:center">Total</th>
                        <th style="text-align:center">Activos</th>
                        <th style="text-align:center">Cerrados</th>
                        <th>Resolución</th>
                    </tr></thead>
                    <tbody>
                        ${porDepto.map(d => {
                            const pct = d.total > 0 ? Math.round((d.cerrados/d.total)*100) : 0;
                            return `<tr>
                                <td style="font-weight:500">${d.dep}</td>
                                <td style="text-align:center">${d.total}</td>
                                <td style="text-align:center;color:var(--tierra)">${d.activos}</td>
                                <td style="text-align:center;color:#16a34a">${d.cerrados}</td>
                                <td>
                                    <div style="display:flex;align-items:center;gap:7px">
                                        <div style="flex:1;background:var(--surface2);border-radius:4px;height:6px">
                                            <div style="background:var(--verde);height:100%;width:${pct}%;border-radius:4px"></div>
                                        </div>
                                        <span style="font-size:.72rem;color:var(--text3);width:30px">${pct}%</span>
                                    </div>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`}
        </div>
    </div>

    <!-- Por técnico -->
    <div class="panel" style="margin-bottom:16px">
        <div class="panel-header"><div class="panel-title">Rendimiento por técnico</div></div>
        <div class="panel-body">
            ${porTecnico.length === 0 ? '<p style="color:var(--text3);font-size:.83rem">Sin técnicos registrados.</p>' : `
            <div class="table-wrap">
                <table class="tickets-table" style="font-size:.82rem">
                    <thead><tr>
                        <th>Técnico</th>
                        <th>Correo</th>
                        <th style="text-align:center">Asignados</th>
                        <th style="text-align:center">Activos</th>
                        <th style="text-align:center">Cerrados</th>
                        <th>Eficiencia</th>
                    </tr></thead>
                    <tbody>
                        ${porTecnico.map(t => {
                            const pct = t.asignados > 0 ? Math.round((t.cerrados/t.asignados)*100) : 0;
                            const ini = t.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
                            return `<tr>
                                <td>
                                    <div style="display:flex;align-items:center;gap:7px">
                                        <div class="kcard-ava" style="width:26px;height:26px;font-size:.62rem">${ini}</div>
                                        <span style="font-weight:500">${t.nombre}</span>
                                    </div>
                                </td>
                                <td style="color:var(--text3);font-size:.77rem">${t.email}</td>
                                <td style="text-align:center">${t.asignados}</td>
                                <td style="text-align:center;color:var(--tierra)">${t.activos}</td>
                                <td style="text-align:center;color:#16a34a">${t.cerrados}</td>
                                <td>
                                    <div style="display:flex;align-items:center;gap:7px">
                                        <div style="flex:1;background:var(--surface2);border-radius:4px;height:6px">
                                            <div style="background:var(--verde);height:100%;width:${pct}%;border-radius:4px"></div>
                                        </div>
                                        <span style="font-size:.72rem;color:var(--text3);width:30px">${pct}%</span>
                                    </div>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`}
        </div>
    </div>

    <!-- Todos los usuarios -->
    <div class="panel" style="margin-bottom:16px">
        <div class="panel-header"><div class="panel-title">Directorio de usuarios (${users.length})</div></div>
        <div class="panel-body">
            <div class="table-wrap">
                <table class="tickets-table" style="font-size:.82rem">
                    <thead><tr>
                        <th>Usuario</th><th>Correo</th><th>Rol</th><th>Departamento</th>
                        <th style="text-align:center">Tickets solicitados</th>
                        <th style="text-align:center">Tickets asignados</th>
                    </tr></thead>
                    <tbody>
                        ${users.map(u => {
                            const sol = tickets.filter(t => t.solicitante_id === u.id).length;
                            const asig= tickets.filter(t => t.asignado_id === u.id).length;
                            const ini = u.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
                            const isAdm = u.rol === 'admin';
                            return `<tr>
                                <td>
                                    <div style="display:flex;align-items:center;gap:7px">
                                        <div class="kcard-ava" style="width:26px;height:26px;font-size:.62rem;background:${isAdm?'var(--verde)':'var(--tierra)'}">${ini}</div>
                                        <span style="font-weight:500">${u.nombre}</span>
                                    </div>
                                </td>
                                <td style="color:var(--text3);font-size:.77rem">${u.email}</td>
                                <td><span class="badge badge-${isAdm?'admin':'usuario'}-role">${isAdm?'Admin TI':'Usuario'}</span></td>
                                <td style="color:var(--text2)">${u.departamento||'—'}</td>
                                <td style="text-align:center">${sol}</td>
                                <td style="text-align:center">${asig}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

// ── Exportar Excel ───────────────────────
async function exportReportExcel() {
    if (typeof XLSX === 'undefined') { toast('XLSX no disponible', 'error'); return; }
    const tickets  = window.gTickets  || [];
    const users    = window.gUsers    || [];
    const wb = XLSX.utils.book_new();

    // Hoja 1: Tickets
    const ticketData = [
        ['ID','Título','Estado','Prioridad','Categoría','Departamento','Solicitante','Técnico asignado','Tiene imagen','Fecha creación','Última actualización'],
        ...tickets.map(t => [
            t.id, t.titulo,
            STATUS_META[t.status]?.label||t.status,
            PRIO_META[t.prioridad]?.label||t.prioridad,
            t.categoria||'—', t.departamento||'—',
            getUserName(t.solicitante_id),
            t.asignado_id ? getUserName(t.asignado_id) : '—',
            t.imagen_url ? 'Sí' : 'No',
            new Date(t.created_at).toLocaleString('es-MX'),
            new Date(t.updated_at).toLocaleString('es-MX')
        ])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ticketData), 'Tickets');

    // Hoja 2: Usuarios
    const userData = [
        ['Nombre','Correo','Rol','Departamento','Tickets solicitados','Tickets asignados'],
        ...users.map(u => [
            u.nombre, u.email,
            u.rol === 'admin' ? 'Administrador TI' : 'Usuario',
            u.departamento||'—',
            tickets.filter(t => t.solicitante_id === u.id).length,
            tickets.filter(t => t.asignado_id === u.id).length
        ])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(userData), 'Usuarios');

    // Hoja 3: Por departamento
    const deptData = [
        ['Departamento','Total tickets','Activos','Cerrados','% Resolución'],
        ...(typeof DEPARTAMENTOS !== 'undefined' ? DEPARTAMENTOS : []).map(dep => {
            const dt = tickets.filter(t => t.departamento === dep);
            const cer= dt.filter(t => t.status === 'cerrado').length;
            return [dep, dt.length, dt.filter(t=>!['cerrado','cancelado'].includes(t.status)).length, cer, dt.length>0?Math.round((cer/dt.length)*100)+'%':'0%'];
        })
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deptData), 'Departamentos');

    const fecha = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `reporte_itsm_${fecha}.xlsx`);
    toast('Reporte Excel generado.', 'success');
}

// ── Exportar PDF ─────────────────────────
async function exportReportPDF() {
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') { toast('jsPDF no disponible', 'error'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const tickets = window.gTickets || [];
    const users   = window.gUsers   || [];
    const fecha   = new Date().toLocaleDateString('es-MX', { dateStyle: 'long' });

    doc.setFontSize(18); doc.setTextColor(22, 101, 52);
    doc.text('Mesa de Servicios TI', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`H. Ayuntamiento de Tzompantepec, Tlaxcala`, 14, 27);
    doc.text(`Reporte generado: ${fecha}`, 14, 33);

    let y = 42;
    const line = () => { doc.setDrawColor(220); doc.line(14, y, 196, y); y += 4; };

    const section = (title) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(12); doc.setTextColor(22,101,52);
        doc.text(title, 14, y); y += 3; line();
        doc.setFontSize(9); doc.setTextColor(50);
    };

    // Resumen
    section('Resumen General');
    const cerrados = tickets.filter(t => t.status === 'cerrado').length;
    const tasaRes  = tickets.length > 0 ? Math.round((cerrados/tickets.length)*100) : 0;
    [
        `Total de tickets: ${tickets.length}`,
        `Abiertos: ${tickets.filter(t=>!['cerrado','cancelado'].includes(t.status)).length}`,
        `Cerrados: ${cerrados}`,
        `Tasa de resolución: ${tasaRes}%`,
        `Críticos activos: ${tickets.filter(t=>t.prioridad==='crítica'&&!['cerrado','cancelado'].includes(t.status)).length}`,
        `Total de usuarios: ${users.length}`
    ].forEach(text => { doc.text(text, 14, y); y += 6; });
    y += 4;

    // Tickets recientes
    section('Últimos 10 Tickets');
    tickets.slice(0,10).forEach(t => {
        if (y > 270) { doc.addPage(); y = 20; }
        const line1 = `${t.id} — ${t.titulo.substring(0,50)}${t.titulo.length>50?'...':''}`;
        const line2 = `  Estado: ${STATUS_META[t.status]?.label||t.status}  |  Prioridad: ${PRIO_META[t.prioridad]?.label||t.prioridad}  |  ${t.departamento||'—'}`;
        doc.text(line1, 14, y); y += 5;
        doc.setTextColor(120); doc.text(line2, 14, y); doc.setTextColor(50); y += 7;
    });

    // Usuarios
    section('Directorio de Usuarios');
    users.forEach(u => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${u.nombre} (${u.rol==='admin'?'Admin TI':'Usuario'}) — ${u.email} — ${u.departamento||'—'}`, 14, y);
        y += 6;
    });

    const fechaFile = new Date().toISOString().slice(0,10);
    doc.save(`reporte_itsm_${fechaFile}.pdf`);
    toast('Reporte PDF generado.', 'success');
}
