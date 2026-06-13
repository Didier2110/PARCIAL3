// tecnico.js — Vista del Técnico de Campo (TECNICO only) — mobile-first
(function () {
    requireRoleAuth('TECNICO');
    setupNavbar();
})();

let misOrdenes = [];
let filtroActual = 'todos';
let ordenActiva  = null; // orden abierta en el modal de ejecución

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    document.getElementById('fechaHoy').textContent = hoy.charAt(0).toUpperCase() + hoy.slice(1);
    cargarMisOrdenes();
});

async function cargarMisOrdenes() {
    const userData = getUserData();
    if (!userData) return;
    const res = await apiCall(`/ordenes/tecnico/${userData.id}`);
    if (!res || !res.ok) {
        document.getElementById('listaOrdenes').innerHTML =
            '<div class="alert alert-danger">Error al cargar tus órdenes</div>';
        return;
    }
    misOrdenes = res.data || [];
    renderOrdenes();
}

function setFiltro(estado) {
    filtroActual = estado;
    // Actualizar botones activos
    ['filtroTodos','filtroAsignada','filtroProgreso','filtroComp'].forEach(id => {
        document.getElementById(id)?.classList.remove('active','btn-primary','btn-warning',
            'btn-info','btn-success');
        const el = document.getElementById(id);
        if (el) el.className = el.className.replace(/btn-(primary|warning|info|success)\b/g, '').replace('active','').trim();
    });
    const mapa = { todos: ['filtroTodos','btn-primary'], ASIGNADA: ['filtroAsignada','btn-warning'],
                   EN_PROGRESO: ['filtroProgreso','btn-info'], COMPLETADA: ['filtroComp','btn-success'] };
    if (mapa[estado]) {
        const el = document.getElementById(mapa[estado][0]);
        if (el) { el.classList.add('active', mapa[estado][1]); }
    }
    renderOrdenes();
}

function renderOrdenes() {
    const lista = filtroActual === 'todos'
        ? misOrdenes
        : misOrdenes.filter(o => o.estado === filtroActual);

    if (!lista.length) {
        document.getElementById('listaOrdenes').innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-clipboard2-check fs-1"></i>
                <p class="mt-2">No tienes órdenes ${filtroActual === 'todos' ? '' : 'con estado: ' + filtroActual}</p>
            </div>`;
        return;
    }

    // Ordenar: EN_PROGRESO primero, luego ASIGNADA, luego COMPLETADA, luego VALIDADA
    const prio = { EN_PROGRESO: 0, ASIGNADA: 1, PENDIENTE: 2, COMPLETADA: 3, VALIDADA: 4, RECHAZADA: 5, CANCELADA: 6 };
    lista.sort((a, b) => (prio[a.estado] ?? 9) - (prio[b.estado] ?? 9));

    document.getElementById('listaOrdenes').innerHTML = lista.map(o => `
        <div class="card orden-card mb-3 ${o.estado === 'ASIGNADA' || o.estado === 'EN_PROGRESO' ? 'shadow-sm' : ''}"
             onclick="abrirOrden('${o.id}')">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    ${badgeTipo(o.tipo)}
                    ${badgeEstado(o.estado)}
                </div>
                <h6 class="fw-bold mb-1">${escHtml(o.titulo || '—')}</h6>
                <p class="mb-1 small"><i class="bi bi-geo-alt me-1 text-danger"></i>${escHtml(o.direccion || '—')}${o.ciudad ? ', ' + escHtml(o.ciudad) : ''}</p>
                ${o.referencia ? `<p class="mb-1 small text-muted"><i class="bi bi-signpost me-1"></i>${escHtml(o.referencia)}</p>` : ''}
                <p class="mb-0 small text-muted"><i class="bi bi-clock me-1"></i>${fechaCorta(o.fechaProgramada)}</p>
                ${fasesProgress(o)}
                ${o.estado === 'RECHAZADA' && o.observacionesJefe
                    ? `<div class="alert alert-danger py-1 mt-2 small mb-0"><i class="bi bi-exclamation-triangle me-1"></i>${escHtml(o.observacionesJefe)}</div>`
                    : ''}
            </div>
        </div>
    `).join('');
}

function fasesProgress(o) {
    if (!o.fases || !o.fases.length) return '';
    const total = o.fases.length;
    const comp  = o.fases.filter(f => f.estado === 'COMPLETADA').length;
    const pct   = Math.round((comp / total) * 100);
    return `
        <div class="mt-2">
            <div class="d-flex justify-content-between small text-muted mb-1">
                <span>Progreso</span><span>${comp}/${total} fases</span>
            </div>
            <div class="progress" style="height:6px">
                <div class="progress-bar bg-success" style="width:${pct}%"></div>
            </div>
        </div>`;
}

// ===== Modal ejecutar orden =====
async function abrirOrden(id) {
    const res = await apiCall(`/ordenes/${id}`);
    if (!res || !res.ok) return;
    ordenActiva = res.data;
    renderModalEjecutar(ordenActiva);
    new bootstrap.Modal(document.getElementById('modalEjecutar')).show();
}

function renderModalEjecutar(o) {
    document.getElementById('ejecutarTitle').textContent = o.titulo || 'Orden de Trabajo';

    const puedeTrabajarse = ['ASIGNADA', 'EN_PROGRESO', 'RECHAZADA'].includes(o.estado);
    const puedeIniciar    = o.estado === 'ASIGNADA';
    const puedeCerrar     = o.estado === 'EN_PROGRESO';
    const puedeFotos      = o.estado === 'EN_PROGRESO';

    const fasesHtml = (o.fases || []).map((f, i) => `
        <div class="fase-item p-3 mb-2 ${f.estado === 'COMPLETADA' ? 'completada' : ''}"
             ${puedeTrabajarse && f.estado !== 'COMPLETADA' ? `onclick="completarFase('${o.id}', ${i})"` : ''}>
            <div class="d-flex align-items-center gap-2">
                <i class="bi ${f.estado === 'COMPLETADA' ? 'bi-check-circle-fill text-success' : 'bi-circle text-secondary'} fs-5"></i>
                <div class="flex-grow-1">
                    <div class="fw-semibold">${escHtml(f.nombre)}</div>
                    ${f.observaciones ? `<div class="small text-muted">${escHtml(f.observaciones)}</div>` : ''}
                    ${f.fechaCompletado ? `<div class="small text-success"><i class="bi bi-clock-history me-1"></i>${fechaCorta(f.fechaCompletado)}</div>` : ''}
                </div>
                ${puedeTrabajarse && f.estado !== 'COMPLETADA'
                    ? '<span class="badge bg-secondary">Toca para completar</span>'
                    : (f.estado === 'COMPLETADA' ? '<span class="badge bg-success">Completada</span>' : '')}
            </div>
        </div>
    `).join('');

    const fotosHtml = (o.fotosIds || []).length > 0
        ? `<div class="d-flex flex-wrap gap-2 mt-1">
            ${o.fotosIds.map(fid => `<div class="text-center small"><i class="bi bi-image fs-3 text-muted"></i><br><span class="text-muted">${fid.slice(-6)}</span></div>`).join('')}
           </div>`
        : '<p class="text-muted small">Sin fotos</p>';

    document.getElementById('ejecutarBody').innerHTML = `
        <!-- Info básica -->
        <div class="d-flex flex-wrap gap-2 mb-3">
            ${badgeTipo(o.tipo)} ${badgeEstado(o.estado)}
            ${o.planInternet ? `<span class="badge bg-info text-dark"><i class="bi bi-wifi me-1"></i>${escHtml(o.planInternet)}</span>` : ''}
            ${o.incluyeTv    ? `<span class="badge bg-info text-dark"><i class="bi bi-tv me-1"></i>TV</span>` : ''}
        </div>
        <p class="mb-1"><i class="bi bi-geo-alt-fill me-1 text-danger"></i><strong>${escHtml(o.direccion || '—')}</strong>${o.ciudad ? ', ' + escHtml(o.ciudad) : ''}</p>
        ${o.referencia ? `<p class="mb-1 small text-muted"><i class="bi bi-signpost me-1"></i>${escHtml(o.referencia)}</p>` : ''}
        ${o.descripcion ? `<p class="mb-2 small">${escHtml(o.descripcion)}</p>` : ''}
        ${o.observacionesJefe ? `<div class="alert alert-warning py-2 small"><i class="bi bi-exclamation-triangle me-1"></i><strong>Jefe:</strong> ${escHtml(o.observacionesJefe)}</div>` : ''}

        <hr>

        <!-- Acciones principales -->
        <div class="d-flex gap-2 flex-wrap mb-3">
            ${puedeIniciar ? `<button class="btn btn-primary btn-fase flex-grow-1" onclick="iniciarOrden('${o.id}')"><i class="bi bi-play-fill me-1"></i>Iniciar Trabajo</button>` : ''}
            ${puedeFotos   ? `<button class="btn btn-outline-secondary btn-fase" onclick="abrirSubirFoto('${o.id}')"><i class="bi bi-camera fs-5"></i></button>` : ''}
            ${puedeCerrar  ? `<button class="btn btn-success btn-fase flex-grow-1" onclick="pedirCierre('${o.id}')"><i class="bi bi-flag-fill me-1"></i>Cerrar Orden</button>` : ''}
        </div>

        <!-- Fases -->
        <h6 class="fw-bold mb-2"><i class="bi bi-list-check me-1"></i>Fases de Trabajo</h6>
        ${fasesHtml || '<p class="text-muted small">Sin fases definidas</p>'}

        <!-- Fotos -->
        <h6 class="fw-bold mt-3 mb-2"><i class="bi bi-images me-1"></i>Fotos (${(o.fotosIds || []).length})</h6>
        ${fotosHtml}
    `;
}

// ===== Acciones técnico =====
async function iniciarOrden(id) {
    const res = await apiCall(`/ordenes/${id}/iniciar`, 'PUT');
    if (res && res.ok) {
        ordenActiva = res.data;
        renderModalEjecutar(ordenActiva);
        cargarMisOrdenes();
    }
}

async function completarFase(ordenId, indice) {
    const obs = prompt(`Fase ${indice + 1} — Observaciones (opcional):`);
    if (obs === null) return; // cancelado
    const res = await apiCall(`/ordenes/${ordenId}/fases`, 'PUT', {
        indice,
        estado: 'COMPLETADA',
        observaciones: obs || ''
    });
    if (res && res.ok) {
        ordenActiva = res.data;
        renderModalEjecutar(ordenActiva);
        cargarMisOrdenes();
    }
}

// Subir foto
let ordenParaFoto = null;
function abrirSubirFoto(id) {
    ordenParaFoto = id;
    document.getElementById('inputFoto').value = '';
    document.getElementById('previewFoto').innerHTML = '';
    document.getElementById('inputFoto').onchange = function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                document.getElementById('previewFoto').innerHTML =
                    `<img src="${e.target.result}" class="foto-preview mt-2" alt="preview">`;
            };
            reader.readAsDataURL(file);
        }
    };
    new bootstrap.Modal(document.getElementById('modalFoto')).show();
}

async function subirFoto() {
    const fileInput = document.getElementById('inputFoto');
    if (!fileInput.files.length) { alert('Selecciona una imagen'); return; }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('foto', file);

    const token = getToken();
    try {
        const response = await fetch(`${window.location.origin}/api/v1/ordenes/${ordenParaFoto}/fotos/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalFoto')).hide();
            abrirOrden(ordenParaFoto); // refrescar modal
            cargarMisOrdenes();
        } else {
            alert('Error al subir la foto');
        }
    } catch (e) {
        alert('Error de conexión: ' + e.message);
    }
}

// Cerrar orden
let ordenParaCierre = null;
function pedirCierre(id) {
    ordenParaCierre = id;
    document.getElementById('cerrarObs').value = '';
    new bootstrap.Modal(document.getElementById('modalCerrar')).show();
}

async function confirmarCierre() {
    const obs = document.getElementById('cerrarObs').value.trim();
    const res = await apiCall(`/ordenes/${ordenParaCierre}/cerrar`, 'PUT', { observaciones: obs });
    if (res && res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('modalCerrar')).hide();
        bootstrap.Modal.getInstance(document.getElementById('modalEjecutar')).hide();
        cargarMisOrdenes();
    } else {
        alert('Error al cerrar la orden: ' + (res?.data?.message || ''));
    }
}

// ===== Helpers visuales =====
function badgeTipo(tipo) {
    const mapa = { INSTALACION: 'bg-primary', MANTENIMIENTO: 'bg-warning text-dark',
                   AVERIA: 'bg-danger', RETIRO: 'bg-secondary', TRASLADO: 'bg-info text-dark' };
    const lbl  = { INSTALACION: 'Instalación', MANTENIMIENTO: 'Mantenimiento', AVERIA: 'Avería',
                   RETIRO: 'Retiro', TRASLADO: 'Traslado' };
    return `<span class="badge ${mapa[tipo] || 'bg-light text-dark'}">${lbl[tipo] || tipo || '—'}</span>`;
}

function badgeEstado(estado) {
    const mapa = { PENDIENTE: 'bg-warning text-dark', ASIGNADA: 'bg-info text-dark',
                   EN_PROGRESO: 'bg-primary', COMPLETADA: 'bg-success',
                   VALIDADA: 'bg-success', RECHAZADA: 'bg-danger', CANCELADA: 'bg-secondary' };
    return `<span class="badge ${mapa[estado] || 'bg-light text-dark'}">${estado || '—'}</span>`;
}

function fechaCorta(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
