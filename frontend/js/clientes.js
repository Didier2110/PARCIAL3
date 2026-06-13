// Script para gestión de clientes
document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
    cargarClientes();

    const nuevoClienteForm = document.getElementById('nuevoClienteForm');
    if (nuevoClienteForm) {
        nuevoClienteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const cliente = {
                razonSocial: document.getElementById('razonSocial').value,
                documento: document.getElementById('documento').value,
                tipoDocumento: 'NIT',
                email: document.getElementById('email').value,
                telefono: document.getElementById('telefono').value,
                ciudad: document.getElementById('ciudad').value,
                departamento: 'Departamento',
                codigoPostal: '00000'
            };

            const response = await apiCall('/clientes', 'POST', cliente);
            
            if (response.ok) {
                document.getElementById('nuevoClienteForm').reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('nuevoClienteModal'));
                modal.hide();
                cargarClientes();
            } else {
                alert('Error al crear cliente: ' + response.data.message);
            }
        });
    }
});

async function cargarClientes() {
    const response = await apiCall('/clientes');
    
    if (response.ok) {
        const clientes = response.data;
        const tabla = document.getElementById('clientesTable');
        tabla.innerHTML = '';

        clientes.forEach(cliente => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cliente.razonSocial}</td>
                <td>${cliente.documento}</td>
                <td>${cliente.email}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.ciudad}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verCliente('${cliente.id}')">Ver</button>
                    <button class="btn btn-sm btn-warning" onclick="editarCliente('${cliente.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarCliente('${cliente.id}')">Eliminar</button>
                </td>
            `;
            tabla.appendChild(row);
        });
    }
}

async function verCliente(id) {
    const response = await apiCall(`/clientes/${id}`);
    if (response.ok) {
        const cliente = response.data;
        alert(`Cliente: ${cliente.razonSocial}\nEmail: ${cliente.email}\nTeléfono: ${cliente.telefono}`);
    }
}

async function editarCliente(id) {
    alert('Funcionalidad de edición disponible pronto');
}

async function eliminarCliente(id) {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
        const response = await apiCall(`/clientes/${id}`, 'DELETE');
        if (response.ok) {
            alert('Cliente eliminado exitosamente');
            cargarClientes();
        } else {
            alert('Error al eliminar cliente');
        }
    }
}
