// ════════════════════════════════════════════════════════════════
// INICIALIZACIÓN DE SUPABASE - CARGA DIRECTA DE LIBRERÍA
// ════════════════════════════════════════════════════════════════

(function() {
    'use strict';

    const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

    /**
     * Carga la librería de Supabase desde CDN e inicializa el cliente.
     * Si ya está cargada en window.supabase, la usa directamente.
     */
    function loadAndInit() {
        if (window.supabase && window.supabase.createClient) {
            // Ya estaba cargada (ej. tag <script> en el HTML)
            console.log('✅ Supabase ya disponible en window');
            tryAutoConnect();
            return;
        }

        // Cargar desde CDN
        const script = document.createElement('script');
        script.src = SUPABASE_CDN;

        script.onload = function() {
            console.log('✅ Librería Supabase cargada');
            tryAutoConnect();
        };

        script.onerror = function() {
            console.error('❌ No se pudo cargar la librería de Supabase desde CDN.');
        };

        document.head.appendChild(script);
    }

    /**
     * Intenta conectar automáticamente usando las credenciales guardadas
     * en localStorage (guardadas previamente por connectSupabase()).
     */
    function tryAutoConnect() {
        const url = localStorage.getItem('supa_url');
        const key = localStorage.getItem('supa_key');

        if (!url || !key) {
            console.log('ℹ️ Sin credenciales guardadas — esperando configuración manual.');
            return;
        }

        try {
            // Evitar instancias duplicadas
            if (window.supabaseClient) {
                console.log('ℹ️ Cliente Supabase ya existe, omitiendo creación duplicada.');
                return;
            }

            window.supabaseClient = window.supabase.createClient(url, key);
            console.log('✅ Supabase conectado automáticamente');

            // Actualizar UI del banner si existe
            const bannerStatus = document.getElementById('banner-status');
            if (bannerStatus) {
                bannerStatus.textContent = '● SUPABASE CONECTADO';
                bannerStatus.className = 'banner-status connected';
            }

            const syncDot = document.getElementById('sync-dot');
            if (syncDot) syncDot.classList.remove('offline');

            const syncLabel = document.getElementById('sync-label');
            if (syncLabel) syncLabel.textContent = 'Supabase sync';

        } catch (error) {
            console.error('❌ Error al conectar Supabase automáticamente:', error);
        }
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAndInit);
    } else {
        loadAndInit();
    }

})();
