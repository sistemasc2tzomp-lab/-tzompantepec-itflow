// ═══════════════════════════════════════════
// DASHBOARD EMERGENCY - VERSIÓN SIMPLIFICADA PARA VISUALIZACIÓN
// ══════════════════════════════════════════════

async function renderDashboard() {
    const el = document.getElementById('view-dashboard');
    if (!el) return;
    
    console.log('🚨 Dashboard Emergency: Iniciando renderizado');
    
    try {
        // Forzar visibilidad
        el.style.display = 'block';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        
        // Cargar datos básicos
        const allTickets = await loadTickets();
        const users = await loadUsers();
        const currentUser = getCurrentUser();
        
        console.log('📊 Datos cargados:', {
            tickets: allTickets?.length || 0,
            users: users?.length || 0,
            currentUser: currentUser?.email || 'No user'
        });
        
        // Renderizar contenido mínimo pero visible
        el.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
                <h2 style="font-family:var(--font-display);font-size:1.4rem;color:#16a34a;margin:0">Dashboard</h2>
                <button class="btn btn-success btn-sm" onclick="openNewTicketModal()">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Nuevo ticket
                </button>
            </div>
            <p class="section-sub">Sistema de gestión de tickets municipales</p>
            
            <!-- Tarjetas de estadísticas -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-bottom:30px;">
                <div style="background:#16a34a;color:white;padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(22,163,74,0.15);">
                    <h3 style="margin:0 0 10px 0;font-size:1.2rem;">📊 Total de Tickets</h3>
                    <div style="font-size:2rem;font-weight:700;">${allTickets?.length || 0}</div>
                </div>
                
                <div style="background:#dc2626;color:white;padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(220,38,38,0.15);">
                    <h3 style="margin:0 0 10px 0;font-size:1.2rem;">👥 Usuarios Registrados</h3>
                    <div style="font-size:2rem;font-weight:700;">${users?.length || 0}</div>
                </div>
                
                <div style="background:#2563eb;color:white;padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(37,99,235,0.15);">
                    <h3 style="margin:0 0 10px 0;font-size:1.2rem;">🔧 Estado del Sistema</h3>
                    <div style="font-size:1rem;">${isSupabaseConnected() ? '✅ Conectado a Supabase' : '❌ Sin conexión'}</div>
                </div>
            </div>
            
            <!-- Debug info -->
            <div style="position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.8);color:white;padding:10px;border-radius:5px;font-size:0.8rem;z-index:9999;">
                <strong>🚨 EMERGENCY MODE</strong><br>
                <small>Dashboard versión de emergencia activa</small>
            </div>
        `;
        
        hideLoading();
        
    } catch (error) {
        console.error('❌ Error en dashboard:', error);
        el.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <h3 style="color:#dc2626;">❌ Error cargando dashboard</h3>
                <p style="color:#666;">${error.message}</p>
            </div>
        `;
        hideLoading();
    }
}

// Exportar función de emergencia
window.renderDashboardEmergency = renderDashboard;

console.log('🚨 Dashboard Emergency cargado');
