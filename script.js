
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuración de Firebase
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
const provider = new GoogleAuthProvider();

// Login
window.loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    document.getElementById("user-info").innerText = `Hola, ${user.displayName}`;
    document.getElementById("login-btn").style.display = "none";
    document.getElementById("logout-btn").style.display = "inline-block";
    loadUserData(user.uid);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("No se pudo iniciar sesión.");
  }
};

// Logout
window.logout = async () => {
  await signOut(auth);
  location.reload();
};

// Guardar datos del DOM
window.saveData = async () => {
  const user = auth.currentUser;
  if (!user) return alert("Debes iniciar sesión.");
  const data = {
    recursos: document.getElementById("lista-recursos")?.innerHTML || "",
    objetos: document.getElementById("lista-objetos")?.innerHTML || "",
    vehiculos: document.getElementById("lista-vehiculos")?.innerHTML || "",
    armas: document.getElementById("lista-armas")?.innerHTML || "",
    skills: document.getElementById("lista-skills")?.innerHTML || ""
  };
  await setDoc(doc(db, "users", user.uid), data);
  alert("Datos guardados.");
};

// Cargar datos al DOM
async function loadUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const data = snap.data();
    if (data.recursos) document.getElementById("lista-recursos").innerHTML = data.recursos;
    if (data.objetos) document.getElementById("lista-objetos").innerHTML = data.objetos;
    if (data.vehiculos) document.getElementById("lista-vehiculos").innerHTML = data.vehiculos;
    if (data.armas) document.getElementById("lista-armas").innerHTML = data.armas;
    if (data.skills) document.getElementById("lista-skills").innerHTML = data.skills;
    document.getElementById("dashboard-datos").innerText = "Datos cargados.";
  } else {
    document.getElementById("dashboard-datos").innerText = "No hay datos previos.";
  }
}

// Estado del usuario
onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById("user-info").innerText = `Hola, ${user.displayName}`;
    document.getElementById("login-btn").style.display = "none";
    document.getElementById("logout-btn").style.display = "inline-block";
    loadUserData(user.uid);
  }
});

// Navegación por pestañas
window.openTab = function (evt, tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  const buttons = document.querySelectorAll(".tab-button");
  tabs.forEach(tab => tab.style.display = "none");
  buttons.forEach(btn => btn.classList.remove("active"));
  document.getElementById(tabId).style.display = "block";
  evt.currentTarget.classList.add("active");
};
