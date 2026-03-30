// lib/ticketStorage.js
// Utilidades para manejar fotos de tickets en Supabase Storage
// + hook useTicketFotos para usar en componentes React

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient"; // ajusta la ruta

const BUCKET = "ticket-fotos";
const MAX_SIZE_MB = 5;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

// ─────────────────────────────────────────────────────────────────
// FUNCIONES BASE
// ─────────────────────────────────────────────────────────────────

/**
 * Sube una sola foto al bucket y registra su ruta en ticket_fotos.
 * @param {File} file - Archivo a subir
 * @param {string} ticketId - UUID del ticket
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{ path: string, registro: object }>}
 */
export async function subirFotoTicket(file, ticketId, userId) {
  // Validaciones
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new Error(`Tipo no permitido: ${file.type}. Usa JPG, PNG o WebP.`);
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`El archivo supera ${MAX_SIZE_MB} MB.`);
  }

  // Generar ruta única: {ticketId}/{userId}/{timestamp}_{random}.{ext}
  const ext = file.name.split(".").pop().toLowerCase();
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `${ticketId}/${userId}/${filename}`;

  // 1. Subir al bucket
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) throw uploadError;

  // 2. Registrar en la tabla ticket_fotos
  const { data: registro, error: dbError } = await supabase
    .from("ticket_fotos")
    .insert({
      ticket_id: ticketId,
      storage_path: storagePath,
      nombre: file.name,
      tamanio: file.size,
      mime_type: file.type,
      subido_por: userId,
    })
    .select()
    .single();

  if (dbError) {
    // Intentar limpiar el archivo subido si falla el registro
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw dbError;
  }

  return { path: storagePath, registro };
}

/**
 * Sube múltiples fotos en paralelo.
 * @param {File[]} files - Lista de archivos
 * @param {string} ticketId
 * @param {string} userId
 * @param {function} onProgreso - Callback(completados, total)
 * @returns {Promise<Array<{ path, registro } | { error, file }>>}
 */
export async function subirMultiplesFotos(files, ticketId, userId, onProgreso) {
  let completados = 0;
  const resultados = await Promise.allSettled(
    files.map(async (file) => {
      const res = await subirFotoTicket(file, ticketId, userId);
      completados++;
      onProgreso?.(completados, files.length);
      return res;
    })
  );

  return resultados.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { error: r.reason?.message || "Error desconocido", file: files[i] }
  );
}

/**
 * Obtiene la URL pública firmada de una foto (válida 1 hora).
 * @param {string} storagePath - Ruta en el bucket
 * @param {number} expiresIn - Segundos de validez (default 3600)
 * @returns {Promise<string>} URL firmada
 */
export async function getUrlFoto(storagePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Obtiene todas las fotos de un ticket con sus URLs firmadas.
 * @param {string} ticketId
 * @returns {Promise<Array<{ id, nombre, tamanio, mime_type, url }>>}
 */
export async function getFotosTicket(ticketId) {
  const { data, error } = await supabase
    .from("ticket_fotos")
    .select("id, storage_path, nombre, tamanio, mime_type, subido_en")
    .eq("ticket_id", ticketId)
    .order("subido_en", { ascending: true });

  if (error) throw error;

  // Generar URLs firmadas en paralelo
  const conUrls = await Promise.all(
    data.map(async (foto) => {
      try {
        const url = await getUrlFoto(foto.storage_path);
        return { ...foto, url };
      } catch {
        return { ...foto, url: null, urlError: true };
      }
    })
  );

  return conUrls;
}

/**
 * Elimina una foto del bucket y de la base de datos.
 * @param {string} fotoId - UUID en ticket_fotos
 * @param {string} storagePath - Ruta en el bucket
 */
export async function eliminarFoto(fotoId, storagePath) {
  // 1. Eliminar de storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);
  if (storageError) throw storageError;

  // 2. Eliminar registro de DB
  const { error: dbError } = await supabase
    .from("ticket_fotos")
    .delete()
    .eq("id", fotoId);
  if (dbError) throw dbError;
}

// ─────────────────────────────────────────────────────────────────
// HOOK: useTicketFotos
// ─────────────────────────────────────────────────────────────────

/**
 * Hook para gestionar fotos de un ticket en componentes React.
 *
 * @example
 * const { fotos, cargando, subir, eliminar, progreso } = useTicketFotos(ticketId);
 */
export function useTicketFotos(ticketId) {
  const [fotos, setFotos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [progreso, setProgreso] = useState(null); // { completados, total }

  // Cargar fotos al montar o cambiar ticketId
  const cargar = useCallback(async () => {
    if (!ticketId) return;
    setCargando(true);
    setError(null);
    try {
      const data = await getFotosTicket(ticketId);
      setFotos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [ticketId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Subir nuevas fotos
  const subir = useCallback(
    async (files) => {
      if (!ticketId) throw new Error("ticketId requerido");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setProgreso({ completados: 0, total: files.length });

      const resultados = await subirMultiplesFotos(
        Array.from(files),
        ticketId,
        user.id,
        (completados, total) => setProgreso({ completados, total })
      );

      setProgreso(null);

      // Recargar lista actualizada
      await cargar();

      // Devolver resultados para que el componente muestre errores individuales
      return resultados;
    },
    [ticketId, cargar]
  );

  // Eliminar una foto
  const eliminar = useCallback(
    async (fotoId, storagePath) => {
      await eliminarFoto(fotoId, storagePath);
      setFotos((prev) => prev.filter((f) => f.id !== fotoId));
    },
    []
  );

  return { fotos, cargando, error, progreso, subir, eliminar, recargar: cargar };
}

// ─────────────────────────────────────────────────────────────────
// COMPONENTE: GaleriaFotos (para mostrar fotos de un ticket)
// ─────────────────────────────────────────────────────────────────

import { Trash2, ZoomIn, Loader2, ImageOff } from "lucide-react";

/**
 * Galería de fotos para el detalle de un ticket.
 * @param {string} ticketId
 * @param {boolean} puedeEliminar - Si el usuario puede borrar fotos
 */
export function GaleriaFotos({ ticketId, puedeEliminar = false }) {
  const { fotos, cargando, error, subir, eliminar, progreso } =
    useTicketFotos(ticketId);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const inputRef = useRef(null);

  if (cargando) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#888", fontSize: 13 }}>
        <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
        Cargando fotos...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "#dc2626", fontSize: 13 }}>
        Error al cargar fotos: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Grid de fotos */}
      {fotos.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {fotos.map((foto) => (
            <div
              key={foto.id}
              style={{
                position: "relative",
                width: 80,
                height: 80,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                background: "#f9f9f9",
              }}
            >
              {foto.url ? (
                <img
                  src={foto.url}
                  alt={foto.nombre}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ccc",
                  }}
                >
                  <ImageOff size={20} />
                </div>
              )}

              {/* Botones hover */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.45)";
                  e.currentTarget.style.opacity = 1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0)";
                  e.currentTarget.style.opacity = 0;
                }}
              >
                <button
                  onClick={() => setFotoAmpliada(foto)}
                  style={iconBtnStyle}
                  title="Ver foto"
                >
                  <ZoomIn size={12} color="#fff" />
                </button>
                {puedeEliminar && (
                  <button
                    onClick={() => eliminar(foto.id, foto.storage_path)}
                    style={iconBtnStyle}
                    title="Eliminar"
                  >
                    <Trash2 size={12} color="#fff" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#aaa", marginBottom: 10 }}>
          Sin fotos adjuntas.
        </p>
      )}

      {/* Botón agregar más fotos */}
      {puedeEliminar && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              fontSize: 12,
              color: "#1a5c38",
              background: "none",
              border: "1px dashed #1a5c38",
              borderRadius: 6,
              padding: "5px 12px",
              cursor: "pointer",
            }}
          >
            + Agregar fotos
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={TIPOS_PERMITIDOS.join(",")}
            style={{ display: "none" }}
            onChange={(e) => subir(e.target.files)}
          />
          {progreso && (
            <span style={{ fontSize: 12, color: "#666", marginLeft: 10 }}>
              Subiendo {progreso.completados}/{progreso.total}...
            </span>
          )}
        </>
      )}

      {/* Visor de foto ampliada */}
      {fotoAmpliada && (
        <div
          onClick={() => setFotoAmpliada(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 20,
          }}
        >
          <img
            src={fotoAmpliada.url}
            alt={fotoAmpliada.nombre}
            style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 8 }}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            style={{
              position: "absolute",
              bottom: 24,
              color: "#ccc",
              fontSize: 12,
            }}
          >
            {fotoAmpliada.nombre} · Clic fuera para cerrar
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

const iconBtnStyle = {
  background: "rgba(0,0,0,0.4)",
  border: "none",
  borderRadius: 4,
  padding: 4,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
