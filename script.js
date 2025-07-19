// Variables globales
let objectives = [];
let changeCount = 0;

// Inicialización
window.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  restoreInputs();
});

function initializeApp() {
  loadDataFromStorage();
  setupEventListeners();
  renderDashboard();
}

// Almacenamiento
function loadDataFromStorage() {
  try {
    objectives = JSON.parse(localStorage.getItem('duneObjectives')) || [];
  } catch (error) {
    console.error('Error al cargar datos:', error);
    objectives = [];
  }
}

function saveToStorage() {
  try {
    localStorage.setItem('duneObjectives', JSON.stringify(objectives));
    changeCount++;
    if (changeCount >= 5) {
      createBackup();
      changeCount = 0;
    }
  } catch (error) {
    alert('Error al guardar en localStorage');
  }
}

function createBackup() {
  const backup = {
    objectives,
    aguaLitros: localStorage.getItem('aguaLitros'),
    aguaLinterjones: localStorage.getItem('aguaLinterjones'),
    solaris: localStorage.getItem('solaris'),
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('duneBackup', JSON.stringify(backup));
}

// Eventos
function setupEventListeners() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('guardarImpuestosBtn').addEventListener('click', guardarImpuestos);
  document.getElementById('addImpuestoBtn').addEventListener('click', () => {
    document.getElementById('impuestosFormContainer').style.display = 'block';
  });

  document.getElementById('guardarEnergiaBtn').addEventListener('click', guardarEnergia);
  document.getElementById('addEnergiaBtn').addEventListener('click', () => {
    document.getElementById('energiaFormContainer').style.display = 'block';
  });

  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', importData);

  document.getElementById('saveBtn').addEventListener('click', () => {
    saveToStorage();
    alert('Datos guardados');
  });

  document.getElementById('objectivesBtn').addEventListener('click', () => alert('Gestión de objetivos no implementada.'));
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  document.querySelectorAll('.tab-content').forEach(section => section.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');

  if (tabName === 'dashboard') renderDashboard();
}

// Agua
function guardarAgua() {
  const litros = parseInt(document.getElementById('aguaLitros').value) || 0;
  const linterjones = parseInt(document.getElementById('aguaLinterjones').value) || 0;
  localStorage.setItem('aguaLitros', litros);
  localStorage.setItem('aguaLinterjones', linterjones);
  renderDashboard();
  alert('Datos de agua guardados.');
}

// Solaris
function guardarSolaris() {
  const cantidad = parseInt(document.getElementById('solarisCantidad').value) || 0;
  localStorage.setItem('solaris', cantidad);
  renderDashboard();
  alert('Cantidad de Solaris guardada.');
}

// Impuestos
function guardarImpuestos() {
  const dias = parseInt(document.getElementById('impuestosDias').value) || 0;
  const horas = parseInt(document.getElementById('impuestosHoras').value) || 0;
  const totalMs = (dias * 24 + horas) * 60 * 60 * 1000;
  const vencimiento = Date.now() + totalMs;
  localStorage.setItem('impuestosVencimiento', vencimiento);
  iniciarCuentaRegresiva('impuestos');
  renderDashboard();
  document.getElementById('impuestosFormContainer').style.display = 'none';
  document.getElementById('impuestosCuentaRegresiva').style.display = 'block';
}

// Energía
function guardarEnergia() {
  const dias = parseInt(document.getElementById('energiaDias').value) || 0;
  const horas = parseInt(document.getElementById('energiaHoras').value) || 0;
  const totalMs = (dias * 24 + horas) * 60 * 60 * 1000;
  const vencimiento = Date.now() + totalMs;
  localStorage.setItem('energiaVencimiento', vencimiento);
  iniciarCuentaRegresiva('energia');
  renderDashboard();
  document.getElementById('energiaFormContainer').style.display = 'none';
  document.getElementById('energiaCuentaRegresiva').style.display = 'block';
}

function iniciarCuentaRegresiva(tipo) {
  const idTexto = `${tipo}CountdownTexto`;
  const idDashboard = `${tipo}CountdownDashboard`;
  const vencimiento = parseInt(localStorage.getItem(`${tipo}Vencimiento`));

  if (!vencimiento) return;

  const updateCountdown = () => {
    const ahora = Date.now();
    const diff = vencimiento - ahora;
    if (diff <= 0) {
      document.getElementById(idTexto).textContent = '¡Tiempo agotado!';
      document.getElementById(idDashboard).textContent = '¡Tiempo agotado!';
      clearInterval(timer);
      return;
    }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    const texto = `Restan ${d} días, ${h} horas, ${m} min, ${s} seg`;
    document.getElementById(idTexto).textContent = texto;
    document.getElementById(idDashboard).textContent = texto;
  };

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}

// Dashboard
function renderDashboard() {
  document.getElementById('dashboardAguaLitros').textContent = localStorage.getItem('aguaLitros') || 0;
  document.getElementById('dashboardAguaLinterjones').textContent = localStorage.getItem('aguaLinterjones') || 0;
  document.getElementById('dashboardSolaris').textContent = localStorage.getItem('solaris') || 0;
  iniciarCuentaRegresiva('impuestos');
  iniciarCuentaRegresiva('energia');
  document.getElementById('impuestosDashboardCard').style.display = 'block';
  document.getElementById('energiaDashboardCard').style.display = 'block';
}

function restoreInputs() {
  document.getElementById('aguaLinterjones').value = localStorage.getItem('aguaLinterjones') || 0;
  document.getElementById('aguaLitros').value = localStorage.getItem('aguaLitros') || 0;
  document.getElementById('solarisCantidad').value = localStorage.getItem('solaris') || 0;
}

// Exportar e importar
function exportData() {
  const data = {
    aguaLitros: localStorage.getItem('aguaLitros'),
    aguaLinterjones: localStorage.getItem('aguaLinterjones'),
    solaris: localStorage.getItem('solaris'),
    impuestosVencimiento: localStorage.getItem('impuestosVencimiento'),
    energiaVencimiento: localStorage.getItem('energiaVencimiento'),
    objectives
  };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dune_tracker_backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.aguaLitros) localStorage.setItem('aguaLitros', data.aguaLitros);
      if (data.aguaLinterjones) localStorage.setItem('aguaLinterjones', data.aguaLinterjones);
      if (data.solaris) localStorage.setItem('solaris', data.solaris);
      if (data.impuestosVencimiento) localStorage.setItem('impuestosVencimiento', data.impuestosVencimiento);
      if (data.energiaVencimiento) localStorage.setItem('energiaVencimiento', data.energiaVencimiento);
      if (data.objectives) objectives = data.objectives;
      renderDashboard();
      restoreInputs();
      alert('Datos importados correctamente.');
    } catch (err) {
      alert('Error al importar el archivo.');
    }
  };
  reader.readAsText(file);
}
