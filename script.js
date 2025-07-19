// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAs3ZeDo6g_SwaiGbruER2444rWkafQLTU",
  authDomain: "dune-inventario.firebaseapp.com",
  projectId: "dune-inventario",
  storageBucket: "dune-inventario.firebasestorage.app",
  messagingSenderId: "26414027507",
  appId: "1:26414027507:web:b8970fb32a837d7117dd86"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let currentUser = null;

window.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupEventListeners();
});

function setupAuth() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userNameEl = document.getElementById("userName");

  loginBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      currentUser = result.user;
      loadUserData();
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    currentUser = null;
    location.reload();
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      userNameEl.textContent = user.displayName;
      loadUserData();
    } else {
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      userNameEl.textContent = "";
    }
  });
}

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

  document.getElementById('saveBtn').addEventListener('click', guardarAguaYSolaris);
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  document.querySelectorAll('.tab-content').forEach(section => section.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');

  if (tabName === 'dashboard') renderDashboard();
}

async function loadUserData() {
  if (!currentUser) return;
  const docRef = doc(db, "usuarios", currentUser.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById('aguaLinterjones').value = data.aguaLinterjones || 0;
    document.getElementById('aguaLitros').value = data.aguaLitros || 0;
    document.getElementById('solarisCantidad').value = data.solaris || 0;
    if (data.impuestosVencimiento) iniciarCuentaRegresiva("impuestos", data.impuestosVencimiento);
    if (data.energiaVencimiento) iniciarCuentaRegresiva("energia", data.energiaVencimiento);
    renderDashboard(data);
  }
}

async function guardarAguaYSolaris() {
  const aguaLitros = parseInt(document.getElementById('aguaLitros').value) || 0;
  const aguaLinterjones = parseInt(document.getElementById('aguaLinterjones').value) || 0;
  const solaris = parseInt(document.getElementById('solarisCantidad').value) || 0;
  await guardarEnFirestore({ aguaLitros, aguaLinterjones, solaris });
  renderDashboard({ aguaLitros, aguaLinterjones, solaris });
  alert("Datos guardados");
}

async function guardarImpuestos() {
  const dias = parseInt(document.getElementById('impuestosDias').value) || 0;
  const horas = parseInt(document.getElementById('impuestosHoras').value) || 0;
  const vencimiento = Date.now() + (dias * 24 + horas) * 60 * 60 * 1000;
  await guardarEnFirestore({ impuestosVencimiento: vencimiento });
  iniciarCuentaRegresiva("impuestos", vencimiento);
  renderDashboard();
  document.getElementById('impuestosFormContainer').style.display = 'none';
  document.getElementById('impuestosCuentaRegresiva').style.display = 'block';
}

async function guardarEnergia() {
  const dias = parseInt(document.getElementById('energiaDias').value) || 0;
  const horas = parseInt(document.getElementById('energiaHoras').value) || 0;
  const vencimiento = Date.now() + (dias * 24 + horas) * 60 * 60 * 1000;
  await guardarEnFirestore({ energiaVencimiento: vencimiento });
  iniciarCuentaRegresiva("energia", vencimiento);
  renderDashboard();
  document.getElementById('energiaFormContainer').style.display = 'none';
  document.getElementById('energiaCuentaRegresiva').style.display = 'block';
}

async function guardarEnFirestore(data) {
  if (!currentUser) return;
  const ref = doc(db, "usuarios", currentUser.uid);
  await setDoc(ref, data, { merge: true });
}

function iniciarCuentaRegresiva(tipo, vencimiento) {
  const idTexto = `${tipo}CountdownTexto`;
  const idDashboard = `${tipo}CountdownDashboard`;
  clearInterval(window[`${tipo}Timer`]);
  function update() {
    const diff = vencimiento - Date.now();
    if (diff <= 0) {
      document.getElementById(idTexto).textContent = '¡Tiempo agotado!';
      document.getElementById(idDashboard).textContent = '¡Tiempo agotado!';
      clearInterval(window[`${tipo}Timer`]);
      return;
    }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    const texto = `Restan ${d} días, ${h} horas, ${m} min, ${s} seg`;
    document.getElementById(idTexto).textContent = texto;
    document.getElementById(idDashboard).textContent = texto;
  }
  update();
  window[`${tipo}Timer`] = setInterval(update, 1000);
}

function renderDashboard(data = {}) {
  document.getElementById('dashboardAguaLitros').textContent = data.aguaLitros || document.getElementById('aguaLitros').value || 0;
  document.getElementById('dashboardAguaLinterjones').textContent = data.aguaLinterjones || document.getElementById('aguaLinterjones').value || 0;
  document.getElementById('dashboardSolaris').textContent = data.solaris || document.getElementById('solarisCantidad').value || 0;
  document.getElementById('impuestosDashboardCard').style.display = 'block';
  document.getElementById('energiaDashboardCard').style.display = 'block';
}
