// Configuración de la API
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Función para obtener el token del localStorage
function getToken() {
    return localStorage.getItem('authToken');
}

// Función para establecer el token
function setToken(token) {
    localStorage.setItem('authToken', token);
}

// Función para limpiar el token
function clearToken() {
    localStorage.removeItem('authToken');
}

// Función genérica para hacer peticiones a la API
async function apiCall(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method: method,
        headers: headers,
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (response.status === 401) {
            clearToken();
            window.location.href = 'login.html';
            return null;
        }

        const responseData = await response.json();
        return {
            status: response.status,
            ok: response.ok,
            data: responseData
        };
    } catch (error) {
        console.error('API Error:', error);
        return {
            ok: false,
            error: error.message
        };
    }
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    return getToken() !== null;
}

// Función para redirigir si no está autenticado
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// Función para logout
function logout() {
    clearToken();
    window.location.href = 'login.html';
}
