// Variables globales
let rawResources = [];
let refinedResources = [];
let objects = [];
let vehicles = [];
let weapons = [];
let objectives = [];
let editingItem = null;
let editingType = null;
let changeCount = 0;

const categoryOptions = {
    objects: ['Herramientas', 'Consumibles', 'Estructuras', 'Componentes', 'Vehiculares', 'Otros'],
    vehicles: ['Ornitópteros', 'Moto de arena', 'Naves', 'Módulos', 'Otros'],
    weapons: ['Hoja corta', 'Hoja larga', 'Rifles', 'Pistolas', 'Explosivos', 'Láseres', 'Armas pesadas', 'Otros']
};

let currentUser = null;
let db;
let user;

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    renderAguaTab();
    document.getElementById('guardarAguaBtn').addEventListener('click', guardarAguaYFirebase);
    document.getElementById('guardarSolarisBtn').addEventListener('click', guardarSolarisYFirebase);
});

// === FUNCIONES NUEVAS PARA AGUA Y SOLARIS ===
async function guardarAguaYFirebase() {
    const linterjones = parseInt(document.getElementById('aguaLinterjones').value) || 0;
    const litros = parseInt(document.getElementById('aguaLitros').value) || 0;

    localStorage.setItem('aguaLinterjones', linterjones);
    localStorage.setItem('aguaLitros', litros);

    if (user) {
        const userDocRef = doc(db, "usuarios", user.uid);
        await setDoc(userDocRef, {
            aguaLinterjones: linterjones,
            aguaLitros: litros
        }, { merge: true });
    }

    renderDashboard();
}

async function guardarSolarisYFirebase() {
    const cantidad = parseInt(document.getElementById('solarisCantidad').value) || 0;
    localStorage.setItem('solaris', cantidad);

    if (user) {
        const userDocRef = doc(db, "usuarios", user.uid);
        await setDoc(userDocRef, {
            solaris: cantidad
        }, { merge: true });
    }

    renderDashboard();
}

async function cargarDatosDesdeFirebase(user) {
    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();

        if (data.aguaLinterjones !== undefined) {
            document.getElementById('aguaLinterjones').value = data.aguaLinterjones;
            localStorage.setItem('aguaLinterjones', data.aguaLinterjones);
        }

        if (data.aguaLitros !== undefined) {
            document.getElementById('aguaLitros').value = data.aguaLitros;
            localStorage.setItem('aguaLitros', data.aguaLitros);
        }

        if (data.solaris !== undefined) {
            document.getElementById('solarisCantidad').value = data.solaris;
            localStorage.setItem('solaris', data.solaris);
        }

        renderDashboard();
    }
}

function initializeApp() {
    const tabs = document.querySelectorAll('.tabs li');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const selectedTab = tab.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === selectedTab) {
                    content.classList.add('active');
                }
            });
        });
    });

    renderDashboard();
}

// DASHBOARD
function renderDashboard() {
    const dashboard = document.getElementById('dashboardContent');
    dashboard.innerHTML = '';

    renderContadorImpuestos(dashboard);
    renderContadorEnergia(dashboard);
    renderAguaResumen(dashboard);
    renderSolarisResumen(dashboard);
}

// AGUA
function renderAguaResumen(container) {
    const linterjones = localStorage.getItem('aguaLinterjones') || 0;
    const litros = localStorage.getItem('aguaLitros') || 0;

    const aguaCard = document.createElement('div');
    aguaCard.className = 'agua-card';
    aguaCard.innerHTML = `
        <h3>💧 Agua</h3>
        <p>Linterjones: ${linterjones}</p>
        <p>Litros sueltos: ${litros}</p>
    `;

    container.appendChild(aguaCard);
}

// SOLARIS
function renderSolarisResumen(container) {
    const cantidad = localStorage.getItem('solaris') || 0;

    const solarisCard = document.createElement('div');
    solarisCard.className = 'solaris-card';
    solarisCard.innerHTML = `
        <h3>💰 Solaris</h3>
        <p>Cantidad: ${cantidad}</p>
    `;

    container.appendChild(solarisCard);
}

// AUTENTICACIÓN
onAuthStateChanged(auth, async (_user) => {
    user = _user;
    if (user) await cargarDatosDesdeFirebase(user);
});

// === ENERGÍA ===
async function guardarEnergia() {
    const dias = parseInt(document.getElementById('energiaDias').value) || 0;
    const horas = parseInt(document.getElementById('energiaHoras').value) || 0;

    const tiempoRestanteMs = (dias * 24 + horas) * 60 * 60 * 1000;
    const fechaFin = Date.now() + tiempoRestanteMs;

    localStorage.setItem('energiaFin', fechaFin);

    if (user) {
        const userDocRef = doc(db, "usuarios", user.uid);
        await setDoc(userDocRef, { energiaFin: fechaFin }, { merge: true });
    }

    renderDashboard();
    iniciarCuentaRegresivaEnergia();
}

function iniciarCuentaRegresivaEnergia() {
    const contenedor = document.getElementById('energiaCountdownTexto');
    const energiaFin = localStorage.getItem('energiaFin');
    if (!energiaFin) return;

    function actualizarEnergia() {
        const ahora = Date.now();
        const resta = energiaFin - ahora;

        if (resta <= 0) {
            contenedor.textContent = '¡Sin energía!';
            clearInterval(intervaloEnergia);
            return;
        }

        const dias = Math.floor(resta / (1000 * 60 * 60 * 24));
        const horas = Math.floor((resta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((resta % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((resta % (1000 * 60)) / 1000);

        contenedor.textContent = `Restan ${dias} días, ${horas} horas y ${minutos} minutos para que se acabe la energía`;
    }

    actualizarEnergia();
    var intervaloEnergia = setInterval(actualizarEnergia, 1000);
}

// === IMPUESTOS ===
async function guardarImpuestos() {
    const dias = parseInt(document.getElementById('impuestosDias').value) || 0;
    const horas = parseInt(document.getElementById('impuestosHoras').value) || 0;

    const tiempoRestanteMs = (dias * 24 + horas) * 60 * 60 * 1000;
    const fechaFin = Date.now() + tiempoRestanteMs;

    localStorage.setItem('impuestosFin', fechaFin);

    if (user) {
        const userDocRef = doc(db, "usuarios", user.uid);
        await setDoc(userDocRef, { impuestosFin: fechaFin }, { merge: true });
    }

    renderDashboard();
    iniciarCuentaRegresivaImpuestos();
}

function iniciarCuentaRegresivaImpuestos() {
    const contenedor = document.getElementById('impuestosCountdownTexto');
    const impuestosFin = localStorage.getItem('impuestosFin');
    if (!impuestosFin) return;

    function actualizarImpuestos() {
        const ahora = Date.now();
        const resta = impuestosFin - ahora;

        if (resta <= 0) {
            contenedor.textContent = '¡Debes pagar los impuestos!';
            clearInterval(intervaloImpuestos);
            return;
        }

        const dias = Math.floor(resta / (1000 * 60 * 60 * 24));
        const horas = Math.floor((resta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((resta % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((resta % (1000 * 60)) / 1000);

        contenedor.textContent = `Restan ${dias} días, ${horas} horas y ${minutos} minutos para pagar los impuestos`;
    }

    actualizarImpuestos();
    var intervaloImpuestos = setInterval(actualizarImpuestos, 1000);
}

// === AL INICIAR LA WEB ===
window.onload = () => {
    iniciarCuentaRegresivaImpuestos();
    iniciarCuentaRegresivaEnergia();
};
