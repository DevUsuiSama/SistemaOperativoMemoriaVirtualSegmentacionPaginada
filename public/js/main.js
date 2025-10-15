// ========== CONFIGURACIÓN GENERAL ==========
const menu = document.getElementById('menu');
const hamburger = document.getElementById('hamburger');
const themeToggle = document.getElementById('themeToggle');
const contentSections = document.querySelectorAll('.content__section');
const menuLinks = document.querySelectorAll('.menu__link');

// Estados de simulación
const simulationState = {
    virtualMemory: {
        running: false,
        paused: false,
        currentStep: 0,
        totalSteps: 12,
        intervalId: null,
        speed: 1500,
        algorithm: 'fifo',
        pageFaults: 0,
        memoryUsage: 0
    },
    pageTable: {
        running: false,
        paused: false,
        currentStep: 0,
        totalSteps: 8,
        intervalId: null,
        speed: 2000
    },
    comparison: {
        running: false,
        paused: false,
        currentStep: 0,
        totalSteps: 10,
        intervalId: null,
        speed: 2500,
        mode: 'comparison'
    },
    hybrid: {
        running: false,
        paused: false,
        currentStep: 0,
        totalSteps: 6,
        intervalId: null,
        speed: 2000
    }
};

// ========== CONFIGURACIÓN DE INTERFAZ ==========
hamburger.addEventListener('click', () => {
    menu.classList.toggle('menu--open');
    hamburger.classList.toggle('hamburger--open');
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('.theme-toggle__icon');
    if (icon) {
        icon.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    }
});

menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);

        contentSections.forEach(section => {
            section.style.display = 'none';
        });

        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        menuLinks.forEach(l => l.classList.remove('menu__link--active'));
        link.classList.add('menu__link--active');

        if (window.innerWidth <= 768) {
            menu.classList.remove('menu--open');
            hamburger.classList.remove('hamburger--open');
        }

        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    });
});

// ========== CLASE BASE THREE.JS ==========
class ThreeScene {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Contenedor ${containerId} no encontrado`);
            return;
        }

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupControls();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupRenderer() {
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    onWindowResize() {
        if (!this.container) return;
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        if (!this.renderer) return;
        requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// ========== MEMORIA VIRTUAL ==========
class VirtualMemoryScene extends ThreeScene {
    constructor(containerId) {
        super(containerId);
        if (this.container) {
            this.createScene();
            this.animate();
        }
    }

    createScene() {
        // Limpiar escena
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.setupLights();

        // Crear componentes
        this.physicalMemory = this.createMemoryBlock(4, 0x3498db, -6, 0, "FÍSICA");
        this.virtualMemory = this.createMemoryBlock(8, 0xe74c3c, 0, 0, "VIRTUAL");
        this.diskStorage = this.createMemoryBlock(8, 0xf39c12, 6, 0, "DISCO");

        // Estado interno
        this.physicalFrames = Array(4).fill(null);
        this.pageTable = {};
        this.accessSequence = [0, 1, 2, 3, 4, 5, 0, 1, 6, 7, 2, 3];
    }

    createMemoryBlock(count, color, x, y, label) {
        const group = new THREE.Group();
        group.position.set(x, y, 0);

        for (let i = 0; i < count; i++) {
            const geometry = new THREE.BoxGeometry(1, 1, 0.5);
            const material = new THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });

            const block = new THREE.Mesh(geometry, material);
            block.position.set(0, (count / 2 - i - 0.5) * 1.2, 0);
            block.userData = { type: label, index: i };

            // Etiqueta
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 64;

            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#000000';
            context.font = '20px Arial';
            context.textAlign = 'center';
            context.fillText(`${label.charAt(0)}${i}`, canvas.width / 2, canvas.height / 2 + 8);

            const texture = new THREE.CanvasTexture(canvas);
            const labelMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
            const labelGeometry = new THREE.PlaneGeometry(0.8, 0.4);
            const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
            labelMesh.position.set(0, (count / 2 - i - 0.5) * 1.2, 0.26);

            group.add(block);
            group.add(labelMesh);
        }

        // Título
        const titleGeometry = new THREE.PlaneGeometry(2.5, 0.4);
        const titleMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
        const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
        titleMesh.position.set(0, count / 2 * 1.2 + 1, 0);
        group.add(titleMesh);

        this.scene.add(group);
        return group;
    }

    executeStep(step) {
        const page = this.accessSequence[step];
        const explanation = document.getElementById('explanation-virtual-3d');

        // Limpiar flechas anteriores
        this.scene.children.filter(child => child instanceof THREE.ArrowHelper)
            .forEach(arrow => this.scene.remove(arrow));

        // Verificar si la página está en memoria física
        let frameIndex = this.physicalFrames.indexOf(page);

        if (frameIndex === -1) {
            // PAGE FAULT - La página no está en memoria
            simulationState.virtualMemory.pageFaults++;
            if (explanation) {
                explanation.innerHTML = `
                            <div class="explanation-title">❌ PAGE FAULT - Paso ${step + 1}</div>
                            <p>La página <strong>V${page}</strong> no está en memoria física. Se debe cargar desde el disco.</p>
                        `;
            }

            // Buscar marco disponible
            frameIndex = this.findAvailableFrame();

            if (frameIndex === -1) {
                // No hay marcos disponibles - reemplazo necesario
                frameIndex = this.selectFrameForReplacement(step);
                const replacedPage = this.physicalFrames[frameIndex];

                if (explanation) {
                    explanation.innerHTML += `<p>No hay marcos disponibles. Reemplazando página <strong>V${replacedPage}</strong> usando algoritmo ${simulationState.virtualMemory.algorithm}.</p>`;
                }

                // Animación de swap out
                this.createArrow(
                    this.physicalMemory.children[frameIndex * 2].position.clone().add(this.physicalMemory.position),
                    this.diskStorage.children[replacedPage * 2].position.clone().add(this.diskStorage.position),
                    0xf39c12
                );

                // Actualizar estado
                this.physicalFrames[frameIndex] = page;
                this.updateBlockAppearance(frameIndex, page, true);
            } else {
                // Marco disponible encontrado
                this.physicalFrames[frameIndex] = page;
                this.updateBlockAppearance(frameIndex, page, false);
            }

            // Animación de swap in
            this.createArrow(
                this.diskStorage.children[page * 2].position.clone().add(this.diskStorage.position),
                this.physicalMemory.children[frameIndex * 2].position.clone().add(this.physicalMemory.position),
                0x2ecc71
            );
        } else {
            // Página encontrada en memoria
            if (explanation) {
                explanation.innerHTML = `
                            <div class="explanation-title">✅ ACCESO EXITOSO - Paso ${step + 1}</div>
                            <p>La página <strong>V${page}</strong> está en el marco físico <strong>M${frameIndex}</strong>. Acceso directo a memoria.</p>
                        `;
            }

            // Resaltar acceso
            this.highlightAccess(frameIndex, page);
        }

        // Actualizar estadísticas
        simulationState.virtualMemory.memoryUsage = this.physicalFrames.filter(x => x !== null).length;
        this.updateStatistics(step);
    }

    findAvailableFrame() {
        return this.physicalFrames.findIndex(frame => frame === null);
    }

    selectFrameForReplacement(step) {
        const algorithm = simulationState.virtualMemory.algorithm;

        switch (algorithm) {
            case 'fifo':
                return step % 4; // Simplemente circular
            case 'lru':
                // Simulación simple de LRU - reemplazar la menos usada recientemente
                return Math.floor(Math.random() * 4);
            case 'optimal':
                // Simulación simple de óptimo
                return Math.floor(Math.random() * 4);
            default:
                return 0;
        }
    }

    updateBlockAppearance(frameIndex, page, isReplacement) {
        const block = this.physicalMemory.children[frameIndex * 2];
        const label = this.physicalMemory.children[frameIndex * 2 + 1];

        // Cambiar color
        block.material.color.setHex(isReplacement ? 0xe74c3c : 0x2ecc71);

        // Actualizar etiqueta
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000000';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.fillText(`V${page}`, canvas.width / 2, canvas.height / 2 + 8);

        const texture = new THREE.CanvasTexture(canvas);
        label.material.map = texture;
        label.material.needsUpdate = true;
    }

    highlightAccess(frameIndex, page) {
        const block = this.physicalMemory.children[frameIndex * 2];
        const originalColor = block.material.color.getHex();

        // Animación de resaltado
        block.material.color.setHex(0x3498db);
        setTimeout(() => {
            block.material.color.setHex(originalColor);
        }, 500);
    }

    createArrow(from, to, color) {
        const direction = new THREE.Vector3().subVectors(to, from);
        const length = direction.length();
        const arrow = new THREE.ArrowHelper(
            direction.normalize(),
            from,
            length,
            color,
            0.3,
            0.15
        );
        this.scene.add(arrow);

        setTimeout(() => {
            this.scene.remove(arrow);
        }, simulationState.virtualMemory.speed - 300);
    }

    updateStatistics(step) {
        const info = document.getElementById('step-info-virtual-3d');
        if (info) {
            info.innerHTML = `
                        <strong>Paso actual:</strong> ${step + 1}/${simulationState.virtualMemory.totalSteps}<br>
                        <strong>Accediendo a página:</strong> V${this.accessSequence[step]}<br>
                        <strong>Page faults:</strong> ${simulationState.virtualMemory.pageFaults}<br>
                        <strong>Páginas en memoria:</strong> ${simulationState.virtualMemory.memoryUsage}/4
                    `;
        }
    }

    reset() {
        this.createScene();
        simulationState.virtualMemory.pageFaults = 0;
        simulationState.virtualMemory.memoryUsage = 0;
    }
}

// ========== TABLA DE PÁGINAS ==========
class PageTableScene extends ThreeScene {
    constructor(containerId) {
        super(containerId);
        if (this.container) {
            this.createScene();
            this.animate();
            this.initPageTable();
        }
    }

    createScene() {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.setupLights();

        // Crear tabla de páginas 3D
        this.create3DPageTable();
    }

    create3DPageTable() {
        const tableGroup = new THREE.Group();

        const entries = [
            { virtual: 0, physical: 2, present: true, modified: false, referenced: true, protection: 'RW' },
            { virtual: 1, physical: 0, present: true, modified: true, referenced: true, protection: 'RW' },
            { virtual: 2, physical: -1, present: false, modified: false, referenced: false, protection: 'R' },
            { virtual: 3, physical: 1, present: true, modified: false, referenced: true, protection: 'RX' },
            { virtual: 4, physical: -1, present: false, modified: false, referenced: false, protection: 'RW' },
            { virtual: 5, physical: 3, present: true, modified: false, referenced: false, protection: 'R' },
        ];

        entries.forEach((entry, i) => {
            const color = entry.present ? 0x3498db : 0xe74c3c;
            const geometry = new THREE.BoxGeometry(2.5, 0.4, 0.2);
            const material = new THREE.MeshPhongMaterial({ color });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, 2 - i * 0.6, 0);
            mesh.userData = entry;

            tableGroup.add(mesh);
        });

        this.scene.add(tableGroup);
    }

    initPageTable() {
        const tableBody = document.getElementById('page-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        const entries = [
            { virtual: 0, physical: 2, present: true, modified: false, referenced: true, protection: 'RW' },
            { virtual: 1, physical: 0, present: true, modified: true, referenced: true, protection: 'RW' },
            { virtual: 2, physical: -1, present: false, modified: false, referenced: false, protection: 'R' },
            { virtual: 3, physical: 1, present: true, modified: false, referenced: true, protection: 'RX' },
            { virtual: 4, physical: -1, present: false, modified: false, referenced: false, protection: 'RW' },
            { virtual: 5, physical: 3, present: true, modified: false, referenced: false, protection: 'R' },
        ];

        entries.forEach(entry => {
            const row = document.createElement('tr');
            row.id = `page-table-row-${entry.virtual}`;
            row.innerHTML = `
                        <td>${entry.virtual}</td>
                        <td>${entry.physical >= 0 ? entry.physical : '-'}</td>
                        <td>${entry.present ? '✅' : '❌'}</td>
                        <td>${entry.modified ? '✅' : '❌'}</td>
                        <td>${entry.referenced ? '✅' : '❌'}</td>
                        <td>${entry.protection}</td>
                    `;
            tableBody.appendChild(row);
        });
    }

    executeStep(step) {
        const virtualAddress = this.generateVirtualAddress(step);
        const pageNumber = virtualAddress >> 8; // Suponiendo páginas de 256 bytes
        const offset = virtualAddress & 0xFF;

        const explanation = document.getElementById('explanation-page-table-3d');
        const info = document.getElementById('step-info-page-table-3d');

        if (explanation) {
            explanation.innerHTML = `
                        <div class="explanation-title">🔍 TRADUCCIÓN DE DIRECCIÓN - Paso ${step + 1}</div>
                        <p>Dirección virtual: <strong>0x${virtualAddress.toString(16).padStart(4, '0')}</strong><br>
                        Número de página: <strong>${pageNumber}</strong> | Desplazamiento: <strong>0x${offset.toString(16).padStart(2, '0')}</strong></p>
                    `;
        }

        // Resaltar fila en la tabla
        const tableBody = document.getElementById('page-table-body');
        if (tableBody) {
            tableBody.querySelectorAll('tr').forEach(tr => {
                tr.style.backgroundColor = '';
            });
            const row = document.getElementById(`page-table-row-${pageNumber}`);
            if (row) row.style.backgroundColor = '#e3f2fd';
        }

        // Simular consulta a tabla de páginas
        setTimeout(() => {
            const row = document.getElementById(`page-table-row-${pageNumber}`);
            const entry = row ? this.getEntryFromRow(row) : null;

            if (entry && entry.present) {
                const physicalAddress = (entry.physical << 8) | offset;
                if (explanation) {
                    explanation.innerHTML += `
                                <p>✅ Página <strong>${pageNumber}</strong> encontrada en marco <strong>${entry.physical}</strong><br>
                                Dirección física: <strong>0x${physicalAddress.toString(16).padStart(4, '0')}</strong></p>
                            `;
                }

                if (info) {
                    info.innerHTML = `
                                <strong>Paso actual:</strong> ${step + 1}/${simulationState.pageTable.totalSteps}<br>
                                <strong>Dirección virtual:</strong> 0x${virtualAddress.toString(16).padStart(4, '0')}<br>
                                <strong>Página:</strong> ${pageNumber} | <strong>Desplazamiento:</strong> 0x${offset.toString(16).padStart(2, '0')}<br>
                                <strong>Dirección física:</strong> 0x${physicalAddress.toString(16).padStart(4, '0')}
                            `;
                }
            } else {
                if (explanation) {
                    explanation.innerHTML += `
                                <p>❌ <strong>PAGE FAULT</strong> - La página ${pageNumber} no está en memoria<br>
                                Se debe cargar desde el disco y actualizar la tabla de páginas</p>
                            `;
                }

                if (info) {
                    info.innerHTML = `
                                <strong>Paso actual:</strong> ${step + 1}/${simulationState.pageTable.totalSteps}<br>
                                <strong>Dirección virtual:</strong> 0x${virtualAddress.toString(16).padStart(4, '0')}<br>
                                <strong>Página:</strong> ${pageNumber} | <strong>Desplazamiento:</strong> 0x${offset.toString(16).padStart(2, '0')}<br>
                                <strong>Dirección física:</strong> PAGE FAULT
                            `;
                }
            }
        }, 1000);
    }

    generateVirtualAddress(step) {
        // Generar direcciones virtuales realistas
        const addresses = [0x0100, 0x0250, 0x0000, 0x0350, 0x0200, 0x0150, 0x0300, 0x0050];
        return addresses[step % addresses.length];
    }

    getEntryFromRow(row) {
        const cells = row.getElementsByTagName('td');
        return {
            virtual: parseInt(cells[0].textContent),
            physical: cells[1].textContent === '-' ? -1 : parseInt(cells[1].textContent),
            present: cells[2].textContent === '✅',
            modified: cells[3].textContent === '✅',
            referenced: cells[4].textContent === '✅',
            protection: cells[5].textContent
        };
    }
}

// ========== COMPARACIÓN SEGMENTACIÓN vs PAGINACIÓN ==========
class ComparisonScene extends ThreeScene {
    constructor(containerId) {
        super(containerId);
        if (this.container) {
            this.createScene();
            this.animate();
        }
    }

    createScene() {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.setupLights();

        this.showComparison();
    }

    showComparison() {
        // Segmentación (izquierda)
        this.createSegmentation(-4, 0);
        // Paginación (derecha)
        this.createPagination(4, 0);
    }

    createSegmentation(x, y) {
        const group = new THREE.Group();
        group.position.set(x, y, 0);

        // Segmentos de diferentes tamaños (simulando fragmentación)
        const segments = [
            { size: 2.5, color: 0x3498db, y: 3, label: "CÓDIGO" },
            { size: 1.2, color: 0x2ecc71, y: 0.5, label: "DATOS" },
            { size: 1.8, color: 0xe74c3c, y: -1.8, label: "PILA" },
            { size: 0.8, color: 0x9b59b6, y: -3.5, label: "HEAP" },
        ];

        segments.forEach(segment => {
            const geometry = new THREE.BoxGeometry(2, segment.size, 0.5);
            const material = new THREE.MeshPhongMaterial({ color: segment.color });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, segment.y, 0);
            group.add(mesh);
        });

        // Espacios vacíos (fragmentación externa)
        const gaps = [
            { size: 0.5, y: 1.8 },
            { size: 0.3, y: -0.8 }
        ];

        gaps.forEach(gap => {
            const geometry = new THREE.BoxGeometry(2, gap.size, 0.3);
            const material = new THREE.MeshPhongMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, gap.y, 0);
            group.add(mesh);
        });

        this.scene.add(group);
    }

    createPagination(x, y) {
        const group = new THREE.Group();
        group.position.set(x, y, 0);

        // Páginas de tamaño uniforme
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 2; col++) {
                const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.5);
                const material = new THREE.MeshPhongMaterial({
                    color: 0x3498db,
                    transparent: true,
                    opacity: 0.8
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(
                    (col - 0.5) * 1.2,
                    (1.5 - row) * 1.2,
                    0
                );
                group.add(mesh);
            }
        }

        // Mostrar fragmentación interna en algunas páginas
        const internalFragmentationPages = [2, 5, 7];
        internalFragmentationPages.forEach(pageIndex => {
            const page = group.children[pageIndex];
            const usedGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.3);
            const usedMaterial = new THREE.MeshPhongMaterial({ color: 0x2ecc71 });
            const usedMesh = new THREE.Mesh(usedGeometry, usedMaterial);
            usedMesh.position.set(0, -0.2, 0.1);
            page.add(usedMesh);
        });

        this.scene.add(group);
    }

    executeStep(step) {
        const explanation = document.getElementById('explanation-comparison-3d');
        const info = document.getElementById('step-info-comparison-3d');

        const steps = [
            "Mostrando estructura básica de ambos sistemas",
            "Observa la fragmentación externa en segmentación",
            "En segmentación, los espacios entre segmentos no son utilizables",
            "En paginación, todas las páginas tienen el mismo tamaño",
            "La fragmentación interna ocurre cuando una página no se usa completamente",
            "Segmentación: mejor para organización lógica",
            "Paginación: más eficiente para gestión de memoria",
            "Segmentación: protección por segmento",
            "Paginación: transparente al programador",
            "Sistemas modernos usan enfoques híbridos"
        ];

        if (explanation) {
            explanation.innerHTML = `
                        <div class="explanation-title">📊 COMPARACIÓN - Paso ${step + 1}</div>
                        <p>${steps[step]}</p>
                    `;
        }

        // Calcular métricas
        const externalFragmentation = Math.min(100, step * 15);
        const internalFragmentation = Math.min(30, step * 5);

        if (info) {
            info.innerHTML = `
                        <strong>Paso actual:</strong> ${step + 1}/${simulationState.comparison.totalSteps}<br>
                        <strong>Modo:</strong> Comparación<br>
                        <strong>Fragmentación externa (Segmentación):</strong> ${externalFragmentation}%<br>
                        <strong>Fragmentación interna (Paginación):</strong> ${internalFragmentation}%
                    `;
        }
    }

    showOnlySegmentation() {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.setupLights();
        this.createSegmentation(0, 0);
    }

    showOnlyPagination() {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.setupLights();
        this.createPagination(0, 0);
    }
}

// ========== SEGMENTACIÓN PAGINADA ==========
class HybridScene extends ThreeScene {
    constructor(containerId) {
        super(containerId);
        if (this.container) {
            this.createScene();
            this.animate();
        }
    }

    createScene() {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.setupLights();

        this.createHybridModel();
    }

    createHybridModel() {
        const mainGroup = new THREE.Group();

        // Segmentos lógicos
        const segments = [
            { name: "CÓDIGO", pages: 4, color: 0x3498db, x: -5 },
            { name: "DATOS", pages: 3, color: 0x2ecc71, x: -1.5 },
            { name: "PILA", pages: 2, color: 0xe74c3c, x: 2 },
            { name: "HEAP", pages: 3, color: 0x9b59b6, x: 5.5 },
        ];

        segments.forEach(segment => {
            const segmentGroup = new THREE.Group();
            segmentGroup.position.set(segment.x, 0, 0);

            // Crear segmento lógico
            const segmentGeometry = new THREE.BoxGeometry(1.2, segment.pages * 0.8, 0.3);
            const segmentMaterial = new THREE.MeshPhongMaterial({
                color: segment.color,
                transparent: true,
                opacity: 0.7
            });
            const segmentMesh = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segmentGroup.add(segmentMesh);

            // Crear páginas dentro del segmento
            for (let i = 0; i < segment.pages; i++) {
                const pageGeometry = new THREE.BoxGeometry(1, 0.6, 0.2);
                const pageMaterial = new THREE.MeshPhongMaterial({
                    color: segment.color,
                    transparent: true,
                    opacity: 0.9
                });
                const pageMesh = new THREE.Mesh(pageGeometry, pageMaterial);
                pageMesh.position.set(0, (segment.pages / 2 - i - 0.5) * 0.8, 0.2);
                segmentGroup.add(pageMesh);
            }

            mainGroup.add(segmentGroup);
        });

        // Memoria física (derecha)
        const physicalMemoryGroup = new THREE.Group();
        physicalMemoryGroup.position.set(0, -3, 0);

        // Marcos de página en memoria física
        for (let i = 0; i < 8; i++) {
            const frameGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.3);
            const frameMaterial = new THREE.MeshPhongMaterial({
                color: 0xf39c12,
                transparent: true,
                opacity: 0.8
            });
            const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
            frameMesh.position.set(
                (i % 4 - 1.5) * 1.2,
                Math.floor(i / 4) * 1.2,
                0
            );
            physicalMemoryGroup.add(frameMesh);
        }

        mainGroup.add(physicalMemoryGroup);
        this.scene.add(mainGroup);
    }

    executeStep(step) {
        const explanation = document.getElementById('explanation-hybrid-3d');
        const info = document.getElementById('step-info-hybrid-3d');

        const steps = [
            "Estructura del proceso con segmentación paginada",
            "Cada segmento lógico se divide en páginas de tamaño fijo",
            "Las páginas de diferentes segmentos se mezclan en memoria física",
            "Tabla de segmentos apunta a tablas de páginas por segmento",
            "Protección a nivel de segmento, gestión a nivel de página",
            "Combina ventajas de ambos sistemas"
        ];

        const activeSegments = Math.min(4, step + 1);
        const pagesAssigned = Math.min(12, step * 2);

        if (explanation) {
            explanation.innerHTML = `
                        <div class="explanation-title">🔄 MODELO HÍBRIDO - Paso ${step + 1}</div>
                        <p>${steps[step]}</p>
                    `;
        }

        if (info) {
            info.innerHTML = `
                        <strong>Paso actual:</strong> ${step + 1}/${simulationState.hybrid.totalSteps}<br>
                        <strong>Mostrando:</strong> ${steps[step].substring(0, 30)}...<br>
                        <strong>Segmentos activos:</strong> ${activeSegments}/4<br>
                        <strong>Páginas asignadas:</strong> ${pagesAssigned}
                    `;
        }
    }
}

// ========== INICIALIZACIÓN Y CONTROL ==========
let virtualMemoryScene, pageTableScene, comparisonScene, hybridScene;

function initializeScenes() {
    try {
        virtualMemoryScene = new VirtualMemoryScene('virtual-memory-3d');
        pageTableScene = new PageTableScene('page-table-3d');
        comparisonScene = new ComparisonScene('comparison-3d');
        hybridScene = new HybridScene('hybrid-3d');

        setupVirtualMemoryControls();
        setupPageTableControls();
        setupComparisonControls();
        setupHybridControls();

        console.log('Escenas Three.js inicializadas correctamente');
    } catch (error) {
        console.error('Error al inicializar las escenas Three.js:', error);
    }
}

function setupVirtualMemoryControls() {
    const startBtn = document.getElementById('start-virtual-3d');
    const pauseBtn = document.getElementById('pause-virtual-3d');
    const resetBtn = document.getElementById('reset-virtual-3d');
    const stepBtn = document.getElementById('step-virtual-3d');
    const speedInput = document.getElementById('speed-virtual-3d');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!simulationState.virtualMemory.running) {
                startSimulation('virtualMemory', () => {
                    if (virtualMemoryScene) {
                        virtualMemoryScene.executeStep(simulationState.virtualMemory.currentStep);
                    }
                });
            } else if (simulationState.virtualMemory.paused) {
                resumeSimulation('virtualMemory');
            }
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            pauseSimulation('virtualMemory');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            stopSimulation('virtualMemory');
            if (virtualMemoryScene) {
                virtualMemoryScene.reset();
            }
        });
    }

    if (stepBtn) {
        stepBtn.addEventListener('click', () => {
            if (simulationState.virtualMemory.currentStep < simulationState.virtualMemory.totalSteps) {
                if (virtualMemoryScene) {
                    virtualMemoryScene.executeStep(simulationState.virtualMemory.currentStep);
                }
                simulationState.virtualMemory.currentStep++;
                updateStatus('virtualMemory');
            }
        });
    }

    if (speedInput) {
        speedInput.addEventListener('change', function () {
            simulationState.virtualMemory.speed = parseInt(this.value);
            updateInterval('virtualMemory');
        });
    }
}

function setupPageTableControls() {
    const startBtn = document.getElementById('start-page-table-3d');
    const pauseBtn = document.getElementById('pause-page-table-3d');
    const resetBtn = document.getElementById('reset-page-table-3d');
    const stepBtn = document.getElementById('step-page-table-3d');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!simulationState.pageTable.running) {
                startSimulation('pageTable', () => {
                    if (pageTableScene) {
                        pageTableScene.executeStep(simulationState.pageTable.currentStep);
                    }
                });
            } else if (simulationState.pageTable.paused) {
                resumeSimulation('pageTable');
            }
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            pauseSimulation('pageTable');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            stopSimulation('pageTable');
            if (pageTableScene) {
                pageTableScene.initPageTable();
            }
        });
    }

    if (stepBtn) {
        stepBtn.addEventListener('click', () => {
            if (simulationState.pageTable.currentStep < simulationState.pageTable.totalSteps) {
                if (pageTableScene) {
                    pageTableScene.executeStep(simulationState.pageTable.currentStep);
                }
                simulationState.pageTable.currentStep++;
                updateStatus('pageTable');
            }
        });
    }
}

function setupComparisonControls() {
    const startBtn = document.getElementById('start-comparison-3d');
    const segBtn = document.getElementById('show-segmentation-3d');
    const pagBtn = document.getElementById('show-pagination-3d');
    const pauseBtn = document.getElementById('pause-comparison-3d');
    const resetBtn = document.getElementById('reset-comparison-3d');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!simulationState.comparison.running) {
                startSimulation('comparison', () => {
                    if (comparisonScene) {
                        comparisonScene.executeStep(simulationState.comparison.currentStep);
                    }
                });
            } else if (simulationState.comparison.paused) {
                resumeSimulation('comparison');
            }
        });
    }

    if (segBtn) {
        segBtn.addEventListener('click', () => {
            if (comparisonScene) {
                comparisonScene.showOnlySegmentation();
            }
        });
    }

    if (pagBtn) {
        pagBtn.addEventListener('click', () => {
            if (comparisonScene) {
                comparisonScene.showOnlyPagination();
            }
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            pauseSimulation('comparison');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            stopSimulation('comparison');
            if (comparisonScene) {
                comparisonScene.showComparison();
            }
        });
    }
}

function setupHybridControls() {
    const startBtn = document.getElementById('start-hybrid-3d');
    const pauseBtn = document.getElementById('pause-hybrid-3d');
    const resetBtn = document.getElementById('reset-hybrid-3d');
    const stepBtn = document.getElementById('step-hybrid-3d');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!simulationState.hybrid.running) {
                startSimulation('hybrid', () => {
                    if (hybridScene) {
                        hybridScene.executeStep(simulationState.hybrid.currentStep);
                    }
                });
            } else if (simulationState.hybrid.paused) {
                resumeSimulation('hybrid');
            }
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            pauseSimulation('hybrid');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            stopSimulation('hybrid');
            if (hybridScene) {
                hybridScene.createScene();
            }
        });
    }

    if (stepBtn) {
        stepBtn.addEventListener('click', () => {
            if (simulationState.hybrid.currentStep < simulationState.hybrid.totalSteps) {
                if (hybridScene) {
                    hybridScene.executeStep(simulationState.hybrid.currentStep);
                }
                simulationState.hybrid.currentStep++;
                updateStatus('hybrid');
            }
        });
    }
}

// Funciones auxiliares de control de simulación
function startSimulation(type, stepFunction) {
    simulationState[type].running = true;
    simulationState[type].paused = false;

    updateStatus(type, 'running');

    simulationState[type].intervalId = setInterval(() => {
        if (simulationState[type].currentStep >= simulationState[type].totalSteps) {
            stopSimulation(type);
            return;
        }

        stepFunction();
        simulationState[type].currentStep++;
    }, simulationState[type].speed);
}

function pauseSimulation(type) {
    if (!simulationState[type].running || simulationState[type].paused) return;

    simulationState[type].paused = true;
    clearInterval(simulationState[type].intervalId);
    updateStatus(type, 'paused');
}

function resumeSimulation(type) {
    if (!simulationState[type].running || !simulationState[type].paused) return;

    simulationState[type].paused = false;
    startSimulation(type, () => {
        // La función de paso se define en startSimulation
    });
}

function stopSimulation(type) {
    simulationState[type].running = false;
    simulationState[type].paused = false;
    simulationState[type].currentStep = 0;
    clearInterval(simulationState[type].intervalId);
    updateStatus(type, 'stopped');
}

function updateInterval(type) {
    if (simulationState[type].running && !simulationState[type].paused) {
        clearInterval(simulationState[type].intervalId);
        startSimulation(type, () => {
            // La función de paso específica se maneja en cada escena
        });
    }
}

function updateStatus(type, status) {
    const statusElement = document.getElementById(`status-${type}-3d`);
    if (!statusElement) {
        console.warn(`Elemento status-${type}-3d no encontrado`);
        return;
    }

    const statusText = {
        'running': 'Estado: Ejecutando',
        'paused': 'Estado: Pausado',
        'stopped': 'Estado: Detenido'
    };

    statusElement.textContent = statusText[status] || 'Estado: Detenido';
    statusElement.className = `simulation-status simulation-status--${status}`;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeScenes);