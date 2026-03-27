// ══════════════════════════════════════════
// INIT-SUPABASE.JS — versión corregida
// Guarda credenciales automáticamente y
// no hace referencia a funciones externas
// ══════════════════════════════════════════

(function autoInitSupabase() {
    function init() {
        const urlEl = document.getElementById('supa-url');
        const keyEl = document.getElementById('supa-key');
        const urlFromHtml = urlEl?.value?.trim().replace(/\/$/, '') || '';
        const keyFromHtml = keyEl?.value?.trim() || '';

        // Guardar en localStorage si están en el HTML
        if (urlFromHtml && keyFromHtml) {
            localStorage.setItem('supa_url', urlFromHtml);
            localStorage.setItem('supa_key', keyFromHtml);
        }

        if (typeof window.supabase === 'undefined') {
            console.error('Supabase SDK no cargado.');
            return;
        }

        console.log('Supabase ya disponible en window');

        const url = urlFromHtml || localStorage.getItem('supa_url') || '';
        const key = keyFromHtml || localStorage.getItem('supa_key') || '';

        if (!url || !key) {
            console.info('Sin credenciales guardadas — esperando configuración manual.');
            return;
        }

        if (!window.supabaseClient) {
            window.supabaseClient = window.supabase.createClient(url, key);
            console.log('Supabase: cliente inicializado automáticamente.');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
