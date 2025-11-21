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
