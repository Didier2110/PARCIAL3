// Configuración de la API - usa el mismo origen del servidor automáticamente
const API_BASE_URL = window.location.origin + '/api/v1';

// ===== Token =====
function getToken()          { return localStorage.getItem('authToken'); }
function setToken(token)     { localStorage.setItem('authToken', token); }
function clearToken()        { localStorage.removeItem('authToken'); }

// ===== Datos de sesión (rol, id, nombre) =====
function setUserData(data) {
    localStorage.setItem('userData', JSON.stringify(data));
}
function getUserData() {
    const raw = localStorage.getItem('userData');
    return raw ? JSON.parse(raw) : null;
}
function getUserRole() {
    const d = getUserData();
    return d ? d.rol : null;
}
// ===== Roles =====
function isAdmin()           { return getUserRole() === 'ADMIN'; }
function isVendedor()        { return getUserRole() === 'VENDEDOR'; }
function isContable()        { return getUserRole() === 'CONTABLE'; }
function isPuntoVenta()      { return getUserRole() === 'PUNTO_VENTA'; }
function isJefeBodega()      { return getUserRole() === 'JEFE_BODEGA'; }
function isJefeCuadrilla()   { return getUserRole() === 'JEFE_CUADRILLA'; }
function isTecnico()         { return getUserRole() === 'TECNICO'; }
function isAdministrativo()  { return getUserRole() === 'ADMINISTRATIVO'; }
function isSoporte()         { return getUserRole() === 'SOPORTE'; }
function isCliente()         { return getUserRole() === 'CLIENTE'; }
function hasRole(...roles)   { return roles.includes(getUserRole()); }

// ===== Petición a la API =====
async function apiCall(endpoint, method = 'GET', data = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (response.status === 401) {
            clearToken();
            localStorage.removeItem('userData');
            window.location.href = '/login.html';
            return null;
        }

        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            const text = await response.text();
            responseData = { message: text };
        }
        return { status: response.status, ok: response.ok, data: responseData };
    } catch (error) {
        console.error('API Error:', error);
        return { ok: false, error: error.message };
    }
}

// ===== Guards =====
function isAuthenticated() { return getToken() !== null; }

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

function requireAdminAuth() {
    if (!isAuthenticated()) { window.location.href = '/login.html'; return false; }
    if (!isAdmin())          { window.location.href = '/index.html'; return false; }
    return true;
}

function requireRoleAuth(...roles) {
    if (!isAuthenticated()) { window.location.href = '/login.html'; return false; }
    if (!hasRole(...roles))  { window.location.href = '/index.html'; return false; }
    return true;
}

// ===== Navbar dinámico =====
function setupNavbar() {
    const rol = getUserRole();

    // Clientes: solo roles comerciales/soporte
    document.querySelectorAll('.clientes-only').forEach(el =>
        el.style.display = hasRole('ADMIN','VENDEDOR','PUNTO_VENTA','ADMINISTRATIVO','CONTABLE','SOPORTE') ? '' : 'none');

    // Admin
    document.querySelectorAll('.admin-only').forEach(el =>
        el.style.display = isAdmin() ? '' : 'none');

    // Ventas / Suscripciones / Facturación
    document.querySelectorAll('.vendedor-only').forEach(el =>
        el.style.display = hasRole('ADMIN','VENDEDOR','PUNTO_VENTA','CONTABLE') ? '' : 'none');

    document.querySelectorAll('.contable-only').forEach(el =>
        el.style.display = hasRole('ADMIN','CONTABLE') ? '' : 'none');

    // Tickets: soporte, bodega y admin
    document.querySelectorAll('.soporte-only').forEach(el =>
        el.style.display = hasRole('ADMIN','SOPORTE','JEFE_BODEGA') ? '' : 'none');

    // Inventario: bodega + cuadrilla (elemento puede tener ambas clases)
    document.querySelectorAll('.bodega-only').forEach(el => {
        const esCuadrilla = el.classList.contains('cuadrilla-only');
        const visible = esCuadrilla
            ? hasRole('ADMIN','JEFE_BODEGA','JEFE_CUADRILLA')
            : hasRole('ADMIN','JEFE_BODEGA');
        el.style.display = visible ? '' : 'none';
    });

    // Órdenes: cuadrilla y admin (excluye bodega-only ya procesado arriba)
    document.querySelectorAll('.cuadrilla-only:not(.bodega-only)').forEach(el =>
        el.style.display = hasRole('ADMIN','JEFE_CUADRILLA') ? '' : 'none');

    // Mi Trabajo: solo técnico
    document.querySelectorAll('.tecnico-only').forEach(el =>
        el.style.display = isTecnico() ? '' : 'none');

    // Para CONTABLE, el módulo de ventas se etiqueta como Facturación
    if (isContable() && !isAdmin()) {
        document.querySelectorAll('a[href="ventas.html"]').forEach(el => {
            el.innerHTML = '<i class="bi bi-receipt me-1"></i>Facturación';
        });
    }

    // Nombre de usuario + badge de rol en navbar
    const userData = getUserData();
    const userNameEl = document.getElementById('navUserName');
    if (userNameEl && userData) {
        const rolLabel = ROLE_LABELS[rol] || rol || '';
        userNameEl.innerHTML = `<span class="nav-user-name">${escapeHtml(userData.nombre || userData.email)}</span>`
            + (rolLabel ? ` <span class="nav-role-badge nav-role-${(rol||'').toLowerCase()}">${escapeHtml(rolLabel)}</span>` : '');
    }
}

const ROLE_LABELS = {
    ADMIN: 'Admin',
    VENDEDOR: 'Vendedor',
    PUNTO_VENTA: 'Punto Venta',
    CONTABLE: 'Contable',
    JEFE_BODEGA: 'Jefe Bodega',
    JEFE_CUADRILLA: 'Jefe Cuadrilla',
    TECNICO: 'Técnico',
    ADMINISTRATIVO: 'Administrativo',
    SOPORTE: 'Soporte',
    CLIENTE: 'Cliente'
};

function escapeHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== Logout =====
function logout() {
    clearToken();
    localStorage.removeItem('userData');
    window.location.href = '/login.html';
}
