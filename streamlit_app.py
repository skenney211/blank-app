import streamlit as st

st.title("🎈 My new app")
st.write(
    "Let's start building! For help and inspiration, head over to [docs.streamlit.io](https://docs.streamlit.io/)."
)
// --- New Visual Effects ---

// 1. Shockwave Effect: Creates an expanding ring
function createShockwave(origin) {
  const geometry = new THREE.RingGeometry(1, 1.2, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const shockwave = new THREE.Mesh(geometry, material);
  shockwave.position.copy(origin);
  shockwave.rotation.x = Math.PI / 2; // lay flat
  shockwave.userData = {
    duration: 1, // effect lasts 1 second
    startTime: performance.now() / 1000,
  };
  return shockwave;
}

// 2. Neutron Emission: Creates a particle system to simulate emitted neutrons
function createNeutronParticles(origin) {
  const particleCount = 100;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    // Start all particles at the origin
    positions[i * 3] = origin.x;
    positions[i * 3 + 1] = origin.y;
    positions[i * 3 + 2] = origin.z;

    // Assign a random velocity vector
    velocities[i * 3] = (Math.random() - 0.5) * 2;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

  const material = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.1,
    transparent: true,
    opacity: 0.9,
  });
  const particles = new THREE.Points(geometry, material);
  particles.userData = {
    lifetime: 2, // lasts 2 seconds
    startTime: performance.now() / 1000,
  };

  return particles;
}

// --- Integration in the Animation Loop ---
// (Assuming your "Energy Release" element triggers the explosion)

const energyEffect = elementsByLabel["Energy Release"];
if (energyEffect && energyEffect.visible) {
  const elapsedTime = now - energyEffect.userData.startTime;
  if (elapsedTime < 1.5) {
    const scale = elapsedTime * 5 * energyEffect.userData.intensity;
    energyEffect.scale.set(scale, scale, scale);
    energyEffect.material.opacity = 1 - (elapsedTime / 1.5);
  } else {
    energyEffect.visible = false;
  }

  // Trigger the new visual effects once at the start of energy release
  if (!energyEffect.userData.effectsAdded) {
    // Add the shockwave effect
    const shockwave = createShockwave(energyEffect.position);
    scene.add(shockwave);

    // Add the neutron emission particle system
    const neutronParticles = createNeutronParticles(energyEffect.position);
    scene.add(neutronParticles);

    energyEffect.userData.effectsAdded = true;
  }
}

// --- Update New Effects Each Frame ---
scene.traverse(function(object) {
  if (object.userData) {
    const currentTime = now;
    // Update shockwave effect
    if (object.userData.duration && object.geometry instanceof THREE.RingGeometry) {
      const effectElapsed = currentTime - object.userData.startTime;
      if (effectElapsed < object.userData.duration) {
        const newScale = 1 + effectElapsed * 3;
        object.scale.set(newScale, newScale, newScale);
        object.material.opacity = 0.8 * (1 - effectElapsed / object.userData.duration);
      } else {
        // Remove shockwave after its duration
        scene.remove(object);
      }
    }
    // Update neutron particles
    if (object.userData.lifetime && object.geometry instanceof THREE.BufferGeometry) {
      const effectElapsed = currentTime - object.userData.startTime;
      const positions = object.geometry.getAttribute('position');
      const velocities = object.geometry.getAttribute('velocity');
      for (let i = 0; i < positions.count; i++) {
        positions.array[i * 3]     += velocities.array[i * 3] * 0.016;
        positions.array[i * 3 + 1] += velocities.array[i * 3 + 1] * 0.016;
        positions.array[i * 3 + 2] += velocities.array[i * 3 + 2] * 0.016;
      }
      positions.needsUpdate = true;
      object.material.opacity = 0.9 * (1 - effectElapsed / object.userData.lifetime);
      if (effectElapsed > object.userData.lifetime) {
        scene.remove(object);
      }
    }
  }
});