// ══════════════════════════════════════════
// GESTIÓN DE USUARIOS
// ══════════════════════════════════════════

let cachedUsers = [];

async function loadUserList() {
    const users = await loadUsers();
    cachedUsers = users || [];
    return cachedUsers;
}

async function renderUsers() {
    if (!isAdmin()) {
        toast('Acceso no autorizado', 'error');
        navigate('dashboard');
        return;
    }
    
    const el = document.getElementById('view-users');
    
    showLoading(true);
    await loadUserList();
    showLoading(false);
    
    el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
            <h2 style="font-family:var(--font-display);font-size:1.4rem;color:var(--verde);margin:0">Usuarios</h2>
            <button class="btn btn-success btn-sm" onclick="openModal('modal-create-user')">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                Nuevo usuario
            </button>
        </div>
        <p class="section-sub">Gestión de usuarios del sistema municipal</p>
        <div class="users-grid">
            ${cachedUsers.map(u => renderUserCard(u)).join('')}
        </div>`;
}

function renderUserCard(u) {
    const tickets = window.gTickets || [];
    const totalT = tickets.filter(t => t.solicitante_id === u.id || t.asignado_id === u.id).length;
    const openT = tickets.filter(t => (t.solicitante_id === u.id || t.asignado_id === u.id) && !['cerrado', 'cancelado'].includes(t.status)).length;
    
    const ini = u.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const isAdm = u.rol === 'admin';
    
    return `<div class="user-card">
        <div class="user-card-head">
            <div class="user-card-ava" style="background:${isAdm ? 'var(--verde)' : 'var(--tierra)'}">${ini}</div>
            <div>
                <div class="user-card-name">${u.nombre}</div>
                <div class="user-card-email">${u.email}</div>
                <div style="margin-top:4px"><span class="badge badge-${isAdm ? 'admin' : 'usuario'}-role">${isAdm ? 'Admin TI' : 'Usuario'}</span></div>
            </div>
        </div>
        ${u.departamento ? `<div style="font-size:.74rem;color:var(--text3);margin-bottom:10px">${u.departamento}</div>` : ''}
        <div class="user-card-stats">
            <div class="user-stat"><div class="user-stat-val">${totalT}</div><div class="user-stat-label">Tickets</div></div>
            <div class="user-stat"><div class="user-stat-val" style="color:var(--tierra)">${openT}</div><div class="user-stat-label">Activos</div></div>
        </div>
    </div>`;
}

/**
 * Crea un nuevo usuario en el sistema
 */
async function submitCreateUser() {
    // Validar permisos de administrador
    if (!isAdmin()) {
        toast('Acceso no autorizado', 'error');
        return;
    }
    
    // Obtener valores del formulario
    const nombre = document.getElementById('cu-nombre').value.trim();
    const email = document.getElementById('cu-email').value.trim();
    const rol = document.getElementById('cu-rol').value;
    const dep = document.getElementById('cu-dep').value;
    const pass = document.getElementById('cu-pass').value.trim() || 'changeme';

    // Validaciones básicas
    if (!nombre || !email) {
        toast('Nombre y correo son obligatorios.', 'error');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        toast('El formato del correo no es válido.', 'error');
        return;
    }

    // Verificar conexión a Supabase
    if (!isSupabaseConnected()) {
        toast('No hay conexión a Supabase', 'error');
        return;
    }

    // Verificar si el email ya existe en la caché local
    if (cachedUsers.some(u => u.email === email)) {
        document.getElementById('cu-email-err').classList.add('show');
        toast('Este correo ya está registrado.', 'error');
        return;
    }
    document.getElementById('cu-email-err').classList.remove('show');

    showLoading(true);
    
    try {
        // 1. Crear usuario en Supabase Auth
        const client = getSupabaseClient();
        const { data: authData, error: authError } = await client.auth.signUp({
            email: email,
            password: pass,
            options: {
                data: {
                    nombre: nombre,
                    rol: rol,
                    departamento: dep
                }
            }
        });
        
        if (authError) {
            throw new Error('Error al crear usuario en Auth: ' + authError.message);
        }
        
        if (!authData || !authData.user) {
            throw new Error('No se recibieron datos del usuario creado');
        }

        // 2. Insertar perfil en la tabla usuarios (con el mismo id)
        const { error: insertError } = await client
            .from('usuarios')
            .insert([{
                id: authData.user.id,
                nombre: nombre,
                email: email,
                rol: rol,
                departamento: dep,
                created_at: new Date().toISOString()
            }]);

        if (insertError) {
            throw new Error('Error al crear perfil de usuario: ' + insertError.message);
        }

        // Actualizar caché local
        const newUser = {
            id: authData.user.id,
            nombre,
            email,
            rol,
            departamento: dep
        };
        cachedUsers.push(newUser);
        window.gUsers.push(newUser);

        closeModal('modal-create-user');
        toast(`Usuario ${nombre} creado exitosamente.`, 'success');
        
        // Recargar lista de usuarios y refrescar vista
        await loadUsers();
        renderUsers();
        
    } catch (error) {
        console.error('Error en submitCreateUser:', error);
        toast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Función auxiliar para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}