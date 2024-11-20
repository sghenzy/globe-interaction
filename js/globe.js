let scene, camera, renderer, globe, cloudLayer, controls, particleSystem, labelRenderer, line, infoBox;
const pins = [];
const orbitGroups = [];
let selectedPin = null;
let isFrozen = false; // Stato del globo e dei pin

function init() {
  const container = document.getElementById('globe-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161616);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth - 300, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth - 300, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  container.appendChild(labelRenderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  addGlobe();
  addCloudLayer();
  addOrbitingPins();
  createInfoBox();

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
  scene.add(globe);
}

function addCloudLayer() {
  const geometry = new THREE.SphereGeometry(0.605, 64, 64);
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
  ];

  const orbitRadius = 0.63;

  pinPositions.forEach((pos, index) => {
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = pos.inclination;

    orbitGroup.rotation.y += pos.startRotation;
    scene.add(orbitGroup);

    const pin = createPin(pos.label, index);
    pin.position.x = orbitRadius;
    orbitGroup.add(pin);
    pins.push(pin);
    orbitGroups.push(orbitGroup);
  });
}

function createPin(labelText, index) {
  const pinGeometry = new THREE.SphereGeometry(0.015, 16, 16);
  const pinMaterial = new THREE.MeshStandardMaterial({ color: 'rgb(144, 238, 144)' });
  const pin = new THREE.Mesh(pinGeometry, pinMaterial);

  pin.userData = { label: labelText, index: index };

  pin.callback = () => handlePinClick(pin); // Aggiungi callback per il clic

  const labelDiv = document.createElement('div');
  labelDiv.className = 'pin-label';
  labelDiv.textContent = labelText;
  labelDiv.style.color = 'white';

  const label = new THREE.CSS2DObject(labelDiv);
  label.position.set(0, 0.1, 0);
  label.visible = false;
  pin.add(label);

  pin.addEventListener('click', () => handlePinClick(pin));

  return pin;
}

function createInfoBox() {
  infoBox = document.createElement('div');
  infoBox.id = 'info-box';
  infoBox.style.position = 'absolute';
  infoBox.style.background = 'rgba(255, 192, 203, 0.9)'; // Rosa
  infoBox.style.padding = '10px';
  infoBox.style.borderRadius = '5px';
  infoBox.style.display = 'none';
  infoBox.innerHTML = `<h3 id="info-title"></h3><p id="info-description"></p>`;
  document.body.appendChild(infoBox);
}

function handlePinClick(pin) {
  if (!isFrozen) {
    freezeScene(); // Congela il globo e i pin
  }

  const title = document.getElementById('info-title');
  const description = document.getElementById('info-description');

  title.innerText = pin.userData.label;
  description.innerText = `Descrizione di ${pin.userData.label}`; // Esempio di descrizione

  infoBox.style.display = 'block';
  infoBox.style.left = '50px';
  infoBox.style.top = '50px';

  // Disegna una linea dinamica dal pin al box
  drawLineToBox(pin);
}

function drawLineToBox(pin) {
  if (line) scene.remove(line);

  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const points = [];
  points.push(pin.position.clone());
  points.push(new THREE.Vector3(0, 0, 0)); // Posizione del box (aggiusta se necessario)
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  line = new THREE.Line(geometry, material);
  scene.add(line);
}

function freezeScene() {
  isFrozen = true;
  controls.autoRotate = false; // Ferma la rotazione del globo
}

function onWindowResize() {
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;

  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(containerWidth, containerHeight);
  labelRenderer.setSize(containerWidth, containerHeight);
}

function animate() {
  if (!isFrozen) {
    globe.rotation.y += 0.0001;
    cloudLayer.rotation.y += 0.0004;

    orbitGroups.forEach((group) => {
      group.rotation.y += 0.0002;
    });
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

init();
