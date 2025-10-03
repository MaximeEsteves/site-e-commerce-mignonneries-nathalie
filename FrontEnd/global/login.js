import { loginAdmin } from '../api/apiClient.js';

async function login(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const data = await loginAdmin({ email, password });

    if (data.token) {
      window.localStorage.setItem('token', data.token);

      const userOpen = document.querySelector('.user-open');
      if (userOpen) userOpen.textContent = 'Log out';

      window.location.href = '/';
    } else {
      throw new Error('Aucun token reçu');
    }
  } catch (error) {
    console.error('Erreur de connexion :', error.message);
    const errMsg = document.querySelector('.text-error-connexion');
    if (errMsg) {
      errMsg.textContent = 'Erreur dans l’identifiant ou le mot de passe';
    }
  }
}

function logout() {
  const userOpen = document.querySelector('.user-open');
  window.localStorage.removeItem('token');
  if (userOpen) userOpen.textContent = 'Login';
  window.location.href = '/';
}

const formLogin = document.querySelector('#menu-connexion');
if (formLogin) {
  formLogin.addEventListener('submit', login);
}

document.body.addEventListener('click', function (e) {
  if (e.target.closest('.user-open')) {
    if (window.localStorage.getItem('token')) {
      logout();
    }
  }
});
