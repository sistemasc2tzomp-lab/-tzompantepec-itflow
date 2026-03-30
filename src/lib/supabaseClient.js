// src/lib/supabaseClient.js
// Conexión central a Supabase — se importa en todos los componentes
// 
// ─── CÓMO OBTENER TUS CREDENCIALES ────────────────────────────
// 1. Ve a https://supabase.com y abre tu proyecto
// 2. En el menú lateral ve a: Settings → API
// 3. Copia "Project URL"  → pégala en SUPABASE_URL
// 4. Copia "anon public"  → pégala en SUPABASE_ANON_KEY
// ──────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = "https://TU_URL_AQUI.supabase.co";
const SUPABASE_ANON_KEY = "TU_ANON_KEY_AQUI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);