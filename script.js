// Firebase Auth
firebase.auth().onAuthStateChanged((user) => {
    const loginSection = document.getElementById("login");
    const logoutButton = document.getElementById("logout");
    const userNameDisplay = document.getElementById("userName");

    if (user) {
        loginSection.style.display = "none";
        logoutButton.style.display = "inline-block";
        userNameDisplay.textContent = user.displayName;
        userNameDisplay.style.display = "inline-block";
        cargarDatos(user.uid);
    } else {
        loginSection.style.display = "inline-block";
        logoutButton.style.display = "none";
        userNameDisplay.textContent = "";
        userNameDisplay.style.display = "none";
    }
});

// Guardar datos Agua
function guardarAgua() {
    const litros = parseInt(document.getElementById('aguaLitros').value) || 0;
    const linterjones = parseInt(document.getElementById('aguaLinterjones').value) || 0;

    localStorage.setItem('aguaLitros', litros);
    localStorage.setItem('aguaLinterjones', linterjones);

    renderDashboard(); // ACTUALIZA el dashboard
    alert("Datos de agua guardados.");
}

// Guardar datos Solaris
function guardarSolaris() {
    const cantidad = parseInt(document.getElementById('solarisCantidad').value) || 0;
    localStorage.setItem('solaris', cantidad);

    renderDashboard(); // ACTUALIZA el dashboard
    alert("Cantidad de Solaris guardada.");
}

// Renderizar dashboard
function renderDashboard() {
    document.getElementById('dashboardAguaLitros').textContent = localStorage.getItem('aguaLitros') || 0;
    document.getElementById('dashboardAguaLinterjones').textContent = localStorage.getItem('aguaLinterjones') || 0;
    document.getElementById('dashboardSolaris').textContent = localStorage.getItem('solaris') || 0;
}

// Guardar datos Impuestos
function guardarImpuestos() {
    const dias = parseInt(document.getElementById("diasImpuestos").value) || 0;
    const horas = parseInt(document.getElementById("horasImpuestos").value) || 0;

    const now = new Date();
    const fechaFinal = new Date(now.getTime() + (dias * 24 + horas) * 60 * 60 * 1000);

    localStorage.setItem("fechaFinalImpuestos", fechaFinal);

    iniciarCuentaRegresivaImpuestos();
    mostrarCuentaRegresivaImpuestosEnDashboard();

    document.getElementById("formularioImpuestos").style.display = "none";
}

// Guardar datos Energía
function guardarEnergia() {
    const dias = parseInt(document.getElementById("diasEnergia").value) || 0;
    const horas = parseInt(document.getElementById("horasEnergia").value) || 0;

    const now = new Date();
    const fechaFinal = new Date(now.getTime() + (dias * 24 + horas) * 60 * 60 * 1000);

    localStorage.setItem("fechaFinalEnergia", fechaFinal);

    iniciarCuentaRegresivaEnergia();
    mostrarCuentaRegresivaEnergiaEnDashboard();

    document.getElementById("formularioEnergia").style.display = "none";
}

// Función para iniciar cuenta regresiva de Impuestos
function iniciarCuentaRegresivaImpuestos() {
    const fechaFinal = new Date(localStorage.getItem("fechaFinalImpuestos"));
    if (isNaN(fechaFinal)) return;

    const actualizar = () => {
        const ahora = new Date();
        const diferencia = fechaFinal - ahora;

        if (diferencia <= 0) {
            document.getElementById("impuestosCountdownTexto").textContent = "¡Tiempo agotado!";
            clearInterval(intervaloImpuestos);
            return;
        }

        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
        const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
        const segundos = Math.floor((diferencia / 1000) % 60);

        document.getElementById("impuestosCountdownTexto").textContent =
            `Restan ${dias} días, ${horas} horas, ${minutos} minutos y ${segundos} segundos`;
    };

    actualizar();
    intervaloImpuestos = setInterval(actualizar, 1000);
}

function mostrarCuentaRegresivaImpuestosEnDashboard() {
    const fechaFinal = new Date(localStorage.getItem("fechaFinalImpuestos"));
    if (isNaN(fechaFinal)) return;

    document.getElementById("impuestosDashboardCard").style.display = "block";

    const actualizar = () => {
        const ahora = new Date();
        const diferencia = fechaFinal - ahora;

        if (diferencia <= 0) {
            document.getElementById("impuestosCountdownDashboard").textContent = "¡Tiempo agotado!";
            clearInterval(intervaloImpuestosDashboard);
            return;
        }

        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
        const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
        const segundos = Math.floor((diferencia / 1000) % 60);

        document.getElementById("impuestosCountdownDashboard").textContent =
            `Restan ${dias} días, ${horas} horas, ${minutos} minutos y ${segundos} segundos`;
    };

    actualizar();
    intervaloImpuestosDashboard = setInterval(actualizar, 1000);
}

// Energía (similar a Impuestos)
function iniciarCuentaRegresivaEnergia() {
    const fechaFinal = new Date(localStorage.getItem("fechaFinalEnergia"));
    if (isNaN(fechaFinal)) return;

    const actualizar = () => {
        const ahora = new Date();
        const diferencia = fechaFinal - ahora;

        if (diferencia <= 0) {
            document.getElementById("energiaCountdownTexto").textContent = "¡Tiempo agotado!";
            clearInterval(intervaloEnergia);
            return;
        }

        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
        const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
        const segundos = Math.floor((diferencia / 1000) % 60);

        document.getElementById("energiaCountdownTexto").textContent =
            `Restan ${dias} días, ${horas} horas, ${minutos} minutos y ${segundos} segundos`;
    };

    actualizar();
    intervaloEnergia = setInterval(actualizar, 1000);
}

function mostrarCuentaRegresivaEnergiaEnDashboard() {
    const fechaFinal = new Date(localStorage.getItem("fechaFinalEnergia"));
    if (isNaN(fechaFinal)) return;

    document.getElementById("energiaDashboardCard").style.display = "block";

    const actualizar = () => {
        const ahora = new Date();
        const diferencia = fechaFinal - ahora;

        if (diferencia <= 0) {
            document.getElementById("energiaCountdownDashboard").textContent = "¡Tiempo agotado!";
            clearInterval(intervaloEnergiaDashboard);
            return;
        }

        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
        const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
        const segundos = Math.floor((diferencia / 1000) % 60);

        document.getElementById("energiaCountdownDashboard").textContent =
            `Restan ${dias} días, ${horas} horas, ${minutos} minutos y ${segundos} segundos`;
    };

    actualizar();
    intervaloEnergiaDashboard = setInterval(actualizar, 1000);
}

// Iniciar todo al cargar
window.onload = () => {
    iniciarCuentaRegresivaImpuestos();
    mostrarCuentaRegresivaImpuestosEnDashboard();
    iniciarCuentaRegresivaEnergia();
    mostrarCuentaRegresivaEnergiaEnDashboard();
    renderDashboard(); // Cargar Agua y Solaris al inicio también
};
