// Script para login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('errorMessage');

            errorDiv.style.display = 'none';

            try {
                const response = await apiCall('/auth/login', 'POST', {
                    email: email,
                    contrasena: password
                });

                if (response && response.ok && response.data.token) {
                    setToken(response.data.token);
                    setUserData({
                        id:     response.data.id,
                        email:  response.data.email,
                        nombre: response.data.nombre,
                        rol:    response.data.rol
                    });
                    window.location.href = '/index.html';
                } else {
                    const msg = (response && response.data && response.data.message)
                        ? response.data.message
                        : 'Credenciales incorrectas';
                    errorDiv.textContent = msg;
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                errorDiv.textContent = 'Error de conexión con el servidor';
                errorDiv.style.display = 'block';
            }
        });
    }
});
