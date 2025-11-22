/**
 * tree/sceneSetup.js - Three.js scene initialization and lighting
 *
 * Sets up the WebGL renderer, camera, and lighting system.
 * Supports two lighting modes:
 * - Dark mode: Nighttime atmosphere with moonlight (blue tones, visible moon)
 * - Light mode: Daytime atmosphere with sunlight (warm tones, no moon)
 *
 * The PS1-style aesthetic is achieved by disabling antialiasing.
 */

import * as THREE from 'three';

// === Exported Scene Objects ===
export let scene, camera, renderer;
export let ambientLight, directionalLight;
export let moonMesh;

/**
 * Initializes the Three.js scene, camera, and renderer.
 * Sets up the canvas and attaches it to the DOM.
 * @param {HTMLElement} container - The DOM element to append the canvas to.
 */
export function initScene(container) {
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

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
}

export function createMoon() {
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffee }); // Pale yellow/white glow
    moonMesh = new THREE.Mesh(geometry, material);

    // User defined position
    moonMesh.position.set(-20.40, 215.00, -102.51);

    // Add to scene
    scene.add(moonMesh);

    moonMesh.userData.label = "Moon";
    return moonMesh;
}

export function updateSceneLighting(isDarkMode) {
    if (!scene) return;

    if (isDarkMode) {
        // Nighttime - Totoro/SOTC Night Vibe
        const fogColor = 0x1a2b3c; // Deep midnight blue/teal
        scene.background = new THREE.Color(fogColor);
        scene.fog = new THREE.FogExp2(fogColor, 0.005);

        // Moonlight
        ambientLight.color.setHex(0x404040);
        ambientLight.intensity = 0.5;

        directionalLight.color.setHex(0xaaccff); // Cool blue moonlight
        directionalLight.intensity = 1.5;
        // Match Moon position
        directionalLight.position.set(-20.40, 215.00, -102.51);

        if (moonMesh) moonMesh.visible = true;
    } else {
        // Daytime - Bright, sunny atmosphere
        const skyColor = 0x87CEEB; // Sky blue
        scene.background = new THREE.Color(skyColor);
        scene.fog = new THREE.FogExp2(0xb0d4f1, 0.002); // Light blue haze

        // Sunlight
        ambientLight.color.setHex(0xffffff);
        ambientLight.intensity = 0.8; // Brighter ambient light

        directionalLight.color.setHex(0xfff4e6); // Warm sunlight
        directionalLight.intensity = 2.0; // Stronger sun
        directionalLight.position.set(50, 100, 50); // Keep original sun position

        // Moon is now always visible
        if (moonMesh) moonMesh.visible = true;
    }
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
