document.addEventListener('DOMContentLoaded', function () {
    requireAuth();
    setupNavbar();
    configurarFormularioSolicitud();
    mostrarRolEnBienvenida();
    cargarDashboardPorRol();
});

function mostrarRolEnBienvenida() {
    const rol = getUserRole();
    const badge = document.getElementById('welcomeRoleBadge');
    if (!badge || !rol) return;
    const label = ROLE_LABELS[rol] || rol;
    badge.textContent = label;
    badge.className = `welcome-role-badge welcome-role-${rol.toLowerCase()}`;
}

function setWelcome(title, subtitle) {
    document.getElementById('welcomeTitle').textContent = title;
    document.getElementById('welcomeSubtitle').textContent = subtitle;
}

function setQuickAction(slot, title, desc, btnText, href, onClick, icon) {
    const titleEl = document.getElementById(`quick${slot}Title`);
    const descEl  = document.getElementById(`quick${slot}Desc`);
    const iconEl  = document.getElementById(`quick${slot}Icon`);
    if (titleEl) titleEl.textContent = title;
    if (descEl)  descEl.textContent  = desc;
    if (iconEl && icon) iconEl.innerHTML = `<i class="bi ${icon}"></i>`;
    const btn = document.getElementById(`quick${slot}Btn`);
    if (!btn) return;
    btn.textContent = btnText;
    btn.href = href || '#';
    btn.onclick = onClick || null;
    btn.classList.remove('disabled');
}

function setWorkflow(title, steps) {
    document.getElementById('workflowTitle').textContent = title;
    document.getElementById('workflowSteps').innerHTML = steps.map(s => `<li>${s}</li>`).join('');
}

function setStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function showCard(id, visible) {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? '' : 'none';
}

async function cargarDashboardPorRol() {
    const role = getUserRole();
    switch (role) {
        case 'ADMIN':
            await cargarDashboardAdmin();
            break;
        case 'VENDEDOR':
        case 'PUNTO_VENTA':
            await cargarDashboardVendedor();
            break;
        case 'CONTABLE':
            await cargarDashboardContable();
            break;
        case 'JEFE_BODEGA':
            await cargarDashboardBodega();
            break;
        case 'SOPORTE':
            await cargarDashboardSoporte();
            break;
        case 'ADMINISTRATIVO':
            await cargarDashboardAdministrativo();
            break;
        case 'JEFE_CUADRILLA':
            await cargarDashboardCuadrilla();
            break;
        case 'TECNICO':
            await cargarDashboardTecnico();
            break;
        case 'CLIENTE':
            await cargarDashboardCliente();
            break;
        default:
            cargarDashboardBasico();
    }
    await renderDashboardCharts(role);
}

async function cargarDashboardContable() {
    setWelcome('Panel Financiero', 'Facturación, cartera y control de pagos del ISP');
    document.getElementById('clientesLabel').textContent      = 'Clientes Activos';
    document.getElementById('suscripcionesLabel').textContent = 'Suscripciones Activas';
    document.getElementById('facturasLabel').textContent      = 'Facturas Pendientes';
    showCard('clientesCard', true);
    showCard('suscripcionesCard', true);
    showCard('facturasCard', true);
    showCard('ticketsCard', false);
    showCard('ordenesCard', false);
    showCard('stockCard', false);

    const [clientesRes, susRes, factRes] = await Promise.all([
        apiCall('/clientes/activos/todos'),
        apiCall('/suscripciones/activas/todas'),
        apiCall('/facturas/pendientes/todas')
    ]);

    setStat('clientesCount',      arr(clientesRes));
    setStat('suscripcionesCount', arr(susRes));
    setStat('facturasCount',      arr(factRes));

    setQuickAction(1, 'Cartera',          'Revisar clientes y estados de cuenta.',              'Ver Clientes', 'clientes.html', null, 'bi-people-fill');
    setQuickAction(2, 'Facturación',      'Consultar suscripciones y pagos pendientes.',        'Ir a Facturación', 'ventas.html', null, 'bi-receipt');
    setQuickAction(3, 'Reporte Financiero', 'Actualizar resumen de cartera y recaudo.',         'Actualizar', '#', async e => {
        e.preventDefault();
        await cargarDashboardContable();
    }, 'bi-arrow-clockwise');

    setWorkflow('Flujo Financiero', [
        'Validar suscripciones activas.',
        'Generar o revisar facturas mensuales pendientes.',
        'Registrar pagos recibidos con comprobante.',
        'Entregar reportes financieros a administración.'
    ]);
}

async function cargarDashboardSoporte() {
    setWelcome('Mesa de Soporte', 'Atención de tickets, fallas y escalamiento técnico');
    document.getElementById('clientesLabel').textContent      = 'Tickets Abiertos';
    document.getElementById('suscripcionesLabel').textContent = 'En Progreso';
    document.getElementById('facturasLabel').textContent      = 'Clientes Activos';
    showCard('clientesCard', true);
    showCard('suscripcionesCard', true);
    showCard('facturasCard', true);
    showCard('ticketsCard', false);
    showCard('ordenesCard', false);
    showCard('stockCard', false);

    const [ticketsRes, enProgresoRes, clientesRes] = await Promise.all([
        apiCall('/tickets/abiertos/todos'),
        apiCall('/tickets/estado/EN_PROGRESO'),
        apiCall('/clientes/activos/todos')
    ]);
    setStat('clientesCount',      arr(ticketsRes));
    setStat('suscripcionesCount', arr(enProgresoRes));
    setStat('facturasCount',      arr(clientesRes));

    setQuickAction(1, 'Bandeja de Tickets', 'Gestionar incidentes y solicitudes.',              'Ir a Tickets',    'tickets.html',  null, 'bi-ticket-detailed-fill');
    setQuickAction(2, 'Consultar Clientes', 'Verificar datos del cliente para soporte.',        'Ver Clientes',    'clientes.html', null, 'bi-person-lines-fill');
    setQuickAction(3, 'Escalamiento',       'Documentar casos que requieren visita técnica.',   'Gestionar Tickets','tickets.html', null, 'bi-arrow-up-right-circle');

    setWorkflow('Flujo de Soporte Técnico', [
        'Recibir ticket de cliente o aliado.',
        'Diagnosticar si se resuelve de forma remota o requiere visita.',
        'Escalar a coordinación técnica cuando aplique.',
        'Cerrar ticket con solución registrada y tiempo de resolución.'
    ]);
}

async function cargarDashboardAdministrativo() {
    setWelcome('Panel Administrativo', 'Documentación, clientes y seguimiento contractual');
    document.getElementById('clientesLabel').textContent      = 'Clientes Registrados';
    document.getElementById('suscripcionesLabel').textContent = 'Contratos Activos';
    showCard('clientesCard', true);
    showCard('suscripcionesCard', true);
    showCard('facturasCard', false);
    showCard('ticketsCard', false);
    showCard('ordenesCard', false);
    showCard('stockCard', false);

    const [clientesRes, susRes] = await Promise.all([
        apiCall('/clientes/activos/todos'),
        apiCall('/suscripciones/activas/todas')
    ]);
    setStat('clientesCount',      arr(clientesRes));
    setStat('suscripcionesCount', arr(susRes));

    setQuickAction(1, 'Clientes',    'Actualizar datos administrativos y documentación.',    'Ver Clientes',    'clientes.html', null, 'bi-building');
    setQuickAction(2, 'Contratos',   'Seguimiento documental de contratos y suscripciones.', 'Ir a Contratos',  'ventas.html',   null, 'bi-file-earmark-text-fill');
    setQuickAction(3, 'Novedades',   'Coordinar con ventas y soporte novedades internas.',   'Ver Inicio',      'index.html',    null, 'bi-bell-fill');

    setWorkflow('Flujo Administrativo', [
        'Revisar documentación de clientes y contratos.',
        'Coordinar novedades internas con ventas y soporte.',
        'Mantener información administrativa actualizada.',
        'Reportar inconsistencias al administrador.'
    ]);
}

async function cargarDashboardAdmin() {
    setWelcome('Centro de Control ISP', 'Vista ejecutiva de clientes, ventas, soporte técnico y operación de campo');
    document.getElementById('clientesLabel').textContent   = 'Clientes Activos';
    document.getElementById('suscripcionesLabel').textContent = 'Suscripciones Activas';
    document.getElementById('facturasLabel').textContent   = 'Facturas Pendientes';
    document.getElementById('ticketsLabel').textContent    = 'Tickets Abiertos';
    document.getElementById('ordenesLabel').textContent    = 'Órdenes Pendientes';
    document.getElementById('stockLabel').textContent      = 'Stock Bajo';
    showCard('clientesCard', true);
    showCard('suscripcionesCard', true);
    showCard('facturasCard', true);
    showCard('ticketsCard', true);
    showCard('ordenesCard', true);
    showCard('stockCard', true);

    const [clientesRes, susRes, factRes, ticketRes, ordenesRes, stockRes] = await Promise.all([
        apiCall('/clientes/activos/todos'),
        apiCall('/suscripciones/activas/todas'),
        apiCall('/facturas/pendientes/todas'),
        apiCall('/tickets/abiertos/todos'),
        apiCall('/ordenes/estado/PENDIENTE'),
        apiCall('/inventario/stock-bajo')
    ]);

    setStat('clientesCount',    arr(clientesRes));
    setStat('suscripcionesCount', arr(susRes));
    setStat('facturasCount',    arr(factRes));
    setStat('ticketsCount',     arr(ticketRes));
    setStat('ordenesCount',     arr(ordenesRes));
    setStat('stockCount',       arr(stockRes));

    setQuickAction(1, 'Gestión Comercial', 'Alta de clientes, planes y cartera comercial.', 'Ir a Clientes', 'clientes.html', null, 'bi-people-fill');
    setQuickAction(2, 'Facturación', 'Generar facturas mensuales y registrar pagos.', 'Ir a Ventas', 'ventas.html', null, 'bi-receipt');
    setQuickAction(3, 'Coordinación Técnica', 'Asignar órdenes y seguimiento de instalación.', 'Ir a Órdenes', 'ordenes.html', null, 'bi-calendar-week');

    setWorkflow('Procedimiento ISP: Solicitud a Activación', [
        'Cliente solicita un plan de internet desde el portal o equipo comercial.',
        'Se crea suscripción en estado pendiente y se genera orden de instalación.',
        'Jefe de cuadrilla asigna técnico y programa visita.',
        'Técnico ejecuta instalación, reporta evidencias y cierre.',
        'Coordinación valida y el área comercial activa la suscripción.'
    ]);
}

function arr(res) {
    return (res?.ok && Array.isArray(res.data)) ? res.data.length : '—';
}

async function cargarDashboardVendedor() {
    setWelcome('Panel Comercial', 'Gestión de nuevos clientes, suscripciones y seguimiento de cartera');
    document.getElementById('clientesLabel').textContent       = 'Clientes Activos';
    document.getElementById('suscripcionesLabel').textContent  = 'Suscripciones Activas';
    document.getElementById('facturasLabel').textContent       = 'Pendientes de Cobro';
    showCard('clientesCard', true);
    showCard('suscripcionesCard', true);
    showCard('facturasCard', true);
    showCard('ticketsCard', false);
    showCard('ordenesCard', false);
    showCard('stockCard', false);

    const [clientesRes, susRes, factRes] = await Promise.all([
        apiCall('/clientes/activos/todos'),
        apiCall('/suscripciones/activas/todas'),
        apiCall('/facturas/pendientes/todas')
    ]);

    setStat('clientesCount',      arr(clientesRes));
    setStat('suscripcionesCount', arr(susRes));
    setStat('facturasCount',      arr(factRes));

    setQuickAction(1, 'Nuevo Cliente',    'Registrar datos del cliente y validar cobertura.',    'Registrar Cliente',  'clientes.html', null, 'bi-person-plus-fill');
    setQuickAction(2, 'Nueva Venta',      'Crear suscripción del plan contratado.',              'Crear Suscripción',  'ventas.html',   null, 'bi-cart-plus-fill');
    setQuickAction(3, 'Estado Comercial', 'Revisar contratos activos y pagos pendientes.',       'Ver Ventas',         'ventas.html',   null, 'bi-graph-up-arrow');

    setWorkflow('Flujo Comercial de Alta de Servicio', [
        'Registrar cliente y confirmar disponibilidad del plan.',
        'Crear suscripción con método de pago y condiciones comerciales.',
        'Enviar la solicitud al frente técnico para instalación.',
        'Monitorear estado hasta activación y facturación.'
    ]);
}

async function cargarDashboardBodega() {
    setWelcome('Panel de Bodega', 'Control de stock, solicitudes de material y atención de tickets');
    document.getElementById('clientesLabel').textContent      = 'Stock Bajo / Alerta';
    document.getElementById('suscripcionesLabel').textContent = 'Solicitudes Pendientes';
    document.getElementById('facturasLabel').textContent      = 'Tickets Abiertos';
    document.getElementById('ordenesLabel').textContent       = 'Items en Catálogo';
    showCard('clientesCard', true);
    showCard('suscripcionesCard', true);
    showCard('facturasCard', true);
    showCard('ticketsCard', false);
    showCard('ordenesCard', true);
    showCard('stockCard', false);

    const [stockRes, solicitudesRes, ticketsRes, inventarioRes] = await Promise.all([
        apiCall('/inventario/stock-bajo'),
        apiCall('/solicitudes-material'),
        apiCall('/tickets/abiertos/todos'),
        apiCall('/inventario')
    ]);

    const solicPendientes = solicitudesRes?.ok && Array.isArray(solicitudesRes.data)
        ? solicitudesRes.data.filter(s => s.estado === 'PENDIENTE').length : '—';

    setStat('clientesCount',      arr(stockRes));
    setStat('suscripcionesCount', solicPendientes);
    setStat('facturasCount',      arr(ticketsRes));
    setStat('ordenesCount',       arr(inventarioRes));

    setQuickAction(1, 'Inventario',         'Controlar entradas, salidas y stock crítico.',   'Ir a Inventario',  'inventario.html', null, 'bi-box-seam-fill');
    setQuickAction(2, 'Despacho Material',  'Aprobar y despachar solicitudes de técnicos.',   'Ver Solicitudes',  'inventario.html', null, 'bi-truck');
    setQuickAction(3, 'Mesa de Tickets',    'Atender tickets escalados de soporte técnico.',  'Ir a Tickets',     'tickets.html',    null, 'bi-headset');

    setWorkflow('Flujo de Abastecimiento Técnico', [
        'Recibir solicitud de material desde técnico u orden de trabajo.',
        'Validar stock disponible y aprobar cantidades.',
        'Registrar salida de inventario y número de despacho.',
        'Actualizar estado para continuidad de la orden técnica.'
    ]);
}

async function cargarDashboardCuadrilla() {
    setWelcome('Panel de Coordinación Técnica', 'Asignación de técnicos y control de órdenes de instalación');
    document.getElementById('clientesLabel').textContent      = 'Órdenes Pendientes';
    document.getElementById('suscripcionesLabel').textContent = 'Órdenes Asignadas';
    document.getElementById('facturasLabel').textContent      = 'Por Validar';
    document.getElementById('ordenesLabel').textContent       = 'En Progreso';
    showCard('clientesCard', true);
    showCard('suscripcionesCard', true);
    showCard('facturasCard', true);
    showCard('ticketsCard', false);
    showCard('ordenesCard', true);
    showCard('stockCard', false);

    const [pendRes, asigRes, compRes, progrRes] = await Promise.all([
        apiCall('/ordenes/estado/PENDIENTE'),
        apiCall('/ordenes/estado/ASIGNADA'),
        apiCall('/ordenes/estado/COMPLETADA'),
        apiCall('/ordenes/estado/EN_PROGRESO')
    ]);

    setStat('clientesCount',      arr(pendRes));
    setStat('suscripcionesCount', arr(asigRes));
    setStat('facturasCount',      arr(compRes));
    setStat('ordenesCount',       arr(progrRes));

    setQuickAction(1, 'Asignar Órdenes',    'Distribuir instalaciones por zona y carga técnica.', 'Ir a Órdenes',    'ordenes.html',    null, 'bi-calendar-week-fill');
    setQuickAction(2, 'Control en Campo',   'Monitorear avance, bloqueos y validaciones.',        'Ver Estado',      'ordenes.html',    null, 'bi-map-fill');
    setQuickAction(3, 'Inventario',         'Consultar stock disponible para operaciones.',        'Ver Inventario',  'inventario.html', null, 'bi-boxes');

    setWorkflow('Procedimiento de Asignación Técnica', [
        'Recibir orden de instalación generada por venta o solicitud de cliente.',
        'Asignar técnico según zona, agenda y capacidad disponible.',
        'Hacer seguimiento a las fases de ejecución y evidencias.',
        'Validar cierre técnico para habilitar activación comercial.'
    ]);
}

async function cargarDashboardTecnico() {
    setWelcome('Panel de Ejecución en Campo', 'Tus órdenes asignadas, en progreso y completadas hoy');
    document.getElementById('clientesLabel').textContent      = 'Órdenes Asignadas';
    document.getElementById('suscripcionesLabel').textContent = 'En Progreso';
    document.getElementById('facturasLabel').textContent      = 'Completadas Hoy';
    showCard('clientesCard', true);
    showCard('suscripcionesCard', true);
    showCard('facturasCard', true);
    showCard('ticketsCard', false);
    showCard('ordenesCard', false);
    showCard('stockCard', false);

    const user = getUserData();
    const ordenesRes = user?.id ? await apiCall(`/ordenes/tecnico/${user.id}`) : null;
    const ordenes = (ordenesRes?.ok && Array.isArray(ordenesRes.data)) ? ordenesRes.data : [];

    setStat('clientesCount',      ordenes.filter(o => o.estado === 'ASIGNADA').length);
    setStat('suscripcionesCount', ordenes.filter(o => o.estado === 'EN_PROGRESO').length);
    setStat('facturasCount',      ordenes.filter(o => o.estado === 'COMPLETADA').length);

    setQuickAction(1, 'Mi Trabajo',         'Ejecutar fases, subir evidencias y cerrar órdenes.', 'Abrir Mi Trabajo', 'tecnico.html', null, 'bi-person-badge-fill');
    setQuickAction(2, 'Órdenes del Día',    'Revisar prioridades, rutas y detalles de hoy.',      'Ver Órdenes',      'tecnico.html', null, 'bi-list-task');
    setQuickAction(3, 'Reporte de Cierre',  'Registrar observaciones, materiales y novedades.',   'Reportar',         'tecnico.html', null, 'bi-clipboard2-check-fill');

    setWorkflow('Rutina Operativa del Técnico', [
        'Recibir orden asignada por coordinación de cuadrilla.',
        'Iniciar trabajo en campo y ejecutar fases técnicas.',
        'Subir evidencias, materiales usados y observaciones.',
        'Cerrar orden para validación del jefe de cuadrilla.'
    ]);
}

async function cargarDashboardCliente() {
    setWelcome('Portal de Cliente ISP', 'Consulta tu estado de facturación y solicita nuevos servicios');
    showCard('clientesCard', false);
    showCard('ticketsCard', false);
    showCard('ordenesCard', false);
    showCard('stockCard', false);
    document.getElementById('suscripcionesLabel').textContent = 'Mis Suscripciones';
    document.getElementById('facturasLabel').textContent = 'Estado de Facturación';

    const [susRes, resumenRes] = await Promise.all([
        apiCall('/suscripciones/mias'),
        apiCall('/facturas/mi-estado')
    ]);

    setStat('suscripcionesCount', (susRes?.ok && Array.isArray(susRes.data)) ? susRes.data.length : '0');

    if (resumenRes?.ok) {
        const data = resumenRes.data;
        if (data.estado === 'SIN_CLIENTE_ASOCIADO') {
            setStat('facturasCount', '-');
            document.getElementById('facturasLabel').textContent = 'Cliente sin vincular';
        } else if (data.estado === 'CON_DEUDA') {
            setStat('facturasCount', 'DEBE');
            document.getElementById('facturasLabel').textContent = `Debe $${Number(data.totalPendiente || 0).toLocaleString('es-CO')}`;
        } else {
            setStat('facturasCount', 'AL DÍA');
            document.getElementById('facturasLabel').textContent = 'Sin saldo pendiente';
        }
    } else {
        setStat('facturasCount', '-');
        document.getElementById('facturasLabel').textContent = 'Sin información disponible';
    }

    setQuickAction(1, 'Solicitar Servicio', 'Escoge un plan y crea tu solicitud de instalación.', 'Solicitar Internet', '#', function (e) {
        e.preventDefault();
        abrirModalSolicitudServicio();
    }, 'bi-wifi');
    setQuickAction(2, 'Mi Cuenta', 'Consulta si tienes facturas pendientes o al día.', 'Actualizar Estado', '#', async function (e) {
        e.preventDefault();
        await cargarDashboardCliente();
    }, 'bi-receipt');
    setQuickAction(3, 'Soporte Comercial', 'Comunícate con nuestro equipo si necesitas ayuda.', 'Contactar', '#', function (e) {
        e.preventDefault();
        mostrarNotificacion('Comunícate con nuestro equipo comercial para soporte de tu cuenta.', 'info');
    }, 'bi-headset');

    setWorkflow('Cómo se procesa tu solicitud de internet', [
        'Seleccionas el plan y envías tu solicitud desde este portal.',
        'Comercial genera la pre-venta y coordinación técnica crea la instalación.',
        'Jefe de cuadrilla asigna técnico y agenda la visita.',
        'Tras la instalación validada, el servicio queda activo y facturable.'
    ]);
}

function cargarDashboardBasico() {
    setWelcome('Panel General', 'Acceso limitado — contacta al administrador para obtener los permisos correctos.');
    showCard('clientesCard', false);
    showCard('suscripcionesCard', false);
    showCard('facturasCard', false);
    showCard('ticketsCard', false);
    showCard('ordenesCard', false);
    showCard('stockCard', false);
    setQuickAction(1, 'Inicio', 'Vista principal del sistema.', 'Ir al Inicio', 'index.html', null, 'bi-house-fill');
    setQuickAction(2, 'Contactar Admin', 'Solicitar los permisos necesarios.', 'Ver Inicio', 'index.html', null, 'bi-person-gear');
    setQuickAction(3, 'Cerrar Sesión', 'Salir del sistema.', 'Cerrar Sesión', '#', e => { e.preventDefault(); logout(); }, 'bi-box-arrow-right');
    setWorkflow('Acceso Básico', [
        'Autenticación de usuario completada.',
        'Rol no reconocido por el sistema.',
        'Contacta al administrador para asignar el rol correcto.'
    ]);
}

function configurarFormularioSolicitud() {
    const form = document.getElementById('solicitudServicioForm');
    if (!form) return;
    form.addEventListener('submit', enviarSolicitudServicioCliente);
}

async function abrirModalSolicitudServicio() {
    const sel = document.getElementById('solServicio');
    sel.innerHTML = '<option value="">- Cargando planes -</option>';
    const res = await apiCall('/servicios/activos/todos');
    if (res?.ok && Array.isArray(res.data)) {
        const activos = res.data.filter(s => s.activo !== false);
        sel.innerHTML = '<option value="">- Selecciona un plan -</option>' +
            activos.map(s => `<option value="${s.id}">${s.nombre} - $${Number(s.precioMensual || 0).toLocaleString('es-CO')}/mes</option>`).join('');
    } else {
        sel.innerHTML = '<option value="">No se pudieron cargar planes</option>';
    }
    new bootstrap.Modal(document.getElementById('modalSolicitudServicio')).show();
}

async function enviarSolicitudServicioCliente(e) {
    e.preventDefault();
    const payload = {
        servicioId: document.getElementById('solServicio').value,
        metodoPago: document.getElementById('solMetodoPago').value,
        observaciones: document.getElementById('solObservaciones').value.trim()
    };
    if (!payload.servicioId) {
        mostrarNotificacion('Debes seleccionar un plan de internet', 'warning');
        return;
    }

    const res = await apiCall('/suscripciones/solicitar', 'POST', payload);
    if (res?.ok) {
        bootstrap.Modal.getInstance(document.getElementById('modalSolicitudServicio')).hide();
        document.getElementById('solicitudServicioForm').reset();
        mostrarNotificacion('Solicitud enviada. Nuestro equipo te contactará para la instalación.', 'success');
        await cargarDashboardCliente();
    } else {
        mostrarNotificacion(res?.data?.message || 'No se pudo enviar la solicitud', 'danger');
    }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    let container = document.getElementById('mainToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mainToastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${tipo} border-0`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${mensaje}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
    container.appendChild(toast);
    const instance = new bootstrap.Toast(toast, { delay: 3200 });
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
    instance.show();
}

const dashboardCharts = {};

function renderDashboardChartsLegacy(role) {
    const row = document.getElementById('dashboardChartsRow');
    if (!row || typeof Chart === 'undefined') return;
    row.style.display = '';

    const labelsSprint = ['S1', 'S2', 'S3', 'S4', 'S5'];
    const labelsMes = ['Ene', 'Feb', 'Mar', 'Abr', 'May'];
    const labelsSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const configs = {
        ADMIN: [
            lineChart('Clientes y suscripciones ISP', labelsSprint, [
                ds('Puntos reales', [120, 98, 72, 43, 18], '#168dff'),
                ds('Línea ideal', [120, 90, 60, 30, 0], '#94a3b8')
            ]),
            lineChart('Facturacion y recaudo', labelsSprint, [
                ds('Trabajo completado', [18, 42, 68, 91, 112], '#00a878'),
                ds('Alcance total', [120, 120, 120, 120, 120], '#f5a400')
            ]),
            barChart('Ordenes finalizadas y pendientes', labelsSprint, [
                ds('Finalizadas', [12, 18, 21, 25, 29], '#00a878'),
                ds('No finalizadas', [6, 5, 4, 3, 2], '#dc3545'),
                ds('En proceso', [8, 9, 7, 6, 4], '#168dff')
            ]),
            barChart('Número de UT por Tipo', ['Instalación', 'Mantenimiento', 'Soporte', 'Retiro'], [
                ds('Órdenes', [34, 18, 27, 6], '#00c2ff')
            ])
        ],
        JEFE_CUADRILLA: [
            lineChart('Ordenes tecnicas pendientes', labelsSprint, [
                ds('Pendientes reales', [48, 41, 33, 18, 7], '#168dff'),
                ds('Línea ideal', [48, 36, 24, 12, 0], '#94a3b8')
            ]),
            lineChart('Instalaciones completadas', labelsSprint, [
                ds('Cierres acumulados', [5, 13, 25, 36, 45], '#00a878'),
                ds('Alcance semanal', [48, 48, 48, 48, 48], '#f5a400')
            ]),
            barChart('Ordenes finalizadas y pendientes', labelsSprint, [
                ds('Finalizadas', [5, 8, 12, 11, 9], '#00a878'),
                ds('No finalizadas', [3, 2, 4, 2, 1], '#dc3545'),
                ds('En proceso', [7, 5, 6, 4, 3], '#168dff')
            ]),
            barChart('Número de UT por Tipo', ['Instalación', 'Mantenimiento', 'Soporte', 'Retiro'], [
                ds('Órdenes', [22, 11, 16, 3], '#00c2ff')
            ])
        ],
        CONTABLE: [
            lineChart('Ingresos del Mes', labelsMes, [ds('Ingresos', [8.5, 9.2, 9.9, 10.4, 11.1], '#00a878')]),
            barChart('Cartera por Estado', ['Al día', '1-15 días', '16-30 días', '+30 días'], [ds('Millones COP', [18, 5, 3, 2], '#168dff')]),
            barChart('Pagos Recibidos', labelsSemana, [ds('Pagos', [9, 12, 8, 14, 16, 7], '#00c2ff')]),
            barChart('Métodos de Pago', ['Efectivo', 'Transferencia', 'PSE', 'Tarjeta'], [ds('Transacciones', [18, 26, 12, 7], '#f5a400')])
        ],
        VENDEDOR: comercialCharts(labelsMes),
        PUNTO_VENTA: comercialCharts(labelsMes),
        JEFE_BODEGA: [
            barChart('Stock Crítico', ['Router', 'ONU', 'Fibra', 'Conector'], [ds('Unidades críticas', [5, 8, 3, 14], '#dc3545')]),
            barChart('Despachos del Día', labelsSemana, [ds('Despachos', [4, 7, 5, 9, 6, 3], '#168dff')]),
            lineChart('Solicitudes Pendientes', labelsSemana, [ds('Pendientes', [8, 7, 9, 6, 5, 4], '#f5a400')]),
            barChart('Entradas de Mercancía', ['Equipos', 'Cable', 'Herramientas', 'Accesorios'], [ds('Entradas', [12, 30, 6, 22], '#00a878')])
        ],
        SOPORTE: [
            barChart('Tickets por Prioridad', ['Baja', 'Media', 'Alta', 'Crítica'], [ds('Tickets', [8, 14, 6, 2], '#168dff')]),
            lineChart('SLA en Riesgo', labelsSemana, [ds('Casos', [2, 3, 5, 4, 2, 1], '#dc3545')]),
            barChart('Canales de Atención', ['Teléfono', 'WhatsApp', 'Web', 'Aliado'], [ds('Tickets', [10, 22, 8, 5], '#00c2ff')]),
            lineChart('Satisfaccion de soporte', labelsSemana, [ds('Satisfaccion', [86, 88, 84, 91, 89, 92], '#00a878')])
        ],
        ADMINISTRATIVO: [
            barChart('Contratos', ['Vigentes', 'Por vencer', 'Vencidos'], [ds('Cantidad', [42, 7, 2], '#168dff')]),
            lineChart('Solicitudes Internas', labelsSemana, [ds('Solicitudes', [4, 5, 3, 7, 4, 2], '#00c2ff')]),
            barChart('Documentos', ['Clientes', 'Contratos', 'Personal', 'Soporte'], [ds('Archivos', [80, 46, 25, 32], '#00a878')]),
            barChart('Vencimientos', ['7 días', '15 días', '30 días'], [ds('Pendientes', [3, 5, 9], '#f5a400')])
        ],
        TECNICO: [
            barChart('Mis Órdenes del Día', ['Asignadas', 'En progreso', 'Completadas'], [ds('Órdenes', [4, 2, 3], '#168dff')]),
            lineChart('Lecturas de Velocidad', labelsSemana, [ds('Mbps promedio', [92, 88, 95, 90, 97, 94], '#00a878')]),
            barChart('Material Solicitado', ['Cable', 'Conectores', 'ONU', 'Router'], [ds('Unidades', [30, 12, 2, 1], '#00c2ff')]),
            lineChart('Cierres Semanales', labelsSemana, [ds('Cierres', [2, 3, 1, 4, 3, 2], '#f5a400')])
        ],
        CLIENTE: [
            lineChart('Velocidad del Servicio', labelsSemana, [ds('Mbps', [48, 51, 49, 52, 50, 53], '#168dff')]),
            barChart('Facturas', ['Pagadas', 'Pendientes'], [ds('Cantidad', [4, 1], '#00a878')]),
            lineChart('Consumo Estimado', labelsSemana, [ds('GB', [12, 18, 15, 20, 22, 16], '#00c2ff')]),
            barChart('Tickets', ['Abiertos', 'Cerrados'], [ds('Cantidad', [1, 5], '#f5a400')])
        ]
    };

    (configs[role] || configs.ADMIN).forEach((config, index) => {
        document.getElementById(`chart${index + 1}Title`).textContent = config.title;
        drawChart(`chart${index + 1}`, config);
    });
}

function comercialCharts(labelsMes) {
    return [
        barChart('Ventas del Mes', labelsMes, [ds('Ventas', [8, 12, 10, 15, 17], '#168dff')]),
        lineChart('Contratos Pendientes', labelsMes, [ds('Pendientes', [6, 5, 7, 4, 3], '#f5a400')]),
        barChart('Planes Vendidos', ['50 Mbps', '100 Mbps', '200 Mbps', 'Empresarial'], [ds('Contratos', [12, 18, 9, 4], '#00c2ff')]),
        lineChart('Recaudo comercial', labelsMes, [ds('Millones COP', [1.2, 1.5, 1.4, 1.8, 2.1], '#00a878')])
    ];
}

function ds(label, data, color) {
    return {
        label,
        data,
        borderColor: color,
        backgroundColor: withAlpha(color, 0.18),
        borderWidth: 2,
        tension: 0.35,
        fill: false
    };
}

function lineChart(title, labels, datasets) {
    return { title, type: 'line', labels, datasets };
}

function barChart(title, labels, datasets) {
    return { title, type: 'bar', labels, datasets };
}

function drawChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (dashboardCharts[canvasId]) dashboardCharts[canvasId].destroy();

    dashboardCharts[canvasId] = new Chart(canvas, {
        type: config.type,
        data: {
            labels: config.labels,
            datasets: config.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { boxWidth: 12, color: '#334155' } }
            },
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(100,116,139,0.12)' } },
                y: { beginAtZero: true, ticks: { color: '#64748b' }, grid: { color: 'rgba(100,116,139,0.12)' } }
            }
        }
    });
}

function withAlpha(hex, alpha) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Dashboard ISP real: reemplaza las graficas genericas por metricas de operacion.
async function renderDashboardCharts(role) {
    const row = document.getElementById('dashboardChartsRow');
    if (!row || typeof Chart === 'undefined') return;
    row.style.display = '';

    const data = normalizarDatosGraficas(await cargarDatosGraficasISP(role));
    const configs = construirGraficasISP(role, data);

    configs.forEach((config, index) => {
        const title = document.getElementById(`chart${index + 1}Title`);
        if (title) title.textContent = config.title;
        drawChart(`chart${index + 1}`, config);
    });
}

async function cargarDatosGraficasISP(role) {
    const user = getUserData();
    const necesitaCampo = hasRole('ADMIN', 'JEFE_CUADRILLA', 'TECNICO');
    const necesitaBodega = hasRole('ADMIN', 'JEFE_BODEGA', 'JEFE_CUADRILLA', 'TECNICO');
    const necesitaFacturas = hasRole('ADMIN', 'CONTABLE', 'VENDEDOR', 'PUNTO_VENTA', 'ADMINISTRATIVO', 'CLIENTE');

    const requests = [
        ['clientes', apiCall('/clientes')],
        ['suscripciones', apiCall(role === 'CLIENTE' ? '/suscripciones/mias' : '/suscripciones')],
        ['tickets', apiCall('/tickets')],
        ['ordenes', necesitaCampo ? apiCall(role === 'TECNICO' && user?.id ? `/ordenes/tecnico/${user.id}` : '/ordenes') : Promise.resolve(null)],
        ['facturas', necesitaFacturas ? apiCall(role === 'CLIENTE' ? '/facturas/mi-estado' : '/facturas') : Promise.resolve(null)],
        ['inventario', necesitaBodega ? apiCall('/inventario') : Promise.resolve(null)],
        ['stockBajo', necesitaBodega ? apiCall('/inventario/stock-bajo') : Promise.resolve(null)],
        ['solicitudesMaterial', necesitaBodega ? apiCall(role === 'TECNICO' && user?.id ? `/solicitudes-material/tecnico/${user.id}` : '/solicitudes-material') : Promise.resolve(null)]
    ];

    const result = {};
    const responses = await Promise.all(requests.map(([key, promise]) =>
        promise.then(res => [key, res]).catch(() => [key, null])
    ));

    responses.forEach(([key, res]) => {
        result[key] = res?.ok ? res.data : [];
    });

    if (role === 'CLIENTE' && user?.id) {
        const clienteRes = await apiCall(`/clientes/usuario/${user.id}`);
        const clientesUsuario = clienteRes?.ok && Array.isArray(clienteRes.data) ? clienteRes.data : [];
        const clienteIds = clientesUsuario.map(c => c.id);
        result.clientes = clientesUsuario;
        result.tickets = Array.isArray(result.tickets)
            ? result.tickets.filter(t => clienteIds.includes(t.clienteId))
            : [];
    }

    return result;
}

function normalizarDatosGraficas(data) {
    return {
        clientes: asArray(data.clientes),
        suscripciones: asArray(data.suscripciones),
        tickets: asArray(data.tickets),
        ordenes: asArray(data.ordenes),
        facturas: Array.isArray(data.facturas) ? data.facturas : [],
        facturacionCliente: !Array.isArray(data.facturas) && data.facturas ? data.facturas : {},
        inventario: asArray(data.inventario),
        stockBajo: asArray(data.stockBajo),
        solicitudesMaterial: asArray(data.solicitudesMaterial)
    };
}

function construirGraficasISP(role, data) {
    if (role === 'CONTABLE') return graficasContables(data);
    if (role === 'VENDEDOR' || role === 'PUNTO_VENTA') return graficasComerciales(data);
    if (role === 'JEFE_BODEGA') return graficasBodega(data);
    if (role === 'SOPORTE') return graficasSoporte(data);
    if (role === 'JEFE_CUADRILLA') return graficasCuadrilla(data);
    if (role === 'TECNICO') return graficasTecnico(data);
    if (role === 'CLIENTE') return graficasCliente(data);
    if (role === 'ADMINISTRATIVO') return graficasAdministrativas(data);
    return graficasAdmin(data);
}

function graficasAdmin(data) {
    const cartera = resumenFacturacion(data.facturas);
    return [
        barChartISP('Clientes y suscripciones ISP', ['Clientes', 'Suscripciones activas', 'Sin servicio', 'Canceladas'], [
            ds('Cantidad', [data.clientes.length, contar(data.suscripciones, 'estado', 'ACTIVA'), clientesSinServicio(data), contar(data.suscripciones, 'estado', 'CANCELADA')], '#168dff')
        ]),
        barChartISP('Facturacion y recaudo', ['Recaudado', 'Pendiente'], [
            ds('COP', [cartera.recaudado, cartera.pendiente], '#00a878')
        ], true),
        barChartISP('Soporte tecnico', ['Abiertos', 'En proceso', 'Resueltos', 'Criticos'], [
            ds('Tickets', [ticketsAbiertos(data.tickets), contar(data.tickets, 'estado', 'EN_PROCESO'), ticketsCerrados(data.tickets), contar(data.tickets, 'prioridad', 'CRITICA')], '#00c2ff')
        ]),
        barChartISP('Operacion de campo ISP', ['Pendientes', 'Asignadas', 'En progreso', 'Completadas', 'Retiros'], [
            ds('Ordenes', [contar(data.ordenes, 'estado', 'PENDIENTE'), contar(data.ordenes, 'estado', 'ASIGNADA'), contar(data.ordenes, 'estado', 'EN_PROGRESO'), contar(data.ordenes, 'estado', 'COMPLETADA'), contar(data.ordenes, 'tipo', 'RETIRO')], '#f5a400')
        ])
    ];
}

function graficasContables(data) {
    const cartera = resumenFacturacion(data.facturas);
    const metodos = labelsValues(contarCampo(data.facturas, 'metodoPago', ['EFECTIVO', 'TRANSFERENCIA', 'PSE', 'TARJETA']));
    return [
        barChartISP('Recaudo vs cartera pendiente', ['Recaudado', 'Pendiente'], [ds('COP', [cartera.recaudado, cartera.pendiente], '#00a878')], true),
        barChartISP('Facturas por estado', ['Pagadas', 'Pendientes', 'Vencidas'], [ds('Facturas', [cartera.pagadas, cartera.pendientes, cartera.vencidas], '#168dff')]),
        barChartISP('Metodos de pago', metodos.labels, [ds('Pagos', metodos.values, '#00c2ff')]),
        barChartISP('Vencimientos de cartera', ['Al dia', 'Vencen pronto', 'Vencidas'], [ds('Facturas', [cartera.alDia, cartera.vencenPronto, cartera.vencidas], '#f5a400')])
    ];
}

function graficasComerciales(data) {
    const planes = topCampoISP(data.suscripciones, 'nombreServicio', 5);
    const estados = labelsValues(contarCampo(data.suscripciones, 'estado', ['ACTIVA', 'PENDIENTE', 'CANCELADA', 'SUSPENDIDA']));
    return [
        barChartISP('Cartera comercial ISP', ['Clientes', 'Suscripciones', 'Pendientes pago'], [
            ds('Cantidad', [data.clientes.length, data.suscripciones.length, data.facturas.filter(f => !esPagada(f)).length], '#168dff')
        ]),
        barChartISP('Planes vendidos', planes.labels, [ds('Suscripciones', planes.values, '#00c2ff')]),
        barChartISP('Estado de contratos', estados.labels, [ds('Contratos', estados.values, '#00a878')]),
        barChartISP('Facturas de clientes', ['Pagadas', 'Pendientes'], [
            ds('Facturas', [data.facturas.filter(esPagada).length, data.facturas.filter(f => !esPagada(f)).length], '#f5a400')
        ])
    ];
}

function graficasSoporte(data) {
    const estados = labelsValues(contarCampo(data.tickets, 'estado', ['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO']));
    const prioridades = labelsValues(contarCampo(data.tickets, 'prioridad', ['BAJA', 'MEDIA', 'ALTA', 'CRITICA']));
    const categorias = topCampoISP(data.tickets, 'categoria', 5);
    const conTicket = clientesConTicketAbierto(data);
    return [
        barChartISP('Tickets por estado', estados.labels, [ds('Tickets', estados.values, '#168dff')]),
        barChartISP('Tickets por prioridad', prioridades.labels, [ds('Tickets', prioridades.values, '#dc3545')]),
        barChartISP('Tipo de incidencia', categorias.labels, [ds('Casos', categorias.values, '#00c2ff')]),
        barChartISP('Clientes afectados', ['Con ticket abierto', 'Sin ticket abierto'], [
            ds('Clientes', [conTicket, Math.max(data.clientes.length - conTicket, 0)], '#00a878')
        ])
    ];
}

function graficasBodega(data) {
    const categorias = topCampoISP(data.inventario, 'categoria', 6, 'cantidad');
    const solicitudes = labelsValues(contarCampo(data.solicitudesMaterial, 'estado', ['PENDIENTE', 'APROBADA', 'DESPACHADA', 'RECHAZADA']));
    const valorInventario = data.inventario.reduce((sum, item) => sum + Number(item.cantidad || 0) * Number(item.precioUnitario || 0), 0);
    return [
        barChartISP('Inventario por categoria', categorias.labels, [ds('Unidades', categorias.values, '#168dff')]),
        barChartISP('Alertas de stock', ['Items en minimo', 'Items disponibles'], [
            ds('Items', [data.stockBajo.length, Math.max(data.inventario.length - data.stockBajo.length, 0)], '#dc3545')
        ]),
        barChartISP('Solicitudes de material', solicitudes.labels, [ds('Solicitudes', solicitudes.values, '#f5a400')]),
        barChartISP('Valor estimado de bodega', ['Inventario'], [ds('COP', [valorInventario], '#00a878')], true)
    ];
}

function graficasCuadrilla(data) {
    const estados = labelsValues(contarCampo(data.ordenes, 'estado', ['PENDIENTE', 'ASIGNADA', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA']));
    const tipos = labelsValues(contarCampo(data.ordenes, 'tipo', ['INSTALACION', 'MANTENIMIENTO', 'AVERIA', 'RETIRO', 'TRASLADO']));
    const tecnicos = topCampoISP(data.ordenes, 'tecnicoId', 6);
    return [
        barChartISP('Ordenes por estado', estados.labels, [ds('Ordenes', estados.values, '#168dff')]),
        barChartISP('Ordenes por tipo ISP', tipos.labels, [ds('Ordenes', tipos.values, '#00c2ff')]),
        barChartISP('Desinstalaciones y retiros', ['Retiros', 'Canceladas', 'Completadas'], [
            ds('Ordenes', [contar(data.ordenes, 'tipo', 'RETIRO'), contar(data.ordenes, 'estado', 'CANCELADA'), contar(data.ordenes, 'estado', 'COMPLETADA')], '#dc3545')
        ]),
        barChartISP('Carga por tecnico', tecnicos.labels, [ds('Ordenes', tecnicos.values, '#00a878')])
    ];
}

function graficasTecnico(data) {
    const estados = labelsValues(contarCampo(data.ordenes, 'estado', ['ASIGNADA', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA']));
    const tipos = labelsValues(contarCampo(data.ordenes, 'tipo', ['INSTALACION', 'MANTENIMIENTO', 'AVERIA', 'RETIRO', 'TRASLADO']));
    const solicitudes = labelsValues(contarCampo(data.solicitudesMaterial, 'estado', ['PENDIENTE', 'APROBADA', 'DESPACHADA']));
    return [
        barChartISP('Mis ordenes', estados.labels, [ds('Ordenes', estados.values, '#168dff')]),
        barChartISP('Tipo de trabajo asignado', tipos.labels, [ds('Ordenes', tipos.values, '#00c2ff')]),
        barChartISP('Fases de trabajo', ['Pendientes', 'En progreso', 'Completadas'], [ds('Fases', resumenFases(data.ordenes), '#f5a400')]),
        barChartISP('Solicitudes de material', solicitudes.labels, [ds('Solicitudes', solicitudes.values, '#00a878')])
    ];
}

function graficasCliente(data) {
    const planes = topCampoISP(data.suscripciones, 'nombreServicio', 4);
    return [
        barChartISP('Mis servicios ISP', ['Suscripciones', 'Activas', 'Pendientes'], [
            ds('Cantidad', [data.suscripciones.length, contar(data.suscripciones, 'estado', 'ACTIVA'), contar(data.suscripciones, 'estado', 'PENDIENTE')], '#168dff')
        ]),
        barChartISP('Mi estado de cuenta', ['Pendiente por pagar'], [
            ds('COP', [Number(data.facturacionCliente.totalPendiente || 0)], '#f5a400')
        ], true),
        barChartISP('Mis tickets de soporte', ['Abiertos', 'Cerrados'], [
            ds('Tickets', [ticketsAbiertos(data.tickets), ticketsCerrados(data.tickets)], '#00c2ff')
        ]),
        barChartISP('Planes contratados', planes.labels, [ds('Servicios', planes.values, '#00a878')])
    ];
}

function graficasAdministrativas(data) {
    const estados = labelsValues(contarCampo(data.suscripciones, 'estado', ['ACTIVA', 'PENDIENTE', 'CANCELADA', 'SUSPENDIDA']));
    return [
        barChartISP('Clientes registrados', ['Activos', 'Inactivos'], [
            ds('Clientes', [data.clientes.filter(c => c.activo !== false).length, data.clientes.filter(c => c.activo === false).length], '#168dff')
        ]),
        barChartISP('Contratos por estado', estados.labels, [ds('Contratos', estados.values, '#00c2ff')]),
        barChartISP('Soporte documental', ['Tickets abiertos', 'Tickets cerrados'], [
            ds('Tickets', [ticketsAbiertos(data.tickets), ticketsCerrados(data.tickets)], '#f5a400')
        ]),
        barChartISP('Facturacion general', ['Pagadas', 'Pendientes'], [
            ds('Facturas', [data.facturas.filter(esPagada).length, data.facturas.filter(f => !esPagada(f)).length], '#00a878')
        ])
    ];
}

function barChartISP(title, labels, datasets, money = false) {
    return {
        title,
        type: 'bar',
        labels: labels && labels.length ? labels : ['Sin datos'],
        datasets: datasets.map(dataset => ({
            ...dataset,
            data: dataset.data && dataset.data.length ? dataset.data : [0]
        })),
        money
    };
}

function drawChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (dashboardCharts[canvasId]) dashboardCharts[canvasId].destroy();

    dashboardCharts[canvasId] = new Chart(canvas, {
        type: config.type,
        data: {
            labels: config.labels,
            datasets: config.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { boxWidth: 12, color: '#334155' } },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const value = ctx.parsed.y ?? ctx.parsed;
                            return `${ctx.dataset.label}: ${config.money ? formatoCOP(value) : value}`;
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(100,116,139,0.12)' } },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#64748b',
                        callback: value => config.money ? formatoCOP(value) : value
                    },
                    grid: { color: 'rgba(100,116,139,0.12)' }
                }
            }
        }
    });
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizar(value) {
    return String(value || '').trim().toUpperCase();
}

function contar(items, field, expected) {
    const wanted = normalizar(expected);
    return asArray(items).filter(item => normalizar(item[field]) === wanted).length;
}

function contarCampo(items, field, preferred = []) {
    const counts = new Map(preferred.map(key => [key, 0]));
    asArray(items).forEach(item => {
        const key = normalizar(item[field]) || 'SIN_DATO';
        counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
}

function labelsValues(counts) {
    const entries = Array.from(counts.entries());
    return {
        labels: entries.map(([label]) => etiqueta(label)),
        values: entries.map(([, value]) => value)
    };
}

function topCampoISP(items, field, limit = 5, sumField = null) {
    const counts = new Map();
    asArray(items).forEach(item => {
        const key = item[field] || 'Sin dato';
        const value = sumField ? Number(item[sumField] || 0) : 1;
        counts.set(key, (counts.get(key) || 0) + value);
    });
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
    return {
        labels: entries.length ? entries.map(([label]) => etiqueta(label)) : ['Sin datos'],
        values: entries.length ? entries.map(([, value]) => value) : [0]
    };
}

function resumenFacturacion(facturas) {
    const hoy = new Date();
    return asArray(facturas).reduce((acc, factura) => {
        const total = Number(factura.total || 0);
        const vencimiento = factura.fechaVencimiento ? new Date(factura.fechaVencimiento) : null;
        if (esPagada(factura)) {
            acc.pagadas += 1;
            acc.recaudado += total;
            return acc;
        }
        acc.pendientes += 1;
        acc.pendiente += total;
        if (vencimiento && vencimiento < hoy) acc.vencidas += 1;
        else if (vencimiento && diasEntre(hoy, vencimiento) <= 7) acc.vencenPronto += 1;
        else acc.alDia += 1;
        return acc;
    }, { pagadas: 0, pendientes: 0, vencidas: 0, vencenPronto: 0, alDia: 0, recaudado: 0, pendiente: 0 });
}

function esPagada(factura) {
    return factura?.pagada === true || normalizar(factura?.estado) === 'PAGADA';
}

function ticketsAbiertos(tickets) {
    return asArray(tickets).filter(t => t.abierto !== false && !['RESUELTO', 'CERRADO'].includes(normalizar(t.estado))).length;
}

function ticketsCerrados(tickets) {
    return asArray(tickets).filter(t => t.abierto === false || ['RESUELTO', 'CERRADO'].includes(normalizar(t.estado))).length;
}

function clientesSinServicio(data) {
    const conServicio = new Set(data.suscripciones.map(s => s.clienteId).filter(Boolean));
    return data.clientes.filter(c => !conServicio.has(c.id)).length;
}

function clientesConTicketAbierto(data) {
    return new Set(data.tickets
        .filter(t => !['RESUELTO', 'CERRADO'].includes(normalizar(t.estado)))
        .map(t => t.clienteId)
        .filter(Boolean)).size;
}

function resumenFases(ordenes) {
    const counts = { PENDIENTE: 0, EN_PROGRESO: 0, COMPLETADA: 0 };
    asArray(ordenes).forEach(orden => asArray(orden.fases).forEach(fase => {
        const estado = normalizar(fase.estado);
        if (counts[estado] !== undefined) counts[estado] += 1;
    }));
    return [counts.PENDIENTE, counts.EN_PROGRESO, counts.COMPLETADA];
}

function diasEntre(desde, hasta) {
    return Math.ceil((hasta.getTime() - desde.getTime()) / 86400000);
}

function formatoCOP(value) {
    return Number(value || 0).toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });
}

function etiqueta(value) {
    return String(value || 'Sin dato')
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
}
