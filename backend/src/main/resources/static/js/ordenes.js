// ordenes.js — Gestión de Órdenes de Trabajo (ADMIN + JEFE_CUADRILLA)
(function () {
    requireRoleAuth('ADMIN', 'JEFE_CUADRILLA');
    setupNavbar();
})();

let todasOrdenes = [];
let todosTecnicos = [];
let todosClientes = [];
let ordenEnValidacion = null;

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([cargarOrdenes(), cargarTecnicos(), cargarClientes()]);
});

async function cargarOrdenes() {
    const estado = document.getElementById('filtroEstado').value;
    const endpoint = estado ? `/ordenes/estado/${estado}` : '/ordenes';
    const res = await apiCall(endpoint);
    if (!res || !res.ok) return;
    todasOrdenes = res.data;
    actualizarStats();
    filtrarTabla();
}

async function cargarTecnicos() {
    const res = await apiCall('/usuarios/tecnicos');
    if (!res || !res.ok) return;
    todosTecnicos = res.data || [];
    // Llenar select del modal crear
    const sel = document.getElementById('cTecnicoId');
    sel.innerHTML = '<option value="">Asignar después...</option>';
    todosTecnicos.forEach(t => {
        const op = document.createElement('option');
        op.value = t.id;
        op.textContent = `${t.nombre} ${t.apellido}`;
        sel.appendChild(op);
    });
}

async function cargarClientes() {
    const res = await apiCall('/clientes');
    if (!res || !res.ok) return;
    todosClientes = res.data || [];
    const sel = document.getElementById('cClienteId');
    sel.innerHTML = '<option value="">Sin cliente vinculado</option>';
    todosClientes.forEach(c => {
        const op = document.createElement('option');
        op.value = c.id;
        op.textContent = c.razonSocial;
        sel.appendChild(op);
    });
}

function actualizarStats() {
    const conteo = { PENDIENTE: 0, ASIGNADA: 0, EN_PROGRESO: 0, COMPLETADA: 0 };
    todasOrdenes.forEach(o => {
        if (conteo.hasOwnProperty(o.estado)) conteo[o.estado]++;
    });
    document.getElementById('statPendiente').textContent  = conteo.PENDIENTE;
    document.getElementById('statAsignada').textContent   = conteo.ASIGNADA;
    document.getElementById('statProgreso').textContent   = conteo.EN_PROGRESO;
    document.getElementById('statCompletada').textContent = conteo.COMPLETADA;
}

function filtrarTabla() {
    const tipo    = document.getElementById('filtroTipo').value.toLowerCase();
    const busca   = document.getElementById('buscador').value.toLowerCase();
    const filtradas = todasOrdenes.filter(o => {
        const matchTipo  = !tipo  || (o.tipo || '').toLowerCase().includes(tipo);
        const matchBusca = !busca ||
            (o.titulo    || '').toLowerCase().includes(busca) ||
            (o.direccion || '').toLowerCase().includes(busca) ||
            nombreTecnico(o.tecnicoId).toLowerCase().includes(busca) ||
            nombreCliente(o.clienteId).toLowerCase().includes(busca);
        return matchTipo && matchBusca;
    });
    renderTabla(filtradas);
}

function nombreTecnico(id) {
    const t = todosTecnicos.find(x => x.id === id);
    return t ? `${t.nombre} ${t.apellido}` : (id ? '— asignado —' : 'Sin asignar');
}

function nombreCliente(id) {
    const c = todosClientes.find(x => x.id === id);
    return c ? c.razonSocial : '—';
}

function renderTabla(ordenes) {
    const tbody = document.getElementById('tablaOrdenes');
    if (!ordenes.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No hay órdenes</td></tr>';
        return;
    }
    tbody.innerHTML = ordenes.map(o => `
        <tr>
            <td>${badgeTipo(o.tipo)}</td>
            <td>
                <div class="fw-semibold">${escHtml(o.titulo || '—')}</div>
                <div class="small text-muted">${escHtml(nombreCliente(o.clienteId))}</div>
            </td>
            <td class="small">${escHtml(o.direccion || '—')}</td>
            <td class="small">${fechaCorta(o.fechaProgramada)}</td>
            <td class="small">${escHtml(nombreTecnico(o.tecnicoId))}</td>
            <td>${badgeEstado(o.estado)}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm me-1" onclick="verDetalle('${o.id}')" title="Ver detalle">
                    <i class="bi bi-eye"></i>
                </button>
                ${o.estado === 'COMPLETADA' ? `
                <button class="btn btn-outline-success btn-sm" onclick="abrirValidar('${o.id}')" title="Validar entrega">
                    <i class="bi bi-check-circle"></i>
                </button>` : ''}
                ${o.estado === 'PENDIENTE' ? `
                <button class="btn btn-outline-danger btn-sm" onclick="cancelarOrden('${o.id}')" title="Cancelar">
                    <i class="bi bi-x-circle"></i>
                </button>` : ''}
            </td>
        </tr>
    `).join('');
}

// ===== Crear orden =====
function abrirModalCrear() {
    document.getElementById('formCrear').reset();
    new bootstrap.Modal(document.getElementById('modalCrear')).show();
}

async function guardarOrden() {
    const tipo    = document.getElementById('cTipo').value;
    const titulo  = document.getElementById('cTitulo').value.trim();
    const direccion = document.getElementById('cDireccion').value.trim();
    const fechaStr  = document.getElementById('cFechaProgramada').value;

    if (!tipo || !titulo || !direccion || !fechaStr) {
        alert('Completa los campos obligatorios (*)');
        return;
    }

    const body = {
        tipo,
        titulo,
        descripcion:    document.getElementById('cDescripcion').value.trim(),
        clienteId:      document.getElementById('cClienteId').value || null,
        tecnicoId:      document.getElementById('cTecnicoId').value || null,
        direccion,
        ciudad:         document.getElementById('cCiudad').value.trim(),
        referencia:     document.getElementById('cReferencia').value.trim(),
        planInternet:   document.getElementById('cPlanInternet').value.trim(),
        incluyeTv:      document.getElementById('cIncluyeTv').checked,
        fechaProgramada: fechaStr + ':00',
        jefeCuadrillaId: getUserData()?.id || null,
    };

    const res = await apiCall('/ordenes', 'POST', body);
    if (res && res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('modalCrear')).hide();
        cargarOrdenes();
    } else {
        alert('Error al crear la orden: ' + (res?.data?.message || 'Error desconocido'));
    }
}

// ===== Ver detalle =====
async function verDetalle(id) {
    const res = await apiCall(`/ordenes/${id}`);
    if (!res || !res.ok) return;
    const o = res.data;

    const fasesHtml = (o.fases || []).map((f, i) => `
        <div class="d-flex align-items-center gap-2 py-2 border-bottom">
            <span class="badge rounded-pill ${f.estado === 'COMPLETADA' ? 'bg-success' : 'bg-secondary'}">${i + 1}</span>
            <div class="flex-grow-1">
                <div class="fw-semibold">${escHtml(f.nombre)}</div>
                ${f.observaciones ? `<div class="small text-muted">${escHtml(f.observaciones)}</div>` : ''}
                ${f.fechaCompletado ? `<div class="small text-success">${fechaCorta(f.fechaCompletado)}</div>` : ''}
            </div>
            <span class="badge ${f.estado === 'COMPLETADA' ? 'bg-success' : 'bg-light text-dark'}">${f.estado}</span>
        </div>
    `).join('');

    document.getElementById('detalleTitle').textContent = `Orden: ${o.titulo || o.id}`;
    document.getElementById('detalleBody').innerHTML = `
        <div class="row g-3">
            <div class="col-md-4">
                <p class="mb-1"><strong>Tipo:</strong> ${badgeTipo(o.tipo)}</p>
                <p class="mb-1"><strong>Estado:</strong> ${badgeEstado(o.estado)}</p>
                <p class="mb-1"><strong>Cliente:</strong> ${escHtml(nombreCliente(o.clienteId))}</p>
                <p class="mb-1"><strong>Técnico:</strong> ${escHtml(nombreTecnico(o.tecnicoId))}</p>
                <p class="mb-1"><strong>Programada:</strong> ${fechaCorta(o.fechaProgramada)}</p>
                ${o.fechaCierre ? `<p class="mb-1"><strong>Cierre:</strong> ${fechaCorta(o.fechaCierre)}</p>` : ''}
                ${o.planInternet ? `<p class="mb-1"><strong>Plan:</strong> ${escHtml(o.planInternet)} ${o.incluyeTv ? '<span class="badge bg-info ms-1">+ TV</span>' : ''}</p>` : ''}
            </div>
            <div class="col-md-4">
                <p class="mb-1"><strong>Dirección:</strong> ${escHtml(o.direccion || '—')}</p>
                <p class="mb-1"><strong>Ciudad:</strong> ${escHtml(o.ciudad || '—')}</p>
                <p class="mb-1"><strong>Referencia:</strong> ${escHtml(o.referencia || '—')}</p>
                ${o.descripcion ? `<p class="mb-1"><strong>Descripción:</strong> ${escHtml(o.descripcion)}</p>` : ''}
                ${o.observacionesTecnico ? `<div class="alert alert-info py-1 mt-2 small"><strong>Obs. técnico:</strong> ${escHtml(o.observacionesTecnico)}</div>` : ''}
                ${o.observacionesJefe ? `<div class="alert alert-warning py-1 mt-2 small"><strong>Obs. jefe:</strong> ${escHtml(o.observacionesJefe)}</div>` : ''}
            </div>
            <div class="col-md-4">
                <strong>Fases de trabajo:</strong>
                <div class="mt-2">${fasesHtml || '<p class="text-muted small">Sin fases</p>'}</div>
                ${o.fotosIds && o.fotosIds.length ? `<div class="mt-2"><strong>Fotos:</strong> ${o.fotosIds.length} cargada(s)</div>` : ''}
            </div>
        </div>
        ${o.estado === 'PENDIENTE' || o.estado === 'ASIGNADA' ? `
        <hr>
        <div class="row g-2 mt-1">
            <div class="col-md-6">
                <label class="form-label small mb-1">Reasignar técnico</label>
                <select class="form-select form-select-sm" id="reasignarTecId">
                    <option value="">Seleccionar técnico...</option>
                    ${todosTecnicos.map(t => `<option value="${t.id}" ${t.id === o.tecnicoId ? 'selected' : ''}>${t.nombre} ${t.apellido}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3 d-flex align-items-end">
                <button class="btn btn-primary btn-sm w-100" onclick="asignarTecnico('${o.id}')">
                    <i class="bi bi-person-check me-1"></i>Asignar
                </button>
            </div>
        </div>` : ''}
    `;
    document.getElementById('detallePie').innerHTML = `
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
        ${o.estado === 'COMPLETADA' ? `<button class="btn btn-success" onclick="abrirValidar('${o.id}')"><i class="bi bi-check-circle me-1"></i>Validar Entrega</button>` : ''}
    `;
    new bootstrap.Modal(document.getElementById('modalDetalle')).show();
}

async function asignarTecnico(ordenId) {
    const tecnicoId = document.getElementById('reasignarTecId').value;
    if (!tecnicoId) { alert('Selecciona un técnico'); return; }
    const res = await apiCall(`/ordenes/${ordenId}/asignar`, 'PUT', { tecnicoId });
    if (res && res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('modalDetalle')).hide();
        cargarOrdenes();
    }
}

// ===== Validar / Rechazar =====
function abrirValidar(id) {
    ordenEnValidacion = id;
    document.getElementById('validarObs').value = '';
    document.getElementById('validarTitle').textContent = 'Validar entrega de orden';

    document.getElementById('btnAprobar').onclick = () => validarOrden(true);
    document.getElementById('btnRechazar').onclick = () => validarOrden(false);

    bootstrap.Modal.getInstance(document.getElementById('modalDetalle'))?.hide();
    new bootstrap.Modal(document.getElementById('modalValidar')).show();
}

async function validarOrden(aprobada) {
    const obs = document.getElementById('validarObs').value.trim();
    const res = await apiCall(`/ordenes/${ordenEnValidacion}/validar`, 'PUT', { aprobada, observaciones: obs });
    if (res && res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('modalValidar')).hide();
        cargarOrdenes();
    } else {
        alert('Error al validar: ' + (res?.data?.message || ''));
    }
}

async function cancelarOrden(id) {
    if (!confirm('Â¿Cancelar esta orden?')) return;
    const res = await apiCall(`/ordenes/${id}`, 'PUT', { estado: 'CANCELADA' });
    if (res && res.ok) cargarOrdenes();
}

// ===== Helpers visuales =====
function badgeTipo(tipo) {
    const mapa = {
        INSTALACION:  'bg-primary',
        MANTENIMIENTO:'bg-warning text-dark',
        AVERIA:       'bg-danger',
        RETIRO:       'bg-secondary',
        TRASLADO:     'bg-info text-dark',
    };
    const cls = mapa[tipo] || 'bg-light text-dark';
    const lbl = { INSTALACION: 'Instalación', MANTENIMIENTO: 'Mantenimiento', AVERIA: 'Avería', RETIRO: 'Retiro', TRASLADO: 'Traslado' }[tipo] || tipo;
    return `<span class="badge ${cls}">${lbl}</span>`;
}

function badgeEstado(estado) {
    const mapa = {
        PENDIENTE:   'bg-warning text-dark',
        ASIGNADA:    'bg-info text-dark',
        EN_PROGRESO: 'bg-primary',
        COMPLETADA:  'bg-success',
        VALIDADA:    'bg-success',
        RECHAZADA:   'bg-danger',
        CANCELADA:   'bg-secondary',
    };
    const cls = mapa[estado] || 'bg-light text-dark';
    return `<span class="badge ${cls}">${estado || '—'}</span>`;
}

function fechaCorta(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
