let scene, camera, orbitRenderer, globeRenderer, globe, controls, particleSystem, labelRenderer;
const pins = [];
const orbitGroups = [];
const orbitLines = [];
let selectedPin = null;

function init() {
  const container = document.getElementById('globe-container');
  
  // Crea la scena e la telecamera
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161616);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Inizializza il renderer per le linee di orbita
  orbitRenderer = new THREE.WebGLRenderer({ antialias: true });
  orbitRenderer.setSize(window.innerWidth - 300, window.innerHeight);
  orbitRenderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(orbitRenderer.domElement);

  // Inizializza il renderer per il globo
  globeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha:true per renderlo trasparente
  globeRenderer.setSize(window.innerWidth - 300, window.innerHeight);
  globeRenderer.setPixelRatio(window.devicePixelRatio);
  globeRenderer.domElement.style.position = "absolute";
  globeRenderer.domElement.style.top = "0";
  container.appendChild(globeRenderer.domElement);

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
  controls = new THREE.OrbitControls(camera, globeRenderer.domElement);
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
    depthWrite: true,
    depthTest: true
  });

  globe = new THREE.Mesh(geometry, material);
  scene.add(globe);
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
    depthWrite: true,
    depthTest: true
  });

  const orbitLine = new THREE.Line(geometry, material);
  orbitLine.computeLineDistances();
  return orbitLine;
}

function animate() {
  requestAnimationFrame(animate);

  globe.rotation.y += 0.001;

  orbitGroups.forEach((group, index) => {
    const rotationSpeed = 0.0005 + index * 0.00005;
    group.rotation.y += rotationSpeed;
  });

  controls.update();

  // Primo passaggio: renderizza le linee di orbita
  orbitRenderer.render(scene, camera);

  // Secondo passaggio: renderizza il globo sopra
  globeRenderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function onWindowResize() {
  const containerWidth = window.innerWidth - 300;
  const containerHeight = window.innerHeight;

  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();

  orbitRenderer.setSize(containerWidth, containerHeight);
  globeRenderer.setSize(containerWidth, containerHeight);
  labelRenderer.setSize(containerWidth, containerHeight);
}

init();
