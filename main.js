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
  collection,
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
  // Aquí iría tu lógica para mostrar los datos en el Dashboard
}

// ======================= FUNCIONES POR PÁGINA =======================
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // RAW PAGE
  if (path.includes("raw.html")) {
    handleGenericSection("raw", "duneRawResources", "addRawBtn", "rawContainer");
  }

  // REFINED PAGE
  if (path.includes("refined.html")) {
    handleGenericSection("refined", "duneRefinedResources", "addRefinedBtn", "refinedContainer");
  }

  // OBJECTS PAGE
  if (path.includes("objects.html")) {
    handleGenericSection("objects", "duneObjects", "addObjectBtn", "objectsContainer");
  }

  // VEHICLES PAGE
  if (path.includes("vehicles.html")) {
    handleGenericSection("vehicles", "duneVehicles", "addVehicleBtn", "vehiclesContainer");
  }

  // WEAPONS PAGE
  if (path.includes("weapons.html")) {
    handleGenericSection("weapons", "duneWeapons", "addWeaponBtn", "weaponsContainer");
  }

  function handleGenericSection(type, storageKey, addBtnId, containerId) {
    const addBtn = document.getElementById(addBtnId);
    const container = document.getElementById(containerId);

    function getLocalData() {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    }

    function saveLocalData(data) {
      localStorage.setItem(storageKey, JSON.stringify(data));
    }

    function renderItems() {
      const data = getLocalData();
      container.innerHTML = "";
      data.forEach((item) => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
          <div class="item-header">
            <div class="item-info">
              <h3>${item.nombre}</h3>
              <span class="item-category">${item.categoria}</span>
              <span class="item-level">Tier ${item.nivel}</span>
            </div>
          </div>
          <div class="item-notes">${item.notas || ""}</div>
        `;
        container.appendChild(card);
      });
    }

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const nombre = prompt("Nombre del recurso:");
        if (!nombre) return;

        const categoria = prompt("Categoría:");
        const nivel = prompt("Nivel (0-2):");
        const notas = prompt("Notas:");

        const nuevoItem = { nombre, categoria, nivel, notas };
        const datosActuales = getLocalData();
        datosActuales.push(nuevoItem);
        saveLocalData(datosActuales);
        renderItems();
      });
    }

    renderItems();
  }
});
