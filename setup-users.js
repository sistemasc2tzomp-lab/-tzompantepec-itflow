// ══════════════════════════════════════════
// SCRIPT PARA CREAR USUARIOS INICIALES EN SUPABASE
// ══════════════════════════════════════════

// Usuarios iniciales para el sistema
const initialUsers = [
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
    },
    {
        email: 'sistemas@tzompantepec.gob.mx',
        password: 'sistemas123',
        nombre: 'Sistemas Municipales',
        rol: 'admin',
        departamento: 'TI / Sistemas'
    }
];

/**
 * Función para crear usuarios iniciales
 * Ejecutar en la consola del navegador después de conectar a Supabase
 */
async function createInitialUsers() {
    if (!window.supabaseClient) {
        console.error('Primero conecta a Supabase');
        return;
    }

    console.log('Creando usuarios iniciales...');
    
    for (const user of initialUsers) {
        try {
            // 1. Crear usuario en Auth
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
                console.error(`Error creando auth para ${user.email}:`, authError);
                continue;
            }

            // 2. Crear perfil en tabla usuarios
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
                console.error(`Error creando perfil para ${user.email}:`, profileError);
                continue;
            }

            console.log(`✅ Usuario creado: ${user.email} (${user.nombre})`);
            
        } catch (error) {
            console.error(`Error procesando ${user.email}:`, error);
        }
    }
    
    console.log('Proceso completado. Recarga la página para ver los usuarios.');
}

/**
 * Función para verificar usuarios existentes
 */
async function checkExistingUsers() {
    if (!window.supabaseClient) {
        console.error('Primero conecta a Supabase');
        return;
    }

    const { data, error } = await window.supabaseClient
        .from('usuarios')
        .select('email, nombre, rol, departamento');

    if (error) {
        console.error('Error consultando usuarios:', error);
        return;
    }

    console.log('Usuarios existentes:');
    data.forEach(user => {
        console.log(`- ${user.email} (${user.nombre}) - ${user.rol} - ${user.departamento}`);
    });
}

// Hacer funciones disponibles globalmente
window.createInitialUsers = createInitialUsers;
window.checkExistingUsers = checkExistingUsers;

console.log('Script de usuarios cargado. Usa createInitialUsers() para crear usuarios o checkExistingUsers() para verificar.');
