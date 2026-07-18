// ============================================================
// LOGIN Page
// ============================================================
import { navigate } from '../router.js';

export function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <div class="login-hero">
        <div class="login-hero-content">
          <div class="brand-logo">
            <span class="dot"></span>
            Canary Management House
          </div>
          <h1>Arquitectos de Riqueza.</h1>
          <p>La cabina de precisión definitiva para gestores inmobiliarios de alto rendimiento. Controle toda su cartera con una claridad inigualable.</p>
          <div class="login-stats">
            <div class="login-stat">
              <div class="login-stat-value">94.2%</div>
              <div class="login-stat-label">Ocupación de Cartera</div>
            </div>
            <div class="login-stat">
              <div class="login-stat-value">+18%</div>
              <div class="login-stat-label">Incremento Medio</div>
            </div>
            <div class="login-stat">
              <div class="login-stat-value">12</div>
              <div class="login-stat-label">Propiedades Activas</div>
            </div>
          </div>
        </div>
      </div>
      <div class="login-form-side">
        <div class="login-form-container">
          <h2>Portal de Gestión</h2>
          <p class="subtitle">Se requiere autenticación segura</p>
          <form id="login-form">
            <div class="form-group">
              <label class="form-label">Correo Electrónico</label>
              <input class="form-input" type="email" id="login-email" placeholder="admin@rentaelite.com" value="admin@rentaelite.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input class="form-input" type="password" id="login-password" placeholder="••••••••" value="admin123" />
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6)">
              <label class="form-checkbox">
                <input type="checkbox" checked /> Recordarme
              </label>
              <a href="#" style="font-size:var(--text-xs)">¿Olvidó su contraseña?</a>
            </div>
            <button type="submit" class="btn btn-primary btn-block btn-lg">Iniciar Sesión</button>
          </form>
          <p style="text-align:center;margin-top:var(--space-6);font-size:var(--text-xs);color:var(--text-tertiary)">
            Demo: admin@rentaelite.com / admin123
          </p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (email && password) {
      localStorage.setItem('rental_elite_auth', 'true');
      navigate('/dashboard');
    }
  });
}
