// ══════════════════════════════════════════
// APLICACIÓN PRINCIPAL
// ══════════════════════════════════════════

// Estado global de la aplicación (usando las variables globales de supabase.js)
window.currentView = 'dashboard';
window.currentAssignTicketId = null;
window.dashCharts = {};

// Estos objetos se mantienen porque son configuraciones, no datos
const STATUS_META = {
    nuevo: { label: 'Nuevo', color: '#4f46e5', dot: '#6366f1' },
    en_asignacion: { label: 'En asignación', color: '#d97706', dot: '#f59e0b' },
    en_progreso: { label: 'En progreso', color: '#059669', dot: '#10b981' },
    pendiente: { label: 'Pendiente', color: '#e11d48', dot: '#f43f5e' },
    atendido: { label: 'Atendido', color: '#16a34a', dot: '#22c55e' },
    cancelado: { label: 'Cancelado', color: '#9ca3af', dot: '#d1d5db' },
    cerrado: { label: 'Cerrado', color: '#6b7280', dot: '#9ca3af' },
};

const PRIO_META = {
    baja: { label: 'Baja', color: '#6b7280' },
    media: { label: 'Media', color: '#2563eb' },
    alta: { label: 'Alta', color: '#d97706' },
    crítica: { label: 'Crítica', color: '#e11d48' },
};

const STATUS_TRANSITIONS = {
    nuevo: ['en_asignacion', 'pendiente', 'cancelado'],
    en_asignacion: ['en_progreso', 'pendiente', 'cancelado'],
    en_progreso: ['atendido', 'pendiente', 'cancelado'],
    pendiente: ['en_asignacion', 'en_progreso', 'cancelado'],
    atendido: ['cerrado', 'cancelado'],
    cancelado: [],
    cerrado: [],
};

/**
 * Inicializa la aplicación después del login
 */
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
        { key: 'tickets', icon: iTicket(), label: 'Todos los tickets', badge: activeTickets },
        { key: 'kanban', icon: iKanban(), label: 'Tablero Kanban' },
        { sep: 'Administración' },
        { key: 'users', icon: iUsers(), label: 'Usuarios del sistema' },
    ];
    
    const userItems = [
        { key: 'dashboard', icon: iDash(), label: 'Mi resumen' },
        { key: 'my-tickets', icon: iTicket(), label: 'Mis tickets', badge: myActiveTickets },
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
window.doLogin = doLogin;
window.doLogout = doLogout;
window.isAdmin = isAdmin;

// Funciones de tickets
window.openTicketDetail = openTicketDetail;
window.openNewTicketModal = openNewTicketModal;
window.submitNewTicket = submitNewTicket;
window.openAssignModal = openAssignModal;
window.confirmAssign = confirmAssign;
window.addComment = addComment;
window.changeStatus = changeStatus;
window.renderMyTickets = renderMyTickets;
window.setMyFilter = setMyFilter;

// Funciones de filtrado y paginación
window.onSearchChange = onSearchChange;
window.onFilterChange = onFilterChange;
window.setPage = setPage;

// Funciones de exportación
window.exportExcel = exportExcel;
window.exportPDF = exportPDF;
window.exportCriticos = exportCriticos;
window.exportResueltos = exportResueltos;

// Funciones de UI
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

// Funciones de configuración y utilidades
window.showSQLGuide = showSQLGuide;
window.copySQLGuide = copySQLGuide;
window.connectSupabase = connectSupabase;