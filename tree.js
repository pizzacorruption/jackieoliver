import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

console.log('Tree.js loaded!'); // Debug log

let scene, camera, renderer;
let treeGroup;
let isTreeModeActive = false;
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
    window.addEventListener('scroll', onScroll);
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
            { str: "Welcome", y: 5, rot: 0 },
            { str: "About Me", y: 25, rot: Math.PI / 2 },
            { str: "Beliefs", y: 50, rot: Math.PI },
            { str: "Interests", y: 75, rot: Math.PI * 1.5 },
            { str: "Contact", y: 95, rot: 0 }
        ];

        texts.forEach(item => {
            const geometry = new TextGeometry(item.str, {
                font: font,
                size: 2,
                height: 0.2,
            });
            geometry.center();

            const mesh = new THREE.Mesh(geometry, textMaterial);
            // Position in a spiral
            const radius = 8;
            mesh.position.y = item.y;
            mesh.position.x = Math.cos(item.rot) * radius;
            mesh.position.z = Math.sin(item.rot) * radius;
            mesh.lookAt(0, item.y, 0); // Face the trunk

            treeGroup.add(mesh);
        });
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onScroll() {
    if (!isTreeModeActive) return;

    // Map scroll to height
    const scrollY = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollProgress = scrollY / docHeight; // 0 to 1

    const maxTreeHeight = 100;
    const currentHeight = scrollProgress * maxTreeHeight;

    // Corkscrew Camera Path
    const radius = 35; // Increased for colossal tree
    const rotations = 2;
    const angle = scrollProgress * Math.PI * 2 * rotations;

    camera.position.x = Math.cos(angle) * radius;
    camera.position.z = Math.sin(angle) * radius;
    camera.position.y = currentHeight + 5; // Look slightly down

    camera.lookAt(0, currentHeight + 5, 0);
}

function animate() {
    if (!isTreeModeActive) return;
    requestAnimationFrame(animate);

    // Simple idle animation
    if (treeGroup) {
        treeGroup.rotation.y += 0.001;
    }

    renderer.render(scene, camera);
}

// Initial Scroll Update
onScroll();
