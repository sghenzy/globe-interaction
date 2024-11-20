let scene, camera, renderer, globe, cloudLayer, controls, particleSystem, labelRenderer;
const pins = [];
const orbitGroups = [];
let selectedPin = null;

// Raycaster per interazione
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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

  // Inizializza il label renderer
  labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth - 300, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  container.appendChild(labelRenderer.domElement);

  // Aggiungi luci
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  // Aggiungi globo e nuvole
  addGlobe();
  addCloudLayer();

  // Aggiungi pin
  addOrbitingPins();

  // Controlli della telecamera
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.minDistance = 2.5;
  controls.maxDistance = 2.5;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.09;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // Event listener
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('click', onMouseClick);
  onWindowResize();
  addParticles();
  animate();
}

function addGlobe() {
  const geometry = new THREE.SphereGeometry(0.45, 64, 64); // Assicurati che il globo sia una sfera perfetta
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
  const geometry = new THREE.SphereGeometry(0.48, 64, 64); // Nuvole leggermente sopra il globo
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
      index: index,
      label: pos.label
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

function onMouseClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(pins);

  if (intersects.length > 0) {
    const clickedPin = intersects[0].object;
    focusOnPin(clickedPin.userData.index);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
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

function focusOnPin(pinIndex) {
  const pin = pins[pinIndex];
  if (!pin) return;

  // Blocca il globo e i pin, ma lascia le nuvole in movimento
  orbitGroups.forEach((group) => {
    group.rotation.y = group.rotation.y; // Congela i pin
  });
  controls.autoRotate = false; // Disabilita la rotazione automatica del globo

  // Ripristina lo stato del pin precedentemente selezionato
  if (selectedPin) {
    selectedPin.material.color.set('rgb(144, 238, 144)'); // Verde per i pin non selezionati
  }

  // Aggiorna il nuovo pin selezionato
  pin.material.color.set('rgb(0, 102, 255)'); // Blu per il pin selezionato
  selectedPin = pin;

  // Calcola la posizione del pin nel mondo
  const pinWorldPosition = new THREE.Vector3();
  pin.getWorldPosition(pinWorldPosition);

  // Crea o aggiorna una linea che collega il pin al box
  addInfoBox(pinWorldPosition, pin.userData.label);
}

function addInfoBox(pinPosition, pinLabel) {
  // Rimuovi eventuale info box esistente
  const existingBox = document.getElementById('info-box');
  if (existingBox) {
    existingBox.remove();
  }

  // Crea il box con il titolo e la descrizione
  const box = document.createElement('div');
  box.id = 'info-box';
  box.style.position = 'absolute';
  box.style.backgroundColor = 'rgba(255, 192, 203, 0.9)'; // Rosa trasparente
  box.style.padding = '10px';
  box.style.borderRadius = '5px';
  box.style.top = '50px';
  box.style.left = '50px';
  box.innerHTML = `
    <h3 style="margin: 0;">${pinLabel}</h3>
    <p style="margin: 0;">Breve descrizione del pin selezionato</p>
  `;

  // Aggiungi il box al documento
  document.body.appendChild(box);

  // Crea una linea rossa che collega il pin al box
  drawLineToBox(pinPosition);
}

function drawLineToBox(pinPosition) {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const lineGeometry = new THREE.BufferGeometry();

  // Calcola le coordinate 3D del pin e le coordinate 2D del box
  const boxPosition = new THREE.Vector3(-2, 2, 0); // Fai il mapping a coordinate statiche
  lineGeometry.setFromPoints([pinPosition, boxPosition]);

  // Aggiungi la linea alla scena
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);

  // Rimuovi la linea precedente se esiste
  if (scene.userData.lastLine) {
    scene.remove(scene.userData.lastLine);
  }
  scene.userData.lastLine = line;
}


init();
