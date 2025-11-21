import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

console.log('Tree.js loaded!'); // Debug log

let scene, camera, renderer;
let treeGroup;
let isTreeModeActive = false;
let isFreeCameraMode = false;
const container = document.getElementById('tree-canvas-container');

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

function init() {
    // Scene Setup - Totoro/SOTC Night Vibe
    scene = new THREE.Scene();
    const fogColor = 0x1a2b3c; // Deep midnight blue/teal
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, 0.02); // Exponential fog for depth

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false }); // Keep PS1 jaggedness
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; // Enable shadows
    container.appendChild(renderer.domElement);

    // Lighting - Moonlight
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft dim light
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xaaccff, 1.5); // Cool blue moonlight
    moonLight.position.set(50, 100, 50);
    moonLight.castShadow = true;
    scene.add(moonLight);

    // Generate Colossal Tree
    generateTree();

    // Generate Text
    loadText();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('wheel', onWheel, { passive: false }); // Enable scroll control

    // Button Listeners
    document.getElementById('tree-up').addEventListener('click', () => moveSection(-1));
    document.getElementById('tree-down').addEventListener('click', () => moveSection(1));

    // Edit Mode Setup
    setupEditMode();
}

// Edit Mode Variables
let isEditMode = false;
let textMeshes = [];
let selectedMesh = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isDragging = false;

function setupEditMode() {
    const positionDisplay = document.getElementById('position-display');
    const positionCoords = document.getElementById('position-coords');

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        if (!isTreeModeActive) return;

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

        // Only allow other controls if in edit mode and have a selected mesh
        if (!isEditMode || !selectedMesh) return;

        const moveSpeed = e.shiftKey ? 1.0 : 0.5; // Faster movement with shift for Y axis
        let updated = false;

        // Arrow keys for repositioning
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                if (e.shiftKey) {
                    // Shift+Left: move in negative X
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
                    // Shift+Right: move in positive X
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

            // Mirror controls
            case 'h':
            case 'H':
                e.preventDefault();
                // Horizontal mirror (flip X scale)
                selectedMesh.scale.x *= -1;
                if (!selectedMesh.userData.mirrorX) {
                    selectedMesh.userData.mirrorX = true;
                } else {
                    selectedMesh.userData.mirrorX = !selectedMesh.userData.mirrorX;
                }
                updated = true;
                break;

            case 'v':
            case 'V':
                e.preventDefault();
                // Vertical mirror (flip Y scale)
                selectedMesh.scale.y *= -1;
                if (!selectedMesh.userData.mirrorY) {
                    selectedMesh.userData.mirrorY = true;
                } else {
                    selectedMesh.userData.mirrorY = !selectedMesh.userData.mirrorY;
                }
                updated = true;
                break;
        }

        // Free Camera Mode Toggle
        if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            isFreeCameraMode = !isFreeCameraMode;
            updatePositionDisplay();
            console.log(`Free Camera Mode: ${isFreeCameraMode ? 'ON' : 'OFF'}`);
            return;
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
        const rot = selectedMesh.rotation;

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
                ← → : Rotate around tree<br>
                ↑ ↓ : Move closer/farther<br>
                Shift + ↑↓ : Move up/down<br>
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
}

// Navigation Logic
let currentSectionIndex = 0;
const totalSections = 5; // Welcome, About, Beliefs, Interests, Contact
let targetScrollProgress = 0; // Start at base
let currentScrollProgress = 0;

// Free camera controls
const freeCameraSpeed = 0.5;
const keys = {};

// Track key presses for free camera
window.addEventListener('keydown', (e) => {
    if (isFreeCameraMode && isTreeModeActive) {
        keys[e.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function onWheel(event) {
    if (!isTreeModeActive) return;
    event.preventDefault();

    if (isFreeCameraMode) {
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

        const texts = [
            { str: "Welcome", x: 18.00, y: 5.00, z: 0.00 },
            { str: "About Me", x: -15.79, y: 29.00, z: 0.20 },
            { str: "Beliefs", x: 16.73, y: 55.00, z: 0.36 },
            { str: "Interests", x: -17.77, y: 79.00, z: -0.03 },
            { str: "Contact", x: 18.00, y: 104.00, z: 0.00 }
        ];

        texts.forEach(item => {
            const geometry = new TextGeometry(item.str, {
                font: font,
                size: 2,
                height: 0.2,
            });
            geometry.center();

            const mesh = new THREE.Mesh(geometry, textMaterial);
            // Use exact coordinates
            mesh.position.x = item.x;
            mesh.position.y = item.y;
            mesh.position.z = item.z;
            mesh.lookAt(0, item.y, 0); // Face the trunk

            // Store label for edit mode
            mesh.userData.label = item.str;
            textMeshes.push(mesh);

            treeGroup.add(mesh);
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

    if (isFreeCameraMode) {
        // Free Camera Mode - WASD controls
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

        // Always look at the tree center
        const treeCenter = new THREE.Vector3(0, camera.position.y, 0);
        camera.lookAt(treeCenter);

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
