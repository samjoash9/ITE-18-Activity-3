import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/loaders/GLTFLoader.js';

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8b4513); // Dark yello orange ni bai na c
scene.fog = new THREE.Fog(0x705d3d, 5, 40); // Ngit2 na naay pagka yellow iya shit

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(20, 10, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;

// Sand Floor para noice
const sand = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ color: 0xd2b48c }) // Sandy color para mura naa sa desert ba
);
sand.rotation.x = -Math.PI / 2;
scene.add(sand);

// Lights ni bai
const ambientLight = new THREE.AmbientLight(0xffcc88, 0.4);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xffaa66, 0.8);
sunlight.position.set(10, 20, -5);
scene.add(sunlight);

// I load na nato ang tae na hammer
const loader = new GLTFLoader();
let mjolnirPosition = { x: 0, y: -0.5, z: 0 };

loader.load(
  'https://trystan211.github.io/ite_joash/mjolnir_thors_hammer.glb',
  (gltf) => {
    const mjolnir = gltf.scene;
    mjolnir.position.set(mjolnirPosition.x, mjolnirPosition.y, mjolnirPosition.z);
    mjolnir.scale.set(0.01, 0.01, 0.01); // Gamay kaayo bai kay yabag higanti ang model na gigamit nako
    scene.add(mjolnir);
  },
  undefined,
  (error) => console.error('Error loading Mjolnir model:', error)
);

// Small Black Stones ni bai
const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

for (let i = 0; i < 50; i++) {
  const x = Math.random() * 60 - 30;
  const z = Math.random() * 60 - 30;

  const stone = new THREE.Mesh(
    new THREE.SphereGeometry(Math.random() * 0.5, 16, 16),
    stoneMaterial
  );
  stone.position.set(x, 0.2, z);
  stone.castShadow = true; // Enable shadows para sa mga bato
  scene.add(stone);
}

// Pointy Rocks nga naay Raycasting 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tallRocks = []; // Store references sa pointy rocks para ma ilhan na mag raycast na sya

const rockMaterial = new THREE.MeshStandardMaterial({
  color: 0x666666,
  roughness: 0.9,
  metalness: 0.1
});

for (let i = 0; i < 10; i++) {
  const x = Math.random() * 50 - 25;
  const z = Math.random() * 50 - 25;

  const tallRock = new THREE.Mesh(
    new THREE.ConeGeometry(Math.random() * 1 + 1, Math.random() * 10 + 5, 8),
    rockMaterial.clone() // Clone material for independent control kay kung wa? awh mu color og mudako sila tanan
  );
  tallRock.position.set(x, Math.random() * 2, z);
  tallRock.castShadow = true;
  tallRocks.push(tallRock);
  scene.add(tallRock);
}

// Kani ang bahala kung unsay buhaton niya kung mag click ka bai
const handleClick = (event) => {
  // Normalize mouse position kay yabag ra siyag tala kung di
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update sa raycaster
  raycaster.setFromCamera(mouse, camera);

  // Tan awon kung naa bay mga intersections
  const intersects = raycaster.intersectObjects(tallRocks);

  if (intersects.length > 0) {
    const selectedRock = intersects[0].object;

    // Diri  niya i store ang original color og ang original scale
    const originalColor = selectedRock.material.color.clone();
    const originalScale = selectedRock.scale.clone();

    // Change ang color og ang size kung ma click
    selectedRock.material.color.set(0x444444); // Darker gray ra ato i shit bai
    selectedRock.scale.multiplyScalar(1.2); // Slightly larger para murag korek

    // Mubalik ra after 2 seconds
    setTimeout(() => {
      selectedRock.material.color.copy(originalColor);
      selectedRock.scale.copy(originalScale);
    }, 2000);
  }
};

// Event Listeners ni bai kay nag raycasting man ta
window.addEventListener('click', handleClick);

// Mao ni ang nag orbit na particles bai
const particleCount = 6000; // Number of particles  ni bai
const particlesGeometry = new THREE.BufferGeometry();
const positions = [];
const velocities = [];

for (let i = 0; i < particleCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 45 + 5; //Mao ni iya range bai
  const y = Math.random() * 12 + 2;

  positions.push(
    Math.cos(angle) * distance + mjolnirPosition.x,
    y,
    Math.sin(angle) * distance + mjolnirPosition.z
  );
  velocities.push(0.002 * (Math.random() > 0.5 ? 1 : -1)); // Random angular shit ni bai para sporadic taraw
}

particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
particlesGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 1));

const particlesMaterial = new THREE.PointsMaterial({
  color: 0xffaa33,
  size: 0.25,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);


const flickeringLights = [];
const lightCount = 5; // 5 lang kay overkill ra sa kahayag ang 10
const lightRadius = 10;

for (let i = 0; i < lightCount; i++) {
  const angle = (i / lightCount) * Math.PI * 2;
  const x = mjolnirPosition.x + Math.cos(angle) * lightRadius;
  const z = mjolnirPosition.z + Math.sin(angle) * lightRadius;
  const y = mjolnirPosition.y + 2 + Math.random() * 2;

  const light = new THREE.PointLight(0x33ccff, 0, 20); // Lightning blue ang color sa atong flickering lights bai
  light.position.set(x, y, z);
  scene.add(light);
  flickeringLights.push(light);
}

// Animation Loop ni bai para sa particles
const clock = new THREE.Clock();

const animate = () => {
  // Update particles ni kay di siya mu shit kung dili i update
  const positions = particlesGeometry.attributes.position.array;
  const velocities = particlesGeometry.attributes.velocity.array;

  for (let i = 0; i < particleCount; i++) {
    const xIndex = i * 3;
    const zIndex = xIndex + 2;

    const x = positions[xIndex] - mjolnirPosition.x;
    const z = positions[zIndex] - mjolnirPosition.z;

    const angle = Math.atan2(z, x) + velocities[i];
    const distance = Math.sqrt(x * x + z * z);

    positions[xIndex] = Math.cos(angle) * distance + mjolnirPosition.x;
    positions[zIndex] = Math.sin(angle) * distance + mjolnirPosition.z;
  }
  particlesGeometry.attributes.position.needsUpdate = true;

  // Flickering light nga naay dynamic positions bai para nindotay
  flickeringLights.forEach((light) => {
    light.intensity = Math.random() * 8 + 4;

    const angle = Math.random() * Math.PI * 2;
    const radius = lightRadius * Math.random();
    light.position.set(
      mjolnirPosition.x + Math.cos(angle) * radius,
      mjolnirPosition.y + 2 + Math.random() * 2,
      mjolnirPosition.z + Math.sin(angle) * radius
    );
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

// Siya ang ga handle sa Window Resize bai
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
