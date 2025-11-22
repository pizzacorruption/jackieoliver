/**
 * editor.js - Development tools for positioning 3D elements
 *
 * Press E to toggle Edit Mode:
 * - Click to select text/objects
 * - Arrow keys to reposition (rotate around tree, move up/down)
 * - H/V to mirror horizontally/vertically
 * - C to copy coordinates to clipboard
 *
 * Press F to toggle Free Camera Mode:
 * - WASD to move, mouse to look (pointer lock)
 * - Q/E for vertical movement
 * - Scroll to move up/down
 *
 * These tools are for development - positions are logged to console on exit.
 */

import * as THREE from 'three';

// === Edit Mode State ===
let isEditMode = false;
let selectedMesh = null;
let isDragging = false;
let movementMode = 'polar'; // 'polar' (default) or 'cartesian'

// === Free Camera State ===
let isFreeCameraMode = false;
const keys = {};  // Track pressed keys for WASD movement

// === Three.js References (set by initEditor) ===
let scene, camera, renderer, textMeshes, getIsTreeModeActive;

// === DOM References ===
let positionDisplay, positionCoords;

// === Input Helpers ===
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

export function initEditor(sceneRef, cameraRef, rendererRef, textMeshesRef, getIsTreeModeActiveRef) {
    scene = sceneRef;
    camera = cameraRef;
    renderer = rendererRef;
    textMeshes = textMeshesRef;
    getIsTreeModeActive = getIsTreeModeActiveRef;

    positionDisplay = document.getElementById('position-display');
    positionCoords = document.getElementById('position-coords');

    console.log(`Editor initialized with ${textMeshes.length} meshes.`);
    setupEditMode();
    setupFreeCameraListeners();
}

export function isFreeCamera() {
    return isFreeCameraMode;
}

export function updateFreeCameraMovement() {
    if (!isFreeCameraMode) return;

    const freeCameraSpeed = 0.5;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    // Get camera's forward and right vectors
    camera.getWorldDirection(forward);
    forward.y = 0; // Keep movement horizontal
    forward.normalize();

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Apply WASD movement
    if (keys['w']) {
        camera.position.add(forward.multiplyScalar(freeCameraSpeed));
    }
    if (keys['s']) {
        camera.position.sub(forward.multiplyScalar(freeCameraSpeed));
    }
    if (keys['a']) {
        camera.position.sub(right.multiplyScalar(freeCameraSpeed));
    }
    if (keys['d']) {
        camera.position.add(right.multiplyScalar(freeCameraSpeed));
    }

    // Vertical Movement (Q/E)
    if (keys['e']) {
        camera.position.y += freeCameraSpeed;
    }
    if (keys['q']) {
        camera.position.y -= freeCameraSpeed;
    }

    // Mouse Look is handled in the mousemove listener directly updating camera.rotation
}

function setupFreeCameraListeners() {
    window.addEventListener('keydown', (e) => {
        if (isFreeCameraMode && getIsTreeModeActive()) {
            keys[e.key.toLowerCase()] = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // Mouse Look Listeners (Pointer Lock)
    renderer.domElement.addEventListener('click', () => {
        if (isFreeCameraMode && getIsTreeModeActive()) {
            renderer.domElement.requestPointerLock();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isFreeCameraMode || !getIsTreeModeActive()) return;

        // Only look if pointer is locked
        if (document.pointerLockElement !== renderer.domElement) return;

        const sensitivity = 0.002;
        const deltaX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        const deltaY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

        camera.rotation.y -= deltaX * sensitivity;
        camera.rotation.x -= deltaY * sensitivity;

        // Clamp pitch
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

        // Ensure rotation order is YXZ to prevent gimbal lock issues for FPS style
        camera.rotation.order = 'YXZ';
    });
}

function setupEditMode() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        if (!getIsTreeModeActive()) return;

        // Toggle edit mode with E key
        if (e.key === 'e' || e.key === 'E') {
            isEditMode = !isEditMode;
            positionDisplay.style.display = isEditMode ? 'block' : 'none';

            if (!isEditMode) {
                // Export positions when exiting edit mode
                exportTextPositions();
                selectedMesh = null;
            }
            return;
        }

        // Free Camera Mode Toggle
        if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            isFreeCameraMode = !isFreeCameraMode;
            updatePositionDisplay();
            console.log(`Free Camera Mode: ${isFreeCameraMode ? 'ON' : 'OFF'}`);

            if (isFreeCameraMode) {
                // Set rotation order to prevent gimbal lock
                camera.rotation.order = 'YXZ';
                // Reset pitch/yaw from current quaternion to avoid jumps
                const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
                camera.rotation.copy(euler);
            } else {
                document.exitPointerLock();
            }
            return;
        }

        // Select Moon Shortcut (M)
        if ((e.key === 'm' || e.key === 'M')) {
            // Auto-enable edit mode if not active
            if (!isEditMode) {
                isEditMode = true;
                positionDisplay.style.display = 'block';
            }

            const moon = textMeshes.find(m => m.userData.label === "Moon");
            if (moon) {
                selectedMesh = moon;
                updatePositionDisplay();
                console.log("Moon selected");
            } else {
                console.warn("Moon mesh not found in textMeshes", textMeshes);
            }
            return;
        }

        // Toggle Movement Mode (T)
        if ((e.key === 't' || e.key === 'T') && isEditMode) {
            movementMode = movementMode === 'polar' ? 'cartesian' : 'polar';
            updatePositionDisplay();
            console.log(`Movement Mode: ${movementMode}`);
            return;
        }

        // Only allow other controls if in edit mode and have a selected mesh
        if (!isEditMode || !selectedMesh) return;

        const moveSpeed = e.shiftKey ? 2.0 : 0.5; // Faster movement with shift
        let updated = false;

        // Arrow keys for repositioning
        if (movementMode === 'cartesian') {
            // === Cartesian Mode (XYZ) ===
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    selectedMesh.position.x -= moveSpeed;
                    updated = true;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    selectedMesh.position.x += moveSpeed;
                    updated = true;
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (e.shiftKey) {
                        selectedMesh.position.y += moveSpeed;
                    } else {
                        selectedMesh.position.z -= moveSpeed;
                    }
                    updated = true;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (e.shiftKey) {
                        selectedMesh.position.y -= moveSpeed;
                    } else {
                        selectedMesh.position.z += moveSpeed;
                    }
                    updated = true;
                    break;
            }
        } else {
            // === Polar Mode (Tree-centric) ===
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (e.shiftKey) {
                        // Shift+Left: move in negative X (legacy override)
                        selectedMesh.position.x -= moveSpeed;
                    } else {
                        // Left: rotate counter-clockwise around tree
                        const angle = Math.atan2(selectedMesh.position.z, selectedMesh.position.x);
                        const radius = Math.sqrt(selectedMesh.position.x ** 2 + selectedMesh.position.z ** 2);
                        const newAngle = angle + 0.1;
                        selectedMesh.position.x = Math.cos(newAngle) * radius;
                        selectedMesh.position.z = Math.sin(newAngle) * radius;
                        selectedMesh.lookAt(0, selectedMesh.position.y, 0);
                    }
                    updated = true;
                    break;

                case 'ArrowRight':
                    e.preventDefault();
                    if (e.shiftKey) {
                        // Shift+Right: move in positive X (legacy override)
                        selectedMesh.position.x += moveSpeed;
                    } else {
                        // Right: rotate clockwise around tree
                        const angle = Math.atan2(selectedMesh.position.z, selectedMesh.position.x);
                        const radius = Math.sqrt(selectedMesh.position.x ** 2 + selectedMesh.position.z ** 2);
                        const newAngle = angle - 0.1;
                        selectedMesh.position.x = Math.cos(newAngle) * radius;
                        selectedMesh.position.z = Math.sin(newAngle) * radius;
                        selectedMesh.lookAt(0, selectedMesh.position.y, 0);
                    }
                    updated = true;
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (e.shiftKey) {
                        // Shift+Up: move up in Y
                        selectedMesh.position.y += moveSpeed;
                    } else {
                        // Up: move closer to tree (decrease radius)
                        const angle = Math.atan2(selectedMesh.position.z, selectedMesh.position.x);
                        const radius = Math.sqrt(selectedMesh.position.x ** 2 + selectedMesh.position.z ** 2);
                        const newRadius = Math.max(5, radius - moveSpeed);
                        selectedMesh.position.x = Math.cos(angle) * newRadius;
                        selectedMesh.position.z = Math.sin(angle) * newRadius;
                    }
                    updated = true;
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    if (e.shiftKey) {
                        // Shift+Down: move down in Y
                        selectedMesh.position.y -= moveSpeed;
                    } else {
                        // Down: move away from tree (increase radius)
                        const angle = Math.atan2(selectedMesh.position.z, selectedMesh.position.x);
                        const radius = Math.sqrt(selectedMesh.position.x ** 2 + selectedMesh.position.z ** 2);
                        const newRadius = radius + moveSpeed;
                        selectedMesh.position.x = Math.cos(angle) * newRadius;
                        selectedMesh.position.z = Math.sin(angle) * newRadius;
                    }
                    updated = true;
                    break;
            }
        }

        // Mirror controls (Universal)
        if (e.key === 'h' || e.key === 'H') {
            e.preventDefault();
            selectedMesh.scale.x *= -1;
            selectedMesh.userData.mirrorX = !selectedMesh.userData.mirrorX;
            updated = true;
        }
        if (e.key === 'v' || e.key === 'V') {
            e.preventDefault();
            selectedMesh.scale.y *= -1;
            selectedMesh.userData.mirrorY = !selectedMesh.userData.mirrorY;
            updated = true;
        }

        // Copy coordinates to clipboard
        if (e.key === 'c' || e.key === 'C') {
            if (selectedMesh) {
                e.preventDefault();
                copyCoordinatesToClipboard();
            }
            return;
        }

        if (updated) {
            updatePositionDisplay();
        }
    });

    // Mouse events for selection and dragging
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
}

function onMouseDown(event) {
    if (!isEditMode) return;

    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to find intersections
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(textMeshes);

    if (intersects.length > 0) {
        selectedMesh = intersects[0].object;
        isDragging = true;
        renderer.domElement.style.cursor = 'grabbing';
        updatePositionDisplay();
    }
}

function onMouseMove(event) {
    if (!isEditMode || !isDragging || !selectedMesh) return;

    // Calculate mouse position
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Create a plane at the selected mesh's Y position
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -selectedMesh.position.y);
    raycaster.setFromCamera(mouse, camera);

    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    if (intersection) {
        selectedMesh.position.x = intersection.x;
        selectedMesh.position.z = intersection.z;

        // Update display
        updatePositionDisplay();
    }
}

function onMouseUp() {
    if (isDragging) {
        isDragging = false;
        renderer.domElement.style.cursor = isEditMode ? 'grab' : 'default';
    }
}

function updatePositionDisplay() {
    if (!selectedMesh) return;

    const pos = selectedMesh.position;
    // Calculate angle from center
    const angle = Math.atan2(pos.z, pos.x);
    const radius = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

    const mirrorX = selectedMesh.userData.mirrorX ? 'Yes' : 'No';
    const mirrorY = selectedMesh.userData.mirrorY ? 'Yes' : 'No';

    positionCoords.innerHTML = `
        <strong>Selected:</strong> ${selectedMesh.userData.label || 'Text'}<br>
        <strong>X:</strong> ${pos.x.toFixed(2)}<br>
        <strong>Y:</strong> ${pos.y.toFixed(2)}<br>
        <strong>Z:</strong> ${pos.z.toFixed(2)}<br>
        <strong>Angle:</strong> ${angle.toFixed(3)} rad<br>
        <strong>Radius:</strong> ${radius.toFixed(2)}<br>
        <strong>Mirror H:</strong> ${mirrorX} | <strong>V:</strong> ${mirrorY}<br>
        <hr style="margin: 8px 0; border: 1px solid #444;">
        <small>
            <strong>Controls:</strong><br>
            <strong>M:</strong> Select Moon<br>
            <strong>T:</strong> Toggle Mode (${movementMode.toUpperCase()})<br>
            ${movementMode === 'cartesian' ?
            `← → : Move X<br>
                 ↑ ↓ : Move Z<br>
                 Shift + ↑↓ : Move Y` :
            `← → : Rotate around tree<br>
                 ↑ ↓ : Move closer/farther<br>
                 Shift + ↑↓ : Move up/down`}
            <br>
            H : Mirror horizontally<br>
            V : Mirror vertically<br>
            C : Copy coordinates<br>
            F : Toggle free camera
        </small>
        <hr style="margin: 8px 0; border: 1px solid #444;">
        <small>
            <strong>Camera Mode:</strong> ${isFreeCameraMode ? '🎮 FREE' : '🎯 GUIDED'}
        </small>
    `;
}

function exportTextPositions() {
    console.log('=== TEXT POSITIONS ===');
    textMeshes.forEach(mesh => {
        const pos = mesh.position;
        const angle = Math.atan2(pos.z, pos.x);
        console.log(`{ str: "${mesh.userData.label}", y: ${pos.y.toFixed(1)}, rot: ${angle.toFixed(3)} },`);
    });
    console.log('======================');
}

function copyCoordinatesToClipboard() {
    if (!selectedMesh) return;

    const pos = selectedMesh.position;
    const angle = Math.atan2(pos.z, pos.x);
    const radius = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

    const coordText = `{ str: "${selectedMesh.userData.label}", x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)}, angle: ${angle.toFixed(3)}, radius: ${radius.toFixed(2)} }`;

    navigator.clipboard.writeText(coordText).then(() => {
        console.log('Coordinates copied to clipboard!');
        console.log(coordText);
        alert('Coordinates copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy coordinates:', err);
        console.log('Coordinates:', coordText);
    });
}
