/**
 * main.js - Entry point and UI handlers for the portfolio site
 *
 * Handles:
 * - Dark/light mode toggle with localStorage persistence
 * - Tree mode button (activates 3D experience)
 * - Typewriter animation for the intro text
 */

import { toggleTreeMode, setDarkMode } from './tree/index.js';

// === DOM Elements ===
const darkModeToggle = document.getElementById('dark-mode-toggle');
const treeModeToggle = document.getElementById('tree-mode-toggle');
const body = document.body;

// === Tree Mode Button ===
if (treeModeToggle) {
    treeModeToggle.addEventListener('click', () => {
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
