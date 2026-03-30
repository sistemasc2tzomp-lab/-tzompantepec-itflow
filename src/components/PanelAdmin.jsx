// PanelAdmin.jsx
// Panel de administrador: reportes, estadísticas y gráficas
// Requiere: @supabase/supabase-js, recharts, lucide-react
// Uso: <PanelAdmin />

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, Legend,
} from "recharts";
import { Loader2, Download, RefreshCw, TrendingUp, Users, Ticket, Clock } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// COLORES
// ─────────────────────────────────────────────────────────────────
const COLORES_ESTADO = {
  activo:    "#2563eb",
  pendiente: "#f59e0b",
  atendido:  "#22c55e",
  cerrado:   "#9ca3af",
};

const COLORES_PRIO = {
  alta:  "#ef4444",
  media: "#f59e0b",
  baja:  "#22c55e",
};

const PALETTE = ["#1a5c38","#2563eb","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

// ─────────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────────
function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function exportarCSV(datos, nombre) {
  if (!datos.length) return;
  const headers = Object.keys(datos[0]).join(",");
  const rows = datos.map((r) => Object.values(r).map((v) => `"${v}"`).join(","));
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${nombre}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────
// HOOK: useDatosAdmin
// ─────────────────────────────────────────────────────────────────
function useDatosAdmin() {
  const [tickets,   setTickets]   = useState([]);
  const [usuarios,  setUsuarios]  = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState(null);
  const [rango,     setRango]     = useState("30"); // días

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const desde = new Date();
      desde.setDate(desde.getDate() - parseInt(rango));

      const { data: t, error: tErr } = await supabase
        .from("vista_tickets")
        .select("*")
        .gte("creado_en", desde.toISOString())
        .order("creado_en", { ascending: false });
      if (tErr) throw tErr;
      setTickets(t || []);

      const { data: u, error: uErr } = await supabase
        .from("perfiles")
        .select("id, nombre, email, rol, departamento, creado_en");
      if (uErr) throw uErr;
      setUsuarios(u || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [rango]);

  useEffect(() => { cargar(); }, [cargar]);
  return { tickets, usuarios, cargando, error, rango, setRango, recargar: cargar };
}

// ─────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export default function PanelAdmin() {
  const { tickets, usuarios, cargando, error, rango, setRango, recargar } = useDatosAdmin();
  const [tab, setTab] = useState("resumen");

  // ── Cálculos derivados ──────────────────────────────────────
  const stats = useMemo(() => {
    const total     = tickets.length;
    const activos   = tickets.filter((t) => t.estado === "activo").length;
    const cerrados  = tickets.filter((t) => t.estado === "cerrado").length;
    const conFotos  = tickets.filter((t) => t.total_fotos > 0).length;
    const sinAsignar= tickets.filter((t) => !t.tecnico_nombre).length;

    // Tiempo promedio de resolución (tickets cerrados)
    const tiemposRes = tickets
      .filter((t) => t.cerrado_en && t.creado_en)
      .map((t) => (new Date(t.cerrado_en) - new Date(t.creado_en)) / 3600000);
    const tiempoPromedio = tiemposRes.length
      ? (tiemposRes.reduce((a, b) => a + b, 0) / tiemposRes.length).toFixed(1)
      : "—";

    return { total, activos, cerrados, conFotos, sinAsignar, tiempoPromedio };
  }, [tickets]);

  // ── Datos para gráficas ─────────────────────────────────────

  // Distribución por estado
  const dataPie = useMemo(() =>
    Object.entries(
      tickets.reduce((acc, t) => {
        acc[t.estado] = (acc[t.estado] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value })),
  [tickets]);

  // Tickets por departamento
  const dataDepto = useMemo(() => {
    const map = tickets.reduce((acc, t) => {
      const d = t.departamento || "Sin depto.";
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(map)
      .map(([depto, total]) => ({ depto: depto.split(" ")[0], total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [tickets]);

  // Tickets por día (últimos 14 días)
  const dataLinea = useMemo(() => {
    const map = {};
    const hoy = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
      map[key] = { dia: key, creados: 0, cerrados: 0 };
    }
    tickets.forEach((t) => {
      const k = new Date(t.creado_en).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
      if (map[k]) map[k].creados++;
      if (t.cerrado_en) {
        const kc = new Date(t.cerrado_en).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
        if (map[kc]) map[kc].cerrados++;
      }
    });
    return Object.values(map);
  }, [tickets]);

  // Tickets por prioridad
  const dataPrio = useMemo(() => {
    const map = tickets.reduce((acc, t) => {
      acc[t.prioridad] = (acc[t.prioridad] || 0) + 1;
      return acc;
    }, {});
    return ["alta", "media", "baja"].map((p) => ({ prioridad: p, total: map[p] || 0 }));
  }, [tickets]);

  // Carga de técnicos
  const dataTecnicos = useMemo(() => {
    const map = tickets.reduce((acc, t) => {
      const nombre = t.tecnico_nombre || "Sin asignar";
      if (!acc[nombre]) acc[nombre] = { tecnico: nombre, activos: 0, cerrados: 0, total: 0 };
      acc[nombre].total++;
      if (t.estado === "activo" || t.estado === "pendiente") acc[nombre].activos++;
      if (t.estado === "cerrado") acc[nombre].cerrados++;
      return acc;
    }, {});
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [tickets]);

  if (cargando) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, gap:10, color:"#888" }}>
      <Loader2 size={18} style={{ animation:"spin 1s linear infinite" }} />
      Cargando reportes...
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding:32, color:"#dc2626", fontSize:14 }}>Error: {error}</div>
  );

  return (
    <div style={{ fontFamily:"inherit" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:600, color:"#111", margin:0 }}>Panel de administrador</h1>
          <p style={{ fontSize:13, color:"#888", marginTop:3 }}>Reportes y estadísticas del sistema</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <label style={{ fontSize:12, color:"#888" }}>Período:</label>
          <select
            value={rango}
            onChange={(e) => setRango(e.target.value)}
            style={{ padding:"6px 10px", borderRadius:7, border:"1px solid #e0e0e0", fontSize:13, fontFamily:"inherit", cursor:"pointer" }}
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
          <button onClick={recargar} style={btnOutline}>
            <RefreshCw size={13} /> Actualizar
          </button>
          <button
            onClick={() => exportarCSV(tickets, `tickets_${new Date().toISOString().slice(0,10)}`)}
            style={btnPrimary}
          >
            <Download size={13} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid #f0f0f0", marginBottom:20 }}>
        {[
          { key:"resumen",   label:"Resumen" },
          { key:"graficas",  label:"Gráficas" },
          { key:"tecnicos",  label:"Carga de técnicos" },
          { key:"todos",     label:`Todos los tickets (${tickets.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:"10px 16px", fontSize:13,
            fontWeight: tab === t.key ? 500 : 400,
            color: tab === t.key ? "#1a5c38" : "#888",
            background:"none", border:"none",
            borderBottom: tab === t.key ? "2px solid #1a5c38" : "2px solid transparent",
            cursor:"pointer", fontFamily:"inherit", marginBottom:-1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── TAB: Resumen ── */}
      {tab === "resumen" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:12, marginBottom:24 }}>
            <StatCard icon={<Ticket size={16}/>}     label="Total tickets"      value={stats.total}          color="#1a5c38" />
            <StatCard icon={<Clock size={16}/>}      label="En curso"           value={stats.activos}         color="#2563eb" />
            <StatCard icon={<TrendingUp size={16}/>} label="Tiempo prom. (hrs)" value={stats.tiempoPromedio} color="#8b5cf6" />
            <StatCard icon={<Users size={16}/>}      label="Sin asignar"        value={stats.sinAsignar}      color="#ef4444" />
          </div>

          {/* Mini gráfica de línea */}
          <div style={cardStyle}>
            <div style={cardTitle}>Tickets creados vs cerrados — últimos 14 días</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dataLinea} margin={{ top:4, right:16, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dia" tick={{ fontSize:11, fill:"#aaa" }} />
                <YAxis tick={{ fontSize:11, fill:"#aaa" }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Line type="monotone" dataKey="creados"  stroke="#2563eb" strokeWidth={2} dot={false} name="Creados" />
                <Line type="monotone" dataKey="cerrados" stroke="#22c55e" strokeWidth={2} dot={false} name="Cerrados" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dos mini gráficas */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:14 }}>
            <div style={cardStyle}>
              <div style={cardTitle}>Por estado</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={dataPie} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {dataPie.map((entry, i) => (
                      <Cell key={i} fill={COLORES_ESTADO[entry.name] || PALETTE[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={cardStyle}>
              <div style={cardTitle}>Por prioridad</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dataPrio} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="prioridad" tick={{ fontSize:12, fill:"#888" }} />
                  <YAxis tick={{ fontSize:11, fill:"#aaa" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
                  <Bar dataKey="total" radius={[4,4,0,0]}>
                    {dataPrio.map((entry, i) => (
                      <Cell key={i} fill={COLORES_PRIO[entry.prioridad] || "#ccc"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Gráficas ── */}
      {tab === "graficas" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={cardStyle}>
            <div style={cardTitle}>Tickets por departamento</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dataDepto} margin={{ top:4, right:16, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="depto" tick={{ fontSize:11, fill:"#888" }} />
                <YAxis tick={{ fontSize:11, fill:"#aaa" }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
                <Bar dataKey="total" fill="#1a5c38" radius={[4,4,0,0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <div style={cardTitle}>Tendencia diaria — creados vs cerrados</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dataLinea} margin={{ top:4, right:16, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dia" tick={{ fontSize:11, fill:"#aaa" }} />
                <YAxis tick={{ fontSize:11, fill:"#aaa" }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Line type="monotone" dataKey="creados"  stroke="#2563eb" strokeWidth={2} dot={{ r:3 }} name="Creados" />
                <Line type="monotone" dataKey="cerrados" stroke="#22c55e" strokeWidth={2} dot={{ r:3 }} name="Cerrados" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB: Técnicos ── */}
      {tab === "tecnicos" && (
        <div>
          <div style={cardStyle}>
            <div style={cardTitle}>Carga de trabajo por técnico</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dataTecnicos.slice(0,8)} layout="vertical" margin={{ top:4, right:16, left:60, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize:11, fill:"#aaa" }} allowDecimals={false} />
                <YAxis type="category" dataKey="tecnico" tick={{ fontSize:11, fill:"#888" }} width={80} />
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="activos"  stackId="a" fill="#2563eb" name="En curso" radius={[0,0,0,0]} />
                <Bar dataKey="cerrados" stackId="a" fill="#22c55e" name="Cerrados" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop:14 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#fafafa" }}>
                  {["Técnico","Activos","Cerrados","Total","% resueltos"].map((h) => (
                    <th key={h} style={{ padding:"8px 14px", textAlign:"left", fontSize:11, fontWeight:500, color:"#999", textTransform:"uppercase", letterSpacing:"0.4px", borderBottom:"1px solid #f0f0f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataTecnicos.map((t, i) => (
                  <tr key={i} style={{ borderBottom:"1px solid #f5f5f5" }}>
                    <td style={{ padding:"10px 14px", fontWeight:500 }}>{t.tecnico}</td>
                    <td style={{ padding:"10px 14px", color:"#2563eb" }}>{t.activos}</td>
                    <td style={{ padding:"10px 14px", color:"#16a34a" }}>{t.cerrados}</td>
                    <td style={{ padding:"10px 14px" }}>{t.total}</td>
                    <td style={{ padding:"10px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1, height:6, background:"#f0f0f0", borderRadius:3 }}>
                          <div style={{ height:"100%", width:`${t.total ? Math.round(t.cerrados/t.total*100) : 0}%`, background:"#22c55e", borderRadius:3, transition:"width .4s" }} />
                        </div>
                        <span style={{ fontSize:11, color:"#888", minWidth:28 }}>
                          {t.total ? Math.round(t.cerrados/t.total*100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: Todos los tickets ── */}
      {tab === "todos" && (
        <div>
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#fafafa" }}>
                  {["ID","Asunto","Solicitante","Técnico","Depto.","Estado","Prioridad","Creado"].map((h) => (
                    <th key={h} style={{ padding:"9px 12px", textAlign:"left", fontSize:11, fontWeight:500, color:"#999", textTransform:"uppercase", letterSpacing:"0.4px", borderBottom:"1px solid #f0f0f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} style={{ borderBottom:"1px solid #f5f5f5" }}>
                    <td style={{ padding:"9px 12px", fontWeight:500, fontSize:11, color:"#999" }}>{t.numero_display}</td>
                    <td style={{ padding:"9px 12px", maxWidth:180 }}>
                      <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:170 }}>{t.asunto}</div>
                    </td>
                    <td style={{ padding:"9px 12px", fontSize:12, color:"#555" }}>{t.creado_por_nombre}</td>
                    <td style={{ padding:"9px 12px", fontSize:12, color: t.tecnico_nombre ? "#555" : "#dc2626" }}>
                      {t.tecnico_nombre || "Sin asignar"}
                    </td>
                    <td style={{ padding:"9px 12px", fontSize:12, color:"#555" }}>{t.departamento}</td>
                    <td style={{ padding:"9px 12px" }}>
                      <span style={{
                        display:"inline-flex", alignItems:"center", gap:4,
                        padding:"2px 8px", borderRadius:20,
                        background: ({ activo:"#dbeafe",pendiente:"#fef3c7",atendido:"#dcfce7",cerrado:"#f3f4f6" })[t.estado],
                        color: ({ activo:"#2563eb",pendiente:"#b45309",atendido:"#15803d",cerrado:"#6b7280" })[t.estado],
                        fontSize:10, fontWeight:500,
                      }}>
                        {t.estado}
                      </span>
                    </td>
                    <td style={{ padding:"9px 12px", fontSize:12, color: ({ alta:"#dc2626",media:"#d97706",baja:"#16a34a" })[t.prioridad] }}>
                      {({ alta:"↑ Alta",media:"→ Media",baja:"↓ Baja" })[t.prioridad]}
                    </td>
                    <td style={{ padding:"9px 12px", fontSize:11, color:"#aaa" }}>{formatFecha(t.creado_en)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", borderLeft:`3px solid ${color}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:11, color:"#999", textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</span>
        <span style={{ color, opacity:0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize:26, fontWeight:600, color, lineHeight:1 }}>{value}</div>
    </div>
  );
}

const cardStyle = {
  background:"#fff", border:"1px solid #e5e7eb",
  borderRadius:10, padding:"16px 18px",
};
const cardTitle = {
  fontSize:13, fontWeight:500, color:"#444", marginBottom:14,
};
const btnPrimary = {
  display:"inline-flex", alignItems:"center", gap:6,
  padding:"7px 14px", background:"#1a5c38", color:"#fff",
  border:"none", borderRadius:7, fontSize:12, fontWeight:500,
  cursor:"pointer", fontFamily:"inherit",
};
const btnOutline = {
  display:"inline-flex", alignItems:"center", gap:6,
  padding:"7px 12px", background:"#fff", color:"#555",
  border:"1px solid #e0e0e0", borderRadius:7, fontSize:12,
  cursor:"pointer", fontFamily:"inherit",
};
