// src/App.jsx
// Archivo principal — rutas, autenticación y layout con sidebar

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

// Componentes
import NuevoTicket  from "./components/NuevoTicket";
import VistaTecnico from "./components/VistaTecnico";
import PanelAdmin   from "./components/PanelAdmin";

// ─────────────────────────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export default function App() {
  const [sesion,   setSesion]   = useState(null);
  const [perfil,   setPerfil]   = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Verificar sesión activa al cargar
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      if (data.session) cargarPerfil(data.session.user.id);
      else setCargando(false);
    });

    // Escuchar cambios de sesión (login / logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
      if (session) cargarPerfil(session.user.id);
      else { setPerfil(null); setCargando(false); }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const cargarPerfil = async (userId) => {
    const { data } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", userId)
      .single();
    setPerfil(data);
    setCargando(false);
  };

  // ── Pantalla de carga inicial ──
  if (cargando) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#f0f5f2",
      flexDirection: "column", gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, border: "3px solid #e0e0e0",
        borderTopColor: "#1a5c38", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{ fontSize: 13, color: "#888" }}>Cargando sistema...</span>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Sin sesión: mostrar login ──
  if (!sesion) return <PaginaLogin />;

  // ── Con sesión: mostrar app ──
  return (
    <BrowserRouter>
      <Layout perfil={perfil}>
        <Routes>
          <Route path="/"         element={<Dashboard perfil={perfil} />} />
          <Route path="/tickets"  element={<VistaTecnico />} />
          <Route path="/admin"    element={
            perfil?.rol === "admin"
              ? <PanelAdmin />
              : <Navigate to="/" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

// ─────────────────────────────────────────────────────────────────
// LAYOUT CON SIDEBAR
// ─────────────────────────────────────────────────────────────────
function Layout({ children, perfil }) {
  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 210, background: "#1a5c38",
        display: "flex", flexDirection: "column",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "16px 14px", borderBottom: "1px solid rgba(255,255,255,.15)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            H. Ayuntamiento de Tzompantepec
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginTop: 3 }}>
            Mesa de Servicios TI
          </div>
        </div>

        {/* Navegación */}
        <nav style={{ flex: 1, paddingTop: 8 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", padding: "10px 14px 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Principal
          </div>
          <NavItem href="/"        label="Mi resumen"   icon="⊞" />
          <NavItem href="/tickets" label="Mis tickets"  icon="☰" />

          {(perfil?.rol === "admin" || perfil?.rol === "tecnico") && (
            <>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", padding: "10px 14px 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Sistema
              </div>
              <NavItem href="/tickets" label="Todos los tickets" icon="≡" />
            </>
          )}

          {perfil?.rol === "admin" && (
            <NavItem href="/admin" label="Administrador" icon="◈" />
          )}
        </nav>

        {/* Usuario + cerrar sesión */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600, color: "#fff",
            }}>
              {perfil?.nombre?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#fff", lineHeight: 1.2 }}>
                {perfil?.nombre || "Usuario"}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>
                {perfil?.rol || "usuario"}
              </div>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            style={{
              width: "100%", padding: "6px 0",
              background: "rgba(255,255,255,.1)",
              border: "1px solid rgba(255,255,255,.15)",
              borderRadius: 6, color: "rgba(255,255,255,.7)",
              fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              transition: "background .15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,.2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,.1)"}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main style={{
        flex: 1, overflow: "auto",
        padding: 24, background: "#f7f8f5",
      }}>
        {children}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// NAV ITEM
// ─────────────────────────────────────────────────────────────────
function NavItem({ href, label, icon }) {
  const active = window.location.pathname === href;
  return (
    <a href={href} style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "9px 14px", fontSize: 13,
      color: active ? "#fff" : "rgba(255,255,255,.7)",
      background: active ? "rgba(255,255,255,.15)" : "transparent",
      borderLeft: `3px solid ${active ? "#f0a500" : "transparent"}`,
      textDecoration: "none", transition: "all .12s",
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 14, opacity: 0.8 }}>{icon}</span>
      {label}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────
// DASHBOARD (página de inicio)
// ─────────────────────────────────────────────────────────────────
function Dashboard({ perfil }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tickets,     setTickets]     = useState([]);
  const [stats,       setStats]       = useState({ activos: 0, pendientes: 0, atendidos: 0, cerrados: 0 });
  const [cargando,    setCargando]    = useState(true);

  useEffect(() => { cargarTickets(); }, []);

  const cargarTickets = async () => {
    setCargando(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("vista_tickets")
      .select("*")
      .eq("creado_por_email", perfil?.email || "")
      .order("creado_en", { ascending: false })
      .limit(5);

    if (data) {
      setTickets(data);
      setStats({
        activos:    data.filter((t) => t.estado === "activo").length,
        pendientes: data.filter((t) => t.estado === "pendiente").length,
        atendidos:  data.filter((t) => t.estado === "atendido").length,
        cerrados:   data.filter((t) => t.estado === "cerrado").length,
      });
    }
    setCargando(false);
  };

  const ESTADO_STYLE = {
    activo:    { bg: "#dbeafe", color: "#2563eb" },
    pendiente: { bg: "#fef3c7", color: "#b45309" },
    atendido:  { bg: "#dcfce7", color: "#15803d" },
    cerrado:   { bg: "#f3f4f6", color: "#6b7280" },
  };

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "#111" }}>
            Hola, {perfil?.nombre?.split(" ")[0] || "Usuario"} 👋
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 3 }}>
            Estado de tus solicitudes de soporte
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", background: "#1a5c38", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          + Nuevo ticket
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Activos",    value: stats.activos,    color: "#2563eb", borde: "#dbeafe" },
          { label: "Atendidos",  value: stats.atendidos,  color: "#15803d", borde: "#dcfce7" },
          { label: "Pendientes", value: stats.pendientes, color: "#b45309", borde: "#fef3c7" },
          { label: "Cerrados",   value: stats.cerrados,   color: "#6b7280", borde: "#f3f4f6" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#fff", borderRadius: 10,
            border: "1px solid #e5e7eb",
            borderLeft: `3px solid ${s.color}`,
            padding: "14px 16px",
          }}>
            <div style={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tickets recientes */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>Mis tickets recientes</span>
          <a href="/tickets" style={{ fontSize: 12, color: "#1a5c38", textDecoration: "none" }}>Ver todos →</a>
        </div>
        {cargando ? (
          <div style={{ padding: 32, textAlign: "center", color: "#aaa", fontSize: 13 }}>Cargando...</div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ccc" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 13 }}>No se encontraron tickets</div>
            <button
              onClick={() => setMostrarForm(true)}
              style={{ marginTop: 12, fontSize: 13, color: "#1a5c38", background: "none", border: "none", cursor: "pointer" }}
            >
              Crear tu primer ticket →
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["ID", "Asunto", "Estado", "Prioridad", "Actualizado"].map((h) => (
                  <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#999", textTransform: "uppercase", letterSpacing: ".4px", borderBottom: "1px solid #f0f0f0" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const es = ESTADO_STYLE[t.estado] || {};
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: "#999", fontWeight: 500 }}>{t.numero_display}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "#111", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.asunto}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 20, background: es.bg, color: es.color, fontSize: 11, fontWeight: 500 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: es.color }} />
                        {t.estado}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: { alta: "#dc2626", media: "#d97706", baja: "#16a34a" }[t.prioridad] }}>
                      {{ alta: "↑ Alta", media: "→ Media", baja: "↓ Baja" }[t.prioridad]}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: "#aaa" }}>
                      {new Date(t.actualizado_en).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nuevo ticket */}
      {mostrarForm && (
        <NuevoTicket
          onClose={() => setMostrarForm(false)}
          onCreado={() => { setMostrarForm(false); cargarTickets(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PÁGINA DE LOGIN
// ─────────────────────────────────────────────────────────────────
function PaginaLogin() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState(null);
  const [cargando, setCargando] = useState(false);

  const login = async () => {
    if (!email || !password) return setError("Completa todos los campos.");
    setCargando(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Correo o contraseña incorrectos.");
    setCargando(false);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#f0f5f2",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: "36px 32px",
        width: 360, boxShadow: "0 4px 32px rgba(0,0,0,.08)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "#1a5c38", margin: "0 auto 12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>🖥️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a5c38" }}>Mesa de Servicios TI</div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>H. Ayuntamiento de Tzompantepec</div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", color: "#dc2626", fontSize: 12,
            padding: "9px 12px", borderRadius: 7, marginBottom: 14,
            border: "1px solid #fecaca",
          }}>
            {error}
          </div>
        )}

        {/* Campos */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#555", display: "block", marginBottom: 5, fontWeight: 500 }}>
            Correo electrónico
          </label>
          <input
            type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@tzompantepec.gob.mx"
            style={{ width: "100%", padding: "9px 11px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            onFocus={(e) => e.target.style.borderColor = "#1a5c38"}
            onBlur={(e) => e.target.style.borderColor = "#ddd"}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "#555", display: "block", marginBottom: 5, fontWeight: 500 }}>
            Contraseña
          </label>
          <input
            type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && login()}
            style={{ width: "100%", padding: "9px 11px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            onFocus={(e) => e.target.style.borderColor = "#1a5c38"}
            onBlur={(e) => e.target.style.borderColor = "#ddd"}
          />
        </div>

        {/* Botón */}
        <button
          onClick={login} disabled={cargando}
          style={{
            width: "100%", padding: "11px",
            background: cargando ? "#aaa" : "#1a5c38",
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: cargando ? "default" : "pointer",
            fontFamily: "inherit", transition: "background .15s",
          }}
        >
          {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </div>
    </div>
  );
}
