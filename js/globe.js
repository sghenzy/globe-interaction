let scene, camera, renderer, globe, cloudLayer, controls, particleSystem, labelRenderer, selectedPin = null;

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
  }
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

  // Calcola la posizione del box applicando la distanza fissa
  const fixedDistance = 150; // Distanza minima dal pin
  const screenPosition = new THREE.Vector3(pinPosition.x, pinPosition.y, pinPosition.z);
  screenPosition.project(camera);

  const normalizedX = screenPosition.x;
  const normalizedY = screenPosition.y;

  const boxX = (window.innerWidth / 2) + (normalizedX * window.innerWidth / 2) + fixedDistance;
  const boxY = (window.innerHeight / 2) - (normalizedY * window.innerHeight / 2) - fixedDistance;

  box.style.left = `${boxX}px`;
  box.style.top = `${boxY}px`;

  box.innerHTML = `
    <h3 style="margin: 0;">${pinLabel}</h3>
    <p style="margin: 0;">Breve descrizione del pin selezionato</p>
  `;

  // Aggiungi il box al documento
  document.body.appendChild(box);

  // Crea una linea rossa che collega il pin al box
  drawLineToBox(pinPosition, boxX, boxY);
}

function drawLineToBox(pinPosition, boxX, boxY) {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const lineGeometry = new THREE.BufferGeometry();

  // Calcola la posizione 3D del pin e mappa la posizione 2D del box in 3D
  const boxPosition = new THREE.Vector3(
    (boxX - window.innerWidth / 2) / (window.innerWidth / 2),
    -(boxY - window.innerHeight / 2) / (window.innerHeight / 2),
    0
  );

  boxPosition.unproject(camera);
  boxPosition.sub(camera.position).normalize();
  boxPosition.multiplyScalar(3); // Avvicina la posizione al box

  lineGeometry.setFromPoints([pinPosition, boxPosition]);

  // Aggiungi la linea alla scena
  const line = new THREE.Line(lineGeometry, lineMaterial);

  // Rimuovi la linea precedente se esiste
  if (scene.userData.lastLine) {
    scene.remove(scene.userData.lastLine);
  }

  scene.add(line);
  scene.userData.lastLine = line;
}

// Setup il listener per il click sullo sfondo
setupBackgroundClickListener();

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

function setupBackgroundClickListener() {
  // Aggiungi un event listener al documento per rilevare click sullo sfondo
  document.addEventListener('click', (event) => {
    // Controlla se il target del click è un pin o l'infobox
    if (
      event.target.closest('.pin-label') || // Escludi il click sull'etichetta del pin
      event.target.closest('#info-box') || // Escludi il click sull'infobox
      event.target.classList.contains('pin') // Escludi il click su un pin
    ) {
      return; // Non fare nulla se il click è su un pin o sul box
    }

    // Ripristina lo stato originale
    resetFocus();
  });
}

function resetFocus() {
  // Ripristina il colore del pin precedentemente selezionato
  if (selectedPin) {
    selectedPin.material.color.set('rgb(144, 238, 144)'); // Verde per i pin non selezionati
    selectedPin = null; // Nessun pin selezionato
  }

  // Rimuovi il box informativo
  const existingBox = document.getElementById('info-box');
  if (existingBox) {
    existingBox.remove();
  }

  // Rimuovi la linea
  if (scene.userData.lastLine) {
    scene.remove(scene.userData.lastLine);
    scene.userData.lastLine = null;
  }

  // Riattiva la rotazione automatica del globo e dei pin
  controls.autoRotate = true; // Riattiva la rotazione automatica del globo
  orbitGroups.forEach((group) => {
    group.userData.isFrozen = false; // Sblocca i gruppi orbitali
  });
}

function focusOnPin(pinIndex) {
  const pin = pins[pinIndex];
  if (!pin) return;

  // Congela il globo e i pin, ma lascia le nuvole in movimento
  controls.autoRotate = false; // Disabilita la rotazione automatica del globo
  orbitGroups.forEach((group) => {
    group.userData.isFrozen = true; // Congela i gruppi orbitali
  });

  // Ripristina lo stato del pin precedentemente selezionato
  if (selectedPin && selectedPin !== pin) {
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

// Aggiorna l'animazione per verificare lo stato di "congelamento"
function animate() {
  requestAnimationFrame(animate);

  // Ruota il globo sull'asse Y solo se non è congelato
  if (!controls.autoRotate) {
    globe.rotation.y += 0.0001;
  }

  // Ruota il livello delle nuvole sempre
  cloudLayer.rotation.y += 0.0004;

  // Ruota ciascun gruppo orbitale se non è congelato
  orbitGroups.forEach((group) => {
    if (!group.userData.isFrozen) {
      const rotationSpeed = 0.0002;
      group.rotation.y += rotationSpeed;
    }
  });

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

init();
