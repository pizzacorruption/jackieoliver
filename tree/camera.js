/**
 * tree/camera.js - Camera movement and navigation
 *
 * Three camera modes:
 * 1. Intro Mode: Slow orbit high above the tree, waiting for user to start
 * 2. Guided Mode: Corkscrew path up the tree, controlled by scroll/buttons
 * 3. Free Camera: WASD movement (handled in editor.js)
 *
 * The tree has 5 sections at different heights (y=5 to y=104).
 * Scrolling interpolates the camera along a spiral path around the trunk.
 */

import * as THREE from 'three';
import { updateFreeCameraMovement } from '../editor.js';

// === Camera State ===
let isIntroMode = true;
let introAngle = 0;

// Transition animation (intro -> guided)
let isTransitioning = false;
let transitionStartTime = 0;
const TRANSITION_DURATION_MS = 2000;
const transitionStartPos = new THREE.Vector3();
const transitionStartLookAt = new THREE.Vector3(0, 40, 0);
const transitionEndLookAt = new THREE.Vector3(0, 5, 0);

// === Navigation State ===
const TOTAL_SECTIONS = 6; // Where I Stand, What I Make, What I Carry, What I Believe, Find Me, Canopy View
let currentSectionIndex = 0;
let targetScrollProgress = 0;   // Where user wants to be (0-1)
let currentScrollProgress = 0;  // Where camera actually is (lerps toward target)

/**
 * Resets the camera state to the initial Intro Mode.
 * Clears any transition or scroll progress.
 */
export function resetCameraState() {
    isIntroMode = true;
    isTransitioning = false;
    introAngle = 0;
    currentSectionIndex = 0;
    targetScrollProgress = 0;
    currentScrollProgress = 0;
}

/**
 * Triggers the transition from Intro Mode to Guided Mode.
 * Moves the camera from the high orbit to the base of the tree.
 * @param {THREE.Camera} camera - The camera object to animate.
 */
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

/**
 * Updates the camera position and rotation based on the current mode.
 * Called every frame in the animation loop.
 * @param {THREE.Camera} camera - The camera to update.
 * @param {boolean} isTreeModeActive - Whether the tree visualization is active.
 * @param {function} isFreeCamera - Function returning true if free camera mode is enabled.
 */
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
        const progress = Math.min((now - transitionStartTime) / TRANSITION_DURATION_MS, 1);

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

        // Two-phase height: sections 0-4 align with text, section 5 zooms out above canopy
        const textSectionEnd = 4/5; // 80% of scroll = section 4 (Find Me)
        const maxTextHeight = 104;  // y position of last text
        const canopyHeight = 200;   // Final destination - way above canopy

        let currentHeight;
        if (currentScrollProgress <= textSectionEnd) {
            // Sections 0-4: Linear through text positions
            currentHeight = (currentScrollProgress / textSectionEnd) * maxTextHeight;
        } else {
            // Section 5: Rise up above canopy for wide view
            const canopyProgress = (currentScrollProgress - textSectionEnd) / (1 - textSectionEnd);
            currentHeight = maxTextHeight + (canopyProgress * (canopyHeight - maxTextHeight));
        }

        // Corkscrew Camera Path - radius EXPANDS in canopy for zoom out effect
        const baseRadius = 35;
        const canopyStart = 0.8; // Last 20% of journey pulls back
        let radius = baseRadius;
        if (currentScrollProgress > canopyStart) {
            // Expand radius for wide "god view"
            const canopyProgress = (currentScrollProgress - canopyStart) / (1 - canopyStart);
            radius = baseRadius + (canopyProgress * 80); // Expand to 115
        }

        const rotations = 2.5; // Extra half rotation for the final section
        const angle = currentScrollProgress * Math.PI * 2 * rotations;

        camera.position.x = Math.cos(angle) * radius;
        camera.position.z = Math.sin(angle) * radius;
        camera.position.y = currentHeight + 5;

        // In canopy section, look down at tree center; otherwise look at current height
        if (currentScrollProgress > canopyStart) {
            const canopyProgress = (currentScrollProgress - canopyStart) / (1 - canopyStart);
            const lookAtY = currentHeight + 5 - (canopyProgress * 60); // Gradually look down
            camera.lookAt(0, lookAtY, 0);
        } else {
            camera.lookAt(0, currentHeight + 5, 0);
        }
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
        currentSectionIndex = Math.round(targetScrollProgress * (TOTAL_SECTIONS - 1));
    }
}

/**
 * Moves the guided camera to the next or previous section.
 * @param {number} direction - +1 for next section (up), -1 for previous section (down).
 */
export function moveSection(direction) {
    currentSectionIndex += direction;

    // Clamp index
    if (currentSectionIndex < 0) currentSectionIndex = 0;
    if (currentSectionIndex >= TOTAL_SECTIONS) currentSectionIndex = TOTAL_SECTIONS - 1;

    // Calculate target progress (0.0 to 1.0)
    // 0 = Welcome (Bottom), 1 = Contact (Top)
    targetScrollProgress = currentSectionIndex / (TOTAL_SECTIONS - 1);
}

export function getIsIntroMode() {
    return isIntroMode;
}

// === Touch Handling for Mobile ===
let touchStartY = 0;
let touchStartTime = 0;

export function onTouchStart(event, isTreeModeActive) {
    if (!isTreeModeActive) return;
    if (isIntroMode) return;

    if (event.touches.length === 1) {
        touchStartY = event.touches[0].clientY;
        touchStartTime = Date.now();
    }
}

export function onTouchMove(event, isTreeModeActive) {
    if (!isTreeModeActive) return;
    if (isIntroMode) return;
    event.preventDefault();

    if (event.touches.length === 1) {
        const touchY = event.touches[0].clientY;
        const deltaY = touchStartY - touchY;

        // Continuous scroll-like behavior
        const scrollDelta = deltaY * 0.002;
        targetScrollProgress += scrollDelta;
        targetScrollProgress = Math.max(0, Math.min(1, targetScrollProgress));

        // Update section index
        currentSectionIndex = Math.round(targetScrollProgress * (TOTAL_SECTIONS - 1));

        touchStartY = touchY;
    }
}

export function onTouchEnd(event, isTreeModeActive) {
    if (!isTreeModeActive) return;
    if (isIntroMode) return;

    const touchDuration = Date.now() - touchStartTime;

    // Quick swipe detection for snapping to sections
    if (touchDuration < 300) {
        const touchEndY = event.changedTouches[0].clientY;
        const swipeDistance = touchStartY - touchEndY;

        if (Math.abs(swipeDistance) > 50) {
            // Significant swipe - move to next/prev section
            if (swipeDistance > 0) {
                moveSection(1); // Swipe up = go to next section
            } else {
                moveSection(-1); // Swipe down = go to previous section
            }
        }
    }
}
