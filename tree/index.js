import { initScene, updateSceneLighting, createMoon, scene, camera, renderer } from './sceneSetup.js';
import { generateTree, loadText } from './treeGeometry.js';
import { updateCamera, resetCameraState, startGuidedMode, moveSection, onWheel, getIsIntroMode } from './camera.js';
import { initEditor, isFreeCamera } from '../editor.js';

console.log('Tree.js (Refactored) loaded!'); // Debug log

let isTreeModeActive = false;
let isDarkMode = document.body.classList.contains('dark-mode'); // Check current mode
const container = document.getElementById('tree-canvas-container');
let treeGroup;
let textMeshes = [];
let isInitialized = false;

export function toggleTreeMode() {
    isTreeModeActive = !isTreeModeActive;

    const introMsg = document.getElementById('intro-message');
    const controls = document.getElementById('tree-controls');

    if (isTreeModeActive) {
        container.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        if (!isInitialized) {
            init();
            isInitialized = true;
        }

        // Reset to Intro Mode
        resetCameraState();

        if (introMsg) introMsg.style.display = 'block';
        if (controls) controls.style.display = 'none';

        animate();
    } else {
        container.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (introMsg) introMsg.style.display = 'none';
    }
}

// Export function to sync with dark mode toggle
export function setDarkMode(darkModeEnabled) {
    isDarkMode = darkModeEnabled;
    if (scene) {
        updateSceneLighting(isDarkMode);
    }
}

function init() {
    // Scene Setup
    initScene(container);

    // Sync dark mode state from the page before setting up lighting
    isDarkMode = document.body.classList.contains('dark-mode');

    // Set initial lighting based on mode
    updateSceneLighting(isDarkMode);

    // Generate Colossal Tree
    treeGroup = generateTree(scene);

    // Generate Moon
    const moonMesh = createMoon();
    textMeshes.push(moonMesh); // Add moon to editable meshes

    // Generate Text
    loadText(treeGroup, textMeshes);

    // Event Listeners
    window.addEventListener('wheel', (e) => onWheel(e, isTreeModeActive, isFreeCamera, camera), { passive: false }); // Enable scroll control

    // Button Listeners
    document.getElementById('tree-up').addEventListener('click', () => moveSection(1));
    document.getElementById('tree-down').addEventListener('click', () => moveSection(-1));

    // Key Listener for Intro
    window.addEventListener('keydown', (e) => {
        if (!isTreeModeActive) return;
        if (getIsIntroMode() && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault(); // Prevent scrolling with space
            startGuidedMode(camera);
        }
    });

    // Edit Mode Setup
    initEditor(scene, camera, renderer, textMeshes, () => isTreeModeActive);
}

function animate() {
    if (!isTreeModeActive) return;
    requestAnimationFrame(animate);

    updateCamera(camera, isTreeModeActive, isFreeCamera);

    // Simple idle animation
    if (treeGroup) {
        // treeGroup.rotation.y += 0.001; // Disable rotation for now to focus on nav
    }

    renderer.render(scene, camera);
}
