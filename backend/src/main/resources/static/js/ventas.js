// ventas.js - Gestion de ventas, suscripciones y facturacion mensual ISP.
const puedeCrearVentas = () => hasRole('ADMIN', 'VENDEDOR', 'PUNTO_VENTA');
const puedeCancelarSuscripciones = () => hasRole('ADMIN');
const puedeVerFacturacion = () => hasRole('ADMIN', 'CONTABLE');
const puedeGenerarFacturas = () => hasRole('ADMIN', 'CONTABLE');
const esRolComercialVentas = () => hasRole('VENDEDOR', 'PUNTO_VENTA');
let facturasCache = [];
let carteraClientesCache = {};

document.addEventListener('DOMContentLoaded', function () {
    requireRoleAuth('ADMIN', 'VENDEDOR', 'PUNTO_VENTA', 'CONTABLE');
    setupNavbar();
    configurarPermisosVentas();
    configurarFormularioPago();
    cargarDatosVentas();

    document.getElementById('nuevaVentaForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!puedeCrearVentas()) {
            mostrarAlertaModal('alertaNuevaVenta', 'Tu rol solo tiene permiso de consulta financiera.');
            return;
        }

        const btnText = document.getElementById('btnGuardarVentaText');
        const btnSpinner = document.getElementById('btnGuardarVentaSpinner');
        btnText.textContent = 'Guardando...';
        btnSpinner.classList.remove('d-none');

        const payload = {
            clienteId: document.getElementById('vCliente').value,
            servicioId: document.getElementById('vServicio').value,
            metodoPago: document.getElementById('vMetodoPago').value,
            precioActual: parseFloat(document.getElementById('vPrecio').value) || null,
            observaciones: document.getElementById('vObservaciones').value.trim(),
            fechaInicio: document.getElementById('vFechaInicio').value || null
        };

        const res = await apiCall('/suscripciones', 'POST', payload);
        btnText.textContent = 'Guardar';
        btnSpinner.classList.add('d-none');

        if (res && res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalNuevaVenta')).hide();
            document.getElementById('nuevaVentaForm').reset();
            mostrarToast('Suscripción creada exitosamente', 'success');
            cargarDatosVentas();
        } else {
            mostrarAlertaModal('alertaNuevaVenta', res?.data?.message || 'Error al crear la suscripción');
        }
    });
});

function configurarPermisosVentas() {
    const puedeGestionar = puedeCrearVentas();
    const btnNuevaVenta = document.getElementById('btnNuevaVenta');
    if (btnNuevaVenta) btnNuevaVenta.style.display = puedeGestionar ? '' : 'none';

    const periodo = document.getElementById('periodoFacturacion');
    if (periodo) periodo.value = new Date().toISOString().slice(0, 7);

    const btnGenerar = document.getElementById('btnGenerarFacturas');
    if (btnGenerar) btnGenerar.style.display = puedeGenerarFacturas() ? '' : 'none';

    const facturacionCard = document.getElementById('facturacionMensualCard');
    if (facturacionCard) facturacionCard.style.display = puedeVerFacturacion() ? '' : 'none';

    if (!puedeGestionar) {
        const subtitulo = document.getElementById('ventasSubtitulo');
        if (subtitulo) subtitulo.textContent = 'Consulta de contratos, facturación mensual y pagos';
    }
}

function configurarFormularioPago() {
    document.getElementById('formPagoFactura')?.addEventListener('submit', registrarPagoFactura);
}

async function cargarDatosVentas() {
    cargarSuscripciones();
    cargarSelectClientes();
    cargarSelectServicios();
    if (puedeVerFacturacion()) cargarFacturas();
}

async function cargarSuscripciones() {
    const tbody = document.getElementById('tablaSuscripciones');
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">
        <div class="spinner-border text-purple" role="status"></div></td></tr>`;

    const [resSusc, resClientes, resServicios] = await Promise.all([
        apiCall('/suscripciones', 'GET'),
        apiCall('/clientes', 'GET'),
        apiCall('/servicios', 'GET')
    ]);

    if (!resSusc || !resSusc.ok) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error al cargar suscripciones</td></tr>`;
        return;
    }

    const suscripciones = resSusc.data;
    const clientes = (resClientes?.ok ? resClientes.data : []);
    const servicios = (resServicios?.ok ? resServicios.data : []);
    const puedeCancelar = puedeCancelarSuscripciones();

    const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c.razonSocial]));
    const servicioMap = Object.fromEntries(servicios.map(s => [s.id, s.nombre]));
    await cargarEstadosCarteraClientes(suscripciones.map(s => s.clienteId).filter(Boolean));

    document.getElementById('totalSuscripciones').textContent = suscripciones.length;
    document.getElementById('totalActivas').textContent = suscripciones.filter(s => s.activa).length;

    const ingresos = suscripciones.filter(s => s.activa)
        .reduce((sum, s) => sum + (s.precioActual || 0), 0);
    document.getElementById('totalIngresos').textContent = esRolComercialVentas()
        ? 'Solo cartera'
        : '$' + ingresos.toLocaleString('es-CO');

    if (suscripciones.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">No hay suscripciones registradas</td></tr>`;
        return;
    }

    tbody.innerHTML = suscripciones.map(s => `
        <tr>
            <td><span class="fw-semibold">${s.numeroContrato || '-'}</span></td>
            <td>${clienteMap[s.clienteId] || '<span class="text-muted">Desconocido</span>'}</td>
            <td>${servicioMap[s.servicioId] || '<span class="text-muted">Desconocido</span>'}</td>
            <td>${esRolComercialVentas() ? '<span class="text-muted small">Restringido</span>' : '$' + (s.precioActual || 0).toLocaleString('es-CO')}</td>
            <td>${esRolComercialVentas() ? '<span class="text-muted small">Restringido</span>' : (s.metodoPago || '-')}</td>
            <td>${badgeEstadoVenta(s.estado, s.activa)}</td>
            <td>${badgeCarteraCliente(s.clienteId)}</td>
            <td>
                <button class="btn btn-sm btn-outline-purple" onclick="verDetalle('${s.id}')" title="Ver detalle">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary ms-1" onclick="descargarContrato('${s.id}', '${escapeAttr(s.numeroContrato || 'contrato')}')" title="Descargar contrato PDF">
                    <i class="bi bi-file-earmark-pdf"></i>
                </button>
                ${puedeCancelar && s.activa ? `<button class="btn btn-sm btn-outline-danger ms-1" onclick="cancelarSuscripcion('${s.id}')" title="Cancelar">
                    <i class="bi bi-x-circle"></i>
                </button>` : ''}
            </td>
        </tr>`).join('');
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

async function cargarFacturas() {
    if (!puedeVerFacturacion()) return;
    const tbody = document.getElementById('tablaFacturas');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Cargando facturas...</td></tr>';
    const res = await apiCall('/facturas', 'GET');
    if (!res?.ok) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-danger">Error al cargar facturas</td></tr>';
        return;
    }
    facturasCache = Array.isArray(res.data) ? res.data : [];
    renderFacturas();
}

function renderFacturas() {
    const tbody = document.getElementById('tablaFacturas');
    if (!facturasCache.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No hay facturas generadas</td></tr>';
        return;
    }

    tbody.innerHTML = facturasCache
        .slice()
        .sort((a, b) => (b.fechaEmision || '').localeCompare(a.fechaEmision || ''))
        .map(f => `
            <tr>
                <td>
                    <div class="fw-semibold">${f.numeroFactura || '-'}</div>
                    <small class="text-muted">Emitida: ${formatoFecha(f.fechaEmision)}</small>
                </td>
                <td>
                    <div>${f.clienteNombre || 'Cliente no asociado'}</div>
                    <small class="text-muted">${f.servicioNombre || '-'}</small>
                </td>
                <td><span class="badge badge-plan">${f.periodoFacturado || '-'}</span></td>
                <td>${formatoFecha(f.fechaVencimiento)}</td>
                <td class="fw-bold">$${Number(f.total || 0).toLocaleString('es-CO')}</td>
                <td>${f.pagada ? '<span class="badge badge-activo">PAGADA</span>' : '<span class="badge badge-inactivo">PENDIENTE</span>'}</td>
                <td>${auditoriaPago(f)}</td>
                <td>
                    <button class="btn btn-action btn-view" onclick="descargarFactura('${f.id}', '${escapeAttr(f.numeroFactura || 'factura')}')" title="Descargar factura PDF">
                        <i class="bi bi-file-earmark-pdf"></i><span>PDF</span>
                    </button>
                    ${f.pagada ? '<span class="text-muted small">Sin acciones</span>' : `
                    <button class="btn btn-action btn-edit" onclick="abrirPagoFactura('${f.id}')" title="Registrar pago">
                        <i class="bi bi-upload"></i><span>Pagar</span>
                    </button>`}
                </td>
            </tr>
        `).join('');
}

function auditoriaPago(f) {
    if (!f.pagada) return '<span class="text-muted small">Sin pago registrado</span>';
    return `
        <div class="small">
            <div><strong>${f.metodoPago || '-'}</strong> ${f.referenciaPago ? `- ${f.referenciaPago}` : ''}</div>
            <div>${f.comprobanteNombreArchivo || 'Comprobante cargado'}</div>
            <div class="text-muted">Subido por ${f.pagoRegistradoPorNombre || f.pagoRegistradoPorEmail || '-'}</div>
            <div class="text-muted">${formatoFechaHora(f.fechaRegistroComprobante || f.fechaPago)}</div>
        </div>`;
}

async function generarFacturasMensuales() {
    if (!puedeGenerarFacturas()) {
        mostrarToast('Tu rol no puede generar facturación mensual', 'danger');
        return;
    }
    const periodo = document.getElementById('periodoFacturacion').value || new Date().toISOString().slice(0, 7);
    const res = await apiCall(`/facturas/generar-mensuales?periodo=${encodeURIComponent(periodo)}`, 'POST');
    if (res?.ok) {
        mostrarToast(`Facturación mensual ${periodo} generada`, 'success');
        cargarFacturas();
    } else {
        mostrarToast(res?.data?.message || 'No se pudo generar la facturación', 'danger');
    }
}

function descargarFactura(id, numero) {
    descargarPdf(`/facturas/${id}/pdf`, `${numero || 'factura'}.pdf`);
}

function descargarContrato(id, numero) {
    descargarPdf(`/suscripciones/${id}/contrato-pdf`, `${numero || 'contrato'}.pdf`);
}

async function descargarPdf(endpoint, nombreArchivo) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
        if (!response.ok) {
            const errorText = await response.text();
            mostrarToast(errorText || 'No se pudo generar el PDF', 'danger');
            return;
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    } catch (error) {
        mostrarToast('Error al descargar el PDF', 'danger');
    }
}

function abrirPagoFactura(id) {
    const factura = facturasCache.find(f => f.id === id);
    if (!factura) return;
    document.getElementById('formPagoFactura').reset();
    document.getElementById('pagoFacturaId').value = id;
    document.getElementById('pagoFacturaNumero').textContent = factura.numeroFactura || 'Factura';
    document.getElementById('pagoFacturaTotal').textContent = '$' + Number(factura.total || 0).toLocaleString('es-CO');
    new bootstrap.Modal(document.getElementById('modalPagoFactura')).show();
}

async function registrarPagoFactura(e) {
    e.preventDefault();
    if (!puedeVerFacturacion()) {
        mostrarToast('Tu rol no puede registrar pagos de facturas', 'danger');
        return;
    }
    const id = document.getElementById('pagoFacturaId').value;
    const archivo = document.getElementById('pagoComprobante').files[0];
    if (!archivo) {
        mostrarToast('Debes subir el comprobante', 'danger');
        return;
    }

    const btn = document.getElementById('btnGuardarPago');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Subiendo';

    const form = new FormData();
    form.append('metodoPago', document.getElementById('pagoMetodo').value);
    form.append('referenciaPago', document.getElementById('pagoReferencia').value.trim());
    form.append('comprobante', archivo);

    const res = await apiUpload(`/facturas/${id}/registrar-pago`, form);
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-upload me-1"></i> Subir y Registrar';

    if (res?.ok) {
        bootstrap.Modal.getInstance(document.getElementById('modalPagoFactura')).hide();
        mostrarToast('Pago registrado con comprobante y auditoría', 'success');
        cargarFacturas();
    } else {
        mostrarToast(res?.data?.message || 'No se pudo registrar el pago', 'danger');
    }
}

async function apiUpload(endpoint, formData) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData
        });
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : { message: await response.text() };
        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        return { ok: false, data: { message: error.message } };
    }
}

async function cargarSelectClientes() {
    const sel = document.getElementById('vCliente');
    const res = await apiCall('/clientes', 'GET');
    if (!res?.ok) return;
    sel.innerHTML = '<option value="">- Selecciona cliente -</option>' +
        res.data.filter(c => c.activo)
           .map(c => `<option value="${c.id}">${c.razonSocial}</option>`).join('');
}

async function cargarSelectServicios() {
    const sel = document.getElementById('vServicio');
    const precio = document.getElementById('vPrecio');
    const res = await apiCall('/servicios', 'GET');
    if (!res?.ok) return;
    const activos = res.data.filter(s => s.activo !== false);
    sel.innerHTML = '<option value="">- Selecciona plan -</option>' +
        activos.map(s =>
            `<option value="${s.id}" data-precio="${s.precioMensual}">${s.nombre} - $${(s.precioMensual || 0).toLocaleString('es-CO')}/mes</option>`
        ).join('');

    sel.addEventListener('change', function () {
        const opt = sel.options[sel.selectedIndex];
        if (opt.dataset.precio) precio.value = opt.dataset.precio;
    });
}

async function cancelarSuscripcion(id) {
    if (!puedeCancelarSuscripciones()) {
        mostrarToast('Solo el Administrador puede cancelar suscripciones desde ventas', 'danger');
        return;
    }
    const res = await apiCall(`/suscripciones/${id}`, 'DELETE');
    if (res && res.ok) {
        mostrarToast('Suscripción cancelada', 'warning');
        cargarSuscripciones();
    } else {
        mostrarToast('Error al cancelar la suscripción', 'danger');
    }
}

async function verDetalle(id) {
    const res = await apiCall(`/suscripciones/${id}`, 'GET');
    if (!res?.ok) {
        mostrarToast('No se pudo cargar el detalle', 'danger');
        return;
    }
    const s = res.data;
    const precioDetalle = esRolComercialVentas()
        ? 'Restringido'
        : `$${(s.precioActual || 0).toLocaleString('es-CO')}/mes`;
    const metodoDetalle = esRolComercialVentas() ? 'Restringido' : (s.metodoPago || '-');
    document.getElementById('detalleContenido').innerHTML = `
        <dl class="row mb-0">
            <dt class="col-5">Contrato</dt><dd class="col-7">${s.numeroContrato || '-'}</dd>
            <dt class="col-5">Estado</dt><dd class="col-7">${badgeEstadoVenta(s.estado, s.activa)}</dd>
            <dt class="col-5">Cartera</dt><dd class="col-7">${badgeCarteraCliente(s.clienteId)}</dd>
            <dt class="col-5">Precio</dt><dd class="col-7">${precioDetalle}</dd>
            <dt class="col-5">Método de pago</dt><dd class="col-7">${metodoDetalle}</dd>
            <dt class="col-5">Observaciones</dt><dd class="col-7">${s.observaciones || '-'}</dd>
        </dl>`;
    new bootstrap.Modal(document.getElementById('modalDetalle')).show();
}

function badgeEstadoVenta(estado, activa) {
    if (activa) return `<span class="badge badge-activo">${estado || 'ACTIVO'}</span>`;
    return `<span class="badge badge-inactivo">${estado || 'INACTIVO'}</span>`;
}

function formatoFecha(valor) {
    if (!valor) return '-';
    return new Date(valor).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatoFechaHora(valor) {
    if (!valor) return '-';
    return new Date(valor).toLocaleString('es-CO', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
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

function escapeAttr(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
