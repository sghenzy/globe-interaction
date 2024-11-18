let scene, camera, renderer, globe, controls, particleSystem, labelRenderer;
const pins = [];
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
  const geometry = new THREE.SphereGeometry(0.5, 64, 64);
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('https://sghenzy.github.io/globe-interaction/img/convertite/Earth%20Night%20Map%202k.webp');
  const material = new THREE.MeshStandardMaterial({ map: earthTexture });
  globe = new THREE.Mesh(geometry, material);

// Applica un offset leggero verso destra
  // globe.position.x = 0.5; // Aggiusta il valore per spostarlo più o meno a destra
  scene.add(globe);

  // Aggiungi i pin
  addPins();

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

// Funzione per aggiungere i pin al globo
function addPins() {
  const pinPositions = [
    { lat: 0.4, lon: 0.1, label: "Il Cairo" },
    { lat: -0.3, lon: 0.3, label: "New York" },
    { lat: 0.2, lon: 0.6, label: "Londra" },
    { lat: -0.4, lon: 0.9, label: "Tokyo" },
    { lat: 0.3, lon: -0.2, label: "Roma" },
    { lat: -0.2, lon: -0.5, label: "Mosca" },
    { lat: 0.1, lon: -0.8, label: "Sydney" },
    { lat: -0.1, lon: -0.1, label: "Parigi" }
  ];

  const globeRadius = 0.5;
  const pinOffset = 0.05; // Offset dei pin dalla superficie del globo

  pinPositions.forEach((pos, index) => {
    const pinGeometry = new THREE.SphereGeometry(0.015, 16, 16); 
    const pinMaterial = new THREE.MeshStandardMaterial({ color: 'rgb(144, 238, 144)' });
    const pin = new THREE.Mesh(pinGeometry, pinMaterial);

    const phi = (90 - pos.lat * 180) * (Math.PI / 180);
    const theta = (pos.lon * 360) * (Math.PI / 180);

    pin.position.x = (globeRadius + pinOffset) * Math.sin(phi) * Math.cos(theta);
    pin.position.y = (globeRadius + pinOffset) * Math.cos(phi);
    pin.position.z = (globeRadius + pinOffset) * Math.sin(phi) * Math.sin(theta);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'pin-label';
    labelDiv.textContent = pos.label;
    labelDiv.style.color = 'white';

    const label = new THREE.CSS2DObject(labelDiv);
    label.position.set(0, 0.1, 0);
    label.visible = false;
    pin.add(label);

    pin.userData.index = index;
    pin.userData.label = label;
    globe.add(pin);
    pins.push(pin);

    // Aggiungi traiettoria tratteggiata
    addDashedOrbit(globeRadius + pinOffset, phi, theta);
  });
}

function addDashedOrbit(radius, phi, theta) {
  const curve = new THREE.EllipseCurve(
    0, 0,            // x, y del centro
    radius, radius,   // larghezza e altezza dell'ellisse
    0, 2 * Math.PI,   // angoli di inizio e fine
    false,            // senso orario
    theta             // angolo di rotazione
  );

  const points = curve.getPoints(100);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color: 0xffffff,
    dashSize: 0.01,
    gapSize: 0.01,
  });

  const orbitLine = new THREE.Line(geometry, material);
  orbitLine.computeLineDistances(); // Necessario per il tratteggio
  orbitLine.rotation.x = phi;

  scene.add(orbitLine);
}


// Funzione per ridimensionare solo il globo
function resizeGlobe() {
  const maxGlobeScale = 1;      // Scale for larger screens
  const minGlobeScale = 0.3;    // Minimum scale for screens between 800px and 560px
  const mobileScale = 0.6;      // Slightly larger scale for screens below 479px

  const screenWidth = window.innerWidth;
  let scaleFactor = maxGlobeScale;

  // Scale down gradually for screens below 850px
  if (screenWidth < 850) {
    scaleFactor = minGlobeScale + (screenWidth - 560) * (maxGlobeScale - minGlobeScale) / (850 - 560);
    scaleFactor = Math.max(minGlobeScale, scaleFactor);
  }

  // Additional scaling for very small screens (below 479px)
  if (screenWidth < 479) {
    scaleFactor = mobileScale;
  }

  // Apply the scale to the globe
  globe.scale.set(scaleFactor, scaleFactor, scaleFactor);
}


// Gestione del ridimensionamento della finestra
function onWindowResize() {
  let containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;

  // Adjust the camera aspect ratio and renderer dimensions
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(containerWidth, containerHeight);
  labelRenderer.setSize(containerWidth, containerHeight);

  // Update the globe size based on new screen size
  resizeGlobe();
}

// Funzione di animazione
function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.00001;
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// Aggiungi particelle per l'effetto
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

// Funzione per selezionare il pin
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
