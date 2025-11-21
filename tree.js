import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { initEditor, updateFreeCameraMovement, isFreeCamera } from './editor.js';

console.log('Tree.js loaded!'); // Debug log

let scene, camera, renderer;
let treeGroup;
let isTreeModeActive = false;
let isDarkMode = true; // Default to dark mode (nighttime)
const container = document.getElementById('tree-canvas-container');

// Lighting references for mode switching
let ambientLight, directionalLight;

export function toggleTreeMode() {
    isTreeModeActive = !isTreeModeActive;

    if (isTreeModeActive) {
        container.style.display = 'block';
        document.body.style.overflow = 'auto'; // Keep scrolling enabled
        if (!scene) init();
        animate();
    } else {
        container.style.display = 'none';
    }
}

// Export function to sync with dark mode toggle
export function setDarkMode(darkModeEnabled) {
    isDarkMode = darkModeEnabled;
    if (scene) {
        updateSceneLighting();
    }
}

function init() {
    // Scene Setup
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false }); // Keep PS1 jaggedness
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; // Enable shadows
    container.appendChild(renderer.domElement);

    // Create lights (will be configured by updateSceneLighting)
    ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xaaccff, 1.5);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Set initial lighting based on mode
    updateSceneLighting();

    // Generate Colossal Tree
    generateTree();

    // Generate Text
    loadText();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('wheel', onWheel, { passive: false }); // Enable scroll control

    // Button Listeners
    document.getElementById('tree-up').addEventListener('click', () => moveSection(1));
    document.getElementById('tree-down').addEventListener('click', () => moveSection(-1));

    // Edit Mode Setup
    initEditor(scene, camera, renderer, textMeshes, () => isTreeModeActive);
}

// Update scene lighting based on dark/light mode
function updateSceneLighting() {
    if (isDarkMode) {
        // Nighttime - Totoro/SOTC Night Vibe
        const fogColor = 0x1a2b3c; // Deep midnight blue/teal
        scene.background = new THREE.Color(fogColor);
        scene.fog = new THREE.FogExp2(fogColor, 0.02);

        // Moonlight
        ambientLight.color.setHex(0x404040);
        ambientLight.intensity = 0.5;

        directionalLight.color.setHex(0xaaccff); // Cool blue moonlight
        directionalLight.intensity = 1.5;
        directionalLight.position.set(50, 100, 50);
    } else {
        // Daytime - Bright, sunny atmosphere
        const skyColor = 0x87CEEB; // Sky blue
        scene.background = new THREE.Color(skyColor);
        scene.fog = new THREE.FogExp2(0xb0d4f1, 0.015); // Light blue haze

        // Sunlight
        ambientLight.color.setHex(0xffffff);
        ambientLight.intensity = 0.8; // Brighter ambient light

        directionalLight.color.setHex(0xfff4e6); // Warm sunlight
        directionalLight.intensity = 2.0; // Stronger sun
        directionalLight.position.set(50, 100, 50);
    }
}

// Edit Mode Variables
let textMeshes = [];

// Navigation Logic
let currentSectionIndex = 0;
const totalSections = 5; // Welcome, About, Beliefs, Interests, Contact
let targetScrollProgress = 0; // Start at base
let currentScrollProgress = 0;

// Free camera controls
// Handled in editor.js

function onWheel(event) {
    if (!isTreeModeActive) return;
    event.preventDefault();

    if (isFreeCamera()) {
        // In free camera mode, scroll moves camera up/down
        camera.position.y += event.deltaY * 0.05;
    } else {
        // In guided mode, scroll changes target progress
        const scrollDelta = event.deltaY * 0.001;
        targetScrollProgress += scrollDelta;
        targetScrollProgress = Math.max(0, Math.min(1, targetScrollProgress));

        // Update section index based on scroll
        currentSectionIndex = Math.round(targetScrollProgress * (totalSections - 1));
    }
}

function moveSection(direction) {
    currentSectionIndex += direction;

    // Clamp index
    if (currentSectionIndex < 0) currentSectionIndex = 0;
    if (currentSectionIndex >= totalSections) currentSectionIndex = totalSections - 1;

    // Calculate target progress (0.0 to 1.0)
    // 0 = Welcome (Bottom), 1 = Contact (Top)
    targetScrollProgress = currentSectionIndex / (totalSections - 1);
}

function generateTree() {
    treeGroup = new THREE.Group();
    scene.add(treeGroup);

    // Materials
    const barkMaterial = new THREE.MeshStandardMaterial({
        color: 0x3e2723, // Darker wood
        roughness: 0.9,
        flatShading: true
    });
    const leafMaterial = new THREE.MeshStandardMaterial({
        color: 0x2f4f4f, // Dark slate green (desaturated)
        roughness: 0.8,
        flatShading: true
    });

    // Massive Trunk
    let height = 0;
    const trunkSegments = 40;
    const segmentHeight = 4;

    for (let i = 0; i < trunkSegments; i++) {
        // Tapering from huge base
        const progress = i / trunkSegments;
        const radiusBottom = 12 * (1 - progress * 0.6); // Starts at 12, shrinks to ~5
        const radiusTop = 12 * (1 - (progress + 0.025) * 0.6);

        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, segmentHeight, 7); // 7 sides for odd/organic low-poly
        const mesh = new THREE.Mesh(geometry, barkMaterial);

        mesh.position.y = height + segmentHeight / 2;
        mesh.rotation.y = Math.random() * Math.PI; // Random rotation per segment

        // Jitter position for gnarled look
        mesh.position.x = (Math.random() - 0.5) * 1.5;
        mesh.position.z = (Math.random() - 0.5) * 1.5;

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        treeGroup.add(mesh);

        // Massive Branches & Canopy
        if (i > 8 && i % 3 === 0) {
            addColossalBranch(height, barkMaterial, leafMaterial, radiusTop);
        }

        height += segmentHeight;
    }
}

function addColossalBranch(y, barkMat, leafMat, trunkRadius) {
    const length = 15 + Math.random() * 10;
    const geometry = new THREE.CylinderGeometry(1, 3, length, 5);
    const branch = new THREE.Mesh(geometry, barkMat);

    const angle = Math.random() * Math.PI * 2;
    branch.position.set(0, y, 0);

    // Angle upwards slightly
    branch.rotation.z = (Math.PI / 2) - 0.3;
    branch.rotation.y = angle;
    branch.translateY(length / 2 + trunkRadius - 2); // Move out from trunk surface

    branch.castShadow = true;
    branch.receiveShadow = true;
    treeGroup.add(branch);

    // Canopy Clusters (Totoro Style)
    // Create "clouds" of leaves at the end of branches
    const clusterCount = 5;
    for (let j = 0; j < clusterCount; j++) {
        const leafSize = 4 + Math.random() * 3;
        const leafGeo = new THREE.IcosahedronGeometry(leafSize, 0); // Low poly sphere
        const leaf = new THREE.Mesh(leafGeo, leafMat);

        // Position at end of branch with spread
        const spread = 8;
        leaf.position.copy(branch.position);
        leaf.position.y += (length / 2) + (Math.random() - 0.5) * spread;
        leaf.position.x += Math.cos(angle) * ((length / 2) + (Math.random() * spread));
        leaf.position.z += Math.sin(angle) * ((length / 2) + (Math.random() * spread));

        leaf.castShadow = true;
        leaf.receiveShadow = true;
        treeGroup.add(leaf);
    }
}

function loadText() {
    const loader = new FontLoader();
    loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', function (font) {

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const detailMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc }); // Slightly dimmer for detail text

        const texts = [
            {
                str: "Welcome",
                x: 18.00, y: 5.00, z: 0.00,
                detail: "I like building things, learning, and helping people."
            },
            {
                str: "About Me",
                x: -15.79, y: 29.00, z: 0.20,
                detail: "UVA grad working at Haptica Sensorics, giving machines a sense of touch."
            },
            {
                str: "Beliefs",
                x: 16.73, y: 55.00, z: 0.36,
                detail: "Knowledge is the greatest investment. Human agency is rising."
            },
            {
                str: "Interests",
                x: -17.77, y: 79.00, z: -0.03,
                detail: "Philosophy, economics, art, and AI—where all three intersect."
            },
            {
                str: "Contact",
                x: 18.00, y: 104.00, z: 0.00,
                detail: "You can contact me at jroliver02@gmail.com"
            }
        ];

        texts.forEach(item => {
            // Main heading
            const geometry = new TextGeometry(item.str, {
                font: font,
                size: 2,
                height: 0.2,
            });
            geometry.center();

            const mesh = new THREE.Mesh(geometry, textMaterial);
            mesh.position.x = item.x;
            mesh.position.y = item.y;
            mesh.position.z = item.z;
            mesh.lookAt(0, item.y, 0); // Face the trunk

            // Mirror horizontally to fix reversed text
            mesh.scale.x = -1;

            mesh.userData.label = item.str;
            textMeshes.push(mesh);
            treeGroup.add(mesh);

            // Detail text (smaller, below main text)
            if (item.detail) {
                const detailGeometry = new TextGeometry(item.detail, {
                    font: font,
                    size: 0.8, // Smaller size
                    height: 0.1,
                });
                detailGeometry.center();

                const detailMesh = new THREE.Mesh(detailGeometry, detailMaterial);
                detailMesh.position.x = item.x;
                detailMesh.position.y = item.y - 2.5; // Position below main text
                detailMesh.position.z = item.z;
                detailMesh.lookAt(0, item.y - 2.5, 0); // Face the trunk

                // Mirror horizontally to match main text
                detailMesh.scale.x = -1;

                detailMesh.userData.label = item.str + " (detail)";
                textMeshes.push(detailMesh);
                treeGroup.add(detailMesh);
            }
        });
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateCamera() {
    if (!isTreeModeActive) return;

    if (isFreeCamera()) {
        updateFreeCameraMovement();
    } else {
        // Guided Mode - Corkscrew Camera Path
        // Smoothly interpolate current progress towards target
        currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.05;

        const maxTreeHeight = 100;
        const currentHeight = currentScrollProgress * maxTreeHeight;

        // Corkscrew Camera Path
        const radius = 35; // Increased for colossal tree
        const rotations = 2;
        const angle = currentScrollProgress * Math.PI * 2 * rotations;

        camera.position.x = Math.cos(angle) * radius;
        camera.position.z = Math.sin(angle) * radius;
        camera.position.y = currentHeight + 5; // Look slightly down

        camera.lookAt(0, currentHeight + 5, 0);
    }
}

function animate() {
    if (!isTreeModeActive) return;
    requestAnimationFrame(animate);

    updateCamera();

    // Simple idle animation
    if (treeGroup) {
        // treeGroup.rotation.y += 0.001; // Disable rotation for now to focus on nav
    }

    renderer.render(scene, camera);
}
