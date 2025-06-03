import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
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
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Botones
document.getElementById("login-btn").addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        document.getElementById("user-info").innerText = `Hola, ${user.displayName}`;
        document.getElementById("login-btn").style.display = "none";
        document.getElementById("logout-btn").style.display = "inline-block";
        loadData(user.uid);
    } catch (error) {
        console.error("Error de login:", error);
    }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
    await signOut(auth);
    location.reload();
});

function getDataFromForm() {
    return {
        recursos: document.getElementById("recursos-data").value,
        objetos: document.getElementById("objetos-data").value,
        vehiculos: document.getElementById("vehiculos-data").value,
        armas: document.getElementById("armas-data").value,
        skills: document.getElementById("skills-data").value
    };
}

function setDataToForm(data) {
    document.getElementById("recursos-data").value = data.recursos || "";
    document.getElementById("objetos-data").value = data.objetos || "";
    document.getElementById("vehiculos-data").value = data.vehiculos || "";
    document.getElementById("armas-data").value = data.armas || "";
    document.getElementById("skills-data").value = data.skills || "";
}

window.saveData = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Debes iniciar sesión.");
    const data = getDataFromForm();
    await setDoc(doc(db, "users", user.uid), data);
    alert("Datos guardados en la nube.");
};

async function loadData(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
        setDataToForm(snap.data());
        document.getElementById("dashboard-data").innerText = "Datos cargados correctamente.";
    } else {
        document.getElementById("dashboard-data").innerText = "Sin datos previos.";
    }
}

onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById("user-info").innerText = `Hola, ${user.displayName}`;
        document.getElementById("login-btn").style.display = "none";
        document.getElementById("logout-btn").style.display = "inline-block";
        loadData(user.uid);
    }
});

// Navegación por pestañas
window.openTab = (evt, tabId) => {
    const tabs = document.querySelectorAll(".tab-content");
    const buttons = document.querySelectorAll(".tab-button");
    tabs.forEach(tab => tab.style.display = "none");
    buttons.forEach(btn => btn.classList.remove("active"));
    document.getElementById(tabId).style.display = "block";
    evt.currentTarget.classList.add("active");
};
