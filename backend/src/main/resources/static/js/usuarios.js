// usuarios.js — Gestión de usuarios (solo ADMIN)
document.addEventListener('DOMContentLoaded', function () {
    requireAdminAuth();
    setupNavbar();
    cargarUsuarios();

    // ====== Formulario nuevo usuario ======
    document.getElementById('nuevoUsuarioForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const btnText = document.getElementById('btnGuardarText');
        const btnSpinner = document.getElementById('btnGuardarSpinner');
        btnText.textContent = 'Guardando...';
        btnSpinner.classList.remove('d-none');

        const payload = {
            nombre:     document.getElementById('uNombre').value.trim(),
            apellido:   document.getElementById('uApellido').value.trim(),
            email:      document.getElementById('uEmail').value.trim(),
            contrasena: document.getElementById('uContrasena').value,
            rol:        document.getElementById('uRol').value,
            telefono:   document.getElementById('uTelefono').value.trim(),
            empresa:    'Innovation Telecomunicaciones S.A.S.',
            documento:  document.getElementById('uDocumento').value.trim()
        };

        const res = await apiCall('/usuarios', 'POST', payload);
        btnText.textContent = 'Guardar';
        btnSpinner.classList.add('d-none');

        if (res && res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoUsuario')).hide();
            document.getElementById('nuevoUsuarioForm').reset();
            mostrarToast('Usuario creado exitosamente', 'success');
            cargarUsuarios();
        } else {
            const msg = res?.data?.message || 'Error al crear el usuario';
            mostrarAlertaModal('alertaNuevoUsuario', msg);
        }
    });

    // ====== Formulario editar usuario ======
    document.getElementById('editarUsuarioForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const id = document.getElementById('eId').value;
        const payload = {
            nombre:   document.getElementById('eNombre').value.trim(),
            apellido: document.getElementById('eApellido').value.trim(),
            telefono: document.getElementById('eTelefono').value.trim(),
            empresa:  'Innovation Telecomunicaciones S.A.S.'
        };

        const nuevoRol = document.getElementById('eRol').value;

        // Primero actualizamos datos básicos
        const resData = await apiCall(`/usuarios/${id}`, 'PUT', payload);
        if (!resData || !resData.ok) {
            mostrarAlertaModal('alertaEditarUsuario', resData?.data?.message || 'Error al actualizar datos');
            return;
        }

        // Luego actualizamos el rol
        const resRol = await apiCall(`/usuarios/${id}/rol`, 'PUT', { rol: nuevoRol });
        if (!resRol || !resRol.ok) {
            mostrarAlertaModal('alertaEditarUsuario', resRol?.data?.message || 'Error al cambiar el rol');
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario')).hide();
        mostrarToast('Usuario actualizado exitosamente', 'success');
        cargarUsuarios();
    });

    document.getElementById('cambiarContrasenaForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const id = document.getElementById('pId').value;
        const contrasena = document.getElementById('pContrasena').value;
        const confirmar = document.getElementById('pConfirmarContrasena').value;

        if (contrasena.length < 6) {
            mostrarAlertaModal('alertaContrasena', 'La contraseña debe tener mínimo 6 caracteres');
            return;
        }
        if (contrasena !== confirmar) {
            mostrarAlertaModal('alertaContrasena', 'Las contraseñas no coinciden');
            return;
        }

        const res = await apiCall(`/usuarios/${id}/contrasena`, 'PUT', { contrasena });
        if (res && res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalCambiarContrasena')).hide();
            document.getElementById('cambiarContrasenaForm').reset();
            mostrarToast('Contraseña actualizada exitosamente', 'success');
        } else {
            mostrarAlertaModal('alertaContrasena', res?.data?.message || 'Error al cambiar la contraseña');
        }
    });
});

// ====== Cargar tabla ======
async function cargarUsuarios() {
    const tbody = document.getElementById('tablaUsuarios');
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">
        <div class="spinner-border text-purple" role="status"></div></td></tr>`;

    const res = await apiCall('/usuarios', 'GET');
    if (!res || !res.ok) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar usuarios</td></tr>`;
        return;
    }

    const usuarios = res.data;
    document.getElementById('totalUsuarios').textContent = usuarios.length;
    document.getElementById('totalAdmins').textContent = usuarios.filter(u => u.rol === 'ADMIN').length;
    document.getElementById('totalActivos').textContent = usuarios.filter(u => u.activo).length;

    if (usuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay usuarios registrados</td></tr>`;
        return;
    }

    tbody.innerHTML = usuarios.map(u => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="avatar-circle">${(u.nombre || '?')[0].toUpperCase()}</div>
                    <div>
                        <div class="fw-semibold">${u.nombre || ''} ${u.apellido || ''}</div>
                        <small class="text-muted">${u.empresa || ''}</small>
                    </div>
                </div>
            </td>
            <td>${u.email}</td>
            <td>${badgeRol(u.rol)}</td>
            <td>${badgeEstado(u.activo)}</td>
            <td>${u.telefono || '<span class="text-muted">—</span>'}</td>
            <td>${fechaCorta(u.fechaCreacion)}</td>
            <td>
                <button class="btn btn-sm btn-outline-purple me-1" onclick="abrirEditar('${u.id}')" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary me-1"
                    onclick="abrirCambiarContrasena('${u.id}')"
                    title="Cambiar contraseña">
                    <i class="bi bi-key"></i>
                </button>
                <button class="btn btn-sm ${u.activo ? 'btn-outline-warning' : 'btn-outline-success'} me-1"
                    onclick="toggleEstado('${u.id}', ${u.activo})"
                    title="${u.activo ? 'Desactivar' : 'Activar'}">
                    <i class="bi bi-${u.activo ? 'person-x' : 'person-check'}"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger"
                    onclick="eliminarUsuario('${u.id}', '${u.nombre} ${u.apellido}')" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`).join('');
}

async function abrirCambiarContrasena(id) {
    const res = await apiCall(`/usuarios/${id}`, 'GET');
    if (!res || !res.ok) {
        mostrarToast('No se pudo cargar el usuario', 'danger');
        return;
    }
    const usuario = res.data;
    const nombre = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Usuario';
    document.getElementById('pId').value = id;
    document.getElementById('pUsuario').value = `${nombre} (${usuario.email || ''})`;
    document.getElementById('pContrasena').value = '';
    document.getElementById('pConfirmarContrasena').value = '';
    document.getElementById('alertaContrasena').style.display = 'none';
    new bootstrap.Modal(document.getElementById('modalCambiarContrasena')).show();
}

// ====== Abrir modal editar ======
async function abrirEditar(id) {
    const res = await apiCall(`/usuarios/${id}`, 'GET');
    if (!res || !res.ok) { mostrarToast('No se pudo cargar el usuario', 'danger'); return; }

    const u = res.data;
    document.getElementById('eId').value       = u.id;
    document.getElementById('eNombre').value   = u.nombre || '';
    document.getElementById('eApellido').value = u.apellido || '';
    document.getElementById('eEmail').value    = u.email || '';
    document.getElementById('eRol').value      = u.rol || 'CLIENTE';
    document.getElementById('eTelefono').value = u.telefono || '';
    document.getElementById('alertaEditarUsuario').style.display = 'none';

    new bootstrap.Modal(document.getElementById('modalEditarUsuario')).show();
}

// ====== Toggle activo/inactivo ======
async function toggleEstado(id, activo) {
    const accion = activo ? 'desactivar' : 'activar';
    if (!confirm(`Â¿Seguro que deseas ${accion} este usuario?`)) return;

    const res = await apiCall(`/usuarios/${id}/${accion}`, 'PUT');
    if (res && res.ok) {
        mostrarToast(`Usuario ${accion === 'desactivar' ? 'desactivado' : 'activado'} exitosamente`, 'success');
        cargarUsuarios();
    } else {
        mostrarToast('Error al cambiar el estado del usuario', 'danger');
    }
}

// ====== Eliminar usuario ======
async function eliminarUsuario(id, nombre) {
    if (!confirm(`Â¿Eliminar permanentemente a "${nombre}"? Esta acción no se puede deshacer.`)) return;

    const res = await apiCall(`/usuarios/${id}`, 'DELETE');
    if (res && res.ok) {
        mostrarToast('Usuario eliminado permanentemente', 'success');
        cargarUsuarios();
    } else {
        mostrarToast(res?.data?.message || 'Error al eliminar el usuario', 'danger');
    }
}

// ====== Helpers visuales ======
function badgeRol(rol) {
    const map = {
        'ADMIN':          '<span class="badge badge-admin">ADMIN</span>',
        'CONTABLE':       '<span class="badge" style="background:#6D4C41;color:#fff">CONTABLE</span>',
        'VENDEDOR':       '<span class="badge" style="background:#3DC947;color:#fff">VENDEDOR</span>',
        'PUNTO_VENTA':    '<span class="badge" style="background:#7E57C2;color:#fff">PUNTO VENTA</span>',
        'JEFE_BODEGA':    '<span class="badge" style="background:#FFA726;color:#fff">JEFE BODEGA</span>',
        'JEFE_CUADRILLA': '<span class="badge" style="background:#0288D1;color:#fff">JEFE CUADRILLA</span>',
        'TECNICO':        '<span class="badge" style="background:#26A69A;color:#fff">T\u00c9CNICO</span>',
        'ADMINISTRATIVO': '<span class="badge" style="background:#546E7A;color:#fff">ADMINISTRATIVO</span>',
        'SOPORTE':        '<span class="badge" style="background:#D81B60;color:#fff">SOPORTE</span>',
        'CLIENTE':        '<span class="badge" style="background:#9166CC;color:#fff">CLIENTE</span>'
    };
    return map[rol] || `<span class="badge badge-user">${rol || 'CLIENTE'}</span>`;
}

function badgeEstado(activo) {
    return activo
        ? '<span class="badge badge-activo">Activo</span>'
        : '<span class="badge badge-inactivo">Inactivo</span>';
}

function fechaCorta(fecha) {
    if (!fecha) return '<span class="text-muted">—</span>';
    try { return new Date(fecha).toLocaleDateString('es-CO'); } catch { return fecha; }
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
