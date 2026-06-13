// tickets.js - Gestion de tickets de soporte tecnico.
let ticketsCache = [];
let clientesTicketMap = {};
let filtroTicketActual = 'TODOS';

document.addEventListener('DOMContentLoaded', function () {
    requireRoleAuth('ADMIN', 'SOPORTE', 'JEFE_BODEGA');
    setupNavbar();
    configurarFiltrosTickets();
    configurarFormularioTicket();
    cargarTickets();
    cargarSelectClientesTicket();
});

function configurarFiltrosTickets() {
    document.querySelectorAll('[data-filtro]').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('[data-filtro]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filtroTicketActual = this.dataset.filtro || 'TODOS';
            renderTickets();
        });
    });
}

function configurarFormularioTicket() {
    document.getElementById('nuevoTicketForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btnText = document.getElementById('btnGuardarTicketText');
        const btnSpinner = document.getElementById('btnGuardarTicketSpinner');
        btnText.textContent = 'Guardando...';
        btnSpinner.classList.remove('d-none');

        const payload = {
            clienteId: document.getElementById('tCliente').value,
            asunto: document.getElementById('tAsunto').value.trim(),
            descripcion: document.getElementById('tDescripcion').value.trim(),
            categoria: document.getElementById('tCategoria').value,
            prioridad: document.getElementById('tPrioridad').value
        };

        const res = await apiCall('/tickets', 'POST', payload);
        btnText.textContent = 'Crear Ticket';
        btnSpinner.classList.add('d-none');

        if (res?.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoTicket'))?.hide();
            document.getElementById('nuevoTicketForm').reset();
            mostrarToast('Ticket creado correctamente', 'success');
            cargarTickets();
        } else {
            mostrarAlertaModal('alertaNuevoTicket', res?.data?.message || res?.data || 'No se pudo crear el ticket');
        }
    });
}

async function cargarTickets(filtro = filtroTicketActual) {
    filtroTicketActual = filtro || 'TODOS';
    const tbody = document.getElementById('tablaTickets');
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">
        <div class="spinner-border text-purple" role="status"></div></td></tr>`;

    const [resTickets, resClientes] = await Promise.all([
        apiCall('/tickets', 'GET'),
        apiCall('/clientes', 'GET')
    ]);

    if (!resTickets?.ok) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar tickets</td></tr>';
        return;
    }

    ticketsCache = Array.isArray(resTickets.data) ? resTickets.data : [];
    const clientes = resClientes?.ok && Array.isArray(resClientes.data) ? resClientes.data : [];
    clientesTicketMap = Object.fromEntries(clientes.map(c => [c.id, c.razonSocial]));
    actualizarContadoresTickets();
    renderTickets();
}

function actualizarContadoresTickets() {
    document.getElementById('countTodos').textContent = ticketsCache.length;
    document.getElementById('countAbiertos').textContent = ticketsCache.filter(t => normalizarEstado(t.estado) === 'ABIERTO').length;
    document.getElementById('countEnProgreso').textContent = ticketsCache.filter(t => normalizarEstado(t.estado) === 'EN_PROGRESO').length;
    document.getElementById('countResueltos').textContent = ticketsCache.filter(t => normalizarEstado(t.estado) === 'RESUELTO').length;
}

function renderTickets() {
    const tbody = document.getElementById('tablaTickets');
    const tickets = filtroTicketActual === 'TODOS'
        ? ticketsCache
        : ticketsCache.filter(t => normalizarEstado(t.estado) === filtroTicketActual);

    if (!tickets.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
            <i class="bi bi-inbox fs-3 d-block mb-2"></i>${mensajeVacioTickets()}</td></tr>`;
        return;
    }

    tbody.innerHTML = tickets
        .slice()
        .sort((a, b) => (b.fechaActualizacion || b.fechaCreacion || '').localeCompare(a.fechaActualizacion || a.fechaCreacion || ''))
        .map(t => `
            <tr>
                <td>
                    <div class="fw-semibold">${escHtml(t.asunto || '-')}</div>
                    <small class="text-muted">${escHtml(truncar(t.descripcion, 72))}</small>
                </td>
                <td>${escHtml(clientesTicketMap[t.clienteId] || 'Cliente no asociado')}</td>
                <td>${badgeCategoria(t.categoria)}</td>
                <td>${badgePrioridad(t.prioridad)}</td>
                <td>${badgeEstadoTicket(t.estado)}</td>
                <td>
                    <small class="text-muted">${formatFecha(t.fechaCreacion)}</small>
                    ${t.fechaActualizacion ? `<div class="text-muted small">Act. ${formatFecha(t.fechaActualizacion)}</div>` : ''}
                </td>
                <td>${accionesTicket(t)}</td>
            </tr>
        `).join('');
}

function accionesTicket(ticket) {
    const estado = normalizarEstado(ticket.estado);
    return `
        <div class="action-buttons">
            ${estado !== 'EN_PROGRESO' && estado !== 'RESUELTO' && estado !== 'CERRADO' ? `
                <button class="btn btn-action btn-edit" onclick="cambiarEstado('${ticket.id}', 'EN_PROGRESO')" title="Marcar en progreso">
                    <i class="bi bi-play-fill"></i><span>En progreso</span>
                </button>` : ''}
            ${estado !== 'RESUELTO' && estado !== 'CERRADO' ? `
                <button class="btn btn-action btn-view" onclick="cambiarEstado('${ticket.id}', 'RESUELTO')" title="Marcar resuelto">
                    <i class="bi bi-check2-circle"></i><span>Resolver</span>
                </button>` : ''}
            ${estado !== 'CERRADO' ? `
                <button class="btn btn-action btn-delete" onclick="cerrarTicket('${ticket.id}')" title="Cerrar ticket">
                    <i class="bi bi-x-circle"></i><span>Cerrar</span>
                </button>` : '<span class="text-muted small">Sin acciones</span>'}
        </div>`;
}

async function cargarSelectClientesTicket() {
    const sel = document.getElementById('tCliente');
    const res = await apiCall('/clientes', 'GET');
    if (!res?.ok) return;
    sel.innerHTML = '<option value="">- Selecciona cliente -</option>' +
        res.data.filter(c => c.activo !== false)
            .map(c => `<option value="${c.id}">${escHtml(c.razonSocial || 'Cliente')}</option>`)
            .join('');
}

async function cambiarEstado(id, nuevoEstado) {
    const res = await apiCall(`/tickets/${id}/estado/${nuevoEstado}`, 'PATCH');
    if (res?.ok && normalizarEstado(res.data?.estado) === normalizarEstado(nuevoEstado)) {
        mostrarToast(`Ticket marcado como ${labelEstado(nuevoEstado)}`, 'success');
        cargarTickets(filtroTicketActual);
    } else {
        mostrarToast(res?.data?.message || res?.data || 'El servidor no confirmó el cambio de estado', 'danger');
        cargarTickets(filtroTicketActual);
    }
}

async function cerrarTicket(id) {
    const res = await apiCall(`/tickets/${id}`, 'DELETE');
    if (res?.ok) {
        mostrarToast('Ticket cerrado correctamente', 'warning');
        cargarTickets(filtroTicketActual);
    } else {
        mostrarToast(res?.data?.message || res?.data || 'No se pudo cerrar el ticket', 'danger');
    }
}

function mensajeVacioTickets() {
    const labels = {
        TODOS: 'No hay tickets registrados',
        ABIERTO: 'No hay tickets abiertos',
        EN_PROGRESO: 'No hay tickets en progreso',
        RESUELTO: 'No hay tickets resueltos',
        CERRADO: 'No hay tickets cerrados'
    };
    return labels[filtroTicketActual] || 'No hay tickets para este filtro';
}

function badgeEstadoTicket(estado) {
    const normalizado = normalizarEstado(estado);
    const map = {
        ABIERTO: 'badge bg-danger',
        EN_PROGRESO: 'badge bg-warning text-dark',
        RESUELTO: 'badge bg-success',
        CERRADO: 'badge bg-secondary'
    };
    return `<span class="${map[normalizado] || 'badge bg-secondary'}">${labelEstado(normalizado)}</span>`;
}

function badgePrioridad(prioridad) {
    const normalizada = (prioridad || '').trim().toUpperCase();
    const map = {
        BAJA: 'badge bg-success',
        MEDIA: 'badge bg-info text-dark',
        ALTA: 'badge bg-warning text-dark',
        CRITICA: 'badge bg-danger'
    };
    return `<span class="${map[normalizada] || 'badge bg-secondary'}">${escHtml(labelSimple(normalizada || 'SIN PRIORIDAD'))}</span>`;
}

function badgeCategoria(categoria) {
    const normalizada = (categoria || '').trim().toUpperCase();
    const icons = {
        SOPORTE_TECNICO: 'bi-tools',
        CAMBIO_CLIENTE: 'bi-person-lines-fill',
        FACTURACION: 'bi-receipt',
        INSTALACION: 'bi-house-gear',
        AVERIA: 'bi-exclamation-triangle',
        OTRO: 'bi-chat-dots'
    };
    return `<span class="text-muted small"><i class="bi ${icons[normalizada] || 'bi-tag'} me-1"></i>${escHtml(labelSimple(normalizada || 'OTRO'))}</span>`;
}

function normalizarEstado(estado) {
    const normalizado = (estado || 'ABIERTO').trim().toUpperCase().replace(/[-\s]+/g, '_');
    return normalizado === 'EN_PROCESO' ? 'EN_PROGRESO' : normalizado;
}

function labelEstado(estado) {
    const labels = {
        ABIERTO: 'Abierto',
        EN_PROGRESO: 'En progreso',
        RESUELTO: 'Resuelto',
        CERRADO: 'Cerrado'
    };
    return labels[normalizarEstado(estado)] || labelSimple(estado || '-');
}

function labelSimple(valor) {
    return String(valor || '-').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function truncar(str, max) {
    if (!str) return '-';
    return str.length > max ? str.substring(0, max) + '...' : str;
}

function formatFecha(valor) {
    if (!valor) return '-';
    return new Date(valor).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function mostrarToast(mensaje, tipo) {
    const toastEl = document.getElementById('toastMsg');
    document.getElementById('toastTexto').textContent = mensaje;
    toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;
    new bootstrap.Toast(toastEl, { delay: 3000 }).show();
}

function mostrarAlertaModal(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = 'block';
}
