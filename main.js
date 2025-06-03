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
  // Implementa aquí el render del dashboard si lo necesitas
}

// ======================= MODALES =======================
function openResourceModal(type) {
  const modal = document.getElementById("resourceModal");
  if (!modal) return;
  modal.dataset.type = type;
  document.getElementById("resourceForm").reset();
  modal.style.display = "block";
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach(modal => {
    modal.style.display = "none";
  });
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
  location.reload(); // o reemplázalo por render dinámico si quieres
}

// ======================= DETECCIÓN DE PÁGINA =======================
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("raw.html")) {
    document.getElementById("addRawBtn")?.addEventListener("click", () => openResourceModal("raw"));
    document.getElementById("resourceForm")?.addEventListener("submit", handleResourceSubmit);
    document.querySelectorAll(".close-btn, .cancel-btn").forEach(btn => {
      btn.addEventListener("click", closeAllModals);
    });
    renderItems("duneRawResources", "rawContainer");
  }

  // Otras pestañas (refined, objects, etc.) puedes repetir este mismo patrón si lo deseas
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
        ${item.imagen ? `<img src="${item.imagen}" alt="${item.nombre}" class="item-image">` : ""}
      </div>
      <div class="item-notes">${item.notas || ""}</div>
    `;
    container.appendChild(card);
  });
}
