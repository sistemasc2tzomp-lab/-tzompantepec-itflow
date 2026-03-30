// ══════════════════════════════════════════
// APLICACIÓN PRINCIPAL
// ══════════════════════════════════════════

// Estado global de la aplicación (usando las variables globales de supabase.js)
window.currentView = 'dashboard';
window.currentAssignTicketId = null;
window.dashCharts = {};

// Dev Mode: Ctrl+Shift+S para mostrar el banner de configuración de Supabase
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        const banner = document.getElementById('config-banner');
        if (banner) banner.classList.toggle('visible');
    }
});

// Proceder con el flujo de inicialización despues del login
function initApp() {
    // Mostrar la interfaz principal
    document.getElementById('page-landing').style.display = 'none';
    document.getElementById('page-app').classList.add('visible');
    
    // Configurar información del usuario en la UI
    const initials = currentUser.nombre.split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    
    document.getElementById('user-ava').textContent = initials;
    document.getElementById('user-name-display').textContent = currentUser.nombre;
    document.getElementById('user-role-display').textContent = isAdmin() ? 'Administrador TI' : 'Usuario';
    document.getElementById('btn-new-ticket').style.display = 'inline-flex';
    
    // Construir navegación
    buildNav();
    showTopNav(isAdmin());
    
    // Navegar al dashboard
    navigate('dashboard');
}

/**
 * Construye el menú de navegación lateral
 */
function buildNav() {
    const nav = document.getElementById('sidebar-nav');
    
    // Calcular badges usando gTickets (variable global de supabase.js)
    const activeTickets = gTickets.filter(t => !['cerrado', 'cancelado'].includes(t.status)).length;
    const myActiveTickets = gTickets.filter(t => t.solicitante_id === currentUser?.id && !['cerrado', 'cancelado'].includes(t.status)).length;
    
    const adminItems = [
        { key: 'dashboard', icon: iDash(), label: 'Dashboard' },
        { key: 'tickets', icon: iTicket(), label: 'Gestión Global', badge: activeTickets },
        { key: 'kanban', icon: iKanban(), label: 'Flujo Kanban' },
        { sep: 'Administración' },
        { key: 'users', icon: iUsers(), label: 'Personal & Usuarios' },
        { key: 'reportes', icon: iDash(), label: 'Analítica' },
    ];
    
    const userItems = [
        { key: 'dashboard', icon: iDash(), label: 'Mi Resumen' },
        { key: 'my-tickets', icon: iTicket(), label: 'Mis Solicitudes', badge: myActiveTickets },
    ];
    
    const items = isAdmin() ? adminItems : userItems;
    
    nav.innerHTML = items.map(item => {
        if (item.sep) return `<div class="nav-section">${item.sep}</div>`;
        const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
        return `<button class="nav-item" id="nav-${item.key}" onclick="navigate('${item.key}')">${item.icon} ${item.label}${badge}</button>`;
    }).join('');
}

/**
 * Navega a una vista específica
 * @param {string} view - Nombre de la vista
 */
async function navigate(view) {
    window.currentView = view;
    
    // Ocultar todas las vistas
    ['dashboard', 'tickets', 'kanban', 'users', 'my-tickets', 'departamentos', 'reportes', 'config'].forEach(v => {
        document.getElementById('view-' + v)?.classList.add('hidden');
    });

    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById('nav-' + view)?.classList.add('active');
    document.getElementById('view-' + view)?.classList.remove('hidden');
    
    // Actualizar título y botones de exportación
    const titles = {
        dashboard: 'Dashboard',
        tickets: 'Gestión de Tickets',
        kanban: 'Tablero Kanban',
        users: 'Usuarios del Sistema',
        'my-tickets': 'Mis Tickets',
        departamentos: 'Departamentos Municipales',
        reportes: 'Reportes y Estadísticas',
        config: 'Configuración del Sistema'
    };
    document.getElementById('topbar-title').textContent = titles[view] || view;
    
    const showExport = ['tickets', 'my-tickets', 'reportes'].includes(view);
    document.getElementById('export-group').style.display = showExport ? 'flex' : 'none';

    // Cargar datos específicos si es necesario
    showLoading(true);
    try {
        switch(view) {
            case 'dashboard':
                renderDashboard();
                break;
                
            case 'tickets':
                renderTickets();
                break;
                
            case 'kanban':
                renderKanban();
                break;
                
            case 'users':
                if (!isAdmin()) {
                    toast('Acceso no autorizado', 'error');
                    navigate('dashboard');
                    return;
                }
                renderUsers();
                break;
                
            case 'my-tickets':
                renderMyTickets();
                break;
                
            case 'departamentos':
                renderDepartamentos();
                break;
                
            case 'reportes':
                renderReportes();
                break;
                
            case 'config':
                if (!isAdmin()) {
                    toast('Acceso no autorizado', 'error');
                    navigate('dashboard');
                    return;
                }
                renderConfig();
                break;
        }
    } catch (e) {
        console.error('Error al cargar datos para vista:', view, e);
        toast('Error al cargar datos: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }

    updateTopNavActive(view);
    buildNav();
    document.getElementById('nav-' + view)?.classList.add('active');
    
    // Actualizar badge de tickets en top nav
    const badge = document.getElementById('tn-badge-tickets');
    if (badge) {
        const count = gTickets.filter(t => !['cerrado', 'cancelado'].includes(t.status)).length;
        badge.textContent = count > 0 ? count : '';
        badge.style.display = count > 0 ? 'inline' : 'none';
    }
}

// ══════════════════════════════════════════
// FUNCIONES GLOBALES PARA EXPORTAR
// ══════════════════════════════════════════

// Hacer funciones principales disponibles globalmente
window.initApp = initApp;
window.navigate = navigate;
window.buildNav = buildNav;

// Funciones de autenticación (definidas en auth.js)
window.doLogin  = typeof doLogin  !== 'undefined' ? doLogin  : () => {};
window.doLogout = typeof doLogout !== 'undefined' ? doLogout : () => {};
window.isAdmin  = typeof isAdmin  !== 'undefined' ? isAdmin  : () => false;

// Funciones de tickets — stubs seguros
window.openTicketDetail   = typeof openTicketDetail   !== 'undefined' ? openTicketDetail   : () => {};
window.openNewTicketModal = typeof openNewTicketModal !== 'undefined' ? openNewTicketModal : () => {};
window.submitNewTicket    = typeof submitNewTicket    !== 'undefined' ? submitNewTicket    : () => {};
window.openAssignModal    = typeof openAssignModal    !== 'undefined' ? openAssignModal    : () => {};
window.confirmAssign      = typeof confirmAssign      !== 'undefined' ? confirmAssign      : () => {};
window.addComment         = typeof addComment         !== 'undefined' ? addComment         : () => {};
window.changeTicketStatus = typeof changeTicketStatus !== 'undefined' ? changeTicketStatus : () => {};
window.changeStatus       = window.changeTicketStatus;
window.renderMyTickets    = typeof renderMyTickets    !== 'undefined' ? renderMyTickets    : () => {};
window.setMyFilter        = typeof setMyFilter        !== 'undefined' ? setMyFilter        : () => {};

// Funciones de filtrado y paginación — stubs seguros
window.onSearchChange = typeof onSearchChange !== 'undefined' ? onSearchChange : () => {};
window.onFilterChange = typeof onFilterChange !== 'undefined' ? onFilterChange : () => {};
window.setPage        = typeof setPage        !== 'undefined' ? setPage        : () => {};

// Funciones de exportación — stubs seguros si no están definidas en reports.js
window.exportExcel     = typeof exportExcel     !== 'undefined' ? exportExcel     : () => toast('Exportación no disponible.', 'error');
window.exportPDF       = typeof exportPDF       !== 'undefined' ? exportPDF       : () => toast('Exportación no disponible.', 'error');
window.exportCriticos  = typeof exportCriticos  !== 'undefined' ? exportCriticos  : () => toast('Exportación no disponible.', 'error');
window.exportResueltos = typeof exportResueltos !== 'undefined' ? exportResueltos : () => toast('Exportación no disponible.', 'error');

// Funciones de UI — stubs seguros
window.toggleMobileMenu = typeof toggleMobileMenu !== 'undefined' ? toggleMobileMenu : () => {};
window.closeMobileMenu  = typeof closeMobileMenu  !== 'undefined' ? closeMobileMenu  : () => {};

// Funciones de configuración y utilidades — stubs seguros
window.showSQLGuide    = typeof showSQLGuide    !== 'undefined' ? showSQLGuide    : () => {};
window.copySQLGuide    = typeof copySQLGuide    !== 'undefined' ? copySQLGuide    : () => {};
<<<<<<< HEAD
window.connectSupabase = typeof connectSupabase !== 'undefined' ? connectSupabase : () => {};
=======
window.connectSupabase = typeof connectSupabase !== 'undefined' ? connectSupabase : () => {};
>>>>>>> 6877419d3c8d6b81ab8aa213fba1b0362f5316f1
