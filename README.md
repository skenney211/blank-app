# Interactive 3D Tornado Visualization

## Description
This project is a real-time 3D simulation of a tornado, created using Three.js and WebGL. It features a dynamic particle system to visualize the tornado funnel and swirling debris, with parameters that can be adjusted interactively by the user. The tornado can also be moved around the scene.

## How to Run
1.  **Save Files:** Download `index.html` and `scene.js` and place them in the same directory on your local computer.
2.  **Open in Browser:** Open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Edge, Safari) that supports WebGL.
3.  **No Server Needed:** This project uses CDN links for Three.js and OrbitControls, so no local web server is strictly required. You can directly open the `index.html` file from your file system.

## Controls

### Camera
*   **Orbit:** Left-click and drag the mouse.
*   **Zoom:** Middle-click and drag, or use the mouse scroll wheel.
*   **Pan:** Right-click and drag the mouse.
    *(These are standard OrbitControls in Three.js)*

### Tornado Movement
*   **Arrow Keys (Up, Down, Left, Right):** Use these keys to move the entire tornado system (funnel and debris) across the ground plane.

### UI Sliders
A control panel is available on the top-left of the screen. Use the sliders to adjust the following parameters in real-time:

*   **Rotational Speed:** Adjusts how fast the tornado particles spin around the core.
*   **Inward Pull:** Controls the strength of the force pulling particles towards the tornado's central axis.
*   **Upward Velocity:** Modifies the base speed at which particles (both funnel and debris) are lifted upwards.
*   **Tornado Width (Top):** Changes the maximum radius of the tornado funnel at its widest point (the top). This also affects the core radius and debris emission area proportionally.
*   **Funnel Density:** Adjusts the number of particles used to render the main tornado funnel, affecting its visual density.
*   **Debris Density:** Adjusts the number of particles used for the ground debris being pulled into the tornado.

## Credits
*   Built using [Three.js](https://threejs.org/)
*   Particle texture (`disc.png`) sourced from Three.js examples.

## Bitcoin Dashboard
A simple real-time dashboard `btc_dashboard.html` demonstrates fetching live Bitcoin data using the public CoinGecko API. It displays price action using Chart.js along with open interest, funding, and a macro event countdown.

Open the file in any modern browser to view the live chart.
