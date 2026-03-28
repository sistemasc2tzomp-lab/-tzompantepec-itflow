// NuevoTicket.jsx
// Formulario completo para crear tickets con fotos
// Requiere: @supabase/supabase-js, lucide-react
// Uso: <NuevoTicket onClose={() => {}} onCreado={(ticket) => {}} />

import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient"; // ajusta la ruta
import { X, Upload, Loader2, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

const DEPARTAMENTOS = [
  "Presidencia",
  "Tesorería",
  "Obras Públicas",
  "Servicios Municipales",
  "Registro Civil",
  "Seguridad Pública",
  "Desarrollo Social",
  "Otro",
];

const MAX_FOTOS = 5;
const MAX_SIZE_MB = 5;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

// ─── Utilidades ────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function validarArchivo(file) {
  if (!TIPOS_PERMITIDOS.includes(file.type))
    return "Solo se permiten imágenes JPG, PNG o WebP.";
  if (file.size > MAX_SIZE_MB * 1024 * 1024)
    return `El archivo supera el límite de ${MAX_SIZE_MB} MB.`;
  return null;
}

// ─── Subir foto a Supabase Storage ─────────────────────────────
async function subirFoto(file, ticketId, userId) {
  const ext = file.name.split(".").pop();
  const path = `${ticketId}/${userId}/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("ticket-fotos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;
  return path;
}

// ─── Componente principal ───────────────────────────────────────
export default function NuevoTicket({ onClose, onCreado }) {
  const [form, setForm] = useState({
    asunto: "",
    departamento: "",
    prioridad: "media",
    descripcion: "",
  });
  const [fotos, setFotos] = useState([]); // { file, preview, error }
  const [enviando, setEnviando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState(null);
  const [exitoso, setExitoso] = useState(false);
  const inputRef = useRef();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Manejo de fotos ──
  const agregarFotos = (files) => {
    const nuevas = Array.from(files).slice(0, MAX_FOTOS - fotos.length);
    const procesadas = nuevas.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      error: validarArchivo(file),
    }));
    setFotos((prev) => [...prev, ...procesadas]);
  };

  const quitarFoto = (idx) => {
    setFotos((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    agregarFotos(e.dataTransfer.files);
  };

  // ── Envío del formulario ──
  const handleSubmit = async () => {
    setErrorGlobal(null);

    // Validaciones básicas
    if (!form.asunto.trim()) return setErrorGlobal("El asunto es obligatorio.");
    if (!form.departamento) return setErrorGlobal("Selecciona un departamento.");
    if (!form.descripcion.trim())
      return setErrorGlobal("La descripción es obligatoria.");
    if (fotos.some((f) => f.error))
      return setErrorGlobal("Revisa los archivos con errores antes de continuar.");

    setEnviando(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Crear el ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          asunto: form.asunto.trim(),
          descripcion: form.descripcion.trim(),
          departamento: form.departamento,
          prioridad: form.prioridad,
          creado_por: user.id,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Subir fotos (en paralelo)
      const fotosValidas = fotos.filter((f) => !f.error);
      if (fotosValidas.length > 0) {
        const paths = await Promise.all(
          fotosValidas.map((f) => subirFoto(f.file, ticket.id, user.id))
        );

        // 3. Registrar rutas en la tabla ticket_fotos
        const registros = paths.map((path, i) => ({
          ticket_id: ticket.id,
          storage_path: path,
          nombre: fotosValidas[i].file.name,
          tamanio: fotosValidas[i].file.size,
          mime_type: fotosValidas[i].file.type,
          subido_por: user.id,
        }));

        const { error: fotosError } = await supabase
          .from("ticket_fotos")
          .insert(registros);

        if (fotosError) throw fotosError;
      }

      setExitoso(true);
      setTimeout(() => {
        onCreado?.(ticket);
        onClose?.();
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorGlobal(
        err.message || "Ocurrió un error al crear el ticket. Intenta de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  };

  // ── Render ──
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "24px 16px",
        zIndex: 50,
        overflowY: "auto",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: 560,
          padding: "20px 24px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>
            Nuevo ticket de soporte
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Éxito */}
        {exitoso && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              padding: "12px 14px",
              marginBottom: 16,
              color: "#166534",
              fontSize: 14,
            }}
          >
            <CheckCircle2 size={16} />
            ¡Ticket creado exitosamente! Cerrando...
          </div>
        )}

        {/* Error global */}
        {errorGlobal && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "12px 14px",
              marginBottom: 16,
              color: "#dc2626",
              fontSize: 13,
            }}
          >
            <AlertCircle size={15} />
            {errorGlobal}
          </div>
        )}

        {/* Campo: Asunto */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Asunto *</label>
          <input
            name="asunto"
            value={form.asunto}
            onChange={handleChange}
            placeholder="Describe brevemente el problema"
            style={inputStyle}
          />
        </div>

        {/* Fila: Departamento + Prioridad */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Departamento *</label>
            <select
              name="departamento"
              value={form.departamento}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Seleccionar...</option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Prioridad</label>
            <select
              name="prioridad"
              value={form.prioridad}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="baja">↓ Baja</option>
              <option value="media">→ Media</option>
              <option value="alta">↑ Alta</option>
            </select>
          </div>
        </div>

        {/* Campo: Descripción */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Descripción del problema *</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            rows={4}
            placeholder="Describe el problema: qué sucede, desde cuándo, en qué equipo o área..."
            style={{ ...inputStyle, resize: "vertical", minHeight: 90 }}
          />
        </div>

        {/* Fotos */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>
            Fotografías{" "}
            <span style={{ color: "#999", fontWeight: 400 }}>
              (opcional · máx. {MAX_FOTOS} imágenes, {MAX_SIZE_MB} MB c/u)
            </span>
          </label>

          {/* Zona de drop */}
          {fotos.length < MAX_FOTOS && (
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              style={{
                border: "1.5px dashed #ccc",
                borderRadius: 8,
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                background: "#fafafa",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1a5c38")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#ccc")}
            >
              <Upload size={20} style={{ color: "#999", marginBottom: 6 }} />
              <div style={{ fontSize: 13, color: "#666" }}>
                Arrastra fotos aquí o{" "}
                <span style={{ color: "#1a5c38", fontWeight: 500 }}>haz clic para seleccionar</span>
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                JPG, PNG, WebP
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={TIPOS_PERMITIDOS.join(",")}
                style={{ display: "none" }}
                onChange={(e) => agregarFotos(e.target.files)}
              />
            </div>
          )}

          {/* Previsualizaciones */}
          {fotos.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {fotos.map((f, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    width: 72,
                    height: 72,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: f.error ? "2px solid #ef4444" : "1px solid #e5e7eb",
                  }}
                >
                  <img
                    src={f.preview}
                    alt={f.file.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {f.error && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(239,68,68,0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title={f.error}
                    >
                      <AlertCircle size={16} color="#fff" />
                    </div>
                  )}
                  <button
                    onClick={() => quitarFoto(i)}
                    title="Eliminar foto"
                    style={{
                      position: "absolute",
                      top: 3,
                      right: 3,
                      background: "rgba(0,0,0,0.55)",
                      border: "none",
                      borderRadius: 4,
                      padding: 2,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={10} color="#fff" />
                  </button>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "rgba(0,0,0,0.5)",
                      color: "#fff",
                      fontSize: 9,
                      padding: "2px 4px",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatBytes(f.file.size)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            paddingTop: 14,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <button onClick={onClose} style={btnOutlineStyle} disabled={enviando}>
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={enviando || exitoso}
            style={{
              ...btnPrimaryStyle,
              opacity: enviando || exitoso ? 0.7 : 1,
            }}
          >
            {enviando ? (
              <>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                Creando...
              </>
            ) : (
              "Crear ticket"
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Estilos inline reutilizables ───────────────────────────────
const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: "#555",
  marginBottom: 5,
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 7,
  fontSize: 13,
  color: "#111",
  background: "#fff",
  outline: "none",
  fontFamily: "inherit",
};

const btnPrimaryStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 18px",
  background: "#1a5c38",
  color: "#fff",
  border: "none",
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const btnOutlineStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  background: "transparent",
  color: "#555",
  border: "1px solid #ddd",
  borderRadius: 7,
  fontSize: 13,
  cursor: "pointer",
};
