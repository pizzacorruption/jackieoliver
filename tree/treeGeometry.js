import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { texts } from './content.js';

export function generateTree(scene) {
    const treeGroup = new THREE.Group();
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
            addColossalBranch(treeGroup, height, barkMaterial, leafMaterial, radiusTop);
        }

        height += segmentHeight;
    }

    // Add massive top canopy (Laputa style)
    addMassiveCanopy(treeGroup, height, leafMaterial);

    return treeGroup;
}

function addColossalBranch(group, y, barkMat, leafMat, trunkRadius) {
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
    group.add(branch);

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
        group.add(leaf);
    }
}

function addMassiveCanopy(group, y, leafMat) {
    const canopyGroup = new THREE.Group();
    group.add(canopyGroup);

    // Create a massive dome of leaves
    const leafCount = 800; // Very dense
    const canopyRadius = 45;
    const canopyHeight = 30;

    for (let i = 0; i < leafCount; i++) {
        const leafSize = 8 + Math.random() * 12; // Large, varied leaves
        const geometry = new THREE.IcosahedronGeometry(leafSize, 0);
        const mesh = new THREE.Mesh(geometry, leafMat);

        // Random position within a flattened sphere/dome
        // We want a dense core and a wider spread
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1); // Uniform sphere
        const r = Math.pow(Math.random(), 1 / 3) * canopyRadius; // Uniform volume

        // Flatten the bottom, dome the top
        let py = r * Math.cos(phi);
        if (py < 0) py *= 0.4; // Flatten bottom

        mesh.position.x = r * Math.sin(phi) * Math.cos(theta);
        mesh.position.z = r * Math.sin(phi) * Math.sin(theta);
        mesh.position.y = y + py;

        // Lift slightly to sit on top of trunk
        mesh.position.y += 5;

        // Random rotation
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        canopyGroup.add(mesh);
    }

    // Add some "hanging" vines/leaves at the bottom for that floating island feel
    for (let i = 0; i < 50; i++) {
        const leafSize = 4 + Math.random() * 4;
        const geometry = new THREE.IcosahedronGeometry(leafSize, 0);
        const mesh = new THREE.Mesh(geometry, leafMat);

        const theta = Math.random() * Math.PI * 2;
        const r = (Math.random() * 0.5 + 0.2) * canopyRadius; // Inner to mid radius

        mesh.position.x = r * Math.cos(theta);
        mesh.position.z = r * Math.sin(theta);
        mesh.position.y = y - Math.random() * 20; // Hanging down

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        canopyGroup.add(mesh);
    }
}

export function loadText(treeGroup, textMeshes) {
    const loader = new FontLoader();
    loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', function (font) {

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const detailMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc }); // Slightly dimmer for detail text

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
