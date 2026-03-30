// VistaTecnico.jsx
// Panel del técnico: tickets asignados, filtros avanzados, asignación y estadísticas
// Requiere: @supabase/supabase-js, lucide-react, ./DetalleTicket
// Uso: <VistaTecnico />

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import DetalleTicket from "./DetalleTicket";
import {
  Search, Filter, RefreshCw, ChevronDown,
  Clock, AlertTriangle, CheckCircle2, User,
  Loader2, X, SlidersHorizontal, ArrowUpDown,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────

const ESTADOS = [
  { key: "todos",     label: "Todos" },
  { key: "activo",    label: "Activos",    color: "#2563eb", bg: "#dbeafe" },
  { key: "pendiente", label: "Pendientes", color: "#b45309", bg: "#fef3c7" },
  { key: "atendido",  label: "Atendidos",  color: "#15803d", bg: "#dcfce7" },
  { key: "cerrado",   label: "Cerrados",   color: "#6b7280", bg: "#f3f4f6" },
];

const PRIORIDADES = [
  { key: "todas", label: "Todas" },
  { key: "alta",  label: "Alta",  color: "#dc2626", icon: "↑" },
  { key: "media", label: "Media", color: "#d97706", icon: "→" },
  { key: "baja",  label: "Baja",  color: "#16a34a", icon: "↓" },
];

const ORDENAR_POR = [
  { key: "creado_en_desc",     label: "Más recientes primero" },
  { key: "creado_en_asc",      label: "Más antiguos primero" },
  { key: "prioridad_desc",     label: "Mayor prioridad primero" },
  { key: "actualizado_en_desc",label: "Última actividad" },
];

const PRIO_ORDEN = { alta: 3, media: 2, baja: 1 };

// ─────────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────────

function formatFechaCorta(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const ahora = new Date();
  const diffMs = ahora - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMs / 3600000);
  const diffDia = Math.floor(diffMs / 86400000);
  if (diffMin < 60)  return `hace ${diffMin}m`;
  if (diffHr  < 24)  return `hace ${diffHr}h`;
  if (diffDia < 7)   return `hace ${diffDia}d`;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function BadgeEstado({ estado }) {
  const e = ESTADOS.find((s) => s.key === estado);
  if (!e || !e.color) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 9px", borderRadius: 20,
      background: e.bg, color: e.color,
      fontSize: 11, fontWeight: 500,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: e.color }} />
      {e.label}
    </span>
  );
}

function BadgePrio({ prioridad }) {
  const p = PRIORIDADES.find((x) => x.key === prioridad);
  if (!p || !p.color) return null;
  return (
    <span style={{ fontSize: 12, fontWeight: 500, color: p.color }}>
      {p.icon} {p.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// HOOK: useTicketsTecnico
// ─────────────────────────────────────────────────────────────────

function useTicketsTecnico() {
  const [tickets, setTickets]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);
  const [perfil, setPerfil]     = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: p } = await supabase
        .from("perfiles").select("*").eq("id", user.id).single();
      setPerfil(p);

      // Admin ve todos los tickets; técnico solo los asignados a él
      let query = supabase
        .from("vista_tickets")
        .select("*")
        .order("creado_en", { ascending: false });

      if (p?.rol === "tecnico") {
        query = query.eq("asignado_a", user.id);
      }

      const { data, error: qErr } = await query;
      if (qErr) throw qErr;
      setTickets(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return { tickets, cargando, error, perfil, recargar: cargar };
}

// ─────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────

export default function VistaTecnico() {
  const { tickets, cargando, error, perfil, recargar } = useTicketsTecnico();

  // Filtros
  const [busqueda,  setBusqueda]  = useState("");
  const [estado,    setEstado]    = useState("todos");
  const [prioridad, setPrioridad] = useState("todas");
  const [depto,     setDepto]     = useState("todos");
  const [ordenar,   setOrdenar]   = useState("creado_en_desc");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Detalle
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  // Departamentos únicos para el filtro
  const departamentos = useMemo(() => {
    const deptos = [...new Set(tickets.map((t) => t.departamento).filter(Boolean))];
    return ["todos", ...deptos.sort()];
  }, [tickets]);

  // Aplicar filtros y orden
  const ticketsFiltrados = useMemo(() => {
    let lista = [...tickets];

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (t) =>
          t.asunto?.toLowerCase().includes(q) ||
          t.numero_display?.toLowerCase().includes(q) ||
          t.creado_por_nombre?.toLowerCase().includes(q) ||
          t.departamento?.toLowerCase().includes(q)
      );
    }
    if (estado    !== "todos")  lista = lista.filter((t) => t.estado    === estado);
    if (prioridad !== "todas")  lista = lista.filter((t) => t.prioridad === prioridad);
    if (depto     !== "todos")  lista = lista.filter((t) => t.departamento === depto);

    lista.sort((a, b) => {
      switch (ordenar) {
        case "creado_en_asc":       return new Date(a.creado_en) - new Date(b.creado_en);
        case "prioridad_desc":      return (PRIO_ORDEN[b.prioridad] || 0) - (PRIO_ORDEN[a.prioridad] || 0);
        case "actualizado_en_desc": return new Date(b.actualizado_en) - new Date(a.actualizado_en);
        default:                    return new Date(b.creado_en) - new Date(a.creado_en);
      }
    });

    return lista;
  }, [tickets, busqueda, estado, prioridad, depto, ordenar]);

  // Estadísticas rápidas
  const stats = useMemo(() => ({
    total:     tickets.length,
    activos:   tickets.filter((t) => t.estado === "activo").length,
    pendientes:tickets.filter((t) => t.estado === "pendiente").length,
    altas:     tickets.filter((t) => t.prioridad === "alta" && t.estado !== "cerrado").length,
    hoy:       tickets.filter((t) => {
      const d = new Date(t.creado_en);
      const hoy = new Date();
      return d.getDate() === hoy.getDate() &&
             d.getMonth() === hoy.getMonth() &&
             d.getFullYear() === hoy.getFullYear();
    }).length,
  }), [tickets]);

  const limpiarFiltros = () => {
    setBusqueda(""); setEstado("todos");
    setPrioridad("todas"); setDepto("todos");
    setOrdenar("creado_en_desc");
  };

  const hayFiltrosActivos =
    busqueda || estado !== "todos" || prioridad !== "todas" || depto !== "todos";

  // ── Asignar técnico a un ticket ──
  const asignarme = async (ticketId, e) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("tickets").update({ asignado_a: user.id }).eq("id", ticketId);
    recargar();
  };

  if (cargando) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, gap: 10, color: "#888" }}>
      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
      Cargando tickets...
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 32, color: "#dc2626", fontSize: 14 }}>
      Error: {error}
    </div>
  );

  return (
    <div style={{ fontFamily: "inherit" }}>

      {/* ── Encabezado ── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>
          {perfil?.rol === "admin" ? "Todos los tickets" : "Mis tickets asignados"}
        </h1>
        <p style={{ fontSize: 13, color: "#888", marginTop: 3 }}>
          Bienvenido, {perfil?.nombre} · {perfil?.rol === "admin" ? "Administrador" : "Técnico TI"}
        </p>
      </div>

      {/* ── Tarjetas de estadísticas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total asignados" value={stats.total}     color="#1a5c38" icon={<User size={16} />} />
        <StatCard label="Activos"          value={stats.activos}   color="#2563eb" icon={<Clock size={16} />} />
        <StatCard label="Pendientes"        value={stats.pendientes}color="#b45309" icon={<Clock size={16} />} />
        <StatCard label="Prioridad alta"    value={stats.altas}    color="#dc2626" icon={<AlertTriangle size={16} />} />
      </div>

      {/* ── Barra de búsqueda y acciones ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por asunto, ID, usuario, departamento..."
            style={{
              width: "100%", paddingLeft: 32, paddingRight: 10,
              paddingTop: 8, paddingBottom: 8,
              border: "1px solid #e5e7eb", borderRadius: 8,
              fontSize: 13, color: "#111", background: "#fff", outline: "none",
              fontFamily: "inherit",
            }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 2 }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8, fontSize: 13,
            border: mostrarFiltros ? "1px solid #1a5c38" : "1px solid #e5e7eb",
            background: mostrarFiltros ? "#e8f5ee" : "#fff",
            color: mostrarFiltros ? "#1a5c38" : "#555",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <SlidersHorizontal size={14} />
          Filtros
          {hayFiltrosActivos && (
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1a5c38" }} />
          )}
        </button>

        <button
          onClick={recargar}
          title="Recargar"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", color: "#555" }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── Panel de filtros avanzados ── */}
      {mostrarFiltros && (
        <div style={{
          background: "#fafafa", border: "1px solid #e5e7eb",
          borderRadius: 10, padding: "14px 16px", marginBottom: 14,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <FiltroSelect
              label="Estado"
              value={estado}
              onChange={setEstado}
              options={ESTADOS.map((e) => ({ value: e.key, label: e.label }))}
            />
            <FiltroSelect
              label="Prioridad"
              value={prioridad}
              onChange={setPrioridad}
              options={PRIORIDADES.map((p) => ({ value: p.key, label: p.label }))}
            />
            <FiltroSelect
              label="Departamento"
              value={depto}
              onChange={setDepto}
              options={departamentos.map((d) => ({
                value: d,
                label: d === "todos" ? "Todos" : d,
              }))}
            />
            <FiltroSelect
              label="Ordenar por"
              value={ordenar}
              onChange={setOrdenar}
              options={ORDENAR_POR.map((o) => ({ value: o.key, label: o.label }))}
            />
          </div>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              style={{ marginTop: 10, fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <X size={12} /> Limpiar todos los filtros
            </button>
          )}
        </div>
      )}

      {/* ── Conteo de resultados ── */}
      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{ticketsFiltrados.length} ticket{ticketsFiltrados.length !== 1 ? "s" : ""}</span>
        {hayFiltrosActivos && <span style={{ color: "#1a5c38" }}>· filtros activos</span>}
      </div>

      {/* ── Tabla de tickets ── */}
      {ticketsFiltrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Sin tickets con estos filtros</div>
          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros} style={{ marginTop: 10, fontSize: 13, color: "#1a5c38", background: "none", border: "none", cursor: "pointer" }}>
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["ID", "Asunto", "Solicitante", "Depto.", "Estado", "Prioridad", "Fotos", "Actualizado", ""].map((h) => (
                  <th key={h} style={{
                    padding: "9px 14px", textAlign: "left",
                    fontSize: 11, fontWeight: 500, color: "#999",
                    textTransform: "uppercase", letterSpacing: "0.4px",
                    borderBottom: "1px solid #f0f0f0",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ticketsFiltrados.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setTicketSeleccionado(t.id)}
                  style={{ borderBottom: "1px solid #f5f5f5", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={(e) => e.currentTarget.style.background = ""}
                >
                  <td style={{ padding: "10px 14px", fontWeight: 500, fontSize: 11, color: "#999" }}>
                    {t.numero_display}
                  </td>
                  <td style={{ padding: "10px 14px", maxWidth: 220 }}>
                    <div style={{ fontWeight: 500, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                      {t.asunto}
                    </div>
                    {t.total_comentarios > 0 && (
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
                        💬 {t.total_comentarios} comentario{t.total_comentarios > 1 ? "s" : ""}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#555" }}>
                    {t.creado_por_nombre}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#555" }}>
                    {t.departamento}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <BadgeEstado estado={t.estado} />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <BadgePrio prioridad={t.prioridad} />
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#aaa" }}>
                    {t.total_fotos > 0 ? `📷 ${t.total_fotos}` : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>
                    {formatFechaCorta(t.actualizado_en)}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {!t.tecnico_nombre && perfil?.rol !== "usuario" && (
                      <button
                        onClick={(e) => asignarme(t.id, e)}
                        style={{
                          fontSize: 11, padding: "4px 10px",
                          borderRadius: 6, border: "1px solid #1a5c38",
                          color: "#1a5c38", background: "#fff",
                          cursor: "pointer", whiteSpace: "nowrap",
                          fontFamily: "inherit",
                        }}
                      >
                        Asignarme
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal de detalle ── */}
      {ticketSeleccionado && (
        <DetalleTicket
          ticketId={ticketSeleccionado}
          onCerrar={() => setTicketSeleccionado(null)}
          onActualizado={() => { recargar(); }}
        />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb",
      borderRadius: 10, padding: "14px 16px",
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
        <span style={{ color, opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function FiltroSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: "#999", fontWeight: 500, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "7px 10px",
          border: "1px solid #e0e0e0", borderRadius: 7,
          fontSize: 13, color: "#111", background: "#fff",
          outline: "none", fontFamily: "inherit", cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
