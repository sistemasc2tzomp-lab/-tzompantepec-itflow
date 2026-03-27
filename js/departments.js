// ══════════════════════════════════════════
// DEPARTAMENTOS — CRUD completo
// Crear, editar, eliminar y listar deptos.
// Solo accesible para administradores
// ══════════════════════════════════════════

// Departamentos se guardan en la tabla 'departamentos'
// Columnas: id (uuid), nombre, descripcion, responsable_id, created_at

let editingDeptoId = null;

// ─────────────────────────────────────────
// RENDER PRINCIPAL
// ─────────────────────────────────────────
async function renderDepartamentos() {
    const el = document.getElementById('view-departamentos');
    if (!el) return;

    // Cargar departamentos desde Supabase
    let deptos = [];
    const client = getSupabaseClient();
    if (client) {
        const { data, error } = await client
            .from('departamentos')
            .select('*')
            .order('nombre');
        if (!error) deptos = data || [];
    }

    // Guardar en caché local
    window.gDepartamentos = deptos;

    el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
            <div>
                <h2 style="font-size:1.1rem;font-weight:700;color:var(--text);margin:0">Departamentos municipales</h2>
                <p style="font-size:.83rem;color:var(--text2);margin:3px 0 0">${deptos.length} departamento(s) registrado(s)</p>
            </div>
            ${isAdmin() ? `
            <button class="btn btn-primary btn-sm" onclick="abrirModalDepto(null)">
                + Nuevo departamento
            </button>` : ''}
        </div>

        <div class="search-wrap" style="margin-bottom:14px;max-width:360px">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="search" id="depto-search" placeholder="Buscar departamento..."
                oninput="filtrarDeptos(this.value)" aria-label="Buscar departamentos"/>
        </div>

        <div id="deptos-grid">
            ${renderDeptosGrid(deptos)}
        </div>

        <!-- MODAL CREAR / EDITAR DEPARTAMENTO -->
        <div class="modal-overlay" id="modal-depto" role="dialog" aria-modal="true">
            <div class="modal">
                <div class="modal-header">
                    <h3 id="modal-depto-title">Nuevo departamento</h3>
                    <button class="modal-close" onclick="closeModal('modal-depto')">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="d-nombre">Nombre del departamento *</label>
                        <input type="text" id="d-nombre" placeholder="Ej. Tesorería Municipal"/>
                        <div class="form-error" id="d-nombre-err">El nombre es obligatorio.</div>
                    </div>
                    <div class="form-group">
                        <label for="d-desc">Descripción</label>
                        <textarea id="d-desc" rows="2"
                            placeholder="Funciones principales del departamento..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="d-responsable">Responsable / Jefe de área</label>
                        <select id="d-responsable">
                            <option value="">— Sin responsable asignado —</option>
                            ${(window.gUsers || []).map(u =>
                                `<option value="${u.id}">${u.nombre} (${u.rol})</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="d-ubicacion">Ubicación / Edificio</label>
                        <input type="text" id="d-ubicacion" placeholder="Ej. Palacio Municipal, 2do piso"/>
                    </div>
                    <div class="form-group">
                        <label for="d-extension">Extensión telefónica</label>
                        <input type="text" id="d-extension" placeholder="Ej. 101"/>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-depto')">Cancelar</button>
                    <button class="btn btn-primary btn-sm" id="d-submit-btn" onclick="submitDepto()">
                        Crear departamento
                    </button>
                </div>
            </div>
        </div>

        <!-- MODAL CONFIRMAR ELIMINACIÓN -->
        <div class="modal-overlay" id="modal-eliminar-depto" role="dialog" aria-modal="true">
            <div class="modal">
                <div class="modal-header">
                    <h3>Eliminar departamento</h3>
                    <button class="modal-close" onclick="closeModal('modal-eliminar-depto')">✕</button>
                </div>
                <div class="modal-body">
                    <p style="color:var(--text2);font-size:.88rem" id="eliminar-depto-desc"></p>
                    <div style="background:#fff1f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-top:12px;font-size:.82rem;color:#b91c1c">
                        ⚠️ Los tickets y usuarios asociados a este departamento no se eliminarán.
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-eliminar-depto')">Cancelar</button>
                    <button class="btn btn-sm" id="confirmar-eliminar-depto-btn"
                        style="background:#dc2626;color:#fff;border:none;border-radius:7px;padding:7px 16px;cursor:pointer;font-size:.82rem"
                        onclick="confirmarEliminarDepto()">
                        Sí, eliminar
                    </button>
                </div>
            </div>
        </div>`;
}

// ─────────────────────────────────────────
// GRID DE DEPARTAMENTOS
// ─────────────────────────────────────────
function renderDeptosGrid(deptos) {
    if (!deptos.length) return `
        <div class="table-empty">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="opacity:.2;margin-bottom:10px">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <p>No hay departamentos registrados.</p>
            ${isAdmin() ? `<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="abrirModalDepto(null)">
                + Agregar el primero
            </button>` : ''}
        </div>`;

    // Colores para las tarjetas (ciclado)
    const COLORES = [
        { bg: '#e8f5ee', border: '#86efac', icon: '#1a5c38' },
        { bg: '#eff6ff', border: '#93c5fd', icon: '#1d4ed8' },
        { bg: '#fefce8', border: '#fde047', icon: '#854d0e' },
        { bg: '#fdf4ff', border: '#d8b4fe', icon: '#7e22ce' },
        { bg: '#fff1f2', border: '#fca5a5', icon: '#be123c' },
        { bg: '#f0fdf4', border: '#4ade80', icon: '#15803d' },
    ];

    return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
        ${deptos.map((d, i) => {
            const c = COLORES[i % COLORES.length];
            const responsable = (window.gUsers || []).find(u => u.id === d.responsable_id);
            const ticketsDepto = (window.gTickets || []).filter(t => t.departamento === d.nombre).length;
            const activosDepto = (window.gTickets || []).filter(t =>
                t.departamento === d.nombre && !['cerrado','cancelado'].includes(t.status)).length;

            return `
            <div class="panel" style="border-left:3px solid ${c.border};background:var(--surface)">
                <div class="panel-body">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px">
                        <div style="display:flex;align-items:center;gap:10px">
                            <div style="width:38px;height:38px;border-radius:10px;background:${c.bg};
                                 display:flex;align-items:center;justify-content:center;flex-shrink:0">
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="${c.icon}" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                            </div>
                            <div>
                                <div style="font-weight:700;font-size:.92rem">${d.nombre}</div>
                                ${d.ubicacion ? `<div style="font-size:.74rem;color:var(--text3)">📍 ${d.ubicacion}</div>` : ''}
                            </div>
                        </div>
                        ${isAdmin() ? `
                        <div style="display:flex;gap:5px;flex-shrink:0">
                            <button class="btn btn-xs btn-secondary" onclick="abrirModalDepto('${d.id}')" title="Editar">✏️</button>
                            <button class="btn btn-xs" onclick="abrirConfirmarEliminarDepto('${d.id}')"
                                style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca" title="Eliminar">🗑</button>
                        </div>` : ''}
                    </div>

                    ${d.descripcion ? `
                    <p style="font-size:.8rem;color:var(--text2);margin-bottom:10px;line-height:1.5">
                        ${d.descripcion}
                    </p>` : ''}

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
                        <div style="background:var(--surface2);border-radius:7px;padding:7px 10px;text-align:center">
                            <div style="font-size:1.1rem;font-weight:700;color:var(--verde,#1a5c38)">${ticketsDepto}</div>
                            <div style="font-size:.68rem;color:var(--text3)">Total tickets</div>
                        </div>
                        <div style="background:var(--surface2);border-radius:7px;padding:7px 10px;text-align:center">
                            <div style="font-size:1.1rem;font-weight:700;color:#d97706">${activosDepto}</div>
                            <div style="font-size:.68rem;color:var(--text3)">Activos</div>
                        </div>
                    </div>

                    <div style="font-size:.78rem;color:var(--text2);display:flex;flex-direction:column;gap:4px">
                        ${responsable ? `
                        <div style="display:flex;align-items:center;gap:5px">
                            <span style="color:var(--text3)">👤 Responsable:</span>
                            <strong>${responsable.nombre}</strong>
                        </div>` : ''}
                        ${d.extension ? `
                        <div style="display:flex;align-items:center;gap:5px">
                            <span style="color:var(--text3)">📞 Ext:</span>
                            <strong>${d.extension}</strong>
                        </div>` : ''}
                    </div>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

// ─────────────────────────────────────────
// FILTRAR DEPARTAMENTOS
// ─────────────────────────────────────────
function filtrarDeptos(q) {
    const texto = q.toLowerCase();
    const lista = (window.gDepartamentos || []).filter(d =>
        (d.nombre       || '').toLowerCase().includes(texto) ||
        (d.descripcion  || '').toLowerCase().includes(texto) ||
        (d.ubicacion    || '').toLowerCase().includes(texto)
    );
    const container = document.getElementById('deptos-grid');
    if (container) container.innerHTML = renderDeptosGrid(lista);
}

// ─────────────────────────────────────────
// ABRIR MODAL CREAR / EDITAR
// ─────────────────────────────────────────
function abrirModalDepto(deptoId) {
    editingDeptoId = deptoId;
    const depto = deptoId ? (window.gDepartamentos || []).find(d => d.id === deptoId) : null;

    document.getElementById('modal-depto-title').textContent = depto ? 'Editar departamento' : 'Nuevo departamento';
    document.getElementById('d-submit-btn').textContent      = depto ? 'Guardar cambios'     : 'Crear departamento';

    document.getElementById('d-nombre').value      = depto?.nombre       || '';
    document.getElementById('d-desc').value        = depto?.descripcion  || '';
    document.getElementById('d-responsable').value = depto?.responsable_id || '';
    document.getElementById('d-ubicacion').value   = depto?.ubicacion    || '';
    document.getElementById('d-extension').value   = depto?.extension    || '';

    document.getElementById('d-nombre-err')?.classList.remove('show');
    openModal('modal-depto');
}

// ─────────────────────────────────────────
// CREAR / ACTUALIZAR DEPARTAMENTO
// ─────────────────────────────────────────
async function submitDepto() {
    const nombre      = document.getElementById('d-nombre').value.trim();
    const descripcion = document.getElementById('d-desc').value.trim();
    const responsable = document.getElementById('d-responsable').value || null;
    const ubicacion   = document.getElementById('d-ubicacion').value.trim();
    const extension   = document.getElementById('d-extension').value.trim();
    const client      = getSupabaseClient();

    if (!nombre) {
        document.getElementById('d-nombre-err').classList.add('show');
        return;
    }
    document.getElementById('d-nombre-err').classList.remove('show');

    showLoading(true);
    try {
        const datos = {
            nombre, descripcion,
            responsable_id: responsable,
            ubicacion, extension,
        };

        if (editingDeptoId) {
            // EDITAR
            const { error } = await client
                .from('departamentos').update(datos).eq('id', editingDeptoId);
            if (error) throw error;

            const idx = (window.gDepartamentos || []).findIndex(d => d.id === editingDeptoId);
            if (idx !== -1) Object.assign(window.gDepartamentos[idx], datos);

            toast(`Departamento "${nombre}" actualizado.`, 'success');
        } else {
            // CREAR
            const { data: nuevo, error } = await client
                .from('departamentos')
                .insert({ ...datos, created_at: new Date().toISOString() })
                .select().single();
            if (error) throw error;

            window.gDepartamentos = window.gDepartamentos || [];
            window.gDepartamentos.push(nuevo);
            toast(`Departamento "${nombre}" creado.`, 'success');
        }

        closeModal('modal-depto');
        renderDepartamentos();

    } catch(e) {
        console.error('Error al guardar departamento:', e);
        toast('Error: ' + e.message, 'error');
    } finally { showLoading(false); }
}

// ─────────────────────────────────────────
// ELIMINAR DEPARTAMENTO
// ─────────────────────────────────────────
let deptoAEliminarId = null;

function abrirConfirmarEliminarDepto(deptoId) {
    deptoAEliminarId = deptoId;
    const d = (window.gDepartamentos || []).find(x => x.id === deptoId);
    document.getElementById('eliminar-depto-desc').innerHTML =
        `¿Estás seguro de que deseas eliminar el departamento <strong>${d?.nombre || deptoId}</strong>?`;
    openModal('modal-eliminar-depto');
}

async function confirmarEliminarDepto() {
    if (!deptoAEliminarId) return;
    const client = getSupabaseClient();
    showLoading(true);
    try {
        const { error } = await client
            .from('departamentos').delete().eq('id', deptoAEliminarId);
        if (error) throw error;

        window.gDepartamentos = (window.gDepartamentos || []).filter(d => d.id !== deptoAEliminarId);
        toast('Departamento eliminado.', 'success');
        closeModal('modal-eliminar-depto');
        renderDepartamentos();
    } catch(e) {
        console.error('Error al eliminar departamento:', e);
        toast('Error al eliminar: ' + e.message, 'error');
    } finally {
        showLoading(false);
        deptoAEliminarId = null;
    }
}

// ─────────────────────────────────────────
// SQL PARA CREAR LA TABLA departamentos
// (ejecutar en Supabase SQL Editor si no existe)
// ─────────────────────────────────────────
/*
create table if not exists public.departamentos (
    id             uuid primary key default uuid_generate_v4(),
    nombre         text not null,
    descripcion    text,
    responsable_id text references public.usuarios(id) on delete set null,
    ubicacion      text,
    extension      text,
    created_at     timestamptz not null default now()
);
alter table public.departamentos enable row level security;
create policy "deptos_select" on public.departamentos for select using (true);
create policy "deptos_insert" on public.departamentos for insert with check (true);
create policy "deptos_update" on public.departamentos for update using (true);
create policy "deptos_delete" on public.departamentos for delete using (true);
*/

// Exponer funciones globalmente
window.renderDepartamentos          = renderDepartamentos;
window.filtrarDeptos                = filtrarDeptos;
window.abrirModalDepto              = abrirModalDepto;
window.submitDepto                  = submitDepto;
window.abrirConfirmarEliminarDepto  = abrirConfirmarEliminarDepto;
window.confirmarEliminarDepto       = confirmarEliminarDepto;
