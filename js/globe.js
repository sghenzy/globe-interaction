let scene, camera, renderer, globe, cloudLayer, controls, particleSystem, labelRenderer, line, infoBox;
const pins = [];
const orbitGroups = [];
let selectedPin = null;

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
  const geometry = new THREE.SphereGeometry(0.64, 64, 64);
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
  const geometry = new THREE.SphereGeometry(0.641, 64, 64);
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

  const orbitRadius = 0.7;

  pinPositions.forEach((pos, index) => {
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = pos.inclination;
    if (pos.axis === 'z') {
      orbitGroup.rotation.y = pos.inclination;
    }

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

  pin.callback = () => handlePinClick(pin);

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

function createInfoBox() {
  infoBox = document.createElement('div');
  infoBox.id = 'info-box';
  infoBox.style.position = 'absolute';
  infoBox.style.background = 'rgba(255, 192, 203, 0.9)';
  infoBox.style.padding = '10px';
  infoBox.style.borderRadius = '5px';
  infoBox.style.display = 'none';
  infoBox.innerHTML = `<h3 id="info-title"></h3><p id="info-description"></p>`;
  document.body.appendChild(infoBox);
}

function handlePinClick(pin) {
  // Ripristina il colore del pin precedentemente selezionato
  if (selectedPin) {
    selectedPin.material.color.set('rgb(144, 238, 144)');
  }

  // Aggiorna il pin selezionato
  selectedPin = pin;
  selectedPin.material.color.set('rgb(0, 102, 255)');

  // Mostra il box informativo
  const title = document.getElementById('info-title');
  const description = document.getElementById('info-description');
  title.innerText = selectedPin.userData.label;
  description.innerText = `Descrizione di ${selectedPin.userData.label}`;

  infoBox.style.display = 'block';
  infoBox.style.left = '50px';
  infoBox.style.top = '50px';

  freezeScene();
  drawLineToBox(pin);
}

function drawLineToBox(pin) {
  if (line) scene.remove(line);

  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const points = [];
  points.push(pin.position.clone());
  points.push(new THREE.Vector3(0, 0, 0));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  line = new THREE.Line(geometry, material);
  scene.add(line);
}

function freezeScene() {
  controls.autoRotate = false;
}

function animate() {
  requestAnimationFrame(animate);

  // Ruota il globo e le nuvole solo se la scena non è freezata
  if (!selectedPin) {
    globe.rotation.y += 0.0001;
    cloudLayer.rotation.y += 0.0004;

    orbitGroups.forEach((group) => {
      group.rotation.y += 0.0002;
    });
  } else {
    cloudLayer.rotation.y += 0.0004;
  }

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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth - 300, window.innerHeight);
  labelRenderer.setSize(window.innerWidth - 300, window.innerHeight);
}

init();
