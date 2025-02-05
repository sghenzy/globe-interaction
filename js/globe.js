let scene, camera, renderer, globe, cloudLayer, controls, particleSystem, labelRenderer, selectedPin = null;

const pins = [];
const orbitGroups = []; // Gruppi per i pin in orbita
let raycaster, mouse; // Variabili per il raycasting

function init() {
  const container = document.getElementById('globe-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f0f0f);

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
  addPins();

  // Event listener per il clic del mouse
  window.addEventListener('pointerdown', onMouseClick);

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
  const geometry = new THREE.SphereGeometry(0.452, 64, 64);
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

function addPins() {
  const pinData = [
    { label: "Il Cairo", lat: 30.0444, lon: 31.2357 },
    { label: "New York", lat: 40.7128, lon: -74.0060 },
    { label: "Londra", lat: 51.5074, lon: -0.1278 },
    { label: "Tokyo", lat: 35.6895, lon: 139.6917 },
    { label: "Roma", lat: 41.9028, lon: 12.4964 },
    { label: "Mosca", lat: 55.7558, lon: 37.6173 },
    { label: "Sydney", lat: -33.8688, lon: 151.2093 },
    { label: "Parigi", lat: 48.8566, lon: 2.3522 }
  ];

  const radius = 0.54; // Poco sopra la superficie del globo

  pinData.forEach(({ label, lat, lon }) => {
    const phi = (90 - lat) * (Math.PI / 180); // Converti latitudine in rad
    const theta = (lon + 180) * (Math.PI / 180); // Converti longitudine in rad

    // Converte coordinate sferiche in 3D
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    const pin = createPin(label);
    pin.position.set(x, y, z);

    // Allinea il pin rispetto alla superficie del globo
    pin.lookAt(globe.position);

    // Aggiungilo come figlio del globo per ruotare con esso
    globe.add(pin);
    pins.push(pin);
  });
}


function createPin(labelText) {
  const pinGeometry = new THREE.SphereGeometry(0.015, 16, 16);
  const pinMaterial = new THREE.MeshStandardMaterial({ color: 'rgb(144, 238, 144)' });
  const pin = new THREE.Mesh(pinGeometry, pinMaterial);

  return pin;
}

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(pins);

  if (intersects.length > 0) {
    const pin = intersects[0].object;
    focusOnPin(pin.userData.index);
  } else {
    resetScene(); // Aggiunto: Reset scena se clicco fuori dai pin
  }
}


function resetScene() {
  const existingBox = document.getElementById('info-box');
  if (existingBox) {
    existingBox.remove();
  }
  if (scene.userData.lastLine) {
    scene.remove(scene.userData.lastLine);
    scene.userData.lastLine = null;
  }

  orbitGroups.forEach(group => {
    group.rotation.y += 0.0002; // Ripristina la rotazione dei pin
  });
  controls.autoRotate = true; // Riattiva rotazione del globo

  if (selectedPin) {
    selectedPin.material.color.set('rgb(144, 238, 144)');
    selectedPin = null;
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
  let containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;

  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(containerWidth, containerHeight);
  labelRenderer.setSize(containerWidth, containerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  // Mantieni in rotazione il livello delle nuvole
  cloudLayer.rotation.y += 0.0008;

  // Mantieni in rotazione le particelle di sfondo
  if (particleSystem) {
    particleSystem.rotation.y += 0.0001; // Rotazione lenta delle particelle
  }

  // Mantieni il controllo della rotazione del globo e dei gruppi orbitali
  if (controls.autoRotate) {
    orbitGroups.forEach(group => {
      group.rotation.y += 0.0005; // Ruota i gruppi orbitali solo se l'auto-rotate è attivo
    });
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}


init();
