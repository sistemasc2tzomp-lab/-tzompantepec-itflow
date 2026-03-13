// ════════════════════════════════════════════════════════════════
// SCRIPT PARA CONECTAR AUTOMÁTICAMENTE A SUPABASE
// ════════════════════════════════════════════════════════════════

/**
 * Conecta automáticamente a Supabase con las credenciales precargadas
 */
function autoConnectSupabase() {
    console.log('🔧 Conectando a Supabase...');
    
    // Verificar si ya está conectado
    if (window.supabaseClient) {
        console.log('✅ Supabase ya está conectado');
        return true;
    }
    
    // Obtener credenciales del formulario
    const url = document.getElementById('supa-url')?.value;
    const key = document.getElementById('supa-key')?.value;
    
    if (!url || !key) {
        console.error('❌ No se encontraron las credenciales');
        return false;
    }
    
    // Conectar a Supabase
    try {
        window.supabaseClient = window.supabase.createClient(url, key);
        console.log('✅ Cliente de Supabase creado');
        
        // Actualizar UI
        const bannerStatus = document.getElementById('banner-status');
        if (bannerStatus) {
            bannerStatus.textContent = '● CONECTADO';
            bannerStatus.className = 'banner-status connected';
        }
        
        // Actualizar sincronización
        const syncDot = document.getElementById('sync-dot');
        const syncLabel = document.getElementById('sync-label');
        if (syncDot && syncLabel) {
            syncDot.style.background = '#16a34a';
            syncLabel.textContent = 'Conectado a Supabase';
        }
        
        // Ocultar banner de configuración
        setTimeout(() => {
            const configBanner = document.getElementById('config-banner');
            if (configBanner) {
                configBanner.style.display = 'none';
            }
        }, 2000);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error conectando a Supabase:', error);
        return false;
    }
}

/**
 * Verifica la conexión a Supabase
 */
async function verifySupabaseConnection() {
    if (!window.supabaseClient) {
        console.log('🔧 Intentando conectar a Supabase...');
        autoConnectSupabase();
    }
    
    if (!window.supabaseClient) {
        console.error('❌ No se pudo conectar a Supabase');
        return false;
    }
    
    try {
        // Intentar una consulta simple
        const { data, error } = await window.supabaseClient
            .from('usuarios')
            .select('count(*)')
            .limit(1);
        
        if (error) {
            console.error('❌ Error verificando conexión:', error);
            return false;
        }
        
        console.log('✅ Conexión a Supabase verificada');
        return true;
        
    } catch (error) {
        console.error('❌ Error en verificación:', error);
        return false;
    }
}

/**
 * Inicializa la conexión cuando el DOM esté listo
 */
function initSupabaseConnection() {
    // Esperar a que el DOM esté cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoConnectSupabase);
    } else {
        autoConnectSupabase();
    }
}

// Función para crear usuarios iniciales automáticamente
async function createInitialUsersAuto() {
    if (!window.supabaseClient) {
        console.error('❌ Supabase no está conectado');
        return;
    }
    
    const users = [
        {
            email: 'admin@tzompantepec.gob.mx',
            password: 'admin123',
            nombre: 'Administrador TI',
            rol: 'admin',
            departamento: 'TI / Sistemas'
        },
        {
            email: 'carlos.hernandez@tzompantepec.gob.mx',
            password: 'user123',
            nombre: 'Carlos Hernández',
            rol: 'usuario',
            departamento: 'Presidencia Municipal'
        },
        {
            email: 'maria.lopez@tzompantepec.gob.mx',
            password: 'user123',
            nombre: 'María López',
            rol: 'usuario',
            departamento: 'Tesorería'
        },
        {
            email: 'juan.perez@tzompantepec.gob.mx',
            password: 'user123',
            nombre: 'Juan Pérez',
            rol: 'usuario',
            departamento: 'Obras Públicas'
        }
    ];
    
    console.log('👥 Creando usuarios iniciales...');
    
    for (const user of users) {
        try {
            // Crear usuario en Auth
            const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                email: user.email,
                password: user.password,
                options: {
                    data: {
                        nombre: user.nombre,
                        rol: user.rol,
                        departamento: user.departamento
                    }
                }
            });
            
            if (authError) {
                console.log(`⚠️ Usuario ${user.email} ya existe o error:`, authError.message);
                continue;
            }
            
            // Crear perfil en tabla usuarios
            const { error: profileError } = await window.supabaseClient
                .from('usuarios')
                .insert([{
                    id: authData.user.id,
                    email: user.email,
                    nombre: user.nombre,
                    rol: user.rol,
                    departamento: user.departamento,
                    created_at: new Date().toISOString()
                }]);
            
            if (profileError) {
                console.error(`❌ Error creando perfil para ${user.email}:`, profileError);
            } else {
                console.log(`✅ Usuario creado: ${user.email}`);
            }
            
        } catch (error) {
            console.error(`❌ Error procesando ${user.email}:`, error);
        }
    }
    
    console.log('🎉 Proceso de creación de usuarios completado');
}

// Hacer funciones disponibles globalmente
window.autoConnectSupabase = autoConnectSupabase;
window.verifySupabaseConnection = verifySupabaseConnection;
window.createInitialUsersAuto = createInitialUsersAuto;
window.initSupabaseConnection = initSupabaseConnection;

// Auto-inicializar
initSupabaseConnection();

console.log('🚀 Script de conexión a Supabase cargado');
console.log('📋 Comandos disponibles:');
console.log('  - autoConnectSupabase()');
console.log('  - verifySupabaseConnection()');
console.log('  - createInitialUsersAuto()');
