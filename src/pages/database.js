// ============================================================
// DATABASE / MAINTENANCE Page
// ============================================================
import { store } from '../store.js';

export function renderDatabasePage() {
  const titleArea = document.getElementById('page-title-area');
  if (titleArea) {
    titleArea.innerHTML = `
      <h1>Copia y Sincronización</h1>
      <div class="breadcrumb"><span>Canary Management House</span> / Administración de Datos</div>
    `;
  }

  const content = document.getElementById('page-content');

  content.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-6);">
      
      <!-- Warning Alert -->
      <div style="background: rgba(250, 204, 21, 0.08); border: 1px solid var(--yellow-accent); border-radius: var(--radius-md); padding: var(--space-4); display: flex; gap: var(--space-3); align-items: flex-start;">
        <span class="material-icons-outlined" style="color: var(--yellow-accent); font-size: 24px;">warning</span>
        <div>
          <h4 style="color: var(--yellow-accent); margin-bottom: var(--space-1); font-size: var(--text-base);">Importante para la migración</h4>
          <p style="font-size: var(--text-sm); line-height: 1.5; color: var(--text-secondary);">
            Si ha ingresado datos en este u otro ordenador que no estaban guardados en el servidor en la nube, siga estos pasos:
            <br><strong>1. Exportar Backup</strong> en el ordenador donde tiene los datos.
            <br><strong>2. Importar Backup</strong> (si usa otro ordenador).
            <br><strong>3. Sincronizar con Neon DB</strong> para subirlos definitivamente a la nube.
          </p>
        </div>
      </div>

      <!-- Main Action Panels -->
      <div class="page-grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-6);">
        
        <!-- Local Backup Panel -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="material-icons-outlined" style="font-size:18px;color:var(--neon);vertical-align:middle;margin-right:8px;">save</span>
              Copia de Seguridad Local
            </div>
          </div>
          <p style="font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-6); min-height: 48px;">
            Guarde una copia física de sus datos en formato JSON en su ordenador o restaure una copia previa.
          </p>
          <div style="display: flex; flex-direction: column; gap: var(--space-3);">
            <button id="btn-export" class="btn btn-secondary btn-block">
              <span class="material-icons-outlined">download</span> Exportar Backup JSON
            </button>
            
            <button id="btn-import-trigger" class="btn btn-secondary btn-block">
              <span class="material-icons-outlined">upload</span> Importar Backup JSON
            </button>
            <input type="file" id="file-import" accept=".json" style="display: none;" />
          </div>
        </div>

        <!-- Cloud Sync Panel -->
        <div class="card" style="border-color: var(--border-neon); box-shadow: var(--shadow-neon);">
          <div class="card-header">
            <div class="card-title">
              <span class="material-icons-outlined" style="font-size:18px;color:var(--neon);vertical-align:middle;margin-right:8px;">cloud_upload</span>
              Sincronizar a la Nube
            </div>
          </div>
          <p style="font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-6); min-height: 48px;">
            Sube todos los datos guardados en este navegador a la base de datos remota Neon DB (PostgreSQL).
          </p>
          <button id="btn-sync" class="btn btn-primary btn-block">
            <span class="material-icons-outlined">sync</span> Sincronizar con Neon DB
          </button>
        </div>

      </div>

      <!-- Sync Status Panel -->
      <div id="sync-status-card" class="card" style="display: none;">
        <div class="card-header">
          <div class="card-title" id="sync-title">Sincronizando datos...</div>
        </div>
        
        <!-- Progress Bar -->
        <div style="width: 100%; height: 8px; background: var(--bg-surface-3); border-radius: var(--radius-full); overflow: hidden; margin-bottom: var(--space-4);">
          <div id="sync-progress" style="width: 0%; height: 100%; background: var(--neon); box-shadow: 0 0 10px var(--neon); transition: width 0.3s ease;"></div>
        </div>
        
        <!-- Logger -->
        <div id="sync-log" style="background: var(--bg-darkest); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-4); font-family: monospace; font-size: var(--text-xs); color: var(--text-secondary); max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-1);">
        </div>
      </div>

    </div>
  `;

  // Attach event listeners
  const btnExport = document.getElementById('btn-export');
  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const fileImport = document.getElementById('file-import');
  const btnSync = document.getElementById('btn-sync');
  const syncStatusCard = document.getElementById('sync-status-card');
  const syncTitle = document.getElementById('sync-title');
  const syncProgress = document.getElementById('sync-progress');
  const syncLog = document.getElementById('sync-log');

  // Export handler
  btnExport?.addEventListener('click', () => {
    try {
      const dataStr = store.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canary_management_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Copia de seguridad exportada correctamente.');
    } catch (e) {
      alert('Error al exportar datos: ' + e.message);
    }
  });

  // Import handlers
  btnImportTrigger?.addEventListener('click', () => fileImport?.click());
  fileImport?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const success = store.importData(result);
        if (success) {
          alert('Copia de seguridad importada con éxito en este navegador. Por favor, recargue la página o sincronice con la nube.');
          window.location.reload();
        } else {
          alert('Error: El archivo JSON de copia de seguridad no es válido.');
        }
      }
    };
    reader.readAsText(file);
  });

  // Sync handler
  btnSync?.addEventListener('click', async () => {
    if (!confirm('¿Está seguro de que desea subir todos sus datos locales a Neon DB? Esto actualizará los registros en la nube.')) {
      return;
    }

    btnSync.disabled = true;
    btnExport.disabled = true;
    btnImportTrigger.disabled = true;
    syncStatusCard.style.display = 'block';
    syncLog.innerHTML = '<div>[INFO] Iniciando sincronización de datos locales...</div>';
    syncProgress.style.width = '0%';

    try {
      await store.syncLocalToCloud((current, total, table) => {
        const pct = Math.round((current / total) * 100);
        syncProgress.style.width = `${pct}%`;
        syncTitle.innerText = `Sincronizando: ${pct}% (${current}/${total})`;
        
        const logLine = document.createElement('div');
        logLine.innerText = `[OK] Tabla: ${table} | Registro ${current} de ${total} procesado.`;
        syncLog.appendChild(logLine);
        syncLog.scrollTop = syncLog.scrollHeight;
      });

      syncTitle.innerHTML = `<span style="color: var(--neon);">Sincronización completada con éxito</span>`;
      const finalLine = document.createElement('div');
      finalLine.innerHTML = `<span style="color: var(--neon);">[ÉXITO] Todos los datos se han subido correctamente a Neon DB.</span>`;
      syncLog.appendChild(finalLine);
      syncLog.scrollTop = syncLog.scrollHeight;
      alert('Sincronización completada con éxito. Todos los datos locales se han subido a Neon DB.');
    } catch (err) {
      console.error(err);
      syncTitle.innerHTML = `<span style="color: var(--red-accent);">Error en la sincronización</span>`;
      const errLine = document.createElement('div');
      errLine.innerHTML = `<span style="color: var(--red-accent);">[ERROR] ${err.message}</span>`;
      syncLog.appendChild(errLine);
      alert('Ocurrió un error al sincronizar los datos: ' + err.message);
    } finally {
      btnSync.disabled = false;
      btnExport.disabled = false;
      btnImportTrigger.disabled = false;
    }
  });
}
