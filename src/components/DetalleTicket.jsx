// DetalleTicket.jsx
// Vista completa del ticket: info, fotos, cambio de estado, comentarios e historial
// Requiere: @supabase/supabase-js, lucide-react, ./ticketStorage (GaleriaFotos)
// Uso: <DetalleTicket ticketId="uuid" onCerrar={() => {}} onActualizado={() => {}} />

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { GaleriaFotos } from "./ticketStorage";
import {
  X, Clock, User, Building2, AlertTriangle,
  CheckCircle2, Loader2, MessageSquare, Send,
  ChevronRight, Lock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────

const ESTADOS = [
  { key: "activo",    label: "Activo",    color: "#2563eb", bg: "#dbeafe" },
  { key: "pendiente", label: "Pendiente", color: "#b45309", bg: "#fef3c7" },
  { key: "atendido",  label: "Atendido",  color: "#15803d", bg: "#dcfce7" },
  { key: "cerrado",   label: "Cerrado",   color: "#6b7280", bg: "#f3f4f6" },
];

const PRIORIDADES = {
  alta:  { label: "Alta",  icon: "↑", color: "#dc2626" },
  media: { label: "Media", icon: "→", color: "#d97706" },
  baja:  { label: "Baja",  icon: "↓", color: "#16a34a" },
};

// ─────────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────────

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Badge({ estado }) {
  const e = ESTADOS.find((s) => s.key === estado) || ESTADOS[0];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: e.bg, color: e.color,
      fontSize: 12, fontWeight: 500,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: e.color }} />
      {e.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// HOOK: useDetalleTicket
// ─────────────────────────────────────────────────────────────────

function useDetalleTicket(ticketId) {
  const [ticket, setTicket]       = useState(null);
  const [historial, setHistorial] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [perfil, setPerfil]       = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);

  const cargar = useCallback(async () => {
    if (!ticketId) return;
    setCargando(true);
    setError(null);
    try {
      // Perfil del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      const { data: p } = await supabase
        .from("perfiles").select("*").eq("id", user.id).single();
      setPerfil(p);

      // Ticket con datos del creador y técnico
      const { data: t, error: tErr } = await supabase
        .from("vista_tickets")
        .select("*")
        .eq("id", ticketId)
        .single();
      if (tErr) throw tErr;
      setTicket(t);

      // Historial de cambios
      const { data: h } = await supabase
        .from("ticket_historial")
        .select("*, cambiado_por_perfil:perfiles!cambiado_por(nombre)")
        .eq("ticket_id", ticketId)
        .order("cambiado_en", { ascending: true });
      setHistorial(h || []);

      // Comentarios
      const { data: c } = await supabase
        .from("ticket_comentarios")
        .select("*, autor:perfiles!autor_id(nombre, rol)")
        .eq("ticket_id", ticketId)
        .order("creado_en", { ascending: true });
      setComentarios(c || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [ticketId]);

  useEffect(() => { cargar(); }, [cargar]);

  return { ticket, historial, comentarios, perfil, cargando, error, recargar: cargar };
}

// ─────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────

export default function DetalleTicket({ ticketId, onCerrar, onActualizado }) {
  const { ticket, historial, comentarios, perfil, cargando, error, recargar } =
    useDetalleTicket(ticketId);

  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [esInterno, setEsInterno]             = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [tab, setTab] = useState("info"); // info | historial | comentarios

  const esTecnicoOAdmin = perfil?.rol === "tecnico" || perfil?.rol === "admin";

  // ── Cambiar estado del ticket ──
  const cambiarEstado = async (nuevoEstado) => {
    if (!ticket || nuevoEstado === ticket.estado) return;
    setCambiandoEstado(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ estado: nuevoEstado })
        .eq("id", ticket.id);
      if (error) throw error;
      await recargar();
      onActualizado?.();
    } catch (err) {
      alert("Error al cambiar estado: " + err.message);
    } finally {
      setCambiandoEstado(false);
    }
  };

  // ── Enviar comentario ──
  const enviarComentario = async () => {
    const texto = nuevoComentario.trim();
    if (!texto || !ticket) return;
    setEnviandoComentario(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("ticket_comentarios").insert({
        ticket_id: ticket.id,
        autor_id: user.id,
        contenido: texto,
        es_interno: esInterno && esTecnicoOAdmin,
      });
      if (error) throw error;
      setNuevoComentario("");
      await recargar();
    } catch (err) {
      alert("Error al enviar comentario: " + err.message);
    } finally {
      setEnviandoComentario(false);
    }
  };

  // ── Render estados de carga / error ──
  if (cargando) return (
    <ModalShell onCerrar={onCerrar}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 10, color: "#888" }}>
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        Cargando ticket...
      </div>
    </ModalShell>
  );

  if (error || !ticket) return (
    <ModalShell onCerrar={onCerrar}>
      <div style={{ padding: 40, textAlign: "center", color: "#dc2626", fontSize: 14 }}>
        {error || "No se encontró el ticket."}
      </div>
    </ModalShell>
  );

  const prio = PRIORIDADES[ticket.prioridad] || PRIORIDADES.media;

  return (
    <ModalShell onCerrar={onCerrar} wide>
      {/* ── Encabezado ── */}
      <div style={{ padding: "18px 22px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>
              {ticket.numero_display} · {ticket.departamento}
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: 0, lineHeight: 1.3 }}>
              {ticket.asunto}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              <Badge estado={ticket.estado} />
              <span style={{ fontSize: 12, fontWeight: 500, color: prio.color }}>
                {prio.icon} {prio.label}
              </span>
              <span style={{ fontSize: 11, color: "#bbb" }}>|</span>
              <span style={{ fontSize: 11, color: "#999", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} /> {formatFecha(ticket.creado_en)}
              </span>
            </div>
          </div>
          <button onClick={onCerrar} style={iconCloseStyle}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0", padding: "0 22px" }}>
        {[
          { key: "info",        label: "Información" },
          { key: "comentarios", label: `Comentarios (${comentarios.length})` },
          { key: "historial",   label: `Historial (${historial.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: tab === t.key ? 500 : 400,
              color: tab === t.key ? "#1a5c38" : "#888",
              background: "none",
              border: "none",
              borderBottom: tab === t.key ? "2px solid #1a5c38" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Cuerpo ── */}
      <div style={{ padding: "18px 22px", overflowY: "auto", maxHeight: "60vh" }}>

        {/* TAB: Información */}
        {tab === "info" && (
          <div>
            {/* Datos del solicitante */}
            <SectionLabel icon={<User size={13} />} text="Solicitante" />
            <InfoRow label="Nombre"       value={ticket.creado_por_nombre} />
            <InfoRow label="Email"        value={ticket.creado_por_email} />
            <InfoRow label="Departamento" value={ticket.departamento} />
            {ticket.tecnico_nombre && (
              <InfoRow label="Técnico asignado" value={ticket.tecnico_nombre} />
            )}

            {/* Descripción */}
            <SectionLabel icon={<MessageSquare size={13} />} text="Descripción" />
            <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, margin: 0 }}>
              {ticket.descripcion}
            </p>

            {/* Fotos */}
            {ticket.total_fotos > 0 && (
              <>
                <SectionLabel text={`Fotografías adjuntas (${ticket.total_fotos})`} />
                <GaleriaFotos ticketId={ticket.id} puedeEliminar={esTecnicoOAdmin} />
              </>
            )}

            {/* Cambio de estado — solo técnico/admin */}
            {esTecnicoOAdmin && (
              <>
                <SectionLabel text="Cambiar estado" />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ESTADOS.map((e) => {
                    const activo = ticket.estado === e.key;
                    return (
                      <button
                        key={e.key}
                        onClick={() => cambiarEstado(e.key)}
                        disabled={activo || cambiandoEstado}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 7,
                          fontSize: 12,
                          fontWeight: activo ? 600 : 400,
                          cursor: activo ? "default" : "pointer",
                          border: activo ? `2px solid ${e.color}` : "1px solid #e0e0e0",
                          background: activo ? e.bg : "#fff",
                          color: activo ? e.color : "#555",
                          transition: "all 0.15s",
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        {cambiandoEstado && !activo
                          ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                          : <span style={{ width: 7, height: 7, borderRadius: "50%", background: e.color }} />
                        }
                        {e.label}
                        {activo && <CheckCircle2 size={12} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Fechas */}
            <SectionLabel icon={<Clock size={13} />} text="Fechas" />
            <InfoRow label="Creado"      value={formatFecha(ticket.creado_en)} />
            <InfoRow label="Actualizado" value={formatFecha(ticket.actualizado_en)} />
            {ticket.cerrado_en && (
              <InfoRow label="Cerrado" value={formatFecha(ticket.cerrado_en)} />
            )}
          </div>
        )}

        {/* TAB: Comentarios */}
        {tab === "comentarios" && (
          <div>
            {comentarios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#bbb", fontSize: 13 }}>
                Sin comentarios aún.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                {comentarios.map((c) => {
                  const esMio = c.autor_id === perfil?.id;
                  return (
                    <div
                      key={c.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: esMio ? "flex-end" : "flex-start",
                      }}
                    >
                      <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>
                        {c.autor?.nombre} · {formatFecha(c.creado_en)}
                        {c.es_interno && (
                          <span style={{ marginLeft: 6, color: "#9333ea", fontWeight: 500 }}>
                            <Lock size={10} style={{ verticalAlign: "middle" }} /> Interno
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "9px 14px",
                          borderRadius: esMio ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                          background: esMio ? "#1a5c38" : (c.es_interno ? "#f5f0ff" : "#f4f4f4"),
                          color: esMio ? "#fff" : (c.es_interno ? "#6b21a8" : "#222"),
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        {c.contenido}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Caja de nuevo comentario */}
            {ticket.estado !== "cerrado" && (
              <div style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                overflow: "hidden",
                marginTop: 8,
              }}>
                <textarea
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Escribe un comentario..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "none",
                    resize: "none",
                    fontSize: 13,
                    fontFamily: "inherit",
                    color: "#111",
                    outline: "none",
                    background: "#fff",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviarComentario();
                  }}
                />
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#fafafa",
                  borderTop: "1px solid #f0f0f0",
                }}>
                  {esTecnicoOAdmin ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={esInterno}
                        onChange={(e) => setEsInterno(e.target.checked)}
                        style={{ accentColor: "#9333ea" }}
                      />
                      <Lock size={11} /> Nota interna (solo técnicos)
                    </label>
                  ) : <span style={{ fontSize: 11, color: "#bbb" }}>Ctrl+Enter para enviar</span>}
                  <button
                    onClick={enviarComentario}
                    disabled={!nuevoComentario.trim() || enviandoComentario}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 14px", borderRadius: 7,
                      background: nuevoComentario.trim() ? "#1a5c38" : "#e5e7eb",
                      color: nuevoComentario.trim() ? "#fff" : "#aaa",
                      border: "none", fontSize: 12, fontWeight: 500,
                      cursor: nuevoComentario.trim() ? "pointer" : "default",
                    }}
                  >
                    {enviandoComentario
                      ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                      : <Send size={13} />}
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Historial */}
        {tab === "historial" && (
          <div>
            {historial.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#bbb", fontSize: 13 }}>
                Sin cambios registrados aún.
              </div>
            ) : (
              <div style={{ position: "relative", paddingLeft: 20 }}>
                {/* Línea vertical */}
                <div style={{
                  position: "absolute", left: 6, top: 6, bottom: 6,
                  width: 1, background: "#e5e7eb",
                }} />

                {/* Evento de creación */}
                <TimelineItem
                  label="Ticket creado"
                  fecha={formatFecha(ticket.creado_en)}
                  por={ticket.creado_por_nombre}
                  color="#1a5c38"
                  isFirst
                />

                {/* Cambios de estado */}
                {historial.map((h) => {
                  const prev = ESTADOS.find((e) => e.key === h.estado_prev);
                  const next = ESTADOS.find((e) => e.key === h.estado_nuevo);
                  return (
                    <TimelineItem
                      key={h.id}
                      label={
                        <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          Estado cambiado
                          {prev && <Badge estado={prev.key} />}
                          <ChevronRight size={12} color="#aaa" />
                          {next && <Badge estado={next.key} />}
                        </span>
                      }
                      fecha={formatFecha(h.cambiado_en)}
                      por={h.cambiado_por_perfil?.nombre}
                      nota={h.nota}
                      color={next?.color || "#888"}
                    />
                  );
                })}

                {/* Evento de cierre */}
                {ticket.cerrado_en && (
                  <TimelineItem
                    label="Ticket cerrado"
                    fecha={formatFecha(ticket.cerrado_en)}
                    color="#6b7280"
                    isLast
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────────

function ModalShell({ children, onCerrar, wide }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "flex-start",
        justifyContent: "center",
        padding: "24px 16px",
        zIndex: 50, overflowY: "auto",
      }}
      onClick={(e) => e.target === e.currentTarget && onCerrar?.()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: wide ? 680 : 520,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function SectionLabel({ text, icon }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 600,
      color: "#999", textTransform: "uppercase",
      letterSpacing: "0.5px",
      margin: "18px 0 8px",
    }}>
      {icon} {text}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "6px 0",
      borderBottom: "1px solid #f5f5f5",
      fontSize: 13,
    }}>
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ color: "#111", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function TimelineItem({ label, fecha, por, nota, color, isFirst, isLast }) {
  return (
    <div style={{ position: "relative", paddingBottom: isLast ? 0 : 18 }}>
      {/* Dot */}
      <div style={{
        position: "absolute", left: -17, top: 3,
        width: 10, height: 10, borderRadius: "50%",
        background: color || "#1a5c38",
        border: "2px solid #fff",
        boxShadow: `0 0 0 1px ${color || "#1a5c38"}`,
      }} />

      <div style={{ fontSize: 13, color: "#222", lineHeight: 1.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: "#aaa", marginTop: 2, display: "flex", gap: 10 }}>
        <span>{fecha}</span>
        {por && <span>por {por}</span>}
      </div>
      {nota && (
        <div style={{
          marginTop: 5, padding: "6px 10px",
          background: "#fafafa", borderRadius: 6,
          fontSize: 12, color: "#666",
          borderLeft: "3px solid #e0e0e0",
        }}>
          {nota}
        </div>
      )}
    </div>
  );
}

const iconCloseStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#aaa",
  padding: 4,
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
