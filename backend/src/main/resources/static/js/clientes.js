// Script para gestion de clientes y planes ISP.
const puedeCrearClientes = () => hasRole('ADMIN', 'SOPORTE', 'ADMINISTRATIVO', 'VENDEDOR', 'PUNTO_VENTA');
const puedeEditarClientes = () => hasRole('ADMIN', 'SOPORTE');
const puedeEliminarClientes = () => hasRole('ADMIN', 'SOPORTE');
const puedeGestionarClientes = () => puedeCrearClientes() || puedeEditarClientes();
const puedeGestionarPlanes = () => hasRole('ADMIN');
const puedeCrearSuscripciones = () => hasRole('ADMIN', 'SOPORTE', 'VENDEDOR', 'PUNTO_VENTA');
const puedeEditarSuscripciones = () => hasRole('ADMIN', 'SOPORTE');
let clientePendienteEliminar = null;
let planPendienteDesactivar = null;
let clientesCache = [];
let planesCache = [];
let suscripcionesCache = [];
let carteraClientesCache = {};

document.addEventListener('DOMContentLoaded', function() {
    requireRoleAuth('ADMIN', 'VENDEDOR', 'PUNTO_VENTA', 'ADMINISTRATIVO', 'CONTABLE', 'SOPORTE');
    setupNavbar();
    configurarPermisosClientes();
    configurarConfirmacionEliminar();
    configurarFormularioCliente();
    configurarFormularioPlan();
    cargarClientes();
    cargarPlanesInternet();

    document.getElementById('planInternet')?.addEventListener('change', function() {
        document.getElementById('camposIsp').style.display = this.value ? '' : 'none';
    });
});

function configurarPermisosClientes() {
    const gestionaClientes = puedeCrearClientes();
    const gestionaPlanes = puedeGestionarPlanes();
    document.getElementById('btnNuevoCliente').style.display = gestionaClientes ? '' : 'none';
    document.getElementById('btnNuevoPlan').style.display = gestionaPlanes ? '' : 'none';
}

function configurarConfirmacionEliminar() {
    document.getElementById('btnConfirmarEliminarCliente')?.addEventListener('click', confirmarEliminarCliente);
    document.getElementById('btnConfirmarDesactivarPlan')?.addEventListener('click', confirmarDesactivarPlan);
}

function configurarFormularioCliente() {
    document.getElementById('nuevoClienteForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('clienteId').value;
        if (!id && !puedeCrearClientes()) {
            mostrarToastClientes('Tu rol solo tiene permiso de consulta de clientes.', 'danger');
            return;
        }
        if (id && !puedeEditarClientes()) {
            mostrarToastClientes('Los cambios de clientes deben ser autorizados por Soporte Tecnico o Administrador.', 'warning');
            return;
        }

        const cliente = {
            razonSocial: document.getElementById('razonSocial').value.trim(),
            documento: document.getElementById('documento').value.trim(),
            tipoDocumento: 'NIT',
            email: document.getElementById('emailCliente').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            ciudad: document.getElementById('ciudad').value.trim(),
            departamento: 'Sin especificar',
            codigoPostal: '00000'
        };

        const response = await apiCall(id ? `/clientes/${id}` : '/clientes', id ? 'PUT' : 'POST', cliente);

        if (response && response.ok) {
            const clienteGuardado = response.data;
            const planId = document.getElementById('planInternet').value;
            const incluyeTv = document.getElementById('incluyeTv').checked;
            const metodoPago = document.getElementById('metodoPago')?.value || 'EFECTIVO';

            const clienteId = id || clienteGuardado?.id;
            if (clienteId) {
                await guardarPlanCliente(clienteId, planId, metodoPago, incluyeTv);
            }

            bootstrap.Modal.getInstance(document.getElementById('nuevoClienteModal'))?.hide();
            mostrarToastClientes(id ? 'Cliente actualizado correctamente' : 'Cliente guardado correctamente', 'success');
            cargarClientes();
        } else {
            const msg = response?.data?.message || response?.data || 'Error al guardar cliente';
            mostrarToastClientes(msg, 'danger');
        }
    });
}

function configurarFormularioPlan() {
    document.getElementById('planForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!puedeGestionarPlanes()) {
            mostrarToastClientes('Solo el Administrador puede crear o modificar planes ISP.', 'danger');
            return;
        }

        const id = document.getElementById('planId').value;
        const plan = {
            nombre: document.getElementById('planNombre').value.trim(),
            tipo: document.getElementById('planTipo').value,
            velocidad: document.getElementById('planVelocidad').value.trim() || null,
            precioMensual: parseFloat(document.getElementById('planPrecio').value) || 0,
            limiteAncho: parseInt(document.getElementById('planLimite').value) || null,
            descripcion: document.getElementById('planDescripcion').value.trim() || null,
            caracteristicas: []
        };

        const response = await apiCall(id ? `/servicios/${id}` : '/servicios', id ? 'PUT' : 'POST', plan);
        if (response?.ok) {
            bootstrap.Modal.getInstance(document.getElementById('planModal'))?.hide();
            mostrarToastClientes(id ? 'Plan actualizado correctamente' : 'Plan creado correctamente', 'success');
            await cargarPlanesInternet();
        } else {
            const msg = response?.data?.message || response?.data || 'Error al guardar el plan';
            mostrarToastClientes(msg, 'danger');
        }
    });
}

function mostrarModuloClientes(modulo) {
    document.getElementById('clientesPanel').style.display = modulo === 'clientes' ? '' : 'none';
    document.getElementById('planesPanel').style.display = modulo === 'planes' ? '' : 'none';
    document.getElementById('tabClientesBtn').classList.toggle('active', modulo === 'clientes');
    document.getElementById('tabPlanesBtn').classList.toggle('active', modulo === 'planes');
    if (modulo === 'planes') cargarPlanesInternet();
}

function abrirModalCliente(id = null) {
    if (!id && !puedeCrearClientes()) {
        mostrarToastClientes('Tu rol no puede registrar clientes.', 'danger');
        return;
    }
    if (id && !puedeEditarClientes()) {
        solicitarAutorizacionCliente(id);
        return;
    }

    document.getElementById('nuevoClienteForm').reset();
    document.getElementById('camposIsp').style.display = 'none';
    document.getElementById('clienteId').value = '';
    document.getElementById('planInternet').disabled = false;
    document.getElementById('incluyeTv').disabled = false;
    document.getElementById('metodoPago').disabled = false;
    document.getElementById('clienteModalTitle').textContent = 'Nuevo Cliente';
    document.getElementById('btnGuardarCliente').innerHTML = '<i class="bi bi-save me-1"></i> Guardar Cliente';

    if (id) {
        const cliente = clientesCache.find(c => c.id === id);
        if (!cliente) return;
        document.getElementById('clienteId').value = cliente.id;
        document.getElementById('razonSocial').value = cliente.razonSocial || '';
        document.getElementById('documento').value = cliente.documento || '';
        document.getElementById('emailCliente').value = cliente.email || '';
        document.getElementById('telefono').value = cliente.telefono || '';
        document.getElementById('ciudad').value = cliente.ciudad || '';
        const suscripcion = obtenerSuscripcionActivaCliente(cliente.id);
        if (suscripcion) {
            document.getElementById('planInternet').value = suscripcion.servicioId || '';
            document.getElementById('metodoPago').value = suscripcion.metodoPago || 'EFECTIVO';
            document.getElementById('camposIsp').style.display = '';
        }
        const puedeCambiarPlan = puedeEditarSuscripciones();
        document.getElementById('planInternet').disabled = !puedeCambiarPlan;
        document.getElementById('incluyeTv').disabled = !puedeCambiarPlan;
        document.getElementById('metodoPago').disabled = !puedeCambiarPlan;
        document.getElementById('clienteModalTitle').textContent = 'Editar Cliente';
        document.getElementById('btnGuardarCliente').innerHTML = '<i class="bi bi-check2 me-1"></i> Actualizar Cliente';
    }

    new bootstrap.Modal(document.getElementById('nuevoClienteModal')).show();
}

function abrirModalPlan(id = null) {
    if (!puedeGestionarPlanes()) {
        mostrarToastClientes('Solo el Administrador puede administrar planes ISP.', 'danger');
        return;
    }
    document.getElementById('planForm').reset();
    document.getElementById('planId').value = '';
    document.getElementById('planModalTitle').innerHTML = '<i class="bi bi-router me-2"></i>Nuevo Plan ISP';
    document.getElementById('btnGuardarPlan').innerHTML = '<i class="bi bi-save me-1"></i> Guardar Plan';

    if (id) {
        const plan = planesCache.find(p => p.id === id);
        if (!plan) return;
        document.getElementById('planId').value = plan.id;
        document.getElementById('planNombre').value = plan.nombre || '';
        document.getElementById('planTipo').value = plan.tipo || 'INTERNET';
        document.getElementById('planVelocidad').value = plan.velocidad || '';
        document.getElementById('planPrecio').value = plan.precioMensual || 0;
        document.getElementById('planLimite').value = plan.limiteAncho || '';
        document.getElementById('planDescripcion').value = plan.descripcion || '';
        document.getElementById('planModalTitle').innerHTML = '<i class="bi bi-router me-2"></i>Editar Plan ISP';
        document.getElementById('btnGuardarPlan').innerHTML = '<i class="bi bi-check2 me-1"></i> Actualizar Plan';
    }

    new bootstrap.Modal(document.getElementById('planModal')).show();
}

async function cargarPlanesInternet() {
    const res = await apiCall('/servicios');
    if (!res || !res.ok) return;
    planesCache = Array.isArray(res.data) ? res.data : [];
    renderPlanes();

    const sel = document.getElementById('planInternet');
    if (!sel) return;
    sel.innerHTML = '<option value="">- Sin plan por ahora -</option>';
    planesCache.filter(p => p.activo !== false).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        const precio = p.precioMensual || p.precio || 0;
        opt.textContent = `${p.nombre}${precio ? ' - $' + Number(precio).toLocaleString('es-CO') : ''}${p.velocidad ? ' - ' + p.velocidad : ''}`;
        sel.appendChild(opt);
    });
}

function renderPlanes() {
    const tabla = document.getElementById('planesTable');
    if (!tabla) return;
    if (!planesCache.length) {
        tabla.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No hay planes registrados</td></tr>';
        return;
    }

    tabla.innerHTML = planesCache.map(p => `
        <tr>
            <td>
                <div class="fw-semibold">${escHtml(p.nombre)}</div>
                ${p.descripcion ? `<small class="text-muted">${escHtml(p.descripcion)}</small>` : ''}
            </td>
            <td>${escHtml(p.tipo || 'INTERNET')}</td>
            <td>${escHtml(p.velocidad || '-')}</td>
            <td class="fw-bold">$${Number(p.precioMensual || 0).toLocaleString('es-CO')}</td>
            <td>${p.activo === false ? '<span class="badge badge-inactivo">INACTIVO</span>' : '<span class="badge badge-activo">ACTIVO</span>'}</td>
            <td>
                <div class="action-buttons">
                    ${puedeGestionarPlanes() ? `<button class="btn btn-action btn-view" onclick="abrirModalPlan('${p.id}')" title="Editar plan">
                        <i class="bi bi-pencil-square"></i><span>Editar</span>
                    </button>
                    <button class="btn btn-action btn-delete" onclick="desactivarPlan('${p.id}')" title="Desactivar plan">
                        <i class="bi bi-slash-circle"></i><span>Desactivar</span>
                    </button>` : '<span class="text-muted small">Solo lectura</span>'}
                </div>
            </td>
        </tr>
    `).join('');
}

async function desactivarPlan(id) {
    if (!puedeGestionarPlanes()) return;
    const plan = planesCache.find(p => p.id === id);
    if (!plan) return;
    planPendienteDesactivar = id;
    document.getElementById('planDesactivarNombre').textContent = plan.nombre || 'Plan seleccionado';
    new bootstrap.Modal(document.getElementById('confirmarPlanModal')).show();
}

async function confirmarDesactivarPlan() {
    if (!planPendienteDesactivar) return;
    const btn = document.getElementById('btnConfirmarDesactivarPlan');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Desactivando';
    const res = await apiCall(`/servicios/${planPendienteDesactivar}`, 'DELETE');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-slash-circle me-1"></i> Desactivar';
    if (res?.ok) {
        bootstrap.Modal.getInstance(document.getElementById('confirmarPlanModal'))?.hide();
        planPendienteDesactivar = null;
        mostrarToastClientes('Plan desactivado correctamente', 'warning');
        cargarPlanesInternet();
    } else {
        mostrarToastClientes('No se pudo desactivar el plan', 'danger');
    }
}

async function cargarClientes() {
    const response = await apiCall('/clientes/activos/todos');

    if (response && response.ok) {
        clientesCache = Array.isArray(response.data) ? response.data : [];
        const tabla = document.getElementById('clientesTable');
        tabla.innerHTML = '';

        if (clientesCache.length === 0) {
            tabla.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay clientes registrados</td></tr>';
            return;
        }

        const resSus = await apiCall('/suscripciones');
        suscripcionesCache = (resSus && resSus.ok && Array.isArray(resSus.data)) ? resSus.data : [];
        await cargarEstadosCarteraClientes(clientesCache.map(c => c.id).filter(Boolean));
        const puedeEditar = puedeEditarClientes();
        const puedeEliminar = puedeEliminarClientes();
        const debeSolicitarCambio = hasRole('VENDEDOR', 'PUNTO_VENTA', 'ADMINISTRATIVO');

        clientesCache.forEach(cliente => {
            const sus = obtenerSuscripcionActivaCliente(cliente.id);
            const planCell = sus
                ? `<span class="badge badge-plan"><i class="bi bi-wifi me-1"></i>${sus.nombreServicio || 'Plan activo'}</span>
                   ${sus.incluyeTv ? '<span class="badge badge-tv ms-1"><i class="bi bi-tv me-1"></i>TV</span>' : ''}`
                : '<span class="text-muted small">Sin plan</span>';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escHtml(cliente.razonSocial || '')}</td>
                <td>${escHtml(cliente.documento || '')}</td>
                <td>${escHtml(cliente.email || '')}</td>
                <td>${escHtml(cliente.telefono || '')}</td>
                <td>${escHtml(cliente.ciudad || '')}</td>
                <td>${planCell}</td>
                <td>${badgeCarteraCliente(cliente.id)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-action btn-view" onclick="verCliente('${cliente.id}')" title="Ver cliente">
                            <i class="bi bi-eye"></i><span>Ver</span>
                        </button>
                        ${puedeEditar ? `<button class="btn btn-action btn-edit" onclick="abrirModalCliente('${cliente.id}')" title="Editar cliente">
                            <i class="bi bi-pencil-square"></i><span>Editar</span>
                        </button>` : ''}
                        ${puedeEliminar ? `
                        <button class="btn btn-action btn-delete" onclick="prepararEliminarCliente('${cliente.id}', '${escapeAttr(cliente.razonSocial || 'Cliente')}')" title="Eliminar cliente">
                            <i class="bi bi-trash3"></i><span>Eliminar</span>
                        </button>` : ''}
                        ${debeSolicitarCambio ? `<button class="btn btn-action btn-edit" onclick="solicitarAutorizacionCliente('${cliente.id}')" title="Solicitar cambio a Soporte Tecnico">
                            <i class="bi bi-chat-left-text"></i><span>Solicitar</span>
                        </button>` : ''}
                    </div>
                </td>
            `;
            tabla.appendChild(row);
        });
    } else {
        document.getElementById('clientesTable').innerHTML =
            '<tr><td colspan="8" class="text-center text-danger">Error al cargar clientes</td></tr>';
    }
}

async function cargarEstadosCarteraClientes(clienteIds) {
    carteraClientesCache = {};
    const ids = [...new Set(clienteIds)];
    await Promise.all(ids.map(async id => {
        const res = await apiCall(`/facturas/estado-cliente/${id}`, 'GET');
        carteraClientesCache[id] = res?.ok ? res.data : { estado: 'SIN_ACCESO', label: 'No autorizado' };
    }));
}

function badgeCarteraCliente(clienteId) {
    const estado = carteraClientesCache[clienteId];
    if (!estado) return '<span class="badge badge-inactivo">Sin validar</span>';
    if (estado.estado === 'DEBE') return '<span class="badge badge-inactivo">Debe dinero</span>';
    if (estado.estado === 'PAZ_Y_SALVO') return '<span class="badge badge-activo">Paz y salvo</span>';
    return `<span class="badge badge-inactivo">${estado.label || 'No autorizado'}</span>`;
}

function obtenerSuscripcionActivaCliente(clienteId) {
    return suscripcionesCache.find(s =>
        s.clienteId === clienteId &&
        (s.activa === true || s.estado === 'ACTIVA')
    );
}

async function guardarPlanCliente(clienteId, planId, metodoPago, incluyeTv) {
    const actual = obtenerSuscripcionActivaCliente(clienteId);

    if (!planId) {
        if (actual?.id && !puedeEditarSuscripciones()) {
            mostrarToastClientes('La cancelacion o cambio de plan debe hacerla Soporte Tecnico o Administrador.', 'warning');
            return;
        }
        if (actual?.id) {
            await apiCall(`/suscripciones/${actual.id}`, 'DELETE');
        }
        return;
    }

    if (actual?.id && !puedeEditarSuscripciones()) {
        mostrarToastClientes('El cambio de plan debe ser autorizado por Soporte Tecnico o Administrador.', 'warning');
        return;
    }
    if (!actual?.id && !puedeCrearSuscripciones()) return;

    const plan = planesCache.find(p => p.id === planId);
    const payload = {
        clienteId,
        servicioId: planId,
        metodoPago,
        precioActual: plan?.precioMensual || 0,
        estado: 'ACTIVA',
        observaciones: incluyeTv ? 'Incluye TV' : ''
    };

    if (actual?.id) {
        await apiCall(`/suscripciones/${actual.id}`, 'PUT', payload);
    } else {
        await apiCall('/suscripciones', 'POST', payload);
    }
}

async function verCliente(id) {
    const response = await apiCall(`/clientes/${id}`);
    if (!response?.ok) {
        mostrarToastClientes('No se pudo cargar el detalle del cliente', 'danger');
        return;
    }

    const c = response.data;
    document.getElementById('detalleClienteInicial').textContent = inicialesCliente(c.razonSocial);
    document.getElementById('detalleClienteNombre').textContent = c.razonSocial || 'Cliente';
    document.getElementById('detalleClienteDocumento').textContent = c.documento || '-';
    document.getElementById('detalleClienteEmail').textContent = c.email || '-';
    document.getElementById('detalleClienteTelefono').textContent = c.telefono || '-';
    document.getElementById('detalleClienteCiudad').textContent = c.ciudad || '-';
    document.getElementById('detalleClienteCartera').innerHTML = badgeCarteraCliente(c.id);
    new bootstrap.Modal(document.getElementById('detalleClienteModal')).show();
}

function prepararEliminarCliente(id, nombre) {
    if (!puedeEliminarClientes()) {
        mostrarToastClientes('Solo Soporte Tecnico o Administrador pueden eliminar clientes.', 'danger');
        return;
    }
    clientePendienteEliminar = id;
    document.getElementById('clienteEliminarNombre').textContent = nombre;
    new bootstrap.Modal(document.getElementById('confirmarEliminarClienteModal')).show();
}

async function solicitarAutorizacionCliente(id) {
    const cliente = clientesCache.find(c => c.id === id);
    const nombre = cliente?.razonSocial || 'este cliente';
    if (!hasRole('VENDEDOR', 'PUNTO_VENTA')) {
        mostrarToastClientes(`Solicita a Soporte Tecnico la modificacion o eliminacion de ${nombre}. Tu rol no puede hacer cambios sin autorizacion.`, 'warning');
        return;
    }

    const usuario = getUserData();
    const res = await apiCall('/tickets', 'POST', {
        clienteId: id,
        asunto: 'Solicitud de autorizacion para modificar cliente',
        descripcion: `${usuario?.nombre || usuario?.email || 'Usuario comercial'} solicita que Soporte Tecnico revise y autorice cambios sobre el cliente ${nombre}.`,
        categoria: 'CAMBIO_CLIENTE',
        prioridad: 'MEDIA'
    });

    if (res?.ok) {
        mostrarToastClientes(`Solicitud enviada a Soporte Tecnico para ${nombre}.`, 'success');
    } else {
        mostrarToastClientes('No se pudo enviar la solicitud a Soporte Tecnico.', 'danger');
    }
}

async function confirmarEliminarCliente() {
    if (!clientePendienteEliminar) return;
    const btn = document.getElementById('btnConfirmarEliminarCliente');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Eliminando';

    const response = await apiCall(`/clientes/${clientePendienteEliminar}`, 'DELETE');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash3 me-1"></i> Eliminar';

    if (response && response.ok) {
        bootstrap.Modal.getInstance(document.getElementById('confirmarEliminarClienteModal'))?.hide();
        clientePendienteEliminar = null;
        mostrarToastClientes('Cliente eliminado correctamente', 'warning');
        cargarClientes();
    } else {
        mostrarToastClientes('Error al eliminar el cliente', 'danger');
    }
}

function mostrarToastClientes(mensaje, tipo) {
    const toastEl = document.getElementById('clientesToast');
    document.getElementById('clientesToastTexto').textContent = mensaje;
    toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;
    new bootstrap.Toast(toastEl, { delay: 3200 }).show();
}

function inicialesCliente(nombre) {
    return (nombre || 'IN')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase())
        .join('') || 'IN';
}

function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(value) {
    return escHtml(value).replace(/'/g, '&#39;');
}
