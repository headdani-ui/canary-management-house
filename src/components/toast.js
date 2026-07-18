// ============================================================
// TOAST Component
// ============================================================

export function showToast(message, type = 'success', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
  };

  toast.innerHTML = `
    <span class="material-icons-outlined" style="font-size:20px;color:var(--${type === 'success' ? 'neon' : type === 'error' ? 'red-accent' : 'yellow-accent'})">${iconMap[type]}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
