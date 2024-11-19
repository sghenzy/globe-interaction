let scene, camera, renderer, globe, cloudLayer, controls, particleSystem, labelRenderer;
const pins = [];
const orbitGroups = []; // Gruppi per i pin in orbita
let selectedPin = null;

function init() {
  const container = document.getElementById('globe-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161616);

  // Inizializza la camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 5); // Centra sull'asse X e Y, Z a 5
  camera.lookAt(0, 0, 0); // Assicurati che la camera guardi il centro

  // Inizializza il renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight); // Usa dimensioni intere
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Inizializza il label renderer per i testi descrittivi
  labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
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

  // Aggiungi il livello delle nuvole sopra il globo
  addCloudLayer();

  // Aggiungi i pin in orbita attorno al globo (senza le linee tratteggiate)
  addOrbitingPins();

  // Aggiungi Event Listener ai link di testo
  setupTextLinks();

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
  const geometry = new THREE.SphereGeometry(0.6, 64, 64);
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
  globe.position.set(0, 0, 0); // Assicura che il globo sia centrato
  scene.add(globe);
}

function addCloudLayer() {
  const geometry = new THREE.SphereGeometry(0.605, 64, 64); // Raggio leggermente più grande del globo
  const textureLoader = new THREE.TextureLoader();
  const cloudsTexture = textureLoader.load('https://sghenzy.github.io/globe-interaction/img/convertite/fair_clouds_8k.jpg');

  const material = new THREE.MeshBasicMaterial({
    map: cloudsTexture,
    transparent: true,
    blending: THREE.AdditiveBlending, // Metodo di fusione tipo "screen"
    opacity: 0.3 // Aggiunge trasparenza per un effetto più naturale
  });

  cloudLayer = new THREE.Mesh(geometry, material);
  cloudLayer.position.set(0, 0, 0); // Assicura che le nuvole siano centrate
  scene.add(cloudLayer);
}

function addOrbitingPins() {
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

  const orbitRadius = 0.63; // Raggio dell'orbita dei pin

  pinPositions.forEach((pos, index) => {
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = pos.inclination;
    if (pos.axis === 'z') {
      orbitGroup.rotation.y = pos.inclination;
    }

    orbitGroup.rotation.y += pos.startRotation; // Inizializzazione unica
    scene.add(orbitGroup);

    const pin = createPin(pos.label);
    pin.position.x = orbitRadius;

    pin.userData = {
      index: index,
      label: pos.label,
      orbitGroup: orbitGroup
    };

    orbitGroup.add(pin);
    pins.push(pin);
    orbitGroups.push(orbitGroup);
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

function setupTextLinks() {
  const links = document.querySelectorAll('.focus-link');
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const pinIndex = parseInt(link.dataset.pinIndex, 10);
      focusOnPin(pinIndex);
    });
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);

  resizeGlobe();
}

function animate() {
  requestAnimationFrame(animate);

  globe.rotation.y += 0.0001;
  cloudLayer.rotation.y += 0.0004;

  orbitGroups.forEach((group, index) => {
    const rotationSpeed = 0.0002 + index * 0.00002;
    group.rotation.y += rotationSpeed;
  });

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function focusOnPin(pinIndex) {
  const pin = pins[pinIndex];
  if (!pin) return;

  if (selectedPin) {
    selectedPin.material.color.set('rgb(144, 238, 144)');
    selectedPin.userData.label.visible = false;
  }

  pin.material.color.set('rgb(0, 102, 255)');
  pin.userData.label.visible = true;
  selectedPin = pin;

  const pinWorldPosition = new THREE.Vector3();
  pin.getWorldPosition(pinWorldPosition);

  const direction = pinWorldPosition.clone().normalize();

  const isBehind = pinWorldPosition.z < 0;

  const targetQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      Math.asin(direction.y),
      Math.atan2(-direction.x, direction.z) + (isBehind ? Math.PI : 0),
      0
    )
  );

  gsap.to(scene.quaternion, {
    x: targetQuaternion.x,
    y: targetQuaternion.y,
    z: targetQuaternion.z,
    w: targetQuaternion.w,
    duration: 1.5,
    ease: 'power2.inOut'
  });

  gsap.to(camera.position, {
    z: 4.5,
    duration: 1.5,
    ease: 'power2.inOut'
  });
}

window.focusOnPin = focusOnPin;
init();
