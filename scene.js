// Ensure Three.js is loaded
if (typeof THREE === 'undefined') {
    console.error('Three.js has not been loaded. Please include it in your HTML.');
}

// -- Global Variables for Parameters (use 'let' for mutable ones) --
// Particle System Base Counts
const INITIAL_FUNNEL_PARTICLE_COUNT = 5000;
const INITIAL_DEBRIS_PARTICLE_COUNT = 1000;

let currentFunnelParticleCount = INITIAL_FUNNEL_PARTICLE_COUNT;
let currentDebrisParticleCount = INITIAL_DEBRIS_PARTICLE_COUNT;

// Tornado Shape & Fixed Dynamics
const TORNADO_HEIGHT = 20;
const FUNNEL_PARTICLE_LIFETIME = 200; 
const DEBRIS_PARTICLE_LIFETIME = 150; 
const DEBRIS_GRAVITY = 0.001;

// Dynamic Parameters (will be controlled by UI)
let currentTornadoMaxRadius = 5;
let currentCoreRadius = currentTornadoMaxRadius * 0.3; 
let currentMaxRotationalSpeed = 0.2; 
let currentInwardPullStrength = 0.01;
let currentMaxUpwardVelocity = 0.15;
let currentDebrisEmissionRadius = currentTornadoMaxRadius * 0.75;


// Tornado Movement
const tornadoSpeed = 0.1;
const tornadoGroup = new THREE.Group();

// Scene objects (renderer, camera, etc.)
const scene = new THREE.Scene();
scene.add(tornadoGroup);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('sceneCanvas') });
let controls; 

// Particle system THREE.Points objects
let funnelParticlesMesh; 
let debrisParticlesMesh;   

// Data arrays for particles
let funnelParticlePositions; 
let funnelParticlesData = [];     
let debrisParticlePositions;   
let debrisParticlesData = [];      

// Geometries
let funnelGeometry; 
let debrisGeometryOuter; 

// Materials
let funnelMaterial;
let debrisMaterial; 

// Texture
const textureLoader = new THREE.TextureLoader();
// Using disc.png as a placeholder, a smoke texture would be better.
const particleTexture = textureLoader.load('https://threejs.org/examples/textures/sprites/disc.png');


// -- Initialization Functions --
function setupSceneAndLighting() {
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.set(15, 15, 25);

    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const groundPlaneMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const groundPlane = new THREE.Mesh(planeGeometry, groundPlaneMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI / 2;
    } else {
        console.warn('THREE.OrbitControls not found.');
    }
}

function initFunnelParticle(index, positionsArray, dataArray) {
    const i = index * 3;
    const y = Math.random() * TORNADO_HEIGHT;
    let radius = ((TORNADO_HEIGHT - y) / TORNADO_HEIGHT) * currentTornadoMaxRadius;
    radius = Math.max(0.1, radius);

    const angle = Math.random() * Math.PI * 2;
    positionsArray[i] = Math.cos(angle) * radius;
    positionsArray[i + 1] = y;
    positionsArray[i + 2] = Math.sin(angle) * radius;

    const initialUpwardVelocity = 0.01 + Math.random() * 0.02;
    dataArray[index] = {
        velocity: new THREE.Vector3(0, initialUpwardVelocity, 0),
        lifetime: Math.random() * FUNNEL_PARTICLE_LIFETIME,
        rotationalSpeed: 0.01 + Math.random() * 0.01,
        currentAngle: angle
    };
}

function createTornadoFunnelSystem() {
    if (funnelParticlesMesh) {
        tornadoGroup.remove(funnelParticlesMesh);
        if (funnelGeometry) funnelGeometry.dispose();
    }
    funnelGeometry = new THREE.BufferGeometry();
    funnelParticlePositions = new Float32Array(currentFunnelParticleCount * 3);
    funnelParticlesData = new Array(currentFunnelParticleCount);

    for (let i = 0; i < currentFunnelParticleCount; i++) {
        initFunnelParticle(i, funnelParticlePositions, funnelParticlesData);
    }
    funnelGeometry.setAttribute('position', new THREE.BufferAttribute(funnelParticlePositions, 3));

    if (!funnelMaterial) {
        funnelMaterial = new THREE.PointsMaterial({
            color: 0xAAAAAA,
            size: 0.3, 
            transparent: true,
            opacity: 0.35, 
            map: particleTexture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });
    } else { 
        funnelMaterial.map = particleTexture;
        funnelMaterial.blending = THREE.AdditiveBlending;
        funnelMaterial.depthWrite = false;
        funnelMaterial.sizeAttenuation = true;
        funnelMaterial.color.set(0xAAAAAA);
        funnelMaterial.size = 0.3;
        funnelMaterial.opacity = 0.35;
        funnelMaterial.needsUpdate = true;
    }
    funnelParticlesMesh = new THREE.Points(funnelGeometry, funnelMaterial);
    tornadoGroup.add(funnelParticlesMesh);
}


function initDebrisParticle(index, positionsArray, dataArray) {
    const i = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * currentDebrisEmissionRadius;

    positionsArray[i] = Math.cos(angle) * radius;
    positionsArray[i + 1] = 0.1 + Math.random() * 0.1;
    positionsArray[i + 2] = Math.sin(angle) * radius;

    const initialUpwardVelocity = 0.05 + Math.random() * 0.05;
    const initialTangentialSpeed = 0.01 + Math.random() * 0.01;
    dataArray[index] = {
        velocity: new THREE.Vector3(
            Math.sin(angle) * initialTangentialSpeed,
            initialUpwardVelocity,
            -Math.cos(angle) * initialTangentialSpeed
        ),
        lifetime: Math.random() * DEBRIS_PARTICLE_LIFETIME,
        currentAngle: angle
    };
}

function createDebrisParticleSystem() {
    if (debrisParticlesMesh) {
        tornadoGroup.remove(debrisParticlesMesh);
        if (debrisGeometryOuter) debrisGeometryOuter.dispose();
    }
    debrisGeometryOuter = new THREE.BufferGeometry();
    debrisParticlePositions = new Float32Array(currentDebrisParticleCount * 3);
    debrisParticlesData = new Array(currentDebrisParticleCount);

    for (let i = 0; i < currentDebrisParticleCount; i++) {
        initDebrisParticle(i, debrisParticlePositions, debrisParticlesData);
    }
    debrisGeometryOuter.setAttribute('position', new THREE.BufferAttribute(debrisParticlePositions, 3));

    if (!debrisMaterial) { 
        debrisMaterial = new THREE.PointsMaterial({
            color: 0x654321, 
            size: 0.25,    
            transparent: true,
            opacity: 0.6, 
            map: particleTexture,
            blending: THREE.NormalBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });
    } else { 
        debrisMaterial.map = particleTexture;
        debrisMaterial.blending = THREE.NormalBlending;
        debrisMaterial.depthWrite = false;
        debrisMaterial.sizeAttenuation = true;
        debrisMaterial.color.set(0x654321);
        debrisMaterial.size = 0.25;
        debrisMaterial.opacity = 0.6;
        debrisMaterial.needsUpdate = true;
    }
    debrisParticlesMesh = new THREE.Points(debrisGeometryOuter, debrisMaterial);
    tornadoGroup.add(debrisParticlesMesh);
}


// -- UI Controls Setup --
function setupUIControls() {
    const rotationSpeedSlider = document.getElementById('rotationSpeed');
    const rotationSpeedValue = document.getElementById('rotationSpeedValue');
    const inwardPullSlider = document.getElementById('inwardPull');
    const inwardPullValue = document.getElementById('inwardPullValue');
    const upwardVelocitySlider = document.getElementById('upwardVelocity');
    const upwardVelocityValue = document.getElementById('upwardVelocityValue');
    const tornadoRadiusSlider = document.getElementById('tornadoRadius');
    const tornadoRadiusValue = document.getElementById('tornadoRadiusValue');
    const funnelDensitySlider = document.getElementById('funnelDensity');
    const funnelDensityValue = document.getElementById('funnelDensityValue');
    const debrisDensitySlider = document.getElementById('debrisDensity');
    const debrisDensityValue = document.getElementById('debrisDensityValue');

    if (!rotationSpeedSlider) { // Basic check if UI elements are present
        console.warn("UI control elements not found. Ensure index.html is correct.");
        return;
    }

    // Set initial values for sliders and text displays
    rotationSpeedSlider.value = currentMaxRotationalSpeed;
    rotationSpeedValue.textContent = currentMaxRotationalSpeed.toFixed(2);
    inwardPullSlider.value = currentInwardPullStrength;
    inwardPullValue.textContent = currentInwardPullStrength.toFixed(3);
    upwardVelocitySlider.value = currentMaxUpwardVelocity;
    upwardVelocityValue.textContent = currentMaxUpwardVelocity.toFixed(2);
    tornadoRadiusSlider.value = currentTornadoMaxRadius;
    tornadoRadiusValue.textContent = currentTornadoMaxRadius.toFixed(1);
    funnelDensitySlider.value = 1.0; 
    funnelDensityValue.textContent = (1.0).toFixed(1);
    debrisDensitySlider.value = 1.0; 
    debrisDensityValue.textContent = (1.0).toFixed(1);

    // Event Listeners
    rotationSpeedSlider.addEventListener('input', (event) => {
        currentMaxRotationalSpeed = parseFloat(event.target.value);
        rotationSpeedValue.textContent = currentMaxRotationalSpeed.toFixed(2);
    });
    inwardPullSlider.addEventListener('input', (event) => {
        currentInwardPullStrength = parseFloat(event.target.value);
        inwardPullValue.textContent = currentInwardPullStrength.toFixed(3);
    });
    upwardVelocitySlider.addEventListener('input', (event) => {
        currentMaxUpwardVelocity = parseFloat(event.target.value);
        upwardVelocityValue.textContent = currentMaxUpwardVelocity.toFixed(2);
    });
    tornadoRadiusSlider.addEventListener('input', (event) => {
        currentTornadoMaxRadius = parseFloat(event.target.value);
        tornadoRadiusValue.textContent = currentTornadoMaxRadius.toFixed(1);
        currentCoreRadius = currentTornadoMaxRadius * 0.3;
        currentDebrisEmissionRadius = currentTornadoMaxRadius * 0.75;
    });
    funnelDensitySlider.addEventListener('input', (event) => {
        const density = parseFloat(event.target.value);
        currentFunnelParticleCount = Math.floor(INITIAL_FUNNEL_PARTICLE_COUNT * density);
        funnelDensityValue.textContent = density.toFixed(1);
        createTornadoFunnelSystem(); 
    });
    debrisDensitySlider.addEventListener('input', (event) => {
        const density = parseFloat(event.target.value);
        currentDebrisParticleCount = Math.floor(INITIAL_DEBRIS_PARTICLE_COUNT * density);
        debrisDensityValue.textContent = density.toFixed(1);
        createDebrisParticleSystem(); 
    });
}


// Keyboard Controls
const keysPressed = {};
document.addEventListener('keydown', (event) => { keysPressed[event.key] = true; });
document.addEventListener('keyup', (event) => { keysPressed[event.key] = false; });

function handleTornadoMovement() {
    if (keysPressed['ArrowUp']) tornadoGroup.position.z -= tornadoSpeed;
    if (keysPressed['ArrowDown']) tornadoGroup.position.z += tornadoSpeed;
    if (keysPressed['ArrowLeft']) tornadoGroup.position.x -= tornadoSpeed;
    if (keysPressed['ArrowRight']) tornadoGroup.position.x += tornadoSpeed;
}

// -- Main Animation Loop --
function animate() {
    requestAnimationFrame(animate);
    handleTornadoMovement();

    // Update main funnel particles
    for (let i = 0; i < currentFunnelParticleCount; i++) {
        if (!funnelParticlesData[i]) { 
            initFunnelParticle(i, funnelParticlePositions, funnelParticlesData);
        }
        funnelParticlesData[i].lifetime--;

        if (funnelParticlesData[i].lifetime <= 0) {
            initFunnelParticle(i, funnelParticlePositions, funnelParticlesData);
        } else {
            const particleData = funnelParticlesData[i];
            const currentY = funnelParticlePositions[i * 3 + 1];
            let currentX = funnelParticlePositions[i * 3];
            let currentZ = funnelParticlePositions[i * 3 + 2];
            let currentRadiusFromCenter = Math.sqrt(currentX * currentX + currentZ * currentZ);

            let targetRotationalSpeed;
            if (currentRadiusFromCenter < currentCoreRadius) {
                targetRotationalSpeed = (currentRadiusFromCenter / currentCoreRadius) * currentMaxRotationalSpeed;
            } else {
                targetRotationalSpeed = (currentCoreRadius / Math.max(0.01, currentRadiusFromCenter)) * currentMaxRotationalSpeed;
            }
            particleData.rotationalSpeed += (targetRotationalSpeed - particleData.rotationalSpeed) * 0.1;
            particleData.currentAngle += particleData.rotationalSpeed;
            currentX = currentRadiusFromCenter * Math.cos(particleData.currentAngle);
            currentZ = currentRadiusFromCenter * Math.sin(particleData.currentAngle);
            funnelParticlePositions[i * 3] = currentX;
            funnelParticlePositions[i * 3 + 2] = currentZ;

            let pull = currentInwardPullStrength * (1 - Math.min(1, currentY / TORNADO_HEIGHT));
            pull = Math.max(0, pull);
            if (currentRadiusFromCenter > 0.01) {
                if (currentRadiusFromCenter < 0.2) pull *= (currentRadiusFromCenter / 0.2);
                funnelParticlePositions[i * 3] -= currentX * pull;
                funnelParticlePositions[i * 3 + 2] -= currentZ * pull;
            }

            const updraftFactor = 1.0 - Math.min(currentRadiusFromCenter / (currentTornadoMaxRadius * 0.75), 1.0);
            const targetUpwardVelocity = currentMaxUpwardVelocity * updraftFactor;
            particleData.velocity.y += (targetUpwardVelocity - particleData.velocity.y) * 0.05;
            funnelParticlePositions[i * 3 + 1] += particleData.velocity.y;

            if (funnelParticlePositions[i * 3 + 1] > TORNADO_HEIGHT * 1.1 || funnelParticlePositions[i * 3 + 1] < -0.5) {
                 initFunnelParticle(i, funnelParticlePositions, funnelParticlesData);
            }
        }
    }
    if (funnelGeometry && funnelGeometry.attributes.position) funnelGeometry.attributes.position.needsUpdate = true;

    // Update Debris Particles
    for (let i = 0; i < currentDebrisParticleCount; i++) {
        if (!debrisParticlesData[i]) { 
            initDebrisParticle(i, debrisParticlePositions, debrisParticlesData);
        }
        debrisParticlesData[i].lifetime--;
        if (debrisParticlesData[i].lifetime <= 0) {
            initDebrisParticle(i, debrisParticlePositions, debrisParticlesData);
        } else {
            const particleData = debrisParticlesData[i];
            const pIdx = i * 3;
            let currentX = debrisParticlePositions[pIdx];
            let currentY = debrisParticlePositions[pIdx + 1];
            let currentZ = debrisParticlePositions[pIdx + 2];
            let currentRadiusFromCenter = Math.sqrt(currentX * currentX + currentZ * currentZ);

            let targetRotationalSpeed;
            if (currentRadiusFromCenter < currentCoreRadius) {
                targetRotationalSpeed = (currentRadiusFromCenter / currentCoreRadius) * currentMaxRotationalSpeed;
            } else {
                targetRotationalSpeed = (currentCoreRadius / Math.max(0.01, currentRadiusFromCenter)) * currentMaxRotationalSpeed;
            }
            if (particleData.rotationalSpeed === undefined) particleData.rotationalSpeed = 0.01 + Math.random() * 0.01;
            particleData.rotationalSpeed += (targetRotationalSpeed - particleData.rotationalSpeed) * 0.1;
            particleData.currentAngle += particleData.rotationalSpeed;
            currentX = currentRadiusFromCenter * Math.cos(particleData.currentAngle);
            currentZ = currentRadiusFromCenter * Math.sin(particleData.currentAngle);
            debrisParticlePositions[pIdx] = currentX;
            debrisParticlePositions[pIdx + 2] = currentZ;

            let pull = currentInwardPullStrength * (1 - Math.min(1, currentY / (TORNADO_HEIGHT * 0.75)));
            pull = Math.max(0, pull);
            if (currentRadiusFromCenter > 0.01) {
                if (currentRadiusFromCenter < 0.2) pull *= (currentRadiusFromCenter / 0.2);
                debrisParticlePositions[pIdx] -= currentX * pull * 0.5;
                debrisParticlePositions[pIdx + 2] -= currentZ * pull * 0.5;
            }
            currentRadiusFromCenter = Math.sqrt(debrisParticlePositions[pIdx] * debrisParticlePositions[pIdx] + debrisParticlePositions[pIdx + 2] * debrisParticlePositions[pIdx + 2]);

            const updraftFactor = 1.0 - Math.min(currentRadiusFromCenter / (currentTornadoMaxRadius * 0.85), 1.0);
            const targetUpwardVelocity = (currentMaxUpwardVelocity * 0.75) * updraftFactor;
            particleData.velocity.y += (targetUpwardVelocity - particleData.velocity.y) * 0.05;
            particleData.velocity.y -= DEBRIS_GRAVITY;
            debrisParticlePositions[pIdx + 1] += particleData.velocity.y;

            if (debrisParticlePositions[pIdx + 1] > TORNADO_HEIGHT * 0.75 ||
                debrisParticlePositions[pIdx + 1] < 0 ||
                currentRadiusFromCenter > currentTornadoMaxRadius * 1.5) {
                initDebrisParticle(i, debrisParticlePositions, debrisParticlesData);
            }
        }
    }
    if (debrisGeometryOuter && debrisGeometryOuter.attributes.position) debrisGeometryOuter.attributes.position.needsUpdate = true;

    if (controls) {
        controls.target.set(tornadoGroup.position.x, tornadoGroup.position.y + TORNADO_HEIGHT / 2, tornadoGroup.position.z);
        controls.update();
    }
    renderer.render(scene, camera);
}

// -- Global Setup Calls --
setupSceneAndLighting();
createTornadoFunnelSystem(); 
createDebrisParticleSystem();  
setupUIControls();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

animate(); 

if (controls) { 
    controls.target.set(tornadoGroup.position.x, tornadoGroup.position.y + TORNADO_HEIGHT / 2, tornadoGroup.position.z);
}
