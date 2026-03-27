// ══════════════════════════════════════════
// REPORTES — Exportación real a Excel y PDF
// Usa las librerías SheetJS (XLSX) y jsPDF
// que ya están cargadas en index.html
// ══════════════════════════════════════════

// ─────────────────────────────────────────
// RENDER VISTA REPORTES
// ─────────────────────────────────────────
async function renderReportes() {
    const el = document.getElementById('view-reportes');
    if (!el) return;

    const tickets  = window.gTickets  || [];
    const usuarios = window.gUsers    || [];
    const hoy      = new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });

    // Calcular métricas
    const total      = tickets.length;
    const abiertos   = tickets.filter(t => !['cerrado','cancelado'].includes(t.status)).length;
    const cerrados   = tickets.filter(t => t.status === 'cerrado').length;
    const criticos   = tickets.filter(t => t.prioridad === 'crítica' && !['cerrado','cancelado'].includes(t.status)).length;
    const sinAsignar = tickets.filter(t => !t.asignado_id).length;

    // Tickets últimos 7 días
    const hace7 = new Date(); hace7.setDate(hace7.getDate() - 7);
    const ultimos7 = tickets.filter(t => new Date(t.created_at) >= hace7).length;

    // Tasa de resolución
    const tasa = total > 0 ? Math.round((cerrados / total) * 100) : 0;

    // Por departamento
    const porDepto = {};
    tickets.forEach(t => {
        const d = t.departamento || 'Sin depto.';
        porDepto[d] = (porDepto[d] || 0) + 1;
    });
    const topDeptos = Object.entries(porDepto).sort((a,b) => b[1]-a[1]).slice(0, 5);

    // Por técnico
    const porTecnico = {};
    tickets.forEach(t => {
        if (!t.asignado_id) return;
        const nombre = getUserName(t.asignado_id);
        if (!porTecnico[nombre]) porTecnico[nombre] = { total:0, cerrados:0 };
        porTecnico[nombre].total++;
        if (t.status === 'cerrado') porTecnico[nombre].cerrados++;
    });

    el.innerHTML = `
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
            <div>
                <h2 style="font-size:1.1rem;font-weight:700;color:var(--text);margin:0">Reportes</h2>
                <p style="font-size:.83rem;color:var(--text2);margin:3px 0 0">
                    Repositorio de datos del sistema — ${hoy}
                </p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn-secondary btn-sm" onclick="exportarExcel()">
                    ↓ Exportar Excel
                </button>
                <button class="btn btn-secondary btn-sm" onclick="exportarPDF()">
                    ↓ Exportar PDF
                </button>
            </div>
        </div>

        <!-- Métricas principales -->
        <div class="metrics-grid" style="margin-bottom:20px">
            ${mCard('#1a5c38','#e8f5ee', total,    'Total tickets',     '',           iTicket('18'))}
            ${mCard('#2563eb','#eff6ff', abiertos,  'Abiertos',          '',           iClock('18'))}
            ${mCard('#16a34a','#f0fdf4', cerrados,  'Cerrados',          '',           iCheck('18'))}
            ${mCard('#d97706','#fefce8', tasa+'%',  'Tasa resolución',   '',           iChart('18'))}
            ${mCard('#dc2626','#fef2f2', criticos,  'Críticos activos',  '',           iAlert('18'))}
            ${mCard('#7c3aed','#f5f3ff', sinAsignar,'Sin asignar',       '',           iUser('18'))}
            ${mCard('#0891b2','#ecfeff', ultimos7,  'Últimos 7 días',    '',           iClock('18'))}
            ${mCard('#059669','#ecfdf5', usuarios.length,'Usuarios',     '',           iUsers('18'))}
        </div>

        <!-- Distribución por estado y prioridad -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div class="panel">
                <div class="panel-body">
                    <div style="font-weight:600;font-size:.88rem;margin-bottom:12px">
                        Distribución por estado
                    </div>
                    ${renderBarrasEstado(tickets)}
                </div>
            </div>
            <div class="panel">
                <div class="panel-body">
                    <div style="font-weight:600;font-size:.88rem;margin-bottom:12px">
                        Tickets por prioridad
                    </div>
                    ${renderBarrasPrioridad(tickets)}
                </div>
            </div>
        </div>

        <!-- Por departamento -->
        <div class="panel" style="margin-bottom:14px">
            <div class="panel-body">
                <div style="font-weight:600;font-size:.88rem;margin-bottom:12px">
                    Tickets por departamento
                </div>
                ${topDeptos.length ? renderBarrasDepto(topDeptos, total) : '<p style="font-size:.82rem;color:var(--text3)">Sin tickets registrados.</p>'}
            </div>
        </div>

        <!-- Rendimiento por técnico -->
        <div class="panel" style="margin-bottom:14px">
            <div class="panel-body">
                <div style="font-weight:600;font-size:.88rem;margin-bottom:12px">
                    Rendimiento por técnico
                </div>
                ${renderTablaTecnicos(porTecnico)}
            </div>
        </div>

        <!-- Directorio de usuarios -->
        <div class="panel">
            <div class="panel-body">
                <div style="font-weight:600;font-size:.88rem;margin-bottom:12px">
                    Directorio de usuarios (${usuarios.length})
                </div>
                ${renderTablaUsuarios(usuarios, tickets)}
            </div>
        </div>`;
}

// ─────────────────────────────────────────
// GRÁFICAS EN HTML/CSS
// ─────────────────────────────────────────
function renderBarrasEstado(tickets) {
    const total = tickets.length || 1;
    return Object.entries(STATUS_META).map(([k, v]) => {
        const n    = tickets.filter(t => t.status === k).length;
        const pct  = Math.round((n / total) * 100);
        return `
        <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:3px">
                <span>${v.label}</span>
                <span style="font-weight:600">${n} <span style="color:var(--text3);font-weight:400">(${pct}%)</span></span>
            </div>
            <div style="height:6px;background:var(--surface2);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${v.color};border-radius:3px;transition:width .4s"></div>
            </div>
        </div>`;
    }).join('');
}

function renderBarrasPrioridad(tickets) {
    const total = tickets.length || 1;
    return Object.entries(PRIO_META).map(([k, v]) => {
        const n   = tickets.filter(t => t.prioridad === k).length;
        const pct = Math.round((n / total) * 100);
        return `
        <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:3px">
                <span>${v.label}</span>
                <span style="font-weight:600">${n} <span style="color:var(--text3);font-weight:400">(${pct}%)</span></span>
            </div>
            <div style="height:6px;background:var(--surface2);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${v.color};border-radius:3px;transition:width .4s"></div>
            </div>
        </div>`;
    }).join('');
}

function renderBarrasDepto(topDeptos, total) {
    const max = topDeptos[0]?.[1] || 1;
    return topDeptos.map(([nombre, n]) => {
        const pct = Math.round((n / max) * 100);
        return `
        <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:3px">
                <span>${nombre}</span>
                <span style="font-weight:600">${n}</span>
            </div>
            <div style="height:6px;background:var(--surface2);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:var(--verde,#1a5c38);border-radius:3px;transition:width .4s"></div>
            </div>
        </div>`;
    }).join('');
}

function renderTablaTecnicos(porTecnico) {
    const entries = Object.entries(porTecnico);
    if (!entries.length) return `<p style="font-size:.82rem;color:var(--text3)">Sin técnicos registrados.</p>`;
    return `
        <div class="table-wrap">
            <table class="tickets-table">
                <thead><tr>
                    <th>Técnico</th><th>Total</th><th>Resueltos</th><th>En curso</th><th>% Resolución</th>
                </tr></thead>
                <tbody>
                    ${entries.sort((a,b) => b[1].total - a[1].total).map(([nombre, d]) => {
                        const pct = d.total > 0 ? Math.round((d.cerrados / d.total) * 100) : 0;
                        return `<tr>
                            <td style="font-weight:600">${nombre}</td>
                            <td>${d.total}</td>
                            <td style="color:#16a34a;font-weight:600">${d.cerrados}</td>
                            <td style="color:#d97706">${d.total - d.cerrados}</td>
                            <td>
                                <div style="display:flex;align-items:center;gap:8px">
                                    <div style="flex:1;height:5px;background:var(--surface2);border-radius:3px">
                                        <div style="height:100%;width:${pct}%;background:#16a34a;border-radius:3px"></div>
                                    </div>
                                    <span style="font-size:.75rem;min-width:28px">${pct}%</span>
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

function renderTablaUsuarios(usuarios, tickets) {
    if (!usuarios.length) return `<p style="font-size:.82rem;color:var(--text3)">Sin usuarios.</p>`;
    return `
        <div class="table-wrap">
            <table class="tickets-table">
                <thead><tr>
                    <th>Usuario</th><th>Correo</th><th>Rol</th><th>Departamento</th>
                    <th>Tickets solicitados</th><th>Tickets asignados</th>
                </tr></thead>
                <tbody>
                    ${usuarios.map(u => {
                        const solicitados = tickets.filter(t => t.solicitante_id === u.id).length;
                        const asignados   = tickets.filter(t => t.asignado_id    === u.id).length;
                        return `<tr>
                            <td style="font-weight:600">${u.nombre}</td>
                            <td style="font-size:.8rem;color:var(--text2)">${u.email}</td>
                            <td><span class="badge badge-${u.rol === 'admin' ? 'atendido' : 'nuevo'}">${u.rol}</span></td>
                            <td style="font-size:.8rem">${u.departamento || '—'}</td>
                            <td style="text-align:center">${solicitados}</td>
                            <td style="text-align:center">${asignados}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

// ─────────────────────────────────────────
// ÍCONOS AUXILIARES (si no existen en utils)
// ─────────────────────────────────────────
function iCheck(s='16') {
    return `<svg width="${s}" height="${s}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
}
function iChart(s='16') {
    return `<svg width="${s}" height="${s}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`;
}

// ─────────────────────────────────────────
// EXPORTAR A EXCEL (SheetJS / XLSX)
// ─────────────────────────────────────────
function exportarExcel() {
    if (typeof XLSX === 'undefined') {
        toast('Librería XLSX no disponible. Verifica que esté cargada en index.html.', 'error');
        return;
    }

    const tickets  = window.gTickets  || [];
    const usuarios = window.gUsers    || [];

    // Hoja 1: Tickets
    const ticketsData = tickets.map(t => ({
        'ID':           t.id,
        'Título':       t.titulo       || t.asunto || '',
        'Estado':       STATUS_META[t.status]?.label   || t.status   || '',
        'Prioridad':    PRIO_META[t.prioridad]?.label  || t.prioridad || '',
        'Departamento': t.departamento || '',
        'Categoría':    t.categoria    || '',
        'Solicitante':  getUserName(t.solicitante_id),
        'Técnico':      t.asignado_id ? getUserName(t.asignado_id) : 'Sin asignar',
        'Descripción':  t.descripcion  || '',
        'Fotos':        (t.imagen_url ? 1 : 0) + (Array.isArray(t.fotos_urls) ? t.fotos_urls.length : 0),
        'Creado':       t.created_at   ? new Date(t.created_at).toLocaleString('es-MX')  : '',
        'Actualizado':  t.updated_at   ? new Date(t.updated_at).toLocaleString('es-MX')  : '',
        'Cerrado':      t.cerrado_en   ? new Date(t.cerrado_en).toLocaleString('es-MX')  : '',
    }));

    // Hoja 2: Usuarios
    const usuariosData = usuarios.map(u => ({
        'Nombre':       u.nombre       || '',
        'Correo':       u.email        || '',
        'Rol':          u.rol          || '',
        'Departamento': u.departamento || '',
        'Registrado':   u.created_at   ? new Date(u.created_at).toLocaleString('es-MX') : '',
        'Tickets solicitados': tickets.filter(t => t.solicitante_id === u.id).length,
        'Tickets asignados':   tickets.filter(t => t.asignado_id    === u.id).length,
    }));

    // Hoja 3: Resumen por departamento
    const porDepto = {};
    tickets.forEach(t => {
        const d = t.departamento || 'Sin depto.';
        if (!porDepto[d]) porDepto[d] = { total:0, abiertos:0, cerrados:0, criticos:0 };
        porDepto[d].total++;
        if (!['cerrado','cancelado'].includes(t.status)) porDepto[d].abiertos++;
        if (t.status === 'cerrado') porDepto[d].cerrados++;
        if (t.prioridad === 'crítica') porDepto[d].criticos++;
    });
    const deptoData = Object.entries(porDepto).map(([nombre, d]) => ({
        'Departamento': nombre,
        'Total':        d.total,
        'Abiertos':     d.abiertos,
        'Cerrados':     d.cerrados,
        'Críticos':     d.criticos,
        '% Resolución': d.total > 0 ? Math.round((d.cerrados / d.total) * 100) + '%' : '0%',
    }));

    // Crear libro
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ticketsData),  'Tickets');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usuariosData), 'Usuarios');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(deptoData),    'Por departamento');

    // Descargar
    const fecha = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `mesa-servicios-TI_${fecha}.xlsx`);
    toast('Excel exportado correctamente.', 'success');
}

// ─────────────────────────────────────────
// EXPORTAR A PDF (jsPDF)
// ─────────────────────────────────────────
function exportarPDF() {
    if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
        toast('Librería jsPDF no disponible. Verifica que esté cargada en index.html.', 'error');
        return;
    }

    const { jsPDF: PDF } = window.jspdf || window;
    const doc  = new PDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const tickets  = window.gTickets || [];
    const hoy  = new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });

    // ── Portada ──────────────────────────────
    doc.setFillColor(26, 92, 56);
    doc.rect(0, 0, 297, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Mesa de Servicios TI', 14, 16);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('H. Ayuntamiento de Tzompantepec — Reporte generado el ' + hoy, 14, 25);
    doc.setFontSize(9);
    doc.text(`Total de tickets: ${tickets.length}`, 14, 33);

    let y = 50;

    // ── Resumen estadístico ──────────────────
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen estadístico', 14, y);
    y += 7;

    const abiertos  = tickets.filter(t => !['cerrado','cancelado'].includes(t.status)).length;
    const cerrados  = tickets.filter(t => t.status === 'cerrado').length;
    const criticos  = tickets.filter(t => t.prioridad === 'crítica').length;
    const tasa      = tickets.length > 0 ? Math.round((cerrados / tickets.length) * 100) : 0;

    const stats = [
        ['Total tickets', tickets.length],
        ['Abiertos',      abiertos],
        ['Cerrados',      cerrados],
        ['Críticos',      criticos],
        ['Tasa resolución', tasa + '%'],
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    stats.forEach(([label, val], i) => {
        const x = 14 + (i * 55);
        doc.setFillColor(232, 245, 238);
        doc.roundedRect(x, y, 50, 16, 2, 2, 'F');
        doc.setTextColor(26, 92, 56);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(String(val), x + 25, y + 9, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(label, x + 25, y + 14, { align: 'center' });
    });
    y += 24;

    // ── Tabla de tickets ─────────────────────
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Listado de tickets', 14, y);
    y += 6;

    // Cabecera tabla
    const cols   = [25, 80, 28, 28, 40, 40, 28];
    const headers= ['ID', 'Título', 'Estado', 'Prioridad', 'Departamento', 'Técnico', 'Fecha'];
    doc.setFillColor(26, 92, 56);
    doc.rect(14, y, 269, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let x = 14;
    headers.forEach((h, i) => { doc.text(h, x + 2, y + 5); x += cols[i]; });
    y += 7;

    // Filas
    doc.setFont('helvetica', 'normal');
    tickets.slice(0, 40).forEach((t, idx) => {
        if (y > 185) {
            doc.addPage();
            y = 20;
        }
        const bg = idx % 2 === 0 ? [248, 248, 248] : [255, 255, 255];
        doc.setFillColor(...bg);
        doc.rect(14, y, 269, 6, 'F');
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(7.5);

        const row = [
            (t.id || '').substring(0, 12),
            (t.titulo || t.asunto || '').substring(0, 38),
            STATUS_META[t.status]?.label   || t.status   || '',
            PRIO_META[t.prioridad]?.label  || t.prioridad || '',
            (t.departamento || '').substring(0, 20),
            t.asignado_id ? getUserName(t.asignado_id).split(' ')[0] : 'Sin asignar',
            t.created_at ? new Date(t.created_at).toLocaleDateString('es-MX') : '',
        ];

        x = 14;
        row.forEach((val, i) => {
            doc.text(String(val), x + 2, y + 4.5);
            x += cols[i];
        });
        y += 6;
    });

    if (tickets.length > 40) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`... y ${tickets.length - 40} tickets más. Exporta Excel para ver el listado completo.`, 14, y + 5);
    }

    // ── Pie de página en todas las páginas ───
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Mesa de Servicios TI — H. Ayuntamiento de Tzompantepec — Página ${i} de ${totalPages}`,
            148.5, 205, { align: 'center' }
        );
    }

    // Descargar
    const fecha = new Date().toISOString().slice(0, 10);
    doc.save(`reporte-tickets_${fecha}.pdf`);
    toast('PDF exportado correctamente.', 'success');
}

// ─────────────────────────────────────────
// ALIASES para compatibilidad con app.js
// ─────────────────────────────────────────
function exportExcel()    { exportarExcel(); }
function exportPDF()      { exportarPDF();   }
function exportCriticos() {
    // Filtrar solo críticos y exportar Excel
    const backup = window.gTickets;
    window.gTickets = (backup || []).filter(t =>
        t.prioridad === 'crítica' && !['cerrado','cancelado'].includes(t.status));
    exportarExcel();
    window.gTickets = backup;
}
function exportResueltos() {
    // Filtrar solo resueltos/cerrados y exportar
    const backup = window.gTickets;
    window.gTickets = (backup || []).filter(t => t.status === 'cerrado');
    exportarExcel();
    window.gTickets = backup;
}

// Exponer globalmente
window.renderReportes  = renderReportes;
window.exportarExcel   = exportarExcel;
window.exportarPDF     = exportarPDF;
window.exportExcel     = exportExcel;
window.exportPDF       = exportPDF;
window.exportCriticos  = exportCriticos;
window.exportResueltos = exportResueltos;
