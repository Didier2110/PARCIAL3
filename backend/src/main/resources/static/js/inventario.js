// inventario.js — Gestión de Inventario y Solicitudes de Material (ADMIN, JEFE_BODEGA, JEFE_CUADRILLA)
(function () {
    requireRoleAuth('ADMIN', 'JEFE_BODEGA', 'JEFE_CUADRILLA');
    setupNavbar();
})();

const puedeGestionarInventario = () => hasRole('ADMIN', 'JEFE_BODEGA');
const puedeAtenderSolicitudes  = () => hasRole('ADMIN', 'JEFE_BODEGA');

let todosLosItems = [];
let itemActual    = null; // para ajuste de stock
let solActual     = null; // para atender solicitud

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', () => {
    // Ocultar acciones de escritura para JEFE_CUADRILLA (solo lectura)
    if (!puedeGestionarInventario()) {
        const btnNuevo = document.querySelector('button[onclick="abrirModalItem()"]');
        if (btnNuevo) btnNuevo.style.display = 'none';
    }
    cargarStock();
    cargarSolicitudes();
});

// ===== TAB navigation =====
function mostrarTab(tab) {
    document.getElementById('tabStock').style.display       = tab === 'stock'       ? '' : 'none';
    document.getElementById('tabSolicitudes').style.display = tab === 'solicitudes' ? '' : 'none';
    document.querySelectorAll('#invTabs .nav-link').forEach((el, i) => {
        el.classList.toggle('active', (tab === 'stock' && i === 0) || (tab === 'solicitudes' && i === 1));
    });
    if (tab === 'solicitudes') cargarSolicitudes();
}

// ===== STOCK =====
async function cargarStock() {
    const res = await apiCall('/inventario');
    if (!res || !res.ok) {
        document.getElementById('tablaStock').innerHTML =
            '<tr><td colspan="8" class="text-center text-danger">Error al cargar inventario</td></tr>';
        return;
    }
    todosLosItems = res.data || [];
    actualizarStats();
    verificarStockBajo();
    filtrarStock();
}

function actualizarStats() {
    document.getElementById('statTotal').textContent = todosLosItems.length;
    document.getElementById('statDisponible').textContent =
        todosLosItems.filter(i => i.cantidad > 0).length;
    document.getElementById('statBajo').textContent =
        todosLosItems.filter(i => i.cantidad <= i.cantidadMinima && i.cantidad > 0).length;
    document.getElementById('statCero').textContent =
        todosLosItems.filter(i => i.cantidad <= 0).length;
}

async function verificarStockBajo() {
    const res = await apiCall('/inventario/stock-bajo');
    const bajo = (res && res.ok) ? (res.data || []) : [];
    const alertaDiv = document.getElementById('alertaStockBajo');
    if (bajo.length > 0) {
        alertaDiv.innerHTML = `
            <div class="alert alert-warning alert-dismissible fade show mb-0" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Alerta de Stock Bajo</strong> — ${bajo.length} item(s) por debajo del mínimo:
                ${bajo.slice(0, 5).map(i => `<span class="badge bg-warning text-dark me-1">${escHtml(i.nombre)}</span>`).join('')}
                ${bajo.length > 5 ? `<span class="text-muted">... y ${bajo.length - 5} más</span>` : ''}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>`;
    } else {
        alertaDiv.innerHTML = '';
    }
}

function filtrarStock() {
    const catFiltro  = document.getElementById('filtroCategoria').value;
    const busqueda   = (document.getElementById('buscadorStock').value || '').toLowerCase();
    const filtrados  = todosLosItems.filter(i => {
        const matchCat  = !catFiltro  || i.categoria === catFiltro;
        const matchBus  = !busqueda   ||
            (i.nombre      || '').toLowerCase().includes(busqueda) ||
            (i.referencia  || '').toLowerCase().includes(busqueda) ||
            (i.numeroSerie || '').toLowerCase().includes(busqueda) ||
            (i.descripcion || '').toLowerCase().includes(busqueda);
        return matchCat && matchBus;
    });
    renderTablaStock(filtrados);
}

function renderTablaStock(items) {
    if (!items.length) {
        document.getElementById('tablaStock').innerHTML =
            '<tr><td colspan="8" class="text-center text-muted py-4">No se encontraron items</td></tr>';
        return;
    }
    document.getElementById('tablaStock').innerHTML = items.map(i => {
        const disponible = (i.cantidad || 0) - (i.cantidadReservada || 0);
        const bajoBadge  = (i.cantidad <= i.cantidadMinima)
            ? `<span class="badge bg-warning text-dark ms-1" title="Stock bajo"><i class="bi bi-exclamation-triangle-fill"></i></span>` : '';
        const ceroClass  = i.cantidad <= 0 ? 'table-danger' : (i.cantidad <= i.cantidadMinima ? 'table-warning' : '');
        return `
        <tr class="${ceroClass}">
            <td>
                <div class="fw-semibold">${escHtml(i.nombre)}</div>
                ${i.descripcion ? `<small class="text-muted">${escHtml(i.descripcion)}</small>` : ''}
            </td>
            <td>${badgeCategoria(i.categoria)}</td>
            <td>${i.numeroSerie ? `<code class="small">${escHtml(i.numeroSerie)}</code>` : '<span class="text-muted">—</span>'}</td>
            <td class="text-center fw-bold">${i.cantidad ?? 0} ${bajoBadge}</td>
            <td class="text-center text-warning">${i.cantidadReservada ?? 0}</td>
            <td class="text-center fw-bold ${disponible <= 0 ? 'text-danger' : 'text-success'}">${disponible}</td>
            <td>${badgeEstadoItem(i.estado)}</td>
            <td>
                ${puedeGestionarInventario() ? `
                <button class="btn btn-outline-primary btn-sm me-1" onclick="abrirAjusteStock('${i.id}', '${escHtml(i.nombre)}')"
                        title="Ajustar stock"><i class="bi bi-plus-slash-minus"></i></button>
                <button class="btn btn-outline-secondary btn-sm me-1" onclick="editarItem('${i.id}')"
                        title="Editar"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-outline-danger btn-sm" onclick="eliminarItem('${i.id}', '${escHtml(i.nombre)}')"
                        title="Eliminar"><i class="bi bi-trash"></i></button>
                ` : `<span class="badge bg-secondary text-white small">Solo lectura</span>`}
            </td>
        </tr>`;
    }).join('');
}

// ===== Modal crear / editar item =====
function abrirModalItem() {
    document.getElementById('iId').value = '';
    document.getElementById('formItem').reset();
    document.getElementById('itemModalTitle').textContent = 'Nuevo Item de Inventario';
    new bootstrap.Modal(document.getElementById('modalItem')).show();
}

function editarItem(id) {
    const item = todosLosItems.find(i => i.id === id);
    if (!item) return;
    document.getElementById('iId').value           = item.id;
    document.getElementById('iNombre').value       = item.nombre        || '';
    document.getElementById('iDescripcion').value  = item.descripcion   || '';
    document.getElementById('iCategoria').value    = item.categoria     || 'OTRO';
    document.getElementById('iCantidad').value     = item.cantidad      ?? 0;
    document.getElementById('iCantidadMinima').value = item.cantidadMinima ?? 0;
    document.getElementById('iUnidad').value       = item.unidad        || '';
    document.getElementById('iPrecio').value       = item.precioUnitario ?? '';
    document.getElementById('iNumeroSerie').value  = item.numeroSerie   || '';
    document.getElementById('iUbicacion').value    = item.ubicacion     || '';
    document.getElementById('iProveedor').value    = item.proveedor     || '';
    document.getElementById('iReferencia').value   = item.referencia    || '';
    document.getElementById('itemModalTitle').textContent = 'Editar Item';
    new bootstrap.Modal(document.getElementById('modalItem')).show();
}

async function guardarItem() {
    const nombre = document.getElementById('iNombre').value.trim();
    if (!nombre) { alert('El nombre es obligatorio'); return; }
    const cantidad = parseInt(document.getElementById('iCantidad').value) || 0;
    if (cantidad < 0) { alert('La cantidad no puede ser negativa'); return; }

    const body = {
        nombre,
        descripcion:    document.getElementById('iDescripcion').value.trim() || null,
        categoria:      document.getElementById('iCategoria').value,
        cantidad,
        cantidadMinima: parseInt(document.getElementById('iCantidadMinima').value) || 0,
        unidad:         document.getElementById('iUnidad').value.trim() || null,
        precioUnitario: parseFloat(document.getElementById('iPrecio').value) || null,
        numeroSerie:    document.getElementById('iNumeroSerie').value.trim() || null,
        ubicacion:      document.getElementById('iUbicacion').value.trim() || null,
        proveedor:      document.getElementById('iProveedor').value.trim() || null,
        referencia:     document.getElementById('iReferencia').value.trim() || null,
        tieneSerie:     !!document.getElementById('iNumeroSerie').value.trim()
    };

    const id  = document.getElementById('iId').value;
    const url = id ? `/inventario/${id}` : '/inventario';
    const met = id ? 'PUT' : 'POST';
    const res = await apiCall(url, met, body);

    if (res && res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('modalItem')).hide();
        cargarStock();
    } else {
        alert('Error al guardar: ' + (res?.data?.message || 'Verifica los datos'));
    }
}

async function eliminarItem(id, nombre) {
    if (!confirm(`Â¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    const res = await apiCall(`/inventario/${id}`, 'DELETE');
    if (res && res.ok) {
        cargarStock();
    } else {
        alert('No se pudo eliminar el item');
    }
}

// ===== Ajuste de stock =====
let itemParaAjuste = null;
function abrirAjusteStock(id, nombre) {
    itemParaAjuste = id;
    document.getElementById('stockTitle').textContent = `Ajustar Stock — ${nombre}`;
    document.getElementById('stockDelta').value  = '';
    document.getElementById('stockMotivo').value = '';
    new bootstrap.Modal(document.getElementById('modalStock')).show();
}

async function confirmarAjusteStock() {
    const delta  = parseInt(document.getElementById('stockDelta').value);
    const motivo = document.getElementById('stockMotivo').value.trim();
    if (isNaN(delta) || delta === 0) { alert('Ingresa un valor distinto de cero'); return; }
    if (!motivo) { alert('Ingresa el motivo del ajuste'); return; }

    const res = await apiCall(`/inventario/${itemParaAjuste}/stock`, 'PUT', { delta, motivo });
    if (res && res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('modalStock')).hide();
        cargarStock();
    } else {
        alert('Error al ajustar stock: ' + (res?.data?.message || 'Stock insuficiente'));
    }
}

// ===== SOLICITUDES DE MATERIAL =====
async function cargarSolicitudes() {
    const estadoFiltro = document.getElementById('filtroEstadoSol')?.value || '';
    const url = estadoFiltro ? `/solicitudes-material` : '/solicitudes-material';
    const res = await apiCall(url);
    if (!res || !res.ok) {
        document.getElementById('listaSolicitudes').innerHTML =
            '<div class="alert alert-danger">Error al cargar solicitudes</div>';
        return;
    }
    let solic = res.data || [];
    if (estadoFiltro) solic = solic.filter(s => s.estado === estadoFiltro);

    // Badge pendientes en el tab
    const pendientes = solic.filter(s => s.estado === 'PENDIENTE').length;
    const badge = document.getElementById('badgePendientes');
    if (badge) {
        badge.textContent = pendientes;
        badge.style.display = pendientes > 0 ? '' : 'none';
    }

    renderSolicitudes(solic);
}

function renderSolicitudes(lista) {
    if (!lista.length) {
        document.getElementById('listaSolicitudes').innerHTML =
            '<div class="text-center py-5 text-muted"><i class="bi bi-clipboard2-x fs-1"></i><p class="mt-2">No hay solicitudes</p></div>';
        return;
    }
    document.getElementById('listaSolicitudes').innerHTML = lista.map(s => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                    <div>
                        <h6 class="mb-0 fw-bold"><i class="bi bi-person-gear me-1"></i>Técnico: ${escHtml(s.tecnicoId || '—')}</h6>
                        <small class="text-muted">Orden: ${escHtml(s.ordenTrabajoId || '—')}</small>
                    </div>
                    ${badgeEstadoSol(s.estado)}
                </div>
                ${s.motivoSolicitud ? `<p class="mb-2 small"><i class="bi bi-chat-left-text me-1 text-muted"></i>${escHtml(s.motivoSolicitud)}</p>` : ''}
                <div class="mb-2">
                    <strong class="small">Items solicitados:</strong>
                    <ul class="mb-0 ps-3">
                        ${(s.items || []).map(it => `
                            <li class="small">
                                ${escHtml(it.nombreItem || it.inventarioId)} — 
                                <strong>${it.cantidadSolicitada}</strong> uds
                                ${it.cantidadAprobada != null ? ` | Aprobado: <strong class="text-success">${it.cantidadAprobada}</strong>` : ''}
                                ${it.numeroSerie ? ` | S/N: <code>${escHtml(it.numeroSerie)}</code>` : ''}
                            </li>`).join('')}
                    </ul>
                </div>
                ${s.observacionesBodega ? `<div class="alert alert-secondary py-1 mb-2 small"><i class="bi bi-chat me-1"></i>${escHtml(s.observacionesBodega)}</div>` : ''}
                <small class="text-muted"><i class="bi bi-calendar me-1"></i>${fechaCorta(s.fechaSolicitud)}</small>
                ${s.estado === 'PENDIENTE' && puedeAtenderSolicitudes() ? `
                    <div class="mt-2 d-flex gap-2">
                        <button class="btn btn-success btn-sm" onclick="abrirAtender('${s.id}', 'aprobar')">
                            <i class="bi bi-check-circle me-1"></i>Aprobar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="abrirAtender('${s.id}', 'rechazar')">
                            <i class="bi bi-x-circle me-1"></i>Rechazar
                        </button>
                    </div>` : ''}
                ${s.estado === 'APROBADA' && puedeAtenderSolicitudes() ? `
                    <div class="mt-2">
                        <button class="btn btn-primary btn-sm" onclick="despacharSolicitud('${s.id}')">
                            <i class="bi bi-truck me-1"></i>Registrar Despacho
                        </button>
                    </div>` : ''}
            </div>
        </div>
    `).join('');
}

// ===== Atender solicitud (aprobar / rechazar) =====
let solPendiente = null;
let accionPendiente = null;

async function abrirAtender(id, accion) {
    const res = await apiCall(`/solicitudes-material/${id}`);
    if (!res || !res.ok) return;
    solPendiente    = res.data;
    accionPendiente = accion;

    if (accion === 'aprobar') {
        renderModalAprobar(solPendiente);
    } else {
        renderModalRechazar(solPendiente);
    }
    new bootstrap.Modal(document.getElementById('modalAtender')).show();
}

function renderModalAprobar(sol) {
    document.getElementById('atenderTitle').textContent = 'Aprobar Solicitud de Material';
    const itemsHtml = (sol.items || []).map((it, i) => `
        <div class="card mb-2 p-2">
            <div class="fw-semibold">${escHtml(it.nombreItem || it.inventarioId)}</div>
            <div class="row g-2 mt-1">
                <div class="col-6">
                    <label class="form-label small">Cant. solicitada: <strong>${it.cantidadSolicitada}</strong></label>
                    <label class="form-label small d-block">Cant. a aprobar</label>
                    <input type="number" class="form-control form-control-sm" id="aprobItem_${i}"
                           value="${it.cantidadSolicitada}" min="0" max="${it.cantidadSolicitada}">
                </div>
                <div class="col-6">
                    <label class="form-label small">N.Â° de Serie (si aplica)</label>
                    <input type="text" class="form-control form-control-sm" id="serieItem_${i}"
                           value="${escHtml(it.numeroSerie || '')}" placeholder="Opcional">
                </div>
            </div>
        </div>`).join('');
    document.getElementById('atenderBody').innerHTML = `
        <p class="text-muted small">Revisa el stock disponible antes de aprobar.</p>
        ${itemsHtml}
        <div class="mb-3 mt-2">
            <label class="form-label">Observaciones para el técnico</label>
            <textarea class="form-control" id="obsBodega" rows="2"></textarea>
        </div>`;
    const userData = getUserData();
    document.getElementById('atenderPie').innerHTML = `
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button class="btn btn-success" onclick="confirmarAprobar('${sol.id}', ${(sol.items||[]).length}, '${userData?.id||''}')">
            <i class="bi bi-check-circle me-1"></i>Aprobar Solicitud
        </button>`;
}

async function confirmarAprobar(solId, numItems, jefeBodegaId) {
    const items = [];
    for (let i = 0; i < numItems; i++) {
        const cantAprobada = parseInt(document.getElementById(`aprobItem_${i}`)?.value) || 0;
        const numeroSerie  = document.getElementById(`serieItem_${i}`)?.value?.trim() || null;
        items.push({ cantidadAprobada: cantAprobada, numeroSerie });
    }
    const obs = document.getElementById('obsBodega').value.trim();
    const res = await apiCall(`/solicitudes-material/${solId}/aprobar`, 'PUT', {
        jefeBodegaId, items, observaciones: obs || null
    });
    if (res && res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('modalAtender')).hide();
        cargarSolicitudes();
        cargarStock();
    } else {
        alert('Error al aprobar: ' + (res?.data?.message || 'Verifica el stock disponible'));
    }
}

function renderModalRechazar(sol) {
    document.getElementById('atenderTitle').textContent = 'Rechazar Solicitud';
    document.getElementById('atenderBody').innerHTML = `
        <div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-1"></i>Â¿Estás seguro de rechazar esta solicitud?</div>
        <div class="mb-3">
            <label class="form-label">Motivo del rechazo <span class="text-danger">*</span></label>
            <textarea class="form-control" id="obsRechazo" rows="3" placeholder="Explica el motivo del rechazo..."></textarea>
        </div>`;
    const userData = getUserData();
    document.getElementById('atenderPie').innerHTML = `
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button class="btn btn-danger" onclick="confirmarRechazo('${sol.id}', '${userData?.id||''}')">
            <i class="bi bi-x-circle me-1"></i>Confirmar Rechazo
        </button>`;
}

async function confirmarRechazo(solId, jefeBodegaId) {
    const obs = document.getElementById('obsRechazo').value.trim();
    if (!obs) { alert('Debes ingresar el motivo del rechazo'); return; }
    const res = await apiCall(`/solicitudes-material/${solId}/rechazar`, 'PUT', {
        jefeBodegaId, observaciones: obs
    });
    if (res && res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('modalAtender')).hide();
        cargarSolicitudes();
    } else {
        alert('Error al rechazar la solicitud');
    }
}

async function despacharSolicitud(id) {
    const userData = getUserData();
    const numDespacho = prompt('Número de despacho / remisión:');
    if (!numDespacho) return;
    const res = await apiCall(`/solicitudes-material/${id}/despachar`, 'PUT', {
        numeroDespachoPor: numDespacho
    });
    if (res && res.ok) {
        cargarSolicitudes();
        cargarStock();
    } else {
        alert('Error al despachar: ' + (res?.data?.message || 'Verifica el stock'));
    }
}

// ===== Helpers visuales =====
function badgeCategoria(cat) {
    const mapa = { CABLE: 'bg-primary', ROUTER: 'bg-success', FIBRA: 'bg-info text-dark',
                   CONECTOR: 'bg-secondary', HERRAMIENTA: 'bg-warning text-dark', OTRO: 'bg-light text-dark' };
    const lbl  = { CABLE: 'Cable', ROUTER: 'Router', FIBRA: 'Fibra',
                   CONECTOR: 'Conector', HERRAMIENTA: 'Herramienta', OTRO: 'Otro' };
    return `<span class="badge ${mapa[cat] || 'bg-light text-dark'}">${lbl[cat] || cat || '—'}</span>`;
}

function badgeEstadoItem(est) {
    const mapa = { DISPONIBLE: 'bg-success', ASIGNADO: 'bg-info text-dark', EN_USO: 'bg-primary',
                   DAÑADO: 'bg-danger', BAJA: 'bg-secondary' };
    return `<span class="badge ${mapa[est] || 'bg-light text-dark'}">${est || '—'}</span>`;
}

function badgeEstadoSol(est) {
    const mapa = { PENDIENTE: 'bg-warning text-dark', APROBADA: 'bg-success', DESPACHADA: 'bg-primary',
                   RECHAZADA: 'bg-danger' };
    return `<span class="badge ${mapa[est] || 'bg-light text-dark'}">${est || '—'}</span>`;
}

function fechaCorta(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
