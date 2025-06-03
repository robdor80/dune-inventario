// main.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let allData = {};

// ======================= LOGIN =======================
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

if (loginBtn && logoutBtn) {
  loginBtn.addEventListener("click", () => {
    signInWithPopup(auth, new GoogleAuthProvider());
  });

  logoutBtn.addEventListener("click", () => {
    signOut(auth);
  });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      await loadUserData();
      renderAllData();
    } else {
      currentUser = null;
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }
  });
}

// ======================= CARGAR DATOS =======================
async function loadUserData() {
  if (!currentUser) return;

  const docRef = doc(db, "dune_data", currentUser.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    allData = docSnap.data();
    console.log("Datos cargados:", allData);
  } else {
    allData = {};
    console.log("No se encontraron datos previos.");
  }
}

// ======================= GUARDAR DATOS =======================
const saveBtn = document.getElementById("saveAllBtn");
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("Primero debes iniciar sesión con Google");
    await setDoc(doc(db, "dune_data", currentUser.uid), allData);
    alert("✅ Datos guardados correctamente en la nube");
  });
}

// ======================= RENDER DASHBOARD =======================
function renderAllData() {
  if (!document.getElementById("dashboard")) return;

  const types = [
    { key: "duneRawResources", label: "Recursos Brutos" },
    { key: "duneRefinedResources", label: "Recursos Refinados" },
    { key: "duneObjects", label: "Objetos" },
    { key: "duneVehicles", label: "Vehículos" },
    { key: "duneWeapons", label: "Armas" }
  ];

  const resumenContainer = document.getElementById("dashboardResumen");
  const listadoContainer = document.getElementById("dashboardListado");

  if (resumenContainer) resumenContainer.innerHTML = "";
  if (listadoContainer) listadoContainer.innerHTML = "";

  types.forEach(({ key, label }) => {
    const items = JSON.parse(localStorage.getItem(key)) || [];

    if (resumenContainer) {
      const resumen = document.createElement("div");
      resumen.className = "summary-item";
      resumen.innerHTML = `
        <div class="summary-number">${items.length}</div>
        <div class="summary-label">${label}</div>
      `;
      resumenContainer.appendChild(resumen);
    }

    if (listadoContainer && items.length > 0) {
      const grupo = document.createElement("div");
      grupo.className = "dashboard-card";
      grupo.innerHTML = `
        <div class="card-header"><h3>${label}</h3></div>
        <div class="card-content">
          ${items.map(i => `<p><strong>${i.nombre}</strong> - ${i.categoria} (Tier ${i.nivel}) - ${i.cantidad} u.</p>`).join('')}
        </div>
      `;
      listadoContainer.appendChild(grupo);
    }
  });
}

// ======================= MODALES =======================
function openResourceModal(type) {
  const modal = document.getElementById("resourceModal");
  if (!modal) return;

  document.getElementById("resourceForm").reset();
  modal.classList.add("show");
  modal.dataset.type = type;

  const header = document.getElementById("mainHeader");
  if (header) header.style.display = "none";
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach(modal => {
    modal.classList.remove("show");
  });
  const header = document.getElementById("mainHeader");
  if (header) header.style.display = "";
}

function handleResourceSubmit(e) {
  e.preventDefault();
  const modal = document.getElementById("resourceModal");
  const type = modal.dataset.type;

  const nombre = document.getElementById("resourceName").value;
  const categoria = document.getElementById("resourceCategory").value;
  const nivel = document.getElementById("resourceLevel").value;
  const cantidad = document.getElementById("resourceQuantity").value;
  const imagen = document.getElementById("resourceImage").value;
  const notas = document.getElementById("resourceNotes").value;

  if (!nombre || !categoria || !nivel || !cantidad) {
    alert("Por favor, completa todos los campos obligatorios.");
    return;
  }

  const nuevo = { nombre, categoria, nivel, cantidad, imagen, notas };

  const key = {
    raw: "duneRawResources",
    refined: "duneRefinedResources",
    objects: "duneObjects",
    vehicles: "duneVehicles",
    weapons: "duneWeapons"
  }[type];

  if (!key) return;

  const actuales = JSON.parse(localStorage.getItem(key)) || [];
  actuales.push(nuevo);
  localStorage.setItem(key, JSON.stringify(actuales));

  closeAllModals();
  renderItems(key, `${type}Container`);
  renderAllData();
}

// ======================= INICIALIZACIÓN index.html =======================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addRawBtn")?.addEventListener("click", () => openResourceModal("raw"));
  document.getElementById("resourceForm")?.addEventListener("submit", handleResourceSubmit);
  document.querySelectorAll(".close-btn, .cancel-btn").forEach(btn => {
    btn.addEventListener("click", closeAllModals);
  });
  renderItems("duneRawResources", "rawContainer");
});

function renderItems(storageKey, containerId) {
  const data = JSON.parse(localStorage.getItem(storageKey)) || [];
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-header">
        <div class="item-info">
          <h3>${item.nombre}</h3>
          <span class="item-category">${item.categoria}</span>
          <span class="item-level">Tier ${item.nivel}</span>
          <span class="item-quantity">${item.cantidad} u.</span>
        </div>
      </div>
      <div class="item-notes">${item.notas || "Sin notas adicionales."}</div>
    `;
    container.appendChild(card);
  });
}
