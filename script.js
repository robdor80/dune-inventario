// script.js corregido - sincronización Firebase para Agua y Solaris
// =================== VARIABLES GLOBALES ===================
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

// =================== INICIALIZACIÓN ===================
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();

    // Restaurar valores guardados (si los hay)
    document.getElementById('aguaLinterjones').value = localStorage.getItem('aguaLinterjones') || 0;
    document.getElementById('aguaLitros').value = localStorage.getItem('aguaLitros') || 0;
    document.getElementById('solarisCantidad').value = localStorage.getItem('solaris') || 0;

    renderDashboard();
});
