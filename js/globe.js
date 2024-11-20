let scene, camera, renderer, globe, cloudLayer, controls, particleSystem, labelRenderer, selectedPin = null, infoBox, infoLine;

const pins = [];
const orbitGroups = []; // Gruppi per i pin in orbita
let raycaster, mouse; // Variabili per il raycasting

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

  // Inizializza il raycaster e il mouse
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Aggiungi il globo
  addGlobe();

  // Aggiungi il livello delle nuvole sopra il globo
  addCloudLayer();

  // Aggiungi i pin in orbita attorno al globo
  addOrbitingPins();

  // Crea il box informativo e la linea
  createInfoBox();

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

  // Event listener per i clic del mouse
  window.addEventListener('pointerdown', onMouseClick);

  // Aggiungi particelle
  addParticles();

  animate();
}

function addGlobe() {
  const geometry = new THREE.SphereGeometry(0.45, 64, 64);
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

function addCloudLayer() {
  const geometry = new THREE.SphereGeometry(0.48, 64, 64);
  const textureLoader = new THREE.TextureLoader();
  const cloudsTexture = textureLoader.load('https://sghenzy.github.io/globe-interaction/img/convertite/fair_clouds_8k.jpg');

  const material = new THREE.MeshBasicMaterial({
    map: cloudsTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.3
  });

  cloudLayer = new THREE.Mesh(geometry, material);
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

  const orbitRadius = 0.5;

  pinPositions.forEach((pos, index) => {
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = pos.inclination;
    if (pos.axis === 'z') {
      orbitGroup.rotation.y = pos.inclination;
    }

    orbitGroup.rotation.y += pos.startRotation;
    scene.add(orbitGroup);

    const pin = createPin(pos.label);
    pin.position.x = orbitRadius;

    pin.userData = {
      index,
      label: pos.label,
      orbitGroup
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
  return pin;
}

function createInfoBox() {
  infoBox = document.createElement('div');
  infoBox.className = 'info-box';
  infoBox.style.position = 'absolute';
  infoBox.style.backgroundColor = 'rgba(255, 192, 203, 0.9)';
  infoBox.style.padding = '10px';
  infoBox.style.borderRadius = '5px';
  infoBox.style.display = 'none';
  document.body.appendChild(infoBox);

  infoLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xff0000 })
  );
  scene.add(infoLine);
}

function updateInfoBox(pinIndex) {
  const pin = pins[pinIndex];
  const worldPosition = new THREE.Vector3();
  pin.getWorldPosition(worldPosition);

  const boxPosition = calculateBoxPosition(worldPosition);
  const linePoints = [worldPosition, boxPosition];
  updateLineGeometry(linePoints);

  const screenPosition = boxPosition.clone().project(camera);

  const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
  const y = -(screenPosition.y * 0.5 - 0.5) * window.innerHeight;

  infoBox.style.left = `${x}px`;
  infoBox.style.top = `${y}px`;
  infoBox.innerHTML = `
    <strong>${pin.userData.label}</strong><br>
    Breve descrizione del pin selezionato
  `;
  infoBox.style.display = 'block';
}

function calculateBoxPosition(worldPosition) {
  const direction = worldPosition.clone().normalize();
  const boxDistance = 0.7;
  return direction.multiplyScalar(boxDistance);
}

function updateLineGeometry(points) {
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  infoLine.geometry.dispose();
  infoLine.geometry = lineGeometry;
}

function focusOnPin(pinIndex) {
  if (selectedPin !== null) {
    selectedPin.material.color.set('rgb(144, 238, 144)');
  }

  selectedPin = pins[pinIndex];
  selectedPin.material.color.set('rgb(0, 102, 255)');

  updateInfoBox(pinIndex);
}

function onMouseClick(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(pins);

  if (intersects.length > 0) {
    const pin = intersects[0].object;
    focusOnPin(pin.userData.index);
  }
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

function onWindowResize() {
  const containerWidth = window.innerWidth - 300;
  const containerHeight = window.innerHeight;

  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(containerWidth, containerHeight);
  labelRenderer.setSize(containerWidth, containerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  globe.rotation.y += 0.0001;
  cloudLayer.rotation.y += 0.0004;

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

init();
