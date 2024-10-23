let scene, camera, renderer, globe, controls, particleSystem;
const pins = [];

let initialCameraPosition;
let cameraMoving = false;
let rotationSpeed = 0.0008;

function init() {
  const container = document.getElementById('globe-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161616); // Questo imposta il colore di sfondo a nero
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  initialCameraPosition = camera.position.clone();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('img/convertite/Earth Night Map 2k.webp');
  const material = new THREE.MeshStandardMaterial({ map: earthTexture });
  globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

  addPins();

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false; // Disabilita lo zoom
  controls.minDistance = 2.5; // Imposta una distanza fissa dalla telecamera
  controls.maxDistance = 2.5; // Blocca la distanza, impedendo di avvicinarsi o allontanarsi
  controls.enablePan = false; // Disabilita il movimento laterale
  controls.autoRotate = true; // Mantiene la rotazione automatica del globo
  controls.autoRotateSpeed = 0.09;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  window.addEventListener('resize', onWindowResize);

  addParticles();
  animate();
}

function addPins() {
  const pinPositions = [
    { lat: 0.5, lon: 0.5 },
    { lat: -0.3, lon: 0.8 },
    { lat: 0.0, lon: -0.5 }
  ];

  pinPositions.forEach((pos, index) => {
    const pinGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const pinMaterial = new THREE.MeshStandardMaterial({ color: 'rgb(144, 238, 144)' });
    const pin = new THREE.Mesh(pinGeometry, pinMaterial);

    const phi = (90 - pos.lat * 180) * (Math.PI / 180);
    const theta = (pos.lon * 360) * (Math.PI / 180);

    pin.position.x = Math.sin(phi) * Math.cos(theta);
    pin.position.y = Math.cos(phi);
    pin.position.z = Math.sin(phi) * Math.sin(theta);
    
    globe.add(pin);
    pins.push(pin);
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
}

function animate() {
  requestAnimationFrame(animate);

  globe.rotation.y += 0.00001; // Rallenta la rotazione del globo

  controls.update();
  renderer.render(scene, camera);
}

init();
