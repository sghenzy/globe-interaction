let scene, camera, renderer, globe, controls, particleSystem, labelRenderer;
const pins = [];
const orbitGroups = []; // Gruppi per i pin in orbita
const orbitLines = []; // Linee di orbita tratteggiate
let selectedPin = null;

function init() {
  const container = document.getElementById('globe-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161616);

  // Inizializza la camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Inizializza il renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth - 300, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Inizializza il label renderer per i testi descrittivi
  labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth - 300, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  container.appendChild(labelRenderer.domElement);

  // Aggiungi luci alla scena
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  // Aggiungi il globo
  addGlobe();

  // Aggiungi i pin in orbita attorno al globo con traiettorie visibili
  addOrbitingPinsWithOrbits();

  // Imposta i controlli per la telecamera
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.minDistance = 2.5;
  controls.maxDistance = 2.5;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.09;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // Event listener per il ridimensionamento
  window.addEventListener('resize', onWindowResize);
  onWindowResize();
  addParticles();
  animate();
}

function addGlobe() {
  const geometry = new THREE.SphereGeometry(0.5, 64, 64);
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('https://sghenzy.github.io/globe-interaction/img/convertite/Earth%20Night%20Map%202k.webp');
  const material = new THREE.MeshStandardMaterial({ map: earthTexture });
  globe = new THREE.Mesh(geometry, material);
  
  // Imposta l'ordine di rendering del globo per sovrapporlo alle linee di orbita
  globe.position.z = 0.8; // Render order alto per sovrapposizione
  
  scene.add(globe);
}


function addOrbitingPinsWithOrbits() {
  const pinPositions = [
    { label: "Il Cairo", inclination: 0, startRotation: 0 },                // Orbita lungo l'asse X
    { label: "New York", inclination: Math.PI / 4, startRotation: 1 },      // Orbita inclinata di 45°
    { label: "Londra", inclination: Math.PI / 2, startRotation: 2 },        // Orbita lungo l'asse Y
    { label: "Tokyo", inclination: Math.PI / 6, startRotation: 3 },         // Orbita inclinata di 30°
    { label: "Roma", inclination: Math.PI / 3, startRotation: 4 },          // Orbita inclinata di 60°
    { label: "Mosca", inclination: Math.PI / 8, startRotation: 5 },         // Orbita inclinata di 22.5°
    { label: "Sydney", inclination: Math.PI / 12, startRotation: 6 },       // Orbita inclinata di 15°
    { label: "Parigi", inclination: Math.PI / 2, startRotation: 7, axis: 'z' } // Orbita lungo l'asse Z
  ];

  const globeRadius = 0.5;
  const orbitRadius = 0.7; // Raggio dell'orbita dei pin

  pinPositions.forEach((pos, index) => {
    // Crea un gruppo orbitale per ciascun pin
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = pos.inclination;
    if (pos.axis === 'z') {
      orbitGroup.rotation.y = pos.inclination;
    }

    orbitGroup.rotation.y += pos.startRotation; // Inizializzazione unica
    scene.add(orbitGroup);

    // Crea il pin e posizionalo nel gruppo orbitale
    const pin = createPin(pos.label);
    pin.position.x = orbitRadius; // Posiziona il pin lungo l'asse X del gruppo orbitale

    orbitGroup.add(pin);
    pins.push(pin);
    orbitGroups.push(orbitGroup);

    // Crea la linea tratteggiata per l'orbita
    const orbitLine = createDashedOrbit(orbitRadius);
    orbitLine.rotation.x = pos.inclination;
    if (pos.axis === 'z') {
      orbitLine.rotation.y = pos.inclination;
    }

    orbitLine.rotation.y += pos.startRotation; // Imposta la stessa rotazione iniziale per allineare con il pin
    orbitLines.push(orbitLine);
    scene.add(orbitLine); // Aggiungi la linea di orbita alla scena
  });
}

function createPin(labelText) {
  const pinGeometry = new THREE.SphereGeometry(0.015, 16, 16); 
  const pinMaterial = new THREE.MeshStandardMaterial({ color: 'rgb(144, 238, 144)' });
  const pin = new THREE.Mesh(pinGeometry, pinMaterial);

  const labelDiv = document.createElement('div');
  labelDiv.className = 'pin-label';
  labelDiv.textContent = labelText;
  labelDiv.style.color = 'white';

  const label = new THREE.CSS2DObject(labelDiv);
  label.position.set(0, 0.1, 0);
  label.visible = false;
  pin.add(label);

  return pin;
}

function createDashedOrbit(radius) {
  const curve = new THREE.EllipseCurve(
    0, 0,            // Centro dell'orbita
    radius, radius,   // Raggio dell'orbita
    0, 2 * Math.PI    // Orbita completa
  );

  const points = curve.getPoints(100);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color: 0xffffff,
    dashSize: 0.05,
    gapSize: 0.03,
    opacity: 0.2, // Imposta l'opacità della linea per renderla meno visibile
    transparent: true
  });

  const orbitLine = new THREE.Line(geometry, material);
  orbitLine.computeLineDistances(); // Necessario per il tratteggio
  return orbitLine;
}

function onWindowResize() {
  let containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;

  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(containerWidth, containerHeight);
  labelRenderer.setSize(containerWidth, containerHeight);

  resizeGlobe();
}

// Funzione di animazione
function animate() {
  requestAnimationFrame(animate);

  // Ruota solo il globo sull'asse Y
  globe.rotation.y += 0.001;

  // Ruota ciascun gruppo orbitale per creare l'effetto di orbita più lento
  orbitGroups.forEach((group, index) => {
    const orbitLine = orbitLines[index];
    const rotationSpeed = 0.0005 + index * 0.00005;

    // Ruota il gruppo orbitale (che contiene il pin) e la linea d'orbita
    group.rotation.y += rotationSpeed;
    orbitLine.rotation.y += rotationSpeed; // Mantieni la linea d'orbita sincronizzata
  });

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function addParticles() {
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 5000;
  const positions = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount * 3; i += 3) {
    const distance = Math.random() * 10 + 2;
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.acos((Math.random() * 2) - 1);

    positions[i] = distance * Math.sin(angle2) * Math.cos(angle1);
    positions[i + 1] = distance * Math.sin(angle2) * Math.sin(angle1);
    positions[i + 2] = distance * Math.cos(angle2);
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particlesMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.01, transparent: true, opacity: 0.5 });
  particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particleSystem);
}

function resizeGlobe() {
  const maxGlobeScale = 1;
  const minGlobeScale = 0.3;
  const mobileScale = 0.6;
  const screenWidth = window.innerWidth;
  let scaleFactor = maxGlobeScale;

  if (screenWidth < 850) {
    scaleFactor = minGlobeScale + (screenWidth - 560) * (maxGlobeScale - minGlobeScale) / (850 - 560);
    scaleFactor = Math.max(minGlobeScale, scaleFactor);
  }
  if (screenWidth < 479) {
    scaleFactor = mobileScale;
  }

  globe.scale.set(scaleFactor, scaleFactor, scaleFactor);
}

function focusOnPin(pinIndex) {
  const pin = pins[pinIndex];
  if (!pin) return;

  if (selectedPin) {
    selectedPin.material.color.set('rgb(144, 238, 144)');
    selectedPin.userData.label.visible = false;
  }

  pin.material.color.set('rgb(173, 216, 230)');
  pin.userData.label.visible = true;
  selectedPin = pin;

  const direction = pin.position.clone().normalize();
  const targetRotation = new THREE.Euler(
    Math.asin(direction.y),
    Math.atan2(-direction.x, direction.z),
    0
  );

  gsap.to(globe.rotation, {
    x: targetRotation.x,
    y: targetRotation.y,
    z: targetRotation.z,
    duration: 1.5,
    ease: 'power2.inOut',
    onUpdate: () => controls.update()
  });
}

window.focusOnPin = focusOnPin;
init();
