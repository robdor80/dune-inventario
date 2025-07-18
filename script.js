
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

        // Categorías por tipo
        const categoryOptions = {
            objects: [
                'Herramientas',
                'Consumibles',
                'Estructuras',
                'Componentes',
                'Vehiculares',
                'Otros'
            ],
            vehicles: [
                'Ornitópteros',
                'Moto de arena',
                'Naves',
                'Módulos',
                'Otros'
            ],
            weapons: [
                'Hoja corta',
                'Hoja larga',
                'Rifles',
                'Pistolas',
                'Explosivos',
                'Láseres',
                'Armas pesadas',
                'Otros'
            ]
        };

        // Inicialización
        document.addEventListener('DOMContentLoaded', function () {
            initializeApp();
            renderAguaTab();

        });

        function initializeApp() {
            loadDataFromStorage();
            setupEventListeners();
            renderAllTabs();
            populateCalculatorDropdown();
            renderObjectives();
            renderDashboard();
        }

        // Gestión de almacenamiento
        function loadDataFromStorage() {
            try {
                rawResources = JSON.parse(localStorage.getItem('duneRawResources')) || [];
                refinedResources = JSON.parse(localStorage.getItem('duneRefinedResources')) || [];

                // Migrar datos existentes de craftingItems
                const oldCraftingItems = JSON.parse(localStorage.getItem('duneCraftingItems')) || [];

                objects = JSON.parse(localStorage.getItem('duneObjects')) || [];
                vehicles = JSON.parse(localStorage.getItem('duneVehicles')) || [];
                weapons = JSON.parse(localStorage.getItem('duneWeapons')) || [];

                // Si no hay datos nuevos pero hay craftingItems, migrar
                if (objects.length === 0 && vehicles.length === 0 && weapons.length === 0 && oldCraftingItems.length > 0) {
                    migrateOldCraftingData(oldCraftingItems);
                }

                objectives = JSON.parse(localStorage.getItem('duneObjectives')) || [];

                // Asegurar que objetos tengan campo quantity
                [objects, vehicles, weapons].forEach(collection => {
                    collection.forEach(item => {
                        if (item.quantity === undefined) {
                            item.quantity = 0;
                        }
                    });
                });
            } catch (error) {
                console.error('Error loading data:', error);
                resetAllData();
            }
        }

        function migrateOldCraftingData(oldItems) {
            // Distribuir items según sus categorías
            oldItems.forEach(item => {
                if (!item.category) return;

                if (['Ornitópteros', 'Moto de arena', 'Naves', 'Módulos'].includes(item.category)) {
                    vehicles.push(item);
                } else if (['Hoja corta', 'Hoja larga', 'Rifles', 'Pistolas', 'Explosivos', 'Láseres', 'Armas pesadas'].includes(item.category)) {
                    weapons.push(item);
                } else {
                    objects.push(item);
                }
            });

            // Limpiar datos antiguos
            localStorage.removeItem('duneCraftingItems');
            saveToStorage();
        }

        function saveToStorage() {
            try {
                localStorage.setItem('duneRawResources', JSON.stringify(rawResources));
                localStorage.setItem('duneRefinedResources', JSON.stringify(refinedResources));
                localStorage.setItem('duneObjects', JSON.stringify(objects));
                localStorage.setItem('duneVehicles', JSON.stringify(vehicles));
                localStorage.setItem('duneWeapons', JSON.stringify(weapons));
                localStorage.setItem('duneObjectives', JSON.stringify(objectives));

                changeCount++;
                if (changeCount >= 5) {
                    createBackup();
                    changeCount = 0;
                }

                updateDashboardIfVisible();
            } catch (error) {
                console.error('Error saving data:', error);
                alert('Error al guardar datos. El almacenamiento local puede estar lleno.');
            }
        }

        function updateDashboardIfVisible() {
            if (document.getElementById('totalItems')) {
                renderDashboard();
            }
        }

        function createBackup() {
            const backup = {
                rawResources,
                refinedResources,
                objects,
                vehicles,
                weapons,
                objectives,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('duneBackup', JSON.stringify(backup));
        }

        function resetAllData() {
            rawResources = [];
            refinedResources = [];
            objects = [];
            vehicles = [];
            weapons = [];
            objectives = [];
            saveToStorage();
        }

        // Event Listeners
        function setupEventListeners() {
            // Pestañas
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => switchTab(btn.dataset.tab));
            });

            // Botones principales
            document.getElementById('addRawBtn').addEventListener('click', () => openResourceModal('raw'));
            document.getElementById('addRefinedBtn').addEventListener('click', () => openResourceModal('refined'));
            document.getElementById('addObjectBtn').addEventListener('click', () => openCraftingModal('objects'));
            document.getElementById('addVehicleBtn').addEventListener('click', () => openCraftingModal('vehicles'));
            document.getElementById('addWeaponBtn').addEventListener('click', () => openCraftingModal('weapons'));

            // Utilidades
            document.getElementById('exportBtn').addEventListener('click', exportData);
            document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
            document.getElementById('importFile').addEventListener('change', importData);
            document.getElementById('calculatorBtn').addEventListener('click', openCalculatorModal);
            document.getElementById('objectivesBtn').addEventListener('click', openObjectivesModal);

            // Búsqueda
            document.getElementById('globalSearch').addEventListener('input', handleGlobalSearch);
            document.getElementById('clearSearch').addEventListener('click', clearSearch);

            // Filtros
            setupFilterListeners();

            // Modales
            setupModalListeners();
        }

        function setupFilterListeners() {
            document.getElementById('rawCategoryFilter').addEventListener('change', () => renderTab('raw'));
            document.getElementById('rawLevelFilter').addEventListener('change', () => renderTab('raw'));
            document.getElementById('refinedCategoryFilter').addEventListener('change', () => renderTab('refined'));
            document.getElementById('refinedLevelFilter').addEventListener('change', () => renderTab('refined'));
            document.getElementById('objectCategoryFilter').addEventListener('change', () => renderTab('objects'));
            document.getElementById('objectStatusFilter').addEventListener('change', () => renderTab('objects'));
            document.getElementById('vehicleCategoryFilter').addEventListener('change', () => renderTab('vehicles'));
            document.getElementById('vehicleStatusFilter').addEventListener('change', () => renderTab('vehicles'));
            document.getElementById('weaponCategoryFilter').addEventListener('change', () => renderTab('weapons'));
            document.getElementById('weaponStatusFilter').addEventListener('change', () => renderTab('weapons'));
        }

        function setupModalListeners() {
            // Cerrar modales
            document.querySelectorAll('.close-btn').forEach(btn => {
                btn.addEventListener('click', closeAllModals);
            });

            document.querySelectorAll('.cancel-btn').forEach(btn => {
                btn.addEventListener('click', closeAllModals);
            });

            // Cerrar modal al hacer clic fuera
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) closeAllModals();
                });
            });

            // Formularios
            document.getElementById('resourceForm').addEventListener('submit', handleResourceSubmit);
            document.getElementById('craftingForm').addEventListener('submit', handleCraftingSubmit);

            // Específicos de objetos/vehículos/armas
            document.getElementById('addMaterialBtn').addEventListener('click', addMaterialToRecipe);

            // Calculadora
            document.getElementById('calculateBtn').addEventListener('click', performCalculation);

            // Objetivos
            document.getElementById('addObjectiveBtn').addEventListener('click', addObjective);
            document.getElementById('newObjective').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addObjective();
            });
        }

        // Navegación de pestañas
        function switchTab(tabName) {
            // Actualizar botones
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

            // Mostrar contenido
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');

            // Renderizar contenido
            renderTab(tabName);
        }

        // Agua
        function guardarAgua() {
            const litros = parseInt(document.getElementById('aguaLitros').value) || 0;
            const linterjones = parseInt(document.getElementById('aguaLinterjones').value) || 0;

            localStorage.setItem('aguaLitros', litros);
            localStorage.setItem('aguaLinterjones', linterjones);

            alert("Datos de agua guardados.");
        }



        // Solaris
        function guardarSolaris() {
            const cantidad = parseInt(document.getElementById('solarisCantidad').value) || 0;
            localStorage.setItem('solaris', cantidad);
            alert("Cantidad de Solaris guardada.");
        }

        // Al cargar, restaurar valores
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('aguaLinterjones').value = localStorage.getItem('aguaLinterjones') || 0;
            document.getElementById('aguaLitros').value = localStorage.getItem('aguaLitros') || 0;
            document.getElementById('solarisCantidad').value = localStorage.getItem('solaris') || 0;
        });


        // Renderizado
        function renderAllTabs() {
            renderTab('raw');
            renderTab('refined');
            renderTab('objects');
            renderTab('vehicles');
            renderTab('weapons');
        }

        function renderDashboard() {
            // Calcular estadísticas generales
            const totalItems = [...rawResources, ...refinedResources, ...objects, ...vehicles, ...weapons]
                .reduce((sum, item) => sum + (item.quantity || 0), 0);
            const totalObjectives = objectives.length;
            const completedObjectives = objectives.filter(obj => obj.completed).length;
            const pendingObjectives = objectives.filter(obj => !obj.completed);

            // Calcular items creables
            const craftableCount = [...refinedResources, ...objects, ...vehicles, ...weapons].filter(item => {
                if (!item.recipe || item.recipe.length === 0) return false;
                const status = getCraftingStatus(item);
                return status.canCraft;
            }).length;

            // Actualizar resumen superior
            document.getElementById('totalItems').textContent = totalItems.toLocaleString();
            document.getElementById('totalObjectives').textContent = `${completedObjectives}/${totalObjectives}`;
            document.getElementById('craftableItems').textContent = craftableCount;

            // Renderizar cada sección
            renderLowResources();
            renderCraftableItems();
            renderPendingObjectives();
            renderCategoryStats();
            renderTopResources();
            renderInventoryStatus();
        }

        function renderLowResources() {
            const container = document.getElementById('lowResourcesContent');
            const allResources = [...rawResources, ...refinedResources];
            const lowResources = allResources.filter(resource => resource.quantity < 10).sort((a, b) => a.quantity - b.quantity);

            if (lowResources.length === 0) {
                container.innerHTML = '<div class="empty-dashboard"><h4>¡Excelente!</h4><p>No tienes recursos escasos</p></div>';
                return;
            }

            container.innerHTML = lowResources.slice(0, 8).map(resource => `
                <div class="dashboard-item warning-item">
                    <div>
                        <div class="dashboard-item-name">${resource.name}</div>
                        <div class="dashboard-item-category">${resource.category} • Tier ${resource.level}</div>
                    </div>
                    <div class="dashboard-item-value">${resource.quantity}</div>
                </div>
            `).join('');
        }

        function renderCraftableItems() {
            const container = document.getElementById('craftableItemsContent');

            const allItems = [...refinedResources, ...objects, ...vehicles, ...weapons];

            console.log("Moto de arena (debug):", vehicles.find(v => v.name.toLowerCase().includes("moto")));
            console.log("Status:", getCraftingStatus(vehicles.find(v => v.name.toLowerCase().includes("moto"))));


            const allCraftable = allItems.filter(item => {
                if (!item.recipe || !Array.isArray(item.recipe) || item.recipe.length === 0) return false;
                const status = getCraftingStatus(item);
                return status.canCraft;
            });

            if (allCraftable.length === 0) {
                container.innerHTML = '<div class="empty-dashboard"><h4>Sin materiales</h4><p>Necesitas más recursos para crear</p></div>';
                return;
            }

            container.innerHTML = allCraftable.map(item => {

                const maxCraftable = getMaxCraftable(item);

                // Detección robusta del tipo de item
                let itemType = 'Otro';
                if (refinedResources.find(r => r.id === item.id)) itemType = 'Refinado';
                else if (objects.find(o => o.id === item.id)) itemType = 'Objeto';
                else if (vehicles.find(v => v.id === item.id)) itemType = 'Vehículo';
                else if (weapons.find(w => w.id === item.id)) itemType = 'Arma';

                return `
            <div class="dashboard-item success-item">
                <div>
                    <div class="dashboard-item-name">${item.name}</div>
                    <div class="dashboard-item-category">${item.category} (${itemType})</div>
                </div>
                <div class="dashboard-item-value">×${maxCraftable}</div>
            </div>
        `;
            }).join('');
        }


        function renderPendingObjectives() {
            const container = document.getElementById('pendingObjectivesContent');
            const pending = objectives.filter(obj => !obj.completed);

            if (pending.length === 0) {
                container.innerHTML = '<div class="empty-dashboard"><h4>¡Todo completado!</h4><p>No tienes objetivos pendientes</p></div>';
                return;
            }

            container.innerHTML = pending.slice(0, 5).map(objective => `
                <div class="objective-preview">
                    <div class="objective-preview-text">${objective.text}</div>
                </div>
            `).join('');
        }

        function renderCategoryStats() {
            const container = document.getElementById('categoryStatsContent');
            const allResources = [...rawResources, ...refinedResources];
            const categories = {};

            // Contar por categorías
            allResources.forEach(resource => {
                if (!categories[resource.category]) {
                    categories[resource.category] = { count: 0, total: 0 };
                }
                categories[resource.category].count++;
                categories[resource.category].total += resource.quantity;
            });

            if (Object.keys(categories).length === 0) {
                container.innerHTML = '<div class="empty-dashboard"><h4>Sin datos</h4><p>Añade recursos para ver estadísticas</p></div>';
                return;
            }

            const maxTotal = Math.max(...Object.values(categories).map(cat => cat.total));

            container.innerHTML = Object.entries(categories).map(([name, data]) => {
                const percentage = maxTotal > 0 ? (data.total / maxTotal) * 100 : 0;
                return `
                    <div class="category-stat">
                        <div class="category-name">
                            <span>${name}</span>
                        </div>
                        <div class="category-count">${data.total}</div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                `;
            }).join('');
        }

        function renderTopResources() {
            const container = document.getElementById('topResourcesContent');
            const allResources = [...rawResources, ...refinedResources]
                .filter(resource => resource.quantity > 0)
                .sort((a, b) => b.quantity - a.quantity);

            if (allResources.length === 0) {
                container.innerHTML = '<div class="empty-dashboard"><h4>Inventario vacío</h4><p>Añade recursos para ver el ranking</p></div>';
                return;
            }

            container.innerHTML = allResources.slice(0, 5).map((resource, index) => {
                const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
                return `
                    <div class="dashboard-item info-item">
                        <div>
                            <div class="dashboard-item-name">${medal} ${resource.name}</div>
                            <div class="dashboard-item-category">${resource.category}</div>
                        </div>
                        <div class="dashboard-item-value">${resource.quantity}</div>
                    </div>
                `;
            }).join('');
        }

        function renderInventoryStatus() {
            const container = document.getElementById('inventoryStatusContent');

            const totalRaw = rawResources.reduce((sum, item) => sum + item.quantity, 0);
            const totalRefined = refinedResources.reduce((sum, item) => sum + item.quantity, 0);
            const totalObjects = objects.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const totalVehicles = vehicles.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const totalWeapons = weapons.reduce((sum, item) => sum + (item.quantity || 0), 0);

            const uniqueRaw = rawResources.length;
            const uniqueRefined = refinedResources.length;
            const uniqueObjects = objects.length;
            const uniqueVehicles = vehicles.length;
            const uniqueWeapons = weapons.length;

            const completedObj = objectives.filter(obj => obj.completed).length;
            const totalObj = objectives.length;
            const objPercentage = totalObj > 0 ? Math.round((completedObj / totalObj) * 100) : 0;

            container.innerHTML = `
                <div class="dashboard-item">
                    <div class="dashboard-item-name">Recursos en bruto</div>
                    <div class="dashboard-item-value">${totalRaw} (${uniqueRaw} tipos)</div>
                </div>
                <div class="dashboard-item">
                    <div class="dashboard-item-name">Recursos refinados</div>
                    <div class="dashboard-item-value">${totalRefined} (${uniqueRefined} tipos)</div>
                </div>
                <div class="dashboard-item">
                    <div class="dashboard-item-name">Objetos</div>
                    <div class="dashboard-item-value">${totalObjects} (${uniqueObjects} tipos)</div>
                </div>
                <div class="dashboard-item">
                    <div class="dashboard-item-name">Vehículos</div>
                    <div class="dashboard-item-value">${totalVehicles} (${uniqueVehicles} tipos)</div>
                </div>
                <div class="dashboard-item">
                    <div class="dashboard-item-name">Armas</div>
                    <div class="dashboard-item-value">${totalWeapons} (${uniqueWeapons} tipos)</div>
                </div>
                <div class="dashboard-item">
                    <div class="dashboard-item-name">Progreso Objetivos</div>
                    <div class="dashboard-item-value">${objPercentage}%</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${objPercentage}%"></div>
                </div>
            `;
        }

        function renderTab(tabName) {
            switch (tabName) {
                case 'raw':
                    renderResources(rawResources, 'rawContainer', 'raw');
                    break;
                case 'refined':
                    renderResources(refinedResources, 'refinedContainer', 'refined');
                    break;
                case 'objects':
                    renderCrafting(objects, 'objectContainer', 'objects');
                    break;
                case 'vehicles':
                    renderCrafting(vehicles, 'vehicleContainer', 'vehicles');
                    break;
                case 'weapons':
                    renderCrafting(weapons, 'weaponContainer', 'weapons');
                    break;
                case 'dashboard':
                    renderDashboard();
                    break;
                case 'webs':
                    // Puedes poner renderWebs() si haces lógica luego
                    break;

            }
        }

        function renderResources(resources, containerId, type) {
            const container = document.getElementById(containerId);
            const filteredResources = filterResources(resources, type);

            if (filteredResources.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No hay recursos</h3>
                        <p>Añade tu primer recurso usando el botón correspondiente</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filteredResources.map(resource => `
                <div class="item-card" data-id="${resource.id}">
                    <div class="item-header">
                        <img src="${resource.image || getDefaultImage('resource')}" 
                             alt="${resource.name}" class="item-image"
                             onerror="this.src='${getDefaultImage('resource')}'">
                        <div class="item-info">
                            <h3>${resource.name}</h3>
                            <div class="item-category">${resource.category}</div>
                        </div>
                        <div class="item-level">Tier ${resource.level}</div>
                    </div>
                    
                    <div class="item-quantity">
                        <span class="quantity-label">Cantidad:</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="changeQuantity('${resource.id}', '${type}', -1)">-</button>
                            <span class="quantity-display">${resource.quantity}</span>
                            <button class="quantity-btn" onclick="changeQuantity('${resource.id}', '${type}', 1)">+</button>
                        </div>
                    </div>
                    
                    ${resource.notes ? `<div class="item-notes">${resource.notes}</div>` : ''}
                    
                    <div class="item-actions">
                        <button class="edit-btn" onclick="editResource('${resource.id}', '${type}')" title="Editar">✏️</button>
                        <button class="delete-btn" onclick="deleteResource('${resource.id}', '${type}')" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `).join('');
        }

        function renderCrafting(items, containerId, type) {
            const container = document.getElementById(containerId);
            const filteredItems = filterCrafting(items, type);

            if (filteredItems.length === 0) {
                const typeName = type === 'objects' ? 'objetos' : type === 'vehicles' ? 'vehículos' : 'armas';
                container.innerHTML = `
            <div class="empty-state">
                <h3>No hay ${typeName}</h3>
                <p>Añade tu primer ${typeName.slice(0, -1)} usando el botón correspondiente</p>
            </div>
        `;
                return;
            }

            container.innerHTML = filteredItems.map(item => {
                const craftingStatus = getCraftingStatus(item);
                const maxCraftable = getMaxCraftable(item);

                const statusHTML = `
            <span class="crafting-status ${craftingStatus.canCraft ? 'can-craft' : 'missing-materials'}">
                ${craftingStatus.canCraft ? `Puedo hacer ${maxCraftable}` : 'Faltan materiales'}
            </span>
        `;

                return `
            <div class="item-card crafting-card" data-id="${item.id}">
                <div class="item-header">
                    <img src="${item.image || getDefaultImage(type)}" 
                         alt="${item.name}" class="item-image"
                         onerror="this.src='${getDefaultImage(type)}'">
                    <div class="item-info">
                        <h3>${item.name}</h3>
                        <div class="item-category">${item.category}</div>
                    </div>
                </div>
                
                <div class="item-quantity">
                    <span class="quantity-label">Tengo:</span>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="changeQuantity('${item.id}', '${type}', -1)">-</button>
                        <span class="quantity-display">${item.quantity || 0}</span>
                        <button class="quantity-btn" onclick="changeQuantity('${item.id}', '${type}', 1)">+</button>
                    </div>
                </div>
                
                <div class="recipe-info">
                    <div class="recipe-title">Materiales necesarios:</div>
                    <div class="recipe-materials">
                        ${item.recipe.map(material => {
                    const available = findMaterialQuantity(material.name);
                    const sufficient = available >= material.quantity;
                    return `
                                <div class="material-item">
                                    <span class="material-name">${material.name} x${material.quantity}</span>
                                    <span class="${sufficient ? 'material-available' : 'material-missing'}">
                                        (${available}/${material.quantity})
                                    </span>
                                </div>
                            `;
                }).join('')}
                    </div>
                </div>
                
                <div class="craft-info">
                    <div>🔧 ${item.tool || 'Manual'}</div>
                    <div>⏱️ ${item.time}s</div>
                    <div>📦 Produce ${item.yield}</div>
                </div>
                
                ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}

                <div class="item-actions">
                    ${statusHTML}
                    <button class="edit-btn" onclick="editCrafting('${item.id}', '${type}')" title="Editar">✏️</button>
                    <button class="delete-btn" onclick="deleteCrafting('${item.id}', '${type}')" title="Eliminar">🗑️</button>
                </div>
            </div>
        `;
            }).join('');
        }


        // Imágenes por defecto
        function getDefaultImage(type) {
            const images = {
                resource: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNEE1NTY4Ii8+CjxwYXRoIGQ9Ik0zMCAyMEM0NCAyNyA0NCAzMyAzMCA0MEMxNiAzMyAxNiAyNyAzMCAyMFoiIGZpbGw9IiNGRkE3MjYiLz4KPHN2Zz4K',
                objects: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNEE1NTY4Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0MFY0MEgyMFYyMFpNMjUgMjVWMzVIMzVWMjVIMjVaIiBmaWxsPSIjRkZBNzI2Ii8+PC9zdmc+',
                vehicles: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNEE1NTY4Ii8+CjxwYXRoIGQ9Ik0xNSAzNUg0NUwyMCAyNUw0MCAyNVoiIGZpbGw9IiNGRkE3MjYiLz4KPGNpcmNsZSBjeD0iMjUiIGN5PSIzNSIgcj0iNCIgZmlsbD0iI0ZGQTcyNiIvPgo8Y2lyY2xlIGN4PSIzNSIgY3k9IjM1IiByPSI0IiBmaWxsPSIjRkZBNzI2Ii8+PC9zdmc+',
                weapons: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNEE1NTY4Ii8+CjxwYXRoIGQ9Ik0yMCA0MEwyNSAyMEwzNSAyMEw0MCA0MEgzNUgzMEgyNUgyMFoiIGZpbGw9IiNGRkE3MjYiLz4KPHJlY3QgeD0iMjciIHk9IjQwIiB3aWR0aD0iNiIgaGVpZ2h0PSIxMCIgZmlsbD0iI0ZGQTcyNiIvPjwvc3ZnPg=='
            };
            return images[type] || images.resource;
        }

        // Filtros
        function filterResources(resources, type) {
            const categoryFilter = document.getElementById(`${type}CategoryFilter`).value;
            const levelFilter = document.getElementById(`${type}LevelFilter`).value;
            const searchTerm = document.getElementById('globalSearch').value.toLowerCase();

            return resources.filter(resource => {
                const matchesCategory = !categoryFilter || resource.category === categoryFilter;
                const matchesLevel = !levelFilter || resource.level.toString() === levelFilter;
                const matchesSearch = !searchTerm ||
                    resource.name.toLowerCase().includes(searchTerm) ||
                    resource.category.toLowerCase().includes(searchTerm) ||
                    (resource.notes && resource.notes.toLowerCase().includes(searchTerm));

                return matchesCategory && matchesLevel && matchesSearch;
            });
        }

        function filterCrafting(items, type) {
            const categoryEl = document.getElementById(`${type}CategoryFilter`);
            const statusEl = document.getElementById(`${type}StatusFilter`);
            const categoryFilter = categoryEl ? categoryEl.value : "";
            const statusFilter = statusEl ? statusEl.value : "";
            const searchTerm = document.getElementById('globalSearch').value.toLowerCase();

            return items.filter(item => {
                const matchesCategory = !categoryFilter || item.category === categoryFilter;
                const matchesSearch = !searchTerm ||
                    item.name.toLowerCase().includes(searchTerm) ||
                    item.category.toLowerCase().includes(searchTerm) ||
                    (item.notes && item.notes.toLowerCase().includes(searchTerm));

                let matchesStatus = true;
                if (statusFilter) {
                    const status = getCraftingStatus(item);
                    matchesStatus = (statusFilter === 'can-craft' && status.canCraft) ||
                        (statusFilter === 'missing-materials' && !status.canCraft);
                }

                return matchesCategory && matchesSearch && matchesStatus;
            });
        }


        // Búsqueda
        function handleGlobalSearch() {
            renderAllTabs();
        }

        function clearSearch() {
            document.getElementById('globalSearch').value = '';
            renderAllTabs();
        }

        // Gestión de cantidades
        function changeQuantity(id, type, change) {
            let item;
            let collection;

            switch (type) {
                case 'raw':
                    collection = rawResources;
                    break;
                case 'refined':
                    collection = refinedResources;
                    break;
                case 'objects':
                    collection = objects;
                    break;
                case 'vehicles':
                    collection = vehicles;
                    break;
                case 'weapons':
                    collection = weapons;
                    break;
            }

            item = collection.find(i => i.id === id);

            if (item) {
                item.quantity = Math.max(0, (item.quantity || 0) + change);
                saveToStorage();
                renderTab(type);
                // Actualizar estado de creación en todas las pestañas que lo necesiten
                if (['raw', 'refined'].includes(type)) {
                    renderTab('objects');
                    renderTab('vehicles');
                    renderTab('weapons');
                }
            }
        }

        // Modales
        function openResourceModal(type) {
            editingType = type;
            editingItem = null;

            document.getElementById('resourceModalTitle').textContent = 'Añadir Recurso';
            document.getElementById('resourceForm').reset();
            document.getElementById('resourceModal').classList.add('show');
        }

        function openCraftingModal(type) {
            editingType = type;
            editingItem = null;

            const titles = {
                objects: 'Añadir Objeto',
                vehicles: 'Añadir Vehículo',
                weapons: 'Añadir Arma'
            };

            document.getElementById('craftingModalTitle').textContent = titles[type];
            document.getElementById('craftingForm').reset();
            document.getElementById('recipeContainer').innerHTML = '';

            // Actualizar opciones de categoría
            updateCategoryOptions(type);

            document.getElementById('craftingModal').classList.add('show');
        }

        function updateCategoryOptions(type) {
            const categorySelect = document.getElementById('craftingCategory');
            categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';

            if (categoryOptions[type]) {
                categoryOptions[type].forEach(category => {
                    categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
                });
            }
        }

        function openCalculatorModal() {
            populateCalculatorDropdown();
            document.getElementById('calculatorModal').classList.add('show');
        }

        function openObjectivesModal() {
            renderObjectives();
            document.getElementById('objectivesModal').classList.add('show');
        }

        function closeAllModals() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('show');
            });
            editingItem = null;
            editingType = null;
        }

        // Edición
        function editResource(id, type) {
            const resources = type === 'raw' ? rawResources : refinedResources;
            const resource = resources.find(r => r.id === id);

            if (resource) {
                editingItem = resource;
                editingType = type;

                document.getElementById('resourceModalTitle').textContent = 'Editar Recurso';
                document.getElementById('resourceName').value = resource.name;
                document.getElementById('resourceCategory').value = resource.category;
                document.getElementById('resourceLevel').value = resource.level;
                document.getElementById('resourceQuantity').value = resource.quantity;
                document.getElementById('resourceImage').value = resource.image || '';
                document.getElementById('resourceNotes').value = resource.notes || '';

                document.getElementById('resourceModal').classList.add('show');
            }
        }

        function editCrafting(id, type) {
            let collection;
            switch (type) {
                case 'objects':
                    collection = objects;
                    break;
                case 'vehicles':
                    collection = vehicles;
                    break;
                case 'weapons':
                    collection = weapons;
                    break;
            }

            const item = collection.find(i => i.id === id);

            if (item) {
                editingItem = item;
                editingType = type;

                const titles = {
                    objects: 'Editar Objeto',
                    vehicles: 'Editar Vehículo',
                    weapons: 'Editar Arma'
                };

                document.getElementById('craftingModalTitle').textContent = titles[type];
                updateCategoryOptions(type);

                document.getElementById('craftingName').value = item.name;
                document.getElementById('craftingCategory').value = item.category;
                document.getElementById('craftingImage').value = item.image || '';
                document.getElementById('craftingTool').value = item.tool || '';
                document.getElementById('craftingTime').value = item.time;
                document.getElementById('craftingYield').value = item.yield;
                document.getElementById('craftingNotes').value = item.notes || '';

                // Cargar receta
                const recipeContainer = document.getElementById('recipeContainer');
                recipeContainer.innerHTML = '';
                item.recipe.forEach(material => {
                    addMaterialToRecipe(material.name, material.quantity);
                });

                document.getElementById('craftingModal').classList.add('show');
            }
        }

        // Eliminación
        function deleteResource(id, type) {
            if (confirm('¿Estás seguro de que quieres eliminar este recurso?')) {
                if (type === 'raw') {
                    rawResources = rawResources.filter(r => r.id !== id);
                } else {
                    refinedResources = refinedResources.filter(r => r.id !== id);
                }
                saveToStorage();
                renderTab(type);
                renderTab('objects');
                renderTab('vehicles');
                renderTab('weapons');
            }
        }

        function deleteCrafting(id, type) {
            const typeNames = {
                objects: 'objeto',
                vehicles: 'vehículo',
                weapons: 'arma'
            };

            if (confirm(`¿Estás seguro de que quieres eliminar este ${typeNames[type]}?`)) {
                switch (type) {
                    case 'objects':
                        objects = objects.filter(i => i.id !== id);
                        break;
                    case 'vehicles':
                        vehicles = vehicles.filter(i => i.id !== id);
                        break;
                    case 'weapons':
                        weapons = weapons.filter(i => i.id !== id);
                        break;
                }
                saveToStorage();
                renderTab(type);
                populateCalculatorDropdown();
            }
        }

        // Formularios
        function handleResourceSubmit(e) {
            e.preventDefault();

            const type = editingType;
            const resources = type === 'raw' ? rawResources : refinedResources;

            const formData = {
                name: document.getElementById('resourceName').value.trim(),
                category: document.getElementById('resourceCategory').value,
                level: parseInt(document.getElementById('resourceLevel').value),
                quantity: parseInt(document.getElementById('resourceQuantity').value),
                image: document.getElementById('resourceImage').value.trim(),
                notes: document.getElementById('resourceNotes').value.trim()
            };

            if (
                !type || !["raw", "refined"].includes(type) ||
                !formData.name || formData.name === "undefined" ||
                !formData.category || formData.category === "undefined" ||
                isNaN(formData.level) ||
                isNaN(formData.quantity)
            ) {
                alert("Por favor, completa correctamente todos los campos obligatorios.");
                return;
            }

            if (!editingItem && resources.some(r => r.name.toLowerCase() === formData.name.toLowerCase())) {
                alert('Ya existe un recurso con ese nombre.');
                return;
            }

            if (editingItem) {
                Object.assign(editingItem, formData);
            } else {
                formData.id = generateId();
                resources.push(formData);
            }

            saveToStorage();
            renderTab(editingType);
            renderTab('objects');
            renderTab('vehicles');
            renderTab('weapons');
            closeAllModals();
        }


        function handleCraftingSubmit(e) {
            e.preventDefault();

            const recipe = [];
            document.querySelectorAll('.recipe-item').forEach(item => {
                const materialSelect = item.querySelector('select');
                const quantityInput = item.querySelector('input');

                if (materialSelect.value && quantityInput.value > 0) {
                    recipe.push({
                        name: materialSelect.value,
                        quantity: parseInt(quantityInput.value)
                    });
                }
            });

            const formData = {
                name: document.getElementById('craftingName').value.trim(),
                category: document.getElementById('craftingCategory').value,
                image: document.getElementById('craftingImage').value.trim(),
                tool: document.getElementById('craftingTool').value,
                time: parseInt(document.getElementById('craftingTime').value),
                yield: parseInt(document.getElementById('craftingYield').value),
                recipe: recipe,
                notes: document.getElementById('craftingNotes').value.trim()
            };

            // Validación
            if (!formData.name || !formData.category) {
                alert('Por favor, completa todos los campos obligatorios.');
                return;
            }

            if (recipe.length === 0) {
                alert('Debes añadir al menos un material a la receta.');
                return;
            }

            let collection;
            switch (editingType) {
                case 'objects':
                    collection = objects;
                    break;
                case 'vehicles':
                    collection = vehicles;
                    break;
                case 'weapons':
                    collection = weapons;
                    break;
            }

            // Verificar duplicados
            if (!editingItem && collection.some(i => i.name.toLowerCase() === formData.name.toLowerCase())) {
                alert('Ya existe un elemento con ese nombre.');
                return;
            }

            if (editingItem) {
                // Editar
                Object.assign(editingItem, formData);
                if (editingItem.quantity === undefined) {
                    editingItem.quantity = 0;
                }
            } else {
                // Crear nuevo
                formData.id = generateId();
                formData.quantity = 0;
                collection.push(formData);
            }

            saveToStorage();
            renderTab(editingType);
            populateCalculatorDropdown();
            closeAllModals();
        }

        // Gestión de recetas
        function addMaterialToRecipe(materialName = '', quantity = 1) {
            const recipeContainer = document.getElementById('recipeContainer');
            const allMaterials = [...rawResources, ...refinedResources, ...objects];


            const recipeItem = document.createElement('div');
            recipeItem.className = 'recipe-item';
            recipeItem.innerHTML = `
                <select required>
                    <option value="">Seleccionar material</option>
                    ${allMaterials.map(material =>
                `<option value="${material.name}" ${material.name === materialName ? 'selected' : ''}>${material.name}</option>`
            ).join('')}
                </select>
                <input type="number" min="1" value="${quantity}" placeholder="Cantidad" required>
                <button type="button" class="remove-material" onclick="this.parentElement.remove()">Eliminar</button>
            `;

            recipeContainer.appendChild(recipeItem);
        }

        // Lógica de creación
        function getCraftingStatus(item) {
            if (!item?.recipe || !Array.isArray(item.recipe)) {
                return {
                    canCraft: false,
                    materials: []
                };
            }

            const materialsStatus = item.recipe.map(material => {
                const available = findMaterialQuantity(material.name);
                return {
                    name: material.name,
                    needed: material.quantity,
                    available: available,
                    sufficient: available >= material.quantity
                };
            });

            const canCraft = materialsStatus.every(m => m.sufficient);

            return {
                canCraft,
                materials: materialsStatus
            };
        }


        function getMaxCraftable(item) {
            if (!item?.recipe || !Array.isArray(item.recipe)) {
                return 0;
            }

            let maxCraftable = Infinity;

            item.recipe.forEach(material => {
                const available = findMaterialQuantity(material.name);
                const possibleFromThis = Math.floor(available / material.quantity);
                maxCraftable = Math.min(maxCraftable, possibleFromThis);
            });

            return maxCraftable === Infinity ? 0 : maxCraftable * (item.yield || 1);
        }


        function findMaterialQuantity(materialName) {
            const rawMaterial = rawResources.find(r => r.name === materialName);
            if (rawMaterial) return rawMaterial.quantity;

            const refinedMaterial = refinedResources.find(r => r.name === materialName);
            if (refinedMaterial) return refinedMaterial.quantity;

            const objectMaterial = objects.find(r => r.name === materialName);
            if (objectMaterial) return objectMaterial.quantity;

            return 0;
        }


        // Calculadora
        function populateCalculatorDropdown() {
            const dropdown = document.getElementById('calcItem');
            dropdown.innerHTML = '<option value="">Seleccionar objeto</option>';

            const allCraftable = [...objects, ...vehicles, ...weapons];
            allCraftable.forEach(item => {
                let typeLabel = '';
                if (objects.includes(item)) typeLabel = ' (Objeto)';
                else if (vehicles.includes(item)) typeLabel = ' (Vehículo)';
                else if (weapons.includes(item)) typeLabel = ' (Arma)';

                dropdown.innerHTML += `<option value="${item.id}" data-type="${getItemType(item)}">${item.name}${typeLabel}</option>`;
            });
        }

        function getItemType(item) {
            if (objects.includes(item)) return 'objects';
            if (vehicles.includes(item)) return 'vehicles';
            if (weapons.includes(item)) return 'weapons';
            return 'unknown';
        }

        function performCalculation() {
            const itemId = document.getElementById('calcItem').value;
            const quantity = parseInt(document.getElementById('calcQuantity').value);

            if (!itemId || !quantity) {
                alert('Por favor, selecciona un objeto y cantidad.');
                return;
            }

            const allItems = [...objects, ...vehicles, ...weapons];
            const item = allItems.find(i => i.id === itemId);
            if (!item) return;

            const craftingBatches = Math.ceil(quantity / item.yield);
            const materialsNeeded = {};

            item.recipe.forEach(material => {
                materialsNeeded[material.name] = material.quantity * craftingBatches;
            });

            const resultsContainer = document.getElementById('calculatorResults');
            resultsContainer.innerHTML = `
                <h4>Para hacer ${quantity} ${item.name} necesitas:</h4>
                <div class="materials-needed">
                    ${Object.entries(materialsNeeded).map(([name, needed]) => {
                const available = findMaterialQuantity(name);
                const sufficient = available >= needed;
                return `
                            <div class="needed-item ${sufficient ? 'needed-sufficient' : 'needed-insufficient'}">
                                <span>${name}</span>
                                <span style="color: ${sufficient ? '#48bb78' : '#f56565'}">
                                    ${needed} necesarios (tienes ${available})
                                </span>
                            </div>
                        `;
            }).join('')}
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #4a5568; color: #a0aec0;">
                    Necesitarás hacer ${craftingBatches} lotes de creación
                </div>
            `;
        }

        // Objetivos
        function addObjective() {
            const input = document.getElementById('newObjective');
            const text = input.value.trim();

            if (text) {
                const objective = {
                    id: generateId(),
                    text: text,
                    completed: false,
                    createdAt: new Date().toISOString()
                };

                objectives.push(objective);
                saveToStorage();
                renderObjectives();
                input.value = '';
            }
        }

        function renderObjectives() {
            const container = document.getElementById('objectivesList');

            if (objectives.length === 0) {
                container.innerHTML = '<div class="empty-state">No tienes objetivos. ¡Añade tu primer objetivo!</div>';
                return;
            }

            container.innerHTML = objectives.map(objective => `
                <div class="objective-item ${objective.completed ? 'completed' : ''}">
                    <div class="objective-text">${objective.text}</div>
                    <div class="objective-actions">
                        ${!objective.completed ? `<button class="complete-btn" onclick="completeObjective('${objective.id}')">Completar</button>` : ''}
                        <button class="delete-btn" onclick="deleteObjective('${objective.id}')" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `).join('');
        }

        function completeObjective(id) {
            const objective = objectives.find(o => o.id === id);
            if (objective) {
                objective.completed = true;
                objective.completedAt = new Date().toISOString();
                saveToStorage();
                renderObjectives();
            }
        }

        function deleteObjective(id) {
            if (confirm('¿Eliminar este objetivo?')) {
                objectives = objectives.filter(o => o.id !== id);
                saveToStorage();
                renderObjectives();
            }
        }

        // Exportar/Importar
        function exportData() {
            const data = {
                rawResources,
                refinedResources,
                objects,
                vehicles,
                weapons,
                objectives,
                exportDate: new Date().toISOString(),
                version: '2.0'
            };

            // Crear archivo CSV
            const csvContent = generateCSV(data);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');

            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `dune-inventory-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // También exportar JSON
            const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const jsonLink = document.createElement('a');
            const jsonUrl = URL.createObjectURL(jsonBlob);
            jsonLink.setAttribute('href', jsonUrl);
            jsonLink.setAttribute('download', `dune-inventory-${new Date().toISOString().split('T')[0]}.json`);
            jsonLink.style.visibility = 'hidden';
            document.body.appendChild(jsonLink);
            jsonLink.click();
            document.body.removeChild(jsonLink);
        }

        function generateCSV(data) {
            let csv = 'DUNE AWAKENING - INVENTARIO\n\n';

            // Recursos Raw
            csv += 'RECURSOS EN BRUTO\n';
            csv += 'Nombre,Categoría,Nivel,Cantidad,Notas\n';
            data.rawResources.forEach(resource => {
                csv += `"${resource.name}","${resource.category}",${resource.level},${resource.quantity},"${resource.notes || ''}"\n`;
            });

            csv += '\nRECURSOS REFINADOS\n';
            csv += 'Nombre,Categoría,Nivel,Cantidad,Notas\n';
            data.refinedResources.forEach(resource => {
                csv += `"${resource.name}","${resource.category}",${resource.level},${resource.quantity},"${resource.notes || ''}"\n`;
            });

            csv += '\nOBJETOS\n';
            csv += 'Nombre,Categoría,Herramienta,Tiempo,Produce,Materiales,Notas\n';
            data.objects.forEach(item => {
                const materials = item.recipe.map(m => `${m.name} x${m.quantity}`).join('; ');
                csv += `"${item.name}","${item.category}","${item.tool || ''}",${item.time},${item.yield},"${materials}","${item.notes || ''}"\n`;
            });

            csv += '\nVEHÍCULOS\n';
            csv += 'Nombre,Categoría,Herramienta,Tiempo,Produce,Materiales,Notas\n';
            data.vehicles.forEach(item => {
                const materials = item.recipe.map(m => `${m.name} x${m.quantity}`).join('; ');
                csv += `"${item.name}","${item.category}","${item.tool || ''}",${item.time},${item.yield},"${materials}","${item.notes || ''}"\n`;
            });

            csv += '\nARMAS\n';
            csv += 'Nombre,Categoría,Herramienta,Tiempo,Produce,Materiales,Notas\n';
            data.weapons.forEach(item => {
                const materials = item.recipe.map(m => `${m.name} x${m.quantity}`).join('; ');
                csv += `"${item.name}","${item.category}","${item.tool || ''}",${item.time},${item.yield},"${materials}","${item.notes || ''}"\n`;
            });

            csv += '\nOBJETIVOS\n';
            csv += 'Objetivo,Estado,Fecha Creación,Fecha Completado\n';
            data.objectives.forEach(objective => {
                csv += `"${objective.text}","${objective.completed ? 'Completado' : 'Pendiente'}","${objective.createdAt}","${objective.completedAt || ''}"\n`;
            });

            return csv;
        }

        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);

                    if (confirm('¿Importar datos? Esto sobrescribirá todos los datos actuales.')) {
                        rawResources = data.rawResources || [];
                        refinedResources = data.refinedResources || [];
                        objects = data.objects || [];
                        vehicles = data.vehicles || [];
                        weapons = data.weapons || [];
                        objectives = data.objectives || [];

                        // Migrar datos antiguos si es necesario
                        if (data.craftingItems && data.craftingItems.length > 0) {
                            migrateOldCraftingData(data.craftingItems);
                        }

                        // Asegurar que objetos tengan quantity
                        [objects, vehicles, weapons].forEach(collection => {
                            collection.forEach(item => {
                                if (item.quantity === undefined) {
                                    item.quantity = 0;
                                }
                            });
                        });

                        saveToStorage();
                        renderAllTabs();
                        populateCalculatorDropdown();
                        renderObjectives();

                        alert('Datos importados correctamente.');
                    }
                } catch (error) {
                    alert('Error al importar el archivo. Asegúrate de que sea un archivo JSON válido.');
                }
            };
            reader.readAsText(file);
        }

        // Utilidades
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        function renderAguaTab() {
            document.getElementById('aguaLitros').value = localStorage.getItem('aguaLitros') || 0;
            document.getElementById('aguaLinterjones').value = localStorage.getItem('aguaLinterjones') || 0;
        }


        // Cargar litros en cisternas desde localStorage
        document.getElementById('aguaLitros').value = localStorage.getItem('aguaLitros') || 0;



        // Funciones globales para onclick
        window.changeQuantity = changeQuantity;
        window.editResource = editResource;
        window.editCrafting = editCrafting;
        window.deleteResource = deleteResource;
        window.deleteCrafting = deleteCrafting;
        window.completeObjective = completeObjective;
        window.deleteObjective = deleteObjective;
    


        const firebaseConfig = {
            apiKey: "AIzaSyAs3ZeDo6g_SwaiGbruER2444rWkafQLTU",
            authDomain: "dune-inventario.firebaseapp.com",
            projectId: "dune-inventario",
            storageBucket: "dune-inventario.firebasestorage.app",
            messagingSenderId: "26414027507",
            appId: "1:26414027507:web:b8970fb32a837d7117dd86"
        };


        // Inicializar Firebase en modo compatibilidad
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();
    


        async function guardarDatosEnFirestore(userId) {
            const datos = {
                rawResources,
                refinedResources,
                objects,
                vehicles,
                weapons,
                objectives,
                aguaLinterjones: parseInt(localStorage.getItem('aguaLinterjones')) || 0,
                aguaLitros: parseInt(localStorage.getItem('aguaLitros')) || 0,
                solaris: parseInt(localStorage.getItem('solaris')) || 0
            };

            try {
                await db.collection("users").doc(userId).set(datos);
                console.log("✅ Datos guardados en Firestore");
            } catch (error) {
                console.error("❌ Error al guardar en Firestore:", error);
            }
        }

        async function cargarDatosDesdeFirestore(userId) {
            try {
                const doc = await db.collection("users").doc(userId).get();
                if (doc.exists) {
                    const datos = doc.data();
                    rawResources = datos.rawResources || [];
                    refinedResources = datos.refinedResources || [];
                    objects = datos.objects || [];
                    vehicles = datos.vehicles || [];
                    weapons = datos.weapons || [];
                    objectives = datos.objectives || [];

                    localStorage.setItem('aguaLinterjones', datos.aguaLinterjones || 0);
                    localStorage.setItem('aguaLitros', datos.aguaLitros || 0);
                    localStorage.setItem('solaris', datos.solaris || 0);

                    saveToStorage(); // Guarda en localStorage

                    // 🔄 Refrescar visualmente el dashboard y pestañas
                    renderDashboard?.();
                    renderRawResources?.();
                    renderRefinedResources?.();
                    renderObjects?.();
                    renderVehicles?.();
                    renderWeapons?.();
                    renderObjectives?.();

                    console.log("✅ Datos cargados desde Firestore y vistas actualizadas");
                } else {
                    console.log("ℹ️ No hay datos aún en Firestore para este usuario.");
                }
            } catch (error) {
                console.error("❌ Error al cargar desde Firestore:", error);
            }
        }

    


        const loginBtn = document.getElementById("loginBtn");
        const logoutBtn = document.getElementById("logoutBtn");
        const userNameSpan = document.getElementById("userName");

        // Iniciar sesión con Google
        loginBtn.addEventListener("click", () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(console.error);
        });

        // Cerrar sesión
        logoutBtn.addEventListener("click", () => {
            auth.signOut().catch(console.error);
        });

        // Detectar cambios en la sesión
        auth.onAuthStateChanged(user => {
            if (user) {
                loginBtn.style.display = "none";
                logoutBtn.style.display = "inline-block";
                userNameSpan.textContent = `👤 ${user.displayName}`;

                // Cargar datos del usuario desde Firestore
                cargarDatosDesdeFirestore(user.uid);
                recuperarDatosImpuestos();
                recuperarDatosEnergia();



                // Guardar cada 30 segundos automáticamente
                setInterval(() => guardarDatosEnFirestore(user.uid), 30000);
            } else {
                loginBtn.style.display = "inline-block";
                logoutBtn.style.display = "none";
                userNameSpan.textContent = "";
            }
        });

        let impuestosIntervalo = null;

        document.getElementById('addImpuestoBtn').addEventListener('click', () => {
            document.getElementById('impuestosFormContainer').style.display = 'block';
        });

        document.getElementById('guardarImpuestosBtn').addEventListener('click', async () => {
            const dias = parseInt(document.getElementById('impuestosDias').value) || 0;
            const horas = parseInt(document.getElementById('impuestosHoras').value) || 0;

            const ahora = new Date();
            const vencimiento = new Date(ahora.getTime() + (dias * 24 + horas) * 60 * 60 * 1000);

            const user = firebase.auth().currentUser;
            if (!user) {
                alert("Debes iniciar sesión antes de guardar los datos.");
                return;
            }
            const userId = user.uid;

            await firebase.firestore().collection("usuarios").doc(userId).set({
                impuestosVencimiento: vencimiento.toISOString()
            }, { merge: true });

            document.getElementById('impuestosFormContainer').style.display = 'none';
            cargarCuentaRegresivaImpuestos(vencimiento);
        });

        function cargarCuentaRegresivaImpuestos(fechaFin) {
            clearInterval(impuestosIntervalo);
            document.getElementById('impuestosCuentaRegresiva').style.display = 'block';
            document.getElementById('impuestosDashboardCard').style.display = 'block';

            function actualizar() {
                const ahora = new Date();
                const fin = new Date(fechaFin);
                const diferencia = fin - ahora;

                if (diferencia <= 0) {
                    document.getElementById('impuestosCountdownTexto').textContent = "⚠️ ¡Impuestos vencidos!";
                    document.getElementById('impuestosCountdownDashboard').textContent = "⚠️ ¡Impuestos vencidos!";
                    clearInterval(impuestosIntervalo);
                    return;
                }

                const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
                const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
                const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

                const texto = `Restan ${dias} días, ${horas} horas, ${minutos} minutos y ${segundos} segundos para pagar los impuestos.`;
                document.getElementById('impuestosCountdownTexto').textContent = texto;
                document.getElementById('impuestosCountdownDashboard').textContent = texto;
            }

            actualizar();
            impuestosIntervalo = setInterval(actualizar, 1000);
        }

        async function recuperarDatosImpuestos() {
            const user = firebase.auth().currentUser;
            if (!user) return;

            const doc = await firebase.firestore().collection("usuarios").doc(user.uid).get();
            if (doc.exists && doc.data().impuestosVencimiento) {
                cargarCuentaRegresivaImpuestos(doc.data().impuestosVencimiento);
            }
        }

    


        let energiaIntervalo = null;

        document.getElementById('addEnergiaBtn').addEventListener('click', () => {
            document.getElementById('energiaFormContainer').style.display = 'block';
        });

        document.getElementById('guardarEnergiaBtn').addEventListener('click', async () => {
            const dias = parseInt(document.getElementById('energiaDias').value) || 0;
            const horas = parseInt(document.getElementById('energiaHoras').value) || 0;

            const ahora = new Date();
            const vencimiento = new Date(ahora.getTime() + (dias * 24 + horas) * 60 * 60 * 1000);

            const user = firebase.auth().currentUser;
            if (!user) {
                alert("Debes iniciar sesión antes de guardar los datos.");
                return;
            }

            const userId = user.uid;

            await firebase.firestore().collection("usuarios").doc(userId).set({
                energiaVencimiento: vencimiento.toISOString()
            }, { merge: true });

            document.getElementById('energiaFormContainer').style.display = 'none';
            cargarCuentaRegresivaEnergia(vencimiento);
        });

        function cargarCuentaRegresivaEnergia(fechaFin) {
            clearInterval(energiaIntervalo);
            document.getElementById('energiaCuentaRegresiva').style.display = 'block';
            document.getElementById('energiaDashboardCard').style.display = 'block';

            function actualizar() {
                const ahora = new Date();
                const fin = new Date(fechaFin);
                const diferencia = fin - ahora;

                if (diferencia <= 0) {
                    document.getElementById('energiaCountdownTexto').textContent = "⚠️ ¡Energía agotada!";
                    document.getElementById('energiaCountdownDashboard').textContent = "⚠️ ¡Energía agotada!";
                    clearInterval(energiaIntervalo);
                    return;
                }

                const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
                const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
                const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

                const texto = `Restan ${dias} días, ${horas} horas, ${minutos} minutos y ${segundos} segundos de energía.`;
                document.getElementById('energiaCountdownTexto').textContent = texto;
                document.getElementById('energiaCountdownDashboard').textContent = texto;
            }

            actualizar();
            energiaIntervalo = setInterval(actualizar, 1000);
        }

        async function recuperarDatosEnergia() {
            const user = firebase.auth().currentUser;
            if (!user) return;

            const doc = await firebase.firestore().collection("usuarios").doc(user.uid).get();
            if (doc.exists && doc.data().energiaVencimiento) {
                cargarCuentaRegresivaEnergia(doc.data().energiaVencimiento);
            }
        }
    



        const saveBtn = document.getElementById("saveBtn");

        saveBtn.addEventListener("click", () => {
            const user = auth.currentUser;
            if (user) {
                guardarDatosEnFirestore(user.uid);
            } else {
                alert("Debes iniciar sesión para guardar tus datos.");
            }
        });

        let tiempoEnergiaRestante = null;
let intervaloEnergia = null;
const energiaCountdownTexto = document.getElementById("energiaCountdownTexto");
const guardarEnergiaBtn = document.getElementById("guardarEnergiaBtn");

guardarEnergiaBtn.addEventListener("click", () => {
  const dias = parseInt(document.getElementById("diasEnergiaInput").value) || 0;
  const horas = parseInt(document.getElementById("horasEnergiaInput").value) || 0;

  const ahora = new Date();
  ahora.setHours(ahora.getHours() + horas + dias * 24);
  tiempoEnergiaRestante = ahora;

  if (user) {
    guardarDatosFirestore(`usuarios/${user.uid}/energia`, {
      tiempoEnergiaRestante: ahora.toISOString()
    });
  }

  iniciarCuentaRegresivaEnergia();
  document.querySelector(".energia-formulario").style.display = "none";
});

function iniciarCuentaRegresivaEnergia() {
  if (!tiempoEnergiaRestante) return;

  clearInterval(intervaloEnergia);

  intervaloEnergia = setInterval(() => {
    const ahora = new Date();
    const diferencia = new Date(tiempoEnergiaRestante) - ahora;

    if (diferencia <= 0) {
      clearInterval(intervaloEnergia);
      energiaCountdownTexto.textContent = "⛔ Energía agotada";
      return;
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
    const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
    const segundos = Math.floor((diferencia / 1000) % 60);

    energiaCountdownTexto.textContent =
      `Restan ${dias} días, ${horas} horas, ${minutos} minutos y ${segundos} segundos de energía`;
  }, 1000);
}

// Cuenta regresiva global
let energiaInterval = null;
let impuestosInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    // Relojes al cargar
    if (localStorage.getItem('energiaVencimiento')) iniciarCuentaRegresiva('energia');
    if (localStorage.getItem('impuestosVencimiento')) iniciarCuentaRegresiva('impuestos');

    // Botones de formulario Energía
    document.getElementById('addEnergiaBtn').addEventListener('click', () => {
        document.getElementById('energiaFormContainer').style.display = 'block';
    });

    document.getElementById('guardarEnergiaBtn').addEventListener('click', () => {
        const dias = parseInt(document.getElementById('energiaDias').value) || 0;
        const horas = parseInt(document.getElementById('energiaHoras').value) || 0;
        const now = new Date();
        const vencimiento = new Date(now.getTime() + ((dias * 24 + horas) * 60 * 60 * 1000));
        localStorage.setItem('energiaVencimiento', vencimiento.toISOString());
        document.getElementById('energiaFormContainer').style.display = 'none';
        document.getElementById('energiaCuentaRegresiva').style.display = 'block';
        document.getElementById('energiaDashboardCard').style.display = 'block';
        iniciarCuentaRegresiva('energia');
    });

    // Botones de formulario Impuestos
    document.getElementById('addImpuestoBtn').addEventListener('click', () => {
        document.getElementById('impuestosFormContainer').style.display = 'block';
    });

    document.getElementById('guardarImpuestosBtn').addEventListener('click', () => {
        const dias = parseInt(document.getElementById('impuestosDias').value) || 0;
        const horas = parseInt(document.getElementById('impuestosHoras').value) || 0;
        const now = new Date();
        const vencimiento = new Date(now.getTime() + ((dias * 24 + horas) * 60 * 60 * 1000));
        localStorage.setItem('impuestosVencimiento', vencimiento.toISOString());
        document.getElementById('impuestosFormContainer').style.display = 'none';
        document.getElementById('impuestosCuentaRegresiva').style.display = 'block';
        document.getElementById('impuestosDashboardCard').style.display = 'block';
        iniciarCuentaRegresiva('impuestos');
    });
});

function iniciarCuentaRegresiva(tipo) {
    const vencimiento = new Date(localStorage.getItem(`${tipo}Vencimiento`));
    const destinoElemento = document.getElementById(`${tipo}CountdownTexto`);
    const dashboardElemento = document.getElementById(`${tipo}CountdownDashboard`);
    const intervaloRef = tipo === 'energia' ? 'energiaInterval' : 'impuestosInterval';

    if (window[intervaloRef]) clearInterval(window[intervaloRef]);

    window[intervaloRef] = setInterval(() => {
        const ahora = new Date();
        const diferencia = vencimiento - ahora;

        if (diferencia <= 0) {
            clearInterval(window[intervaloRef]);
            destinoElemento.textContent = '⛔ Tiempo agotado';
            dashboardElemento.textContent = '⛔';
            return;
        }

        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
        const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
        const segundos = Math.floor((diferencia / 1000) % 60);

        const texto = `Restan ${dias} días, ${horas} horas, ${minutos} minutos y ${segundos} segundos`;

        destinoElemento.textContent = texto;
        dashboardElemento.textContent = texto;
    }, 1000);
}



    