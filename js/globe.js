let globeScene, orbitScene, camera, renderer, globe, controls, labelRenderer;
const pins = [];
const orbitGroups = [];
const orbitLines = [];
let selectedPin = null;

function init() {
  const container = document.getElementById('globe-container');
  
  // Crea due scene separate
  globeScene = new THREE.Scene();
  orbitScene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Inizializza il renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth - 300, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Inizializza il label renderer per i testi descrittivi
  labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth - 300, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  container.appendChild(labelRenderer.domElement);

  // Aggiungi luci alla scena del globo
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  globeScene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 3, 5);
  globeScene.add(directionalLight);

  // Aggiungi il globo alla scena del globo
  addGlobe();

  // Aggiungi i pin e le orbite alla scena delle orbite
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

  window.addEventListener('resize', onWindowResize);
  onWindowResize();
  addParticles();
  animate();
}

function addGlobe() {
  const geometry = new THREE.SphereGeometry(0.5, 64, 64);
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('https://sghenzy.github.io/globe-interaction/img/convertite/Earth%20Night%20Map%202k.webp');
  
  const material = new THREE.MeshStandardMaterial({
    map: earthTexture,
    opacity: 1,
    transparent: false,
    depthWrite: true
  });

  globe = new THREE.Mesh(geometry, material);
  globeScene.add(globe);
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
    opacity: 0.4,
    transparent: true,
    depthWrite: true
  });

  const orbitLine = new THREE.Line(geometry, material);
  orbitLine.computeLineDistances();
  return orbitLine;
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

  const orbitRadius = 0.6;

  pinPositions.forEach((pos, index) => {
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = pos.inclination;
    if (pos.axis === 'z') {
      orbitGroup.rotation.y = pos.inclination;
    }

    orbitGroup.rotation.y += pos.startRotation;
    orbitScene.add(orbitGroup);

    const pin = createPin(pos.label);
    pin.position.x = orbitRadius;
    orbitGroup.add(pin);
    pins.push(pin);
    orbitGroups.push(orbitGroup);

    const orbitLine = createDashedOrbit(orbitRadius);
    orbitLine.rotation.x = pos.inclination;
    if (pos.axis === 'z') {
      orbitLine.rotation.y = pos.inclination;
    }

    orbitLine.rotation.y += pos.startRotation;
    orbitLines.push(orbitLine);
    orbitScene.add(orbitLine);
  });
}

function animate() {
  requestAnimationFrame(animate);

  globe.rotation.y += 0.001;

  orbitGroups.forEach((group, index) => {
    const rotationSpeed = 0.0005 + index * 0.00005;
    group.rotation.y += rotationSpeed;
  });

  controls.update();

  // Primo passaggio: renderizza la scena delle orbite
  renderer.autoClear = true;
  renderer.render(orbitScene, camera);

  // Secondo passaggio: renderizza la scena del globo sopra
  renderer.autoClear = false;
  renderer.render(globeScene, camera);
  labelRenderer.render(globeScene, camera);
}

function onWindowResize() {
  const containerWidth = window.innerWidth - 300;
  const containerHeight = window.innerHeight;

  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(containerWidth, containerHeight);
  labelRenderer.setSize(containerWidth, containerHeight);
}

init();
