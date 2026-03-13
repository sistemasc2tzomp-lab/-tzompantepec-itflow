// ══════════════════════════════════════════
// AUTENTICACIÓN
// ══════════════════════════════════════════

/**
 * Verifica si el usuario actual es administrador
 * @returns {boolean} - True si el usuario es admin, false en caso contrario
 */
function isAdmin() {
    return currentUser?.rol === 'admin';
}

/**
 * Inicia sesión con Supabase Auth
 */
async function doLogin() {
    const email = document.getElementById('login-id').value.trim();
    const password = document.getElementById('login-pass').value.trim();
    const err = document.getElementById('login-error');

    // Verificar conexión a Supabase
    if (!supabaseClient) {
        err.classList.add('show');
        toast('Primero configura y conecta Supabase.', 'error');
        return;
    }

    // Modo Supabase - autenticación con Supabase Auth
    showLoading(true);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });
    showLoading(false);

    if (error || !data.user) {
        err.classList.add('show');
        console.error('Error de login:', error);
        return;
    }

    err.classList.remove('show');
    
    // Cargar perfil del usuario (esto también iniciará la app)
    await loadUserProfile(data.user.id);
}

/**
 * Cierra la sesión actual
 */
async function doLogout() {
    // Cerrar sesión en Supabase si está conectado
    if (supabaseClient) {
        try {
            await supabaseClient.auth.signOut();
            toast('Sesión cerrada correctamente.', 'success');
        } catch (e) {
            console.error('Error al cerrar sesión:', e);
        }
    }
    
    // Limpiar usuario actual
    currentUser = null;
    
    // Limpiar cachés globales
    if (window.gTickets) window.gTickets = [];
    if (window.gUsers) window.gUsers = [];
    if (window.gHistories) window.gHistories = [];
    if (window.gComments) window.gComments = [];
    
    // Destruir todos los gráficos del dashboard
    if (window.dashCharts) {
        Object.values(window.dashCharts).forEach(c => {
            try {
                if (c && typeof c.destroy === 'function') {
                    c.destroy();
                }
            } catch(e) {
                console.warn('Error al destruir gráfico:', e);
            }
        });
        window.dashCharts = {};
    }
    
    // Limpiar estado de la aplicación
    if (window.appState) {
        window.appState.tickets = [];
        window.appState.users = [];
        window.appState.histories = [];
        window.appState.comments = [];
    }
    
    // Ocultar elementos de la UI
    hideTopNav();
    
    // Ocultar la aplicación y mostrar el landing
    document.getElementById('page-app').classList.remove('visible');
    document.getElementById('page-landing').style.display = 'flex';
    
    // Limpiar campos de login
    document.getElementById('login-id').value = '';
    document.getElementById('login-pass').value = '';
    
    // Resetear el estado del banner si es necesario
    if (!supabaseClient) {
        document.getElementById('banner-status').textContent = '● MODO DEMO';
        document.getElementById('banner-status').className = 'banner-status demo';
        document.getElementById('sync-dot').classList.add('offline');
        document.getElementById('sync-label').textContent = 'Demo local';
    }
}

/**
 * Registra un nuevo usuario (solo para administradores)
 * @param {string} email - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @param {Object} userData - Datos adicionales del usuario (nombre, rol, departamento)
 * @returns {Promise<Object|null>} - Datos del usuario creado o null si hay error
 */
async function registerUser(email, password, userData) {
    if (!supabaseClient) {
        toast('Primero configura y conecta Supabase.', 'error');
        return null;
    }

    if (!isAdmin()) {
        toast('Solo administradores pueden crear usuarios.', 'error');
        return null;
    }

    showLoading(true);
    try {
        // Crear usuario en Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nombre: userData.nombre,
                    rol: userData.rol || 'usuario',
                    departamento: userData.departamento || ''
                }
            }
        });

        if (authError) throw authError;

        // Crear perfil en tabla usuarios
        const profileData = {
            id: authData.user.id,
            email: email,
            nombre: userData.nombre,
            rol: userData.rol || 'usuario',
            departamento: userData.departamento || '',
            created_at: new Date().toISOString()
        };

        const { error: profileError } = await supabaseClient
            .from('usuarios')
            .insert(profileData);

        if (profileError) throw profileError;

        // Actualizar caché local si existe
        if (window.gUsers) {
            window.gUsers.push(profileData);
        }
        if (window.appState) {
            window.appState.users.push(profileData);
        }

        toast('Usuario creado exitosamente.', 'success');
        return authData.user;

    } catch (e) {
        console.error('Error al crear usuario:', e);
        toast('Error al crear usuario: ' + e.message, 'error');
        return null;
    } finally {
        showLoading(false);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const lp = document.getElementById('login-pass');
    if (lp) {
        lp.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') doLogin();
        });
    }
    
    document.querySelectorAll('.modal-overlay').forEach(function(o) {
        o.addEventListener('click', function(e) {
            if (e.target === o) o.classList.remove('open');
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.open').forEach(function(m) {
                m.classList.remove('open');
            });
        }
    });
});