# Jackie Oliver - 3D Portfolio

A personal portfolio website featuring an interactive 3D tree experience built with Three.js.

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (e.g., Python `http.server`, VS Code Live Server, or Node.js `http-server`)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/jackieoliver/jackieoliver.github.io.git
   ```
2. Navigate to the project directory:
   ```bash
   cd jackieoliver.github.io
   ```
3. Start a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   ```
4. Open `http://localhost:8000` in your browser.

## 🏗️ Project Structure

The project is split into standard web files and a dedicated 3D module.

```
├── index.html          # Main entry point
├── style.css           # Global styles and UI overlay
├── main.js             # UI logic (Dark mode, Typewriter, DOM events)
├── tree/               # The 3D Tree Experience Module
│   ├── index.js        # Main 3D orchestrator (init, animate loop)
│   ├── sceneSetup.js   # Three.js boilerplate (Scene, Camera, Renderer, Lighting)
│   ├── treeGeometry.js # Procedural generation of the tree mesh
│   ├── camera.js       # Camera movement logic (Intro orbit, Guided scroll)
│   └── content.js      # Text data for the 3D labels
```

## 🌟 Key Features

### Tree Mode
An immersive 3D visualization where the user explores a colossal tree. Each section of the tree represents a different aspect of the portfolio (About, Beliefs, Interests, Contact).

### Camera Modes
- **Intro Mode**: The camera orbits high above the tree, giving a cinematic view.
- **Guided Mode**: Once the user starts, the camera follows a spiral path up the trunk, controlled by scrolling.
- **Free Camera**: (Debug/Editor) Allows WASD movement to inspect the scene.

### Dynamic Lighting
The 3D scene syncs with the website's Dark/Light mode.
- **Light Mode**: Bright sunlight, blue sky, fog.
- **Dark Mode**: Nighttime, moonlight, dark fog, glowing moon.
