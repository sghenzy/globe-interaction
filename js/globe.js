let scene, camera, renderer, globe, controls, particleSystem, labelRenderer;
const pins = [];
let selectedPin = null; // Variabile per tracciare il pin selezionato

function init() {
  const container = document.getElementById('globe-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161616);
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Aggiungi il CSS2DRenderer per supportare i testi descrittivi
  labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  container.appendChild(labelRenderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  const geometry = new THREE.SphereGeometry(0.6, 64, 64);
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('img/convertite/Earth Night Map 2k.webp');
  const material = new THREE.MeshStandardMaterial({ map: earthTexture });
  globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

  addPins();
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
  addParticles();
  animate();
}

// Funzione aggiornata per posizionare correttamente 8 pin con etichette
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

  const globeRadius = 0.6; // Usa la nuova dimensione del raggio della sfera

  pinPositions.forEach((pos, index) => {
    const pinGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const pinMaterial = new THREE.MeshStandardMaterial({ color: 'rgb(144, 238, 144)' });
    const pin = new THREE.Mesh(pinGeometry, pinMaterial);

    const phi = (90 - pos.lat * 180) * (Math.PI / 180);
    const theta = (pos.lon * 360) * (Math.PI / 180);

    pin.position.x = globeRadius * Math.sin(phi) * Math.cos(theta);
    pin.position.y = globeRadius * Math.cos(phi);
    pin.position.z = globeRadius * Math.sin(phi) * Math.sin(theta);

    // Aggiungi il testo descrittivo come CSS2DObject e collegalo al pin
    const labelDiv = document.createElement('div');
    labelDiv.className = 'pin-label';
    labelDiv.textContent = pos.label;
    labelDiv.style.color = 'white';

    const label = new THREE.CSS2DObject(labelDiv);
    label.position.set(0, 0.1, 0); // Posiziona sopra il pin
    label.visible = false; // Nascondi finché non è selezionato
    pin.add(label);

    pin.userData.index = index;
    pin.userData.label = label; // Associa l'oggetto CSS2D per modificarne la visibilità
    globe.add(pin);
    pins.push(pin);
  });
}

// Funzione aggiornata per gestire la rotazione e la selezione dei pin
function focusOnPin(pinIndex) {
  const pin = pins[pinIndex];
  if (!pin) return;

  // Ripristina il colore e nascondi il testo del pin precedente
  if (selectedPin) {
    selectedPin.material.color.set('rgb(144, 238, 144)');
    selectedPin.userData.label.visible = false; // Nasconde l'etichetta del pin precedente
  }

  // Cambia colore e mostra il testo del pin selezionato
  pin.material.color.set('rgb(173, 216, 230)'); // Azzurro
  pin.userData.label.visible = true; // Mostra l'etichetta del pin selezionato
  selectedPin = pin;

  // Calcola la rotazione necessaria per portare il pin in vista su tutti gli assi
  const direction = pin.position.clone().normalize(); // Direzione verso il pin
  const targetRotation = new THREE.Euler(
    Math.asin(direction.y), // Ruota sull'asse X per regolare l'altezza
    Math.atan2(-direction.x, direction.z), // Ruota sull'asse Y per regolare la rotazione orizzontale
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
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.00001;
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera); // Renderizza anche le etichette
}

window.focusOnPin = focusOnPin;
init();
