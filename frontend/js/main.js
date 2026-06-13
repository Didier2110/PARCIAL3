// Script principal
document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
    cargarDatos();
});

async function cargarDatos() {
    // Cargar clientes
    const clientesResponse = await apiCall('/clientes');
    if (clientesResponse.ok) {
        const clientes = clientesResponse.data.filter(c => c.activo);
        document.getElementById('clientesCount').textContent = clientes.length;
    }

    // Cargar suscripciones
    const suscripcionesResponse = await apiCall('/suscripciones/activas/todas');
    if (suscripcionesResponse.ok) {
        document.getElementById('suscripcionesCount').textContent = suscripcionesResponse.data.length;
    }

    // Cargar facturas pendientes
    const facturasResponse = await apiCall('/facturas/pendientes/todas');
    if (facturasResponse.ok) {
        document.getElementById('facturasCount').textContent = facturasResponse.data.length;
    }

    // Cargar tickets abiertos
    const ticketsResponse = await apiCall('/tickets/abiertos/todos');
    if (ticketsResponse.ok) {
        document.getElementById('ticketsCount').textContent = ticketsResponse.data.length;
    }
}
