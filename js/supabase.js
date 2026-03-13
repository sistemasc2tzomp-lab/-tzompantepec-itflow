// ══════════════════════════════════════════
// SUPABASE CLIENT Y VARIABLES GLOBALES
// ══════════════════════════════════════════

let supabaseClient = null;
let currentUser = null;

// Caché local de datos (se sincroniza con Supabase)
let gTickets = [];
let gUsers = [];
let gHistories = [];
let gComments = [];

// Inicializar cliente desde localStorage
(function initSupabaseFromStorage() {
    const savedUrl = localStorage.getItem('supa_url');
    const savedKey = localStorage.getItem('supa_key');
    if (savedUrl && savedKey) {
        supabaseClient = window.supabase.createClient(savedUrl, savedKey);
        restoreSession();
    }
})();

/**
 * Restaura la sesión del usuario si existe
 */
async function restoreSession() {
    if (!supabaseClient) return;
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
        console.error('Error al restaurar sesión:', error);
        return;
    }
    if (session) {
        await loadUserProfile(session.user.id);
    }
}

/**
 * Carga el perfil del usuario desde la tabla 'usuarios'
 * @param {string} userId - ID del usuario en Auth
 */
async function loadUserProfile(userId) {
    if (!supabaseClient) return;
    const { data: userData, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('Error al cargar perfil:', error);
        return;
    }
    
    currentUser = userData;
    
    if (currentUser) {
        document.getElementById('page-landing').style.display = 'none';
        document.getElementById('page-app').classList.add('visible');
        
        // Actualizar UI del banner
        document.getElementById('banner-status').textContent = '● SUPABASE CONECTADO';
        document.getElementById('banner-status').className = 'banner-status connected';
        document.getElementById('sync-dot').classList.remove('offline');
        document.getElementById('sync-label').textContent = 'Supabase sync';
        
        await loadFromSupabase(); // cargar datos iniciales
        if (typeof initApp === 'function') {
            initApp();
        }
    }
}

/**
 * Conecta/configura Supabase desde el banner
 */
async function connectSupabase() {
    const urlEl = document.getElementById('supa-url');
    const keyEl = document.getElementById('supa-key');
    const url = urlEl.value.trim().replace(/\/$/, '');
    const key = keyEl.value.trim();
    
    if (!url || !key) {
        alert('Ingresa URL y Key de Supabase.');
        return;
    }

    localStorage.setItem('supa_url', url);
    localStorage.setItem('supa_key', key);

    supabaseClient = window.supabase.createClient(url, key);

    try {
        const { data, error } = await supabaseClient.from('usuarios').select('count').limit(1);
        if (error) throw error;
        
        document.getElementById('banner-status').textContent = '● SUPABASE CONECTADO';
        document.getElementById('banner-status').className = 'banner-status connected';
        document.getElementById('sync-dot').classList.remove('offline');
        document.getElementById('sync-label').textContent = 'Supabase sync';
        toast('¡Conectado a Supabase!', 'success');
        
        // Intentar restaurar sesión
        await restoreSession();
        
    } catch (e) {
        toast('Error de conexión: ' + e.message, 'error');
        supabaseClient = null;
        localStorage.removeItem('supa_url');
        localStorage.removeItem('supa_key');
        
        document.getElementById('banner-status').textContent = '● ERROR DE CONEXIÓN';
        document.getElementById('banner-status').className = 'banner-status demo';
        document.getElementById('sync-dot').classList.add('offline');
        document.getElementById('sync-label').textContent = 'Sin conexión';
    }
}

/**
 * Carga todos los datos desde Supabase al caché local
 */
async function loadFromSupabase() {
    if (!supabaseClient) return;
    
    showLoading(true);
    try {
        // Cargar usuarios
        const { data: users, error: usersError } = await supabaseClient
            .from('usuarios')
            .select('*')
            .order('nombre');
            
        if (usersError) throw usersError;
        gUsers = users || [];

        // Cargar tickets
        const { data: tickets, error: ticketsError } = await supabaseClient
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (ticketsError) throw ticketsError;
        gTickets = tickets || [];

        // Cargar historial
        const { data: histories, error: histError } = await supabaseClient
            .from('ticket_historiales')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (histError) throw histError;
        gHistories = histories || [];

        // Cargar comentarios
        const { data: comments, error: commError } = await supabaseClient
            .from('comentarios')
            .select('*')
            .order('created_at');
            
        if (commError) throw commError;
        gComments = comments || [];

        console.log(`Datos cargados: ${gTickets.length} tickets, ${gUsers.length} usuarios, ${gHistories.length} actividades, ${gComments.length} comentarios`);
        toast('Datos cargados desde Supabase', 'success');
        
    } catch (e) {
        console.error('Error al cargar datos:', e);
        toast('Error al cargar datos: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Obtiene un usuario por su ID
 * @param {string} userId - ID del usuario
 * @returns {Object|null} - Datos del usuario o null si no existe
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
 * Verifica si hay conexión a Supabase
 * @returns {boolean} - True si hay conexión
 */
function isSupabaseConnected() {
    return supabaseClient !== null;
}

/**
 * Obtiene el cliente de Supabase
 * @returns {Object|null} - Cliente de Supabase o null
 */
function getSupabaseClient() {
    return supabaseClient;
}

/**
 * Carga tickets (desde Supabase)
 * @returns {Promise<Array>} - Lista de tickets
 */
async function loadTickets() {
    if (!supabaseClient) {
        throw new Error('No hay conexión a Supabase');
    }
    
    await loadFromSupabase();
    return gTickets;
}

/**
 * Carga usuarios (desde Supabase)
 * @returns {Promise<Array>} - Lista de usuarios
 */
async function loadUsers() {
    if (!supabaseClient) {
        throw new Error('No hay conexión a Supabase');
    }
    
    await loadFromSupabase();
    return gUsers;
}

/**
 * Carga historial (desde Supabase)
 * @returns {Promise<Array>} - Lista de historial
 */
async function loadHistories() {
    if (!supabaseClient) {
        throw new Error('No hay conexión a Supabase');
    }
    
    await loadFromSupabase();
    return gHistories;
}

/**
 * Carga comentarios (desde Supabase)
 * @returns {Promise<Array>} - Lista de comentarios
 */
async function loadComments() {
    if (!supabaseClient) {
        throw new Error('No hay conexión a Supabase');
    }
    
    await loadFromSupabase();
    return gComments;
}

// Exportar variables globales y funciones
window.gTickets = gTickets;
window.gUsers = gUsers;
window.gHistories = gHistories;
window.gComments = gComments;
window.supabase = supabaseClient;
window.connectSupabase = connectSupabase;
window.loadFromSupabase = loadFromSupabase;
window.getUserById = getUserById;
window.getUserName = getUserName;
window.isSupabaseConnected = isSupabaseConnected;
window.getSupabaseClient = getSupabaseClient;
window.loadTickets = loadTickets;
window.loadUsers = loadUsers;
window.loadHistories = loadHistories;
window.loadComments = loadComments;