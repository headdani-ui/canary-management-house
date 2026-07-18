// ============================================================
// MODAL Component
// ============================================================

export function openModal(title, bodyHtml, footerHtml = '', options = {}) {
  const root = document.getElementById('modal-root');
  const sizeClass = options.large ? 'modal-lg' : '';

  root.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal ${sizeClass}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" id="modal-close-btn">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    </div>
  `;

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  return root.querySelector('.modal');
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  const overlay = root.querySelector('.modal-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => { root.innerHTML = ''; }, 200);
  }
}

export function confirmDialog(title, message) {
  return new Promise((resolve) => {
    const body = `<p style="color:var(--text-secondary);font-size:var(--text-base)">${message}</p>`;
    const footer = `
      <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
      <button class="btn btn-danger" id="confirm-ok">Confirmar</button>
    `;
    openModal(title, body, footer);
    document.getElementById('confirm-cancel').addEventListener('click', () => { closeModal(); resolve(false); });
    document.getElementById('confirm-ok').addEventListener('click', () => { closeModal(); resolve(true); });
  });
}
