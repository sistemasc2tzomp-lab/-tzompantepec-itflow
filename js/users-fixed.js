// ══════════════════════════════════════════════════════════════
// USERS MODULE - GESTIÓN DE USUARIOS DEL SISTEMA
// ══════════════════════════════════════════════════════════

// Cache global para usuarios
window.cachedUsers = [];

// Renderizar tarjeta de usuario
function renderUserCard(user, tickets = []) {
    const userTickets = tickets.filter(t => t.solicitante_id === user.id || t.asignado_id === user.id);
    const ticketCount = userTickets.length;
    
    return `
        <div class="usr-card">
            <div class="usr-avatar">${user.nombre.charAt(0).toUpperCase()}</div>
            <div class="usr-info">
                <div class="usr-name">${user.nombre}</div>
                <div class="usr-email">${user.email}</div>
                <div class="usr-badge ${user.rol === 'admin' ? 'usr-admin' : 'usr-user'}">${user.rol}</div>
                <div class="usr-info-row">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    ${ticketCount} ${ticketCount === 1 ? 'ticket' : 'tickets'}
                </div>
                <div class="usr-info-row">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h-4"/></svg>
                    ${user.departamento || 'Sin departamento'}
                </div>
            </div>
            <div class="usr-actions">
                <button class="btn btn-sm btn-outline" onclick="editUser('${user.id}')">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-4h-4v4zm0 0l4-4m4 4v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v4z"/></svg>
                    Editar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.id}')">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116 21H8a2 2 0 01-2-2V7a2 2 0 012-2h4l2-2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9l-1.5-1.5m0 0L15 6m0 0l1.5 1.5m0 0L21 9"/></svg>
                    Eliminar
                </button>
            </div>
        </div>
    `;
}

// Renderizar lista de usuarios
function renderUsersCards(users) {
    if (!users || users.length === 0) {
        return '<p style="text-align:center;color:var(--text2);padding:40px">No hay usuarios registrados</p>';
    }
    
    return users.map(user => renderUserCard(user)).join('');
}

// Renderizar módulo de usuarios
async function renderUsers() {
    if (!isAdmin()) {
        toast('Acceso no autorizado', 'error');
        navigate('dashboard');
        return;
    }

    const el = document.getElementById('view-users');
    if (!el) return;

    showLoading();

    try {
        const users = await loadUsers();
        const tickets = await loadTickets();
        
        // Actualizar cache global
        window.cachedUsers = users || [];
        
        el.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
                <h2 style="font-family:var(--font-display);font-size:1.4rem;color:var(--verde);margin:0">Usuarios</h2>
                <button class="btn btn-success btn-sm" onclick="openModal('modal-create-user')">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Nuevo usuario
                </button>
            </div>
            <p class="section-sub">Gestión de usuarios del sistema municipal</p>
            <div class="users-grid" id="users-grid">
                ${renderUsersCards(window.cachedUsers)}
            </div>`;
        
        hideLoading();
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        toast('Error al cargar usuarios: ' + error.message, 'error');
        hideLoading();
    }
}

// Abrir modal para crear/editar usuario
function openModal(userId = null) {
    const modal = document.getElementById('modal-usuario');
    const title = document.getElementById('modal-usuario-title');
    const form = document.getElementById('form-usuario');
    
    if (!modal || !title || !form) return;
    
    // Resetear formulario
    form.reset();
    
    if (userId) {
        // Modo edición
        title.textContent = 'Editar usuario';
        const user = window.cachedUsers.find(u => u.id === userId);
        if (user) {
            document.getElementById('usr-nombre').value = user.nombre || '';
            document.getElementById('usr-email').value = user.email || '';
            document.getElementById('usr-rol').value = user.rol || 'usuario';
            document.getElementById('usr-departamento').value = user.departamento || '';
        }
    } else {
        // Modo creación
        title.textContent = 'Nuevo usuario';
    }
    
    modal.classList.remove('hidden');
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('modal-usuario');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Enviar formulario
async function submitUser() {
    const form = document.getElementById('form-usuario');
    if (!form) return;
    
    const formData = {
        nombre: document.getElementById('usr-nombre').value.trim(),
        email: document.getElementById('usr-email').value.trim(),
        rol: document.getElementById('usr-rol').value,
        departamento: document.getElementById('usr-departamento').value,
        password: document.getElementById('usr-password').value.trim()
    };
    
    // Validaciones básicas
    if (!formData.nombre) {
        toast('El nombre es obligatorio', 'error');
        return;
    }
    
    if (!formData.email) {
        toast('El email es obligatorio', 'error');
        return;
    }
    
    if (!formData.email.includes('@')) {
        toast('El email no es válido', 'error');
        return;
    }
    
    try {
        showLoading();
        
        if (window.supabaseClient) {
            // Crear en Supabase Auth
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: formData.email,
                password: formData.password || 'temp123',
                options: {
                    data: {
                        nombre: formData.nombre,
                        rol: formData.rol,
                        departamento: formData.departamento
                    }
                }
            });
            
            if (error) {
                throw error;
            }
            
            // Crear perfil en tabla usuarios
            const { error: profileError } = await window.supabaseClient
                .from('usuarios')
                .insert([{
                    id: data.user.id,
                    email: formData.email,
                    nombre: formData.nombre,
                    rol: formData.rol,
                    departamento: formData.departamento,
                    created_at: new Date().toISOString()
                }]);
            
            if (profileError) {
                throw profileError;
            }
            
            toast('Usuario creado correctamente', 'success');
            closeModal();
            await renderUsers();
            
        } else {
            toast('No hay conexión a Supabase', 'error');
        }
        
    } catch (error) {
        console.error('Error creando usuario:', error);
        toast('Error al crear usuario: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Editar usuario
function editUser(userId) {
    openModal(userId);
}

// Eliminar usuario
async function deleteUser(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) {
        return;
    }
    
    try {
        showLoading();
        
        if (window.supabaseClient) {
            const { error } = await window.supabaseClient
                .from('usuarios')
                .delete()
                .eq('id', userId);
            
            if (error) {
                throw error;
            }
            
            toast('Usuario eliminado correctamente', 'success');
            await renderUsers();
            
        } else {
            toast('No hay conexión a Supabase', 'error');
        }
        
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        toast('Error al eliminar usuario: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Exportar funciones globalmente
window.renderUsers = renderUsers;
window.openModal = openModal;
window.closeModal = closeModal;
window.submitUser = submitUser;
window.editUser = editUser;
window.deleteUser = deleteUser;

console.log('👥 Módulo de usuarios cargado');
