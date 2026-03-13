// ══════════════════════════════════════════
// REPORTES Y EXPORTACIONES
// ══════════════════════════════════════════

async function renderReportes() {
    const el = document.getElementById('view-reportes');
    
    showLoading(true);
    const tickets = await loadTickets();
    const users = await loadUsers();
    showLoading(false);
    
    const total = tickets.length;
    const activos = tickets.filter(x => !['cerrado', 'cancelado'].includes(x.status)).length;
    const atendidos = tickets.filter(x => x.status === 'atendido').length;
    const criticos = tickets.filter(x => x.prioridad === 'crítica').length;

    el.innerHTML = '<h2 style="font-family:var(--font-display);font-size:1.4rem;color:var(--verde);margin-bottom:6px">Reportes</h2>' +
        '<p class="section-sub">Exporta y analiza la información del sistema</p>' +
        '<div class="report-grid">' +
        [
            { icon: '📊', color: '#e8f5ee', title: 'Reporte general', desc: 'Todos los tickets del sistema', fn: 'exportExcel()' },
            { icon: '📋', color: '#eff6ff', title: 'Reporte PDF', desc: 'Documento imprimible de tickets', fn: 'exportPDF()' },
            { icon: '⚠️', color: '#fff1f2', title: 'Tickets críticos', desc: 'Solo prioridad crítica y alta', fn: 'exportCriticos()' },
            { icon: '✅', color: '#f0fdf4', title: 'Tickets resueltos', desc: 'Historial de tickets atendidos', fn: 'exportResueltos()' },
        ].map(r => {
            return '<div class="report-card" onclick="' + r.fn + '">' +
                '<div class="report-card-icon" style="background:' + r.color + ';font-size:1.4rem">' + r.icon + '</div>' +
                '<div class="report-card-title">' + r.title + '</div>' +
                '<div class="report-card-desc">' + r.desc + '</div>' +
                '</div>';
        }).join('') +
        '</div>' +
        '<div class="panel"><div class="panel-header"><div class="panel-title">📈 Resumen estadístico</div></div>' +
        '<div class="panel-body">' +
        '<div class="metrics-grid">' +
        mCard('#1a5c3a', '#e8f5ee', total, 'Total tickets', 'Histórico completo', iTicket('18')) +
        mCard('#1a5c3a', '#e8f5ee', activos, 'Activos', 'En este momento', iClock('18')) +
        mCard('#16a34a', '#f0fdf4', atendidos, 'Atendidos', 'Resueltos', iCheck('18')) +
        mCard('#e11d48', '#fff1f2', criticos, 'Críticos', 'Alta prioridad', iAlert('18')) +
        '</div>' +
        '<div style="margin-top:18px">' +
        Object.entries(STATUS_META).map(entry => {
            const k = entry[0], v = entry[1];
            const cnt = tickets.filter(x => x.status === k).length;
            const pct = total ? Math.round((cnt / total) * 100) : 0;
            return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">' +
                '<div style="width:120px;font-size:.82rem;color:var(--text2)">' + v.label + '</div>' +
                '<div style="flex:1;height:7px;background:var(--surface3);border-radius:4px;overflow:hidden">' +
                '<div style="width:' + pct + '%;height:100%;background:' + v.color + ';border-radius:4px"></div>' +
                '</div>' +
                '<div style="width:50px;text-align:right;font-size:.78rem;color:var(--text3)">' + cnt + ' (' + pct + '%)</div>' +
                '</div>';
        }).join('') +
        '</div>' +
        '</div></div>';
}

// Funciones de exportación
function exportExcel() {
    const tickets = window.gTickets || [];
    const users = window.gUsers || [];
    
    if (tickets.length === 0) {
        toast('No hay datos para exportar', 'error');
        return;
    }
    
    // Preparar datos para Excel
    const data = tickets.map(t => {
        const solicitante = users.find(u => u.id === t.solicitante_id);
        const asignado = users.find(u => u.id === t.asignado_id);
        
        return {
            'ID': t.id,
            'Título': t.titulo,
            'Descripción': t.descripcion?.substring(0, 100) + '...',
            'Categoría': t.categoria,
            'Prioridad': t.prioridad,
            'Estado': t.status,
            'Departamento': t.departamento,
            'Solicitante': solicitante?.nombre || '—',
            'Asignado a': asignado?.nombre || 'Sin asignar',
            'Fecha Creación': fmtDate(t.created_at),
            'Fecha Actualización': fmtDate(t.updated_at)
        };
    });
    
    // Crear libro de Excel
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
    
    // Descargar archivo
    const fileName = `tickets_tzompantepec_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast('Reporte Excel descargado exitosamente', 'success');
}

function exportPDF() {
    const tickets = window.gTickets || [];
    const users = window.gUsers || [];
    
    if (tickets.length === 0) {
        toast('No hay datos para exportar', 'error');
        return;
    }
    
    // Crear documento PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración de página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(26, 92, 58); // Color verde institucional
    doc.text('Reporte de Tickets - H. Ayuntamiento de Tzompantepec', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Fecha
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    // Resumen estadístico
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumen Estadístico', 20, yPosition);
    yPosition += 10;
    
    const total = tickets.length;
    const activos = tickets.filter(t => !['cerrado', 'cancelado'].includes(t.status)).length;
    const resueltos = tickets.filter(t => t.status === 'atendido').length;
    
    doc.setFontSize(10);
    doc.text(`Total de tickets: ${total}`, 30, yPosition);
    yPosition += 8;
    doc.text(`Tickets activos: ${activos}`, 30, yPosition);
    yPosition += 8;
    doc.text(`Tickets resueltos: ${resueltos}`, 30, yPosition);
    yPosition += 15;
    
    // Tabla de tickets
    doc.setFontSize(12);
    doc.text('Detalle de Tickets', 20, yPosition);
    yPosition += 15;
    
    // Encabezados de tabla
    const headers = ['ID', 'Título', 'Estado', 'Prioridad', 'Fecha'];
    const headerWidths = [30, 60, 30, 30, 40];
    let xPos = 20;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
        doc.text(header, xPos, yPosition);
        xPos += headerWidths[i];
    });
    yPosition += 10;
    
    // Filas de datos
    doc.setFont('helvetica', 'normal');
    tickets.slice(0, 20).forEach(ticket => {
        if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
        }
        
        xPos = 20;
        const rowData = [
            ticket.id.substring(0, 8),
            ticket.titulo.substring(0, 20),
            ticket.status,
            ticket.prioridad,
            new Date(ticket.created_at).toLocaleDateString('es-MX')
        ];
        
        rowData.forEach((data, i) => {
            doc.text(data, xPos, yPosition);
            xPos += headerWidths[i];
        });
        yPosition += 8;
    });
    
    // Descargar PDF
    const fileName = `reporte_tickets_tzompantepec_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast('Reporte PDF descargado exitosamente', 'success');
}

function exportCriticos() {
    const tickets = window.gTickets || [];
    const users = window.gUsers || [];
    
    // Filtrar tickets críticos y de alta prioridad
    const criticalTickets = tickets.filter(t => 
        t.prioridad === 'crítica' || t.prioridad === 'alta'
    );
    
    if (criticalTickets.length === 0) {
        toast('No hay tickets críticos para exportar', 'error');
        return;
    }
    
    // Preparar datos
    const data = criticalTickets.map(t => {
        const solicitante = users.find(u => u.id === t.solicitante_id);
        const asignado = users.find(u => u.id === t.asignado_id);
        
        return {
            'ID': t.id,
            'Título': t.titulo,
            'Prioridad': t.prioridad.toUpperCase(),
            'Estado': t.status,
            'Departamento': t.departamento,
            'Solicitante': solicitante?.nombre || '—',
            'Asignado a': asignado?.nombre || 'Sin asignar',
            'Días activo': Math.floor((new Date() - new Date(t.created_at)) / (1000 * 60 * 60 * 24)),
            'Fecha Creación': fmtDate(t.created_at)
        };
    });
    
    // Ordenar por prioridad (crítica primero) y fecha
    data.sort((a, b) => {
        if (a.Prioridad === 'CRÍTICA' && b.Prioridad !== 'CRÍTICA') return -1;
        if (a.Prioridad !== 'CRÍTICA' && b.Prioridad === 'CRÍTICA') return 1;
        return new Date(b['Fecha Creación']) - new Date(a['Fecha Creación']);
    });
    
    // Crear Excel
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets Críticos');
    
    const fileName = `tickets_criticos_tzompantepec_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast(`Reporte de ${criticalTickets.length} tickets críticos descargado`, 'success');
}

function exportResueltos() {
    const tickets = window.gTickets || [];
    const users = window.gUsers || [];
    const histories = window.gHistories || [];
    
    // Filtrar tickets resueltos
    const resolvedTickets = tickets.filter(t => 
        t.status === 'atendido' || t.status === 'cerrado'
    );
    
    if (resolvedTickets.length === 0) {
        toast('No hay tickets resueltos para exportar', 'error');
        return;
    }
    
    // Preparar datos con información de resolución
    const data = resolvedTickets.map(t => {
        const solicitante = users.find(u => u.id === t.solicitante_id);
        const asignado = users.find(u => u.id === t.asignado_id);
        
        // Buscar fecha de resolución
        const resolutionHistory = histories
            .filter(h => h.ticket_id === t.id && h.accion === 'status_change')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        
        const resolutionDate = resolutionHistory ? resolutionHistory.created_at : t.updated_at;
        const resolutionTime = resolutionDate ? 
            Math.floor((new Date(resolutionDate) - new Date(t.created_at)) / (1000 * 60 * 60 * 24)) : 0;
        
        return {
            'ID': t.id,
            'Título': t.titulo,
            'Categoría': t.categoria,
            'Departamento': t.departamento,
            'Solicitante': solicitante?.nombre || '—',
            'Atendido por': asignado?.nombre || 'Sin asignar',
            'Estado Final': t.status,
            'Fecha Creación': fmtDate(t.created_at),
            'Fecha Resolución': fmtDate(resolutionDate),
            'Tiempo Resolución (días)': resolutionTime,
            'Prioridad': t.prioridad
        };
    });
    
    // Ordenar por fecha de resolución (más recientes primero)
    data.sort((a, b) => new Date(b['Fecha Resolución']) - new Date(a['Fecha Resolución']));
    
    // Crear Excel
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets Resueltos');
    
    const fileName = `tickets_resueltos_tzompantepec_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast(`Reporte de ${resolvedTickets.length} tickets resueltos descargado`, 'success');
}