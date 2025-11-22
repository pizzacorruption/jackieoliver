/**
 * tree/index.js - Main orchestrator for the 3D tree experience
 *
 * Coordinates all tree mode functionality:
 * - Toggling tree mode on/off
 * - Initializing the 3D scene, tree geometry, and text labels
 * - Running the animation loop
 * - Syncing dark/light mode with the scene lighting
 */

import { initScene, updateSceneLighting, createMoon, scene, camera, renderer } from './sceneSetup.js';
import { generateTree, loadText } from './treeGeometry.js';
import { updateCamera, resetCameraState, startGuidedMode, moveSection, onWheel, getIsIntroMode, onTouchStart, onTouchMove, onTouchEnd } from './camera.js';
import { initEditor, isFreeCamera } from '../editor.js';

// State
let isTreeModeActive = false;
let isDarkMode = document.body.classList.contains('dark-mode');
const container = document.getElementById('tree-canvas-container');
let treeGroup;
let textMeshes = [];
let isInitialized = false;

/**
 * Toggles the 3D tree visualization on or off.
 * Manages the DOM elements for the intro message and controls.
 * Starts the animation loop if activating.
 */
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
/**
 * Updates the scene lighting to match the website's dark/light mode.
 * @param {boolean} darkModeEnabled - True for dark mode (night), false for light mode (day).
 */
export function setDarkMode(darkModeEnabled) {
    isDarkMode = darkModeEnabled;
    if (scene) {
        updateSceneLighting(isDarkMode);
    }
}

/**
 * Initializes the 3D scene, geometry, and event listeners.
 * Only called once when tree mode is first activated.
 */
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
    window.addEventListener('wheel', (e) => onWheel(e, isTreeModeActive, isFreeCamera, camera), { passive: false });

    // Touch event listeners for mobile navigation
    container.addEventListener('touchstart', (e) => onTouchStart(e, isTreeModeActive), { passive: true });
    container.addEventListener('touchmove', (e) => onTouchMove(e, isTreeModeActive), { passive: false });
    container.addEventListener('touchend', (e) => onTouchEnd(e, isTreeModeActive), { passive: true });

    // Button Listeners
    document.getElementById('tree-up').addEventListener('click', () => moveSection(1));
    document.getElementById('tree-down').addEventListener('click', () => moveSection(-1));

    // Key Listener for Intro
    window.addEventListener('keydown', (e) => {
        if (!isTreeModeActive) return;
        if (getIsIntroMode()) {
            e.preventDefault();
            startGuidedMode(camera);
        }
    });

    // Touch Listener for Intro (mobile support)
    container.addEventListener('touchstart', (e) => {
        if (!isTreeModeActive) return;
        if (getIsIntroMode()) {
            e.preventDefault();
            startGuidedMode(camera);
        }
    }, { passive: false });

    // Edit Mode Setup
    initEditor(scene, camera, renderer, textMeshes, () => isTreeModeActive);
}

/**
 * The main animation loop.
 * Handles camera updates and rendering.
 */
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
