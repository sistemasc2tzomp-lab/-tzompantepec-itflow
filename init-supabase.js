// ════════════════════════════════════════════════════════════════
// INICIALIZACIÓN DE SUPABASE - CARGA SEGURA DE LIBRERÍA
// ════════════════════════════════════════════════════════════════

(function() {
    'use strict';
    
    // Función para esperar a que Supabase esté disponible
    function waitForSupabase(callback, maxAttempts = 50) {
        let attempts = 0;
        
        function check() {
            attempts++;
            
            if (window.supabase && window.supabase.createClient) {
                console.log('✅ Supabase está disponible');
                callback();
            } else if (attempts < maxAttempts) {
                console.log(`⏳ Esperando Supabase... intento ${attempts}/${maxAttempts}`);
                setTimeout(check, 100);
            } else {
                console.error('❌ Supabase no se pudo cargar después de varios intentos');
                // Intentar cargar manualmente
                loadSupabaseManually(callback);
            }
        }
        
        check();
    }
    
    // Cargar Supabase manualmente si no está disponible
    function loadSupabaseManually(callback) {
        console.log('🔧 Cargando Supabase manualmente...');
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.async = true;
        
        script.onload = function() {
            console.log('✅ Librería Supabase cargada manualmente');
            callback();
        };
        
        script.onerror = function() {
            console.error('❌ Error cargando librería Supabase');
        };
        
        document.head.appendChild(script);
    }
    
    // Inicializar cuando el DOM esté listo
    function initSupabase() {
        waitForSupabase(function() {
            // Conectar automáticamente si hay credenciales
            const url = document.getElementById('supa-url')?.value;
            const key = document.getElementById('supa-key')?.value;
            
            if (url && key) {
                try {
                    const { createClient } = window.supabase;
                    window.supabaseClient = createClient(url, key);
                    
                    console.log('✅ Supabase conectado automáticamente');
                    
                    // Actualizar UI
                    const bannerStatus = document.getElementById('banner-status');
                    if (bannerStatus) {
                        bannerStatus.textContent = '● CONECTADO';
                        bannerStatus.className = 'banner-status connected';
                    }
                    
                    // Ocultar banner después de 2 segundos
                    setTimeout(() => {
                        const configBanner = document.getElementById('config-banner');
                        if (configBanner) {
                            configBanner.style.display = 'none';
                        }
                    }, 2000);
                    
                } catch (error) {
                    console.error('❌ Error conectando Supabase:', error);
                }
            }
        });
    }
    
    // Iniciar cuando el documento esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
        initSupabase();
    }
    
})();
