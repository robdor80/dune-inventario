import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAs3ZeDo6g_SwaiGbruER2444rWkafQLTU",
  authDomain: "dune-inventario.firebaseapp.com",
  projectId: "dune-inventario",
  storageBucket: "dune-inventario.appspot.com",
  messagingSenderId: "26414027507",
  appId: "1:26414027507:web:b8970fb32a837d7117dd86"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let usuario = null;

// Detectar login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    usuario = user;
    document.getElementById("userName").textContent = user.displayName;
    if (document.getElementById("dashboard")) cargarTodoEnDashboard();
  }
});

// Botón login
document.getElementById("loginBtn")?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("Error al iniciar sesión");
  }
});

// Guardar todo
window.saveAll = async () => {
  if (!usuario) return alert("Inicia sesión");
  const datos = {
    crudos: localStorage.getItem("materiales_crudos") || "",
    procesados: localStorage.getItem("materiales_procesados") || "",
    objetos: localStorage.getItem("objetos") || "",
    vehiculos: localStorage.getItem("vehiculos") || "",
    armas: localStorage.getItem("armas") || "",
    skills: localStorage.getItem("skills") || ""
  };
  await setDoc(doc(db, "usuarios", usuario.uid), datos);
  alert("Datos guardados en Firebase");
};

// Guardar solo una sección
window.saveSectionData = async (id) => {
  if (!usuario) return alert("Inicia sesión");
  const contenedor = document.getElementById("contenedor-" + id);
  const contenido = contenedor?.innerHTML || "";
  localStorage.setItem(id, contenido);
  const ref = doc(db, "usuarios", usuario.uid);
  const snap = await getDoc(ref);
  const datos = snap.exists() ? snap.data() : {};
  datos[id.replace(/_/g, "")] = contenido;
  await setDoc(ref, datos);
  alert("Sección guardada");
};

// Exportar
window.exportarDatos = async () => {
  if (!usuario) return alert("Inicia sesión");
  const ref = doc(db, "usuarios", usuario.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return alert("No hay datos que exportar");
  const datos = snap.data();
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "dune_backup.json";
  a.click();
};

// Importar
window.importarDatos = async (event) => {
  const file = event.target.files[0];
  if (!file || !usuario) return;
  const text = await file.text();
  const datos = JSON.parse(text);
  await setDoc(doc(db, "usuarios", usuario.uid), datos);
  alert("Datos importados");
  location.reload();
};

// Cargar en Dashboard
async function cargarTodoEnDashboard() {
  const ref = doc(db, "usuarios", usuario.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const datos = snap.data();
  document.getElementById("lista-recursos").textContent = "Materiales Crudos: " + (datos.crudos?.length || 0);
  document.getElementById("lista-procesados").textContent = "Materiales Procesados: " + (datos.procesados?.length || 0);
  document.getElementById("lista-objetos").textContent = "Objetos: " + (datos.objetos?.length || 0);
  document.getElementById("lista-vehiculos").textContent = "Vehículos: " + (datos.vehiculos?.length || 0);
  document.getElementById("lista-armas").textContent = "Armas: " + (datos.armas?.length || 0);
  document.getElementById("lista-skills").textContent = "Skills: " + (datos.skills?.length || 0);
}