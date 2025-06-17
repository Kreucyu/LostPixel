const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const registerSection = document.getElementById('registerSection');
const backToLoginBtn = document.getElementById('backToLoginBtn');

const API_URL = 'http://localhost:3000/api';

if (showRegisterBtn && registerSection && loginForm) {
    showRegisterBtn.onclick = () => {
        loginForm.style.display = 'none';
        showRegisterBtn.style.display = 'none';
        registerSection.style.display = 'block';
        authMessage.textContent = '';
    };
}
if (backToLoginBtn && registerSection && loginForm && showRegisterBtn) {
    backToLoginBtn.onclick = () => {
        registerSection.style.display = 'none';
        loginForm.style.display = 'block';
        showRegisterBtn.style.display = 'block';
        authMessage.textContent = '';
    };
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            const res = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('isLoggedIn', 'true');
                authMessage.textContent = 'Login realizado com sucesso!';
                setTimeout(() => window.location.href = 'index.html', 1000);
            } else {
                authMessage.textContent = data.message || 'Erro ao fazer login.';
            }
        } catch (err) {
            authMessage.textContent = 'Erro ao conectar ao servidor.';
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        try {
            const res = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                registerForm.reset();
                if (registerSection && loginForm && showRegisterBtn) {
                    registerSection.style.display = 'none';
                    loginForm.style.display = 'block';
                    showRegisterBtn.style.display = 'block';
                }
                authMessage.textContent = 'Cadastro realizado com sucesso! Faça login.';
            } else {
                authMessage.textContent = data.message || 'Erro ao cadastrar.';
            }
        } catch (err) {
            authMessage.textContent = 'Erro ao conectar ao servidor.';
        }
    });
}

function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
} 