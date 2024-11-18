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
  // Aumenta leggermente il raggio del globo per sovrapporsi visivamente alle orbite
  const geometry = new THREE.SphereGeometry(0.6, 64, 64); // Cambia il raggio da 0.5 a 0.505
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('https://sghenzy.github.io/globe-interaction/img/convertite/Earth%20Night%20Map%202k.webp');
  
  const material = new THREE.MeshStandardMaterial({
    map: earthTexture,
    opacity: 1,
    transparent: false,
    depthWrite: true, // Assicura che il globo blocchi visivamente le linee
    depthTest: true   // Mantieni il test di profondità per una corretta visualizzazione
  });

  globe = new THREE.Mesh(geometry, material);
  
  scene.add(globe);
}

function addOrbitingPinsWithOrbits() {
  const pinPositions = [
    { label: "Il Cairo", inclination: 0, startRotation: 0 },
    { label: "New York", inclination: Math.PI / 4, startRotation: 1 },
    { label: "Londra", inclination: Math.PI / 2, startRotation: 2 },
    { label: "Tokyo", inclination: Math.PI / 6, startRotation: 3 },
    { label: "Roma", inclination: Math.PI / 3, startRotation: 4 },
    { label: "Mosca", inclination: Math.PI / 8, startRotation: 5 },
    { label: "Sydney", inclination: Math.PI / 12, startRotation: 6 },
    { label: "Parigi", inclination: Math.PI / 2, startRotation: 7, axis: 'z' }
  ];

  const orbitRadius = 0.7; // Raggio dell'orbita dei pin

  pinPositions.forEach((pos, index) => {
    console.log(`Creazione pin e orbita per: ${pos.label}`); // Debug per ogni pin

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
    pin.position.x = orbitRadius;
    orbitGroup.add(pin);
    pins.push(pin);
    orbitGroups.push(orbitGroup);

    // Crea una singola linea di orbita per il pin
    const orbitLine = createDashedOrbit(orbitRadius);
    orbitLine.rotation.x = pos.inclination;
    if (pos.axis === 'z') {
      orbitLine.rotation.y = pos.inclination;
    }

    orbitLine.rotation.y += pos.startRotation;
    orbitLines.push(orbitLine);
    scene.add(orbitLine); // Aggiungi la linea di orbita alla scena
  });

  console.log(`Totale pin creati: ${pins.length}`);
  console.log(`Totale orbite create: ${orbitLines.length}`);
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
    0, 0,            
    radius, radius,   
    0, 2 * Math.PI    
  );

  const points = curve.getPoints(100);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color: 0xffffff,
    dashSize: 0.05,
    gapSize: 0.03,
    opacity: 0.4, // Opacità di base della linea
    transparent: true,
    depthWrite: false, // Evita interferenze di profondità
    depthTest: true
  });

  const orbitLine = new THREE.Line(geometry, material);
  orbitLine.computeLineDistances();

  // Aggiunge un comportamento personalizzato per regolare l'opacità in base alla posizione
  orbitLine.onBeforeRender = function(renderer, scene, camera, geometry, material) {
    const distanceToCamera = camera.position.distanceTo(orbitLine.position);
    const distanceToGlobe = camera.position.distanceTo(globe.position);

    // Regola l'opacità delle linee se sono più vicine alla telecamera del globo
    material.opacity = distanceToCamera < distanceToGlobe ? 0.1 : 0.4;
  };

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
