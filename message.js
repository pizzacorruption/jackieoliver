/**
 * message.js - Procedural melancholy story generator
 *
 * Generates random poetic sentences in the format:
 * "A [adjective] [noun] [verb phrase] in [context]."
 *
 * Click the message to generate a new one.
 * Word lists are curated for a melancholy, reflective tone.
 */

const adjectives = [
    "weary",
    "forgotten",
    "quiet",
    "lonesome",
    "fading",
    "restless",
    "hollowed",
    "wandering"
];

const nouns = [
    "dreamer",
    "stranger",
    "ghost",
    "traveler",
    "soul",
    "voice",
    "shadow",
    "fool"
];

const verbPhrases = [
    "searching for something unnamed",
    "waiting for a sign that never comes",
    "holding on to what slips away",
    "whispering to an empty room",
    "counting the days like coins",
    "learning to let go",
    "remembering what others forget",
    "building cathedrals no one will see"
];

const contexts = [
    "the space between words",
    "a world that moved on",
    "the hour before dawn",
    "photographs that yellowed",
    "the silence after goodbye",
    "a city of strangers",
    "the weight of small choices",
    "rooms where the light changed"
];

function generateMessage() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const verb = verbPhrases[Math.floor(Math.random() * verbPhrases.length)];
    const context = contexts[Math.floor(Math.random() * contexts.length)];

    return `A ${adj} ${noun} ${verb} in ${context}.`;
}

function initMessage() {
    const container = document.getElementById('procedural-message');
    if (!container) return;

    // Create title
    const title = document.createElement('div');
    title.className = 'procedural-title';
    title.textContent = 'Tell me a story';

    // Create message
    const message = document.createElement('div');
    message.className = 'procedural-text';
    message.textContent = generateMessage();

    container.appendChild(title);
    container.appendChild(message);

    // Regenerate on click
    container.style.cursor = 'pointer';
    container.addEventListener('click', () => {
        message.textContent = generateMessage();
    });
}

document.addEventListener('DOMContentLoaded', initMessage);
