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
                
                if (response.ok && response.data.token) {
                    setToken(response.data.token);
                    window.location.href = 'index.html';
                } else {
                    errorDiv.textContent = response.data.message || 'Error en el login';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                errorDiv.textContent = 'Error de conexión';
                errorDiv.style.display = 'block';
            }
        });
    }
});
