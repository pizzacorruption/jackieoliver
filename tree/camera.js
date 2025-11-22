import * as THREE from 'three';
import { updateFreeCameraMovement } from '../editor.js';

// Camera State
let isIntroMode = true;
let introAngle = 0;
let isTransitioning = false;
let transitionStartTime = 0;
const transitionDuration = 2000;
const transitionStartPos = new THREE.Vector3();
const transitionStartLookAt = new THREE.Vector3(0, 40, 0);
const transitionEndLookAt = new THREE.Vector3(0, 5, 0);

// Navigation Logic
let currentSectionIndex = 0;
const totalSections = 5; // Welcome, About, Beliefs, Interests, Contact
let targetScrollProgress = 0; // Start at base
let currentScrollProgress = 0;

export function resetCameraState() {
    isIntroMode = true;
    isTransitioning = false;
    introAngle = 0;
    currentSectionIndex = 0;
    targetScrollProgress = 0;
    currentScrollProgress = 0;
}

export function startGuidedMode(camera) {
    if (isTransitioning) return;
    isIntroMode = false;
    isTransitioning = true;
    transitionStartTime = Date.now();
    transitionStartPos.copy(camera.position);

    const introMsg = document.getElementById('intro-message');
    const controls = document.getElementById('tree-controls');

    if (introMsg) introMsg.style.display = 'none';
    if (controls) controls.style.display = 'flex';

    // Reset to start
    targetScrollProgress = 0;
    currentScrollProgress = 0;
}

export function updateCamera(camera, isTreeModeActive, isFreeCamera) {
    if (!isTreeModeActive) return;

    if (isIntroMode) {
        // Intro Mode - Orbiting Camera
        introAngle += 0.001; // Slow rotation
        const radius = 160; // Further away to see the huge top
        const height = 200; // Higher than the canopy (which is at ~165)

        camera.position.x = Math.cos(introAngle) * radius;
        camera.position.z = Math.sin(introAngle) * radius;
        camera.position.y = height;
        camera.lookAt(0, 140, 0); // Look at the upper trunk/canopy
    } else if (isTransitioning) {
        const now = Date.now();
        const progress = Math.min((now - transitionStartTime) / transitionDuration, 1);

        // Ease out cubic
        const t = 1 - Math.pow(1 - progress, 3);

        // Target: Start of guided mode (Welcome section)
        const targetPos = new THREE.Vector3(35, 5, 0);

        camera.position.lerpVectors(transitionStartPos, targetPos, t);

        const currentLookAt = new THREE.Vector3().lerpVectors(transitionStartLookAt, transitionEndLookAt, t);
        camera.lookAt(currentLookAt);

        if (progress >= 1) {
            isTransitioning = false;
            const controls = document.getElementById('tree-controls');
            if (controls) controls.style.display = 'flex';
        }
    } else if (isFreeCamera()) {
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

export function onWheel(event, isTreeModeActive, isFreeCamera, camera) {
    if (!isTreeModeActive) return;
    if (isIntroMode) return; // Disable scroll in intro mode
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

export function moveSection(direction) {
    currentSectionIndex += direction;

    // Clamp index
    if (currentSectionIndex < 0) currentSectionIndex = 0;
    if (currentSectionIndex >= totalSections) currentSectionIndex = totalSections - 1;

    // Calculate target progress (0.0 to 1.0)
    // 0 = Welcome (Bottom), 1 = Contact (Top)
    targetScrollProgress = currentSectionIndex / (totalSections - 1);
}

export function getIsIntroMode() {
    return isIntroMode;
}
