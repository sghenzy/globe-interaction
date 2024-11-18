let scene, camera, renderer, globe, controls, particleSystem, labelRenderer;
const pins = [];
const orbits = [];
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

  // Aggiungi i pin e le traiettorie
  addPinsAndOrbits();

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
  scene.add(globe);
}

function addPinsAndOrbits() {
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
  const pinOffset = 0.3;

  pinPositions.forEach((pos, index) => {
    const phi = (90 - pos.lat * 180) * (Math.PI / 180);
    const theta = (pos.lon * 360) * (Math.PI / 180);

    // Creazione della traiettoria indipendente
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);
    orbits.push(orbitGroup);

    // Aggiungi traiettoria tratteggiata
    const isPartial = index % 2 === 0;
    addDashedOrbit(orbitGroup, globeRadius + pinOffset, phi, theta, isPartial);

    // Aggiungi il pin alla traiettoria
    const pin = createPin(pos.label);
    orbitGroup.add(pin);
    pin.userData = { phi, theta, radius: globeRadius + pinOffset };
    pins.push(pin);
  });
}

function createPin(labelText) {
  const pinGeometry = new THREE.SphereGeometry(0.015, 16, 16); 
  const pinMaterial = new THREE.MeshStandardMaterial({ color: 'white' });
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

function addDashedOrbit(group, radius, phi, theta, partial = false) {
  const startAngle = partial ? Math.PI : 0;
  const endAngle = partial ? 1.5 * Math.PI : 2 * Math.PI;

  const curve = new THREE.EllipseCurve(
    0, 0,
    radius, radius,
    startAngle, endAngle,
    false,
    theta
  );

  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const material = new THREE.LineDashedMaterial({
    color: 0xffffff,
    dashSize: 0.05,
    gapSize: 0.03,
    opacity: 0.2,
    transparent: true
  });

  const orbitLine = new THREE.Line(geometry, material);
  orbitLine.computeLineDistances();

  orbitLine.rotation.x = phi;
  orbitLine.rotation.y = theta;

  group.add(orbitLine);
}

function animatePins() {
  const time = Date.now() * 0.0001;
  pins.forEach((pin, index) => {
    const { phi, radius } = pin.userData;
    const angle = time + index * 0.2;
    pin.position.x = radius * Math.sin(phi) * Math.cos(angle);
    pin.position.y = radius * Math.cos(phi);
    pin.position.z = radius * Math.sin(phi) * Math.sin(angle);
  });
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

function animate() {
  requestAnimationFrame(animate);

  // Ruota il globo sul proprio asse Y
  globe.rotation.y += 0.001;

  // Anima i pin lungo le traiettorie
  animatePins();

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

window.focusOnPin = focusOnPin;
init();
