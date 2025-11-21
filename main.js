import { toggleTreeMode, setDarkMode } from './tree.js';

// Dark Mode Toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');
const treeModeToggle = document.getElementById('tree-mode-toggle');
const body = document.body;

// Tree Mode Listener
if (treeModeToggle) {
    treeModeToggle.addEventListener('click', () => {
        console.log('Tree Mode clicked!'); // Debug log
        toggleTreeMode();
        // Toggle button text
        if (treeModeToggle.textContent === 'Tree Mode') {
            treeModeToggle.textContent = 'Exit Tree';
        } else {
            treeModeToggle.textContent = 'Tree Mode';
        }
    });
}

// Check for saved preference
if (localStorage.getItem('darkMode') === 'enabled') {
    enableDarkMode();
}

darkModeToggle.addEventListener('click', () => {
    if (body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
});

function enableDarkMode() {
    body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
    darkModeToggle.textContent = 'Light Mode';
    setDarkMode(true); // Sync tree scene to nighttime
}

function disableDarkMode() {
    body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', null);
    darkModeToggle.textContent = 'Dark Mode';
    setDarkMode(false); // Sync tree scene to daytime
}

// Typewriter Effect
const textElement = document.getElementById('typing-text');
const textToType = textElement.textContent;
textElement.textContent = '';

let charIndex = 0;
function typeWriter() {
    if (charIndex < textToType.length) {
        textElement.textContent += textToType.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 50); // Typing speed
    }
}

// Start typing after a slight delay
setTimeout(typeWriter, 1000);


// Kirigami Thread Animation
class KirigamiThread {
    constructor() {
        this.svg = document.getElementById('kirigami-thread');
        if (!this.svg) return; // Exit if SVG not found (e.g. mobile)

        this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.svg.appendChild(this.path);

        this.points = [];
        this.segmentHeight = 20; // Height of each zig-zag
        this.baseAmplitude = 15; // How wide the zig-zag is at rest

        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('scroll', () => this.update());

        this.update(); // Initial draw
    }

    resize() {
        this.height = window.innerHeight;
        this.width = 50; // Container width
        this.centerX = this.width / 2;
        this.totalSegments = Math.ceil(this.height / this.segmentHeight) + 2;
        this.update();
    }

    update() {
        // Calculate scroll progress (0 to 1)
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        let scrollProgress = scrollTop / docHeight;

        // Clamp progress between 0 and 1
        scrollProgress = Math.max(0, Math.min(1, scrollProgress));

        // Tension factor: 1 = loose (top), 0 = tight (bottom)
        // We want it to start loose and get tight.
        // Let's say at bottom, amplitude is near 0 (straight line).
        const tension = 1 - scrollProgress;
        const currentAmplitude = this.baseAmplitude * tension;

        // Build the path string
        let d = `M ${this.centerX} 0 `;

        for (let i = 0; i < this.totalSegments; i++) {
            const y = i * this.segmentHeight;

            // Alternate left and right
            const direction = i % 2 === 0 ? 1 : -1;
            const x = this.centerX + (direction * currentAmplitude);

            // Use quadratic bezier curves for a smoother "folded" look
            // or simple lines for a sharp paper look. Let's do sharp lines for "Kirigami".
            d += `L ${x} ${y + (this.segmentHeight / 2)} `;
            d += `L ${this.centerX} ${y + this.segmentHeight} `;
        }

        this.path.setAttribute('d', d);
    }
}

// Initialize Kirigami Thread
document.addEventListener('DOMContentLoaded', () => {
    new KirigamiThread();
});
