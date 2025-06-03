import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

const loginBtn = document.getElementById("loginBtn");
const userName = document.getElementById("userName");

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    if (auth.currentUser) {
      signOut(auth);
    } else {
      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          userName.textContent = `Hola, ${user.displayName}`;
          loginBtn.textContent = "Cerrar sesión";
          loadData(user.uid);
        })
        .catch((error) => {
          alert("No se pudo iniciar sesión");
          console.error(error);
        });
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    userName.textContent = `Hola, ${user.displayName}`;
    loginBtn.textContent = "Cerrar sesión";
    loadData(user.uid);
  } else {
    userName.textContent = "";
    loginBtn.textContent = "Iniciar sesión";
  }
});

async function saveData() {
  const user = auth.currentUser;
  if (!user) {
    alert("Inicia sesión primero.");
    return;
  }

  const data = {
    recursos: document.getElementById("lista-recursos")?.innerHTML || "",
    objetos: document.getElementById("lista-objetos")?.innerHTML || "",
    vehiculos: document.getElementById("lista-vehiculos")?.innerHTML || "",
    armas: document.getElementById("lista-armas")?.innerHTML || "",
    skills: document.getElementById("lista-skills")?.innerHTML || "",
  };

  await setDoc(doc(db, "usuarios", user.uid), data);
  alert("Datos guardados en Firebase.");
}

async function loadData(uid) {
  const docSnap = await getDoc(doc(db, "usuarios", uid));
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (document.getElementById("lista-recursos")) document.getElementById("lista-recursos").innerHTML = data.recursos || "";
    if (document.getElementById("lista-objetos")) document.getElementById("lista-objetos").innerHTML = data.objetos || "";
    if (document.getElementById("lista-vehiculos")) document.getElementById("lista-vehiculos").innerHTML = data.vehiculos || "";
    if (document.getElementById("lista-armas")) document.getElementById("lista-armas").innerHTML = data.armas || "";
    if (document.getElementById("lista-skills")) document.getElementById("lista-skills").innerHTML = data.skills || "";
  }
}