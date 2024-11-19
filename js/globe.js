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
    // Crea un gruppo orbitale per ciascun pin
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = pos.inclination;
    if (pos.axis === 'z') {
      orbitGroup.rotation.y = pos.inclination;
    }

    orbitGroup.rotation.y += pos.startRotation; // Inizializzazione unica
    scene.add(orbitGroup);

    // Crea il pin e posizionalo nel gruppo orbitale
    const pin = createPin(pos.label);
    pin.position.x = orbitRadius;

    // Assegna l'indice e altre informazioni al pin
    pin.userData = {
      index: index, // Salva l'indice del pin
      label: pos.label, // Etichetta del pin
      orbitGroup: orbitGroup // Gruppo orbitale associato
    };

    orbitGroup.add(pin);

    // Aggiungi il pin e il gruppo orbitale agli array globali
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
  const links = document.querySelectorAll('.focus-link'); // Seleziona tutti i link con la classe "focus-link"
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault(); // Evita il comportamento predefinito del link
      const pinIndex = parseInt(link.dataset.pinIndex, 10); // Ottieni l'indice dal data attributo
      focusOnPin(pinIndex); // Chiama la funzione focusOnPin con l'indice del pin
    });
  });
}

function onWindowResize() {
  let containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;

  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(containerWidth, containerHeight);
  labelRenderer.setSize(containerWidth, containerHeight);

  resizeGlobe();
}

function animate() {
  requestAnimationFrame(animate);

  // Ruota il globo sull'asse Y
  globe.rotation.y += 0.0001;

  // Ruota il livello delle nuvole nello stesso verso, ma più velocemente
  cloudLayer.rotation.y += 0.0004; // Velocità leggermente superiore a quella del globo

  // Ruota ciascun gruppo orbitale per creare l'effetto di orbita più lento
  orbitGroups.forEach((group, index) => {
    const rotationSpeed = 0.0002 + index * 0.00002;

    // Ruota il gruppo orbitale (che contiene il pin)
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

function resizeGlobe() {
  const maxGlobeScale = 1;
  const minGlobeScale = 0.3;
  const mobileScale = 0.6;
  const screenWidth = window.innerWidth;
  let scaleFactor = maxGlobeScale;

  if (screenWidth < 850) {
    scaleFactor = minGlobeScale + (screenWidth - 560) * (maxGlobeScale - minGlobeScale) / (850 - 560);
    scaleFactor = Math.max(minGlobeScale, scaleFactor);
  }
  if (screenWidth < 479) {
    scaleFactor = mobileScale;
  }

  globe.scale.set(scaleFactor, scaleFactor, scaleFactor);
}

function focusOnPin(pinIndex) {
  const pin = pins[pinIndex];
  if (!pin) return;

  // Ripristina lo stato del pin precedentemente selezionato
  if (selectedPin) {
    selectedPin.material.color.set('rgb(255, 255, 0)'); // Giallo per i pin non selezionati
    selectedPin.userData.label.visible = false; // Nasconde l'etichetta precedente
  }

  // Aggiorna il nuovo pin selezionato
  pin.material.color.set('rgb(0, 102, 255)'); // Blu per il pin selezionato
  pin.userData.label.visible = true; // Mostra l'etichetta
  selectedPin = pin;

  // Calcola la posizione globale del pin
  const pinWorldPosition = new THREE.Vector3();
  pin.getWorldPosition(pinWorldPosition);

  // Forza il globo e la scena a essere centrati
  globe.position.set(0, 0, 0);
  scene.position.set(0, 0, 0);
  camera.lookAt(0, 0, 0);

  // Calcola la direzione del pin rispetto al centro
  const direction = pinWorldPosition.clone().normalize();

  // Verifica se il pin è "dietro" il globo
  const isBehind = pinWorldPosition.z < 0;

  // Calcola il quaternione target per allineare il pin all'asse Z positivo
  const currentQuaternion = new THREE.Quaternion().copy(scene.quaternion);
  const targetQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      Math.asin(direction.y), // Rotazione sull'asse X
      Math.atan2(-direction.x, direction.z) + (isBehind ? Math.PI : 0), // Rotazione sull'asse Y (aggiungi 180° se dietro)
      0 // Nessuna rotazione sull'asse Z
    )
  );

  // Usa GSAP per interpolare la rotazione con easing morbido
  const easingDuration = 1.5; // Durata in secondi
  let t = { progress: 0 }; // Variabile per gestire il progresso dell'easing

  gsap.to(t, {
    progress: 1,
    duration: easingDuration,
    ease: 'power2.inOut',
    onUpdate: () => {
      THREE.Quaternion.slerp(currentQuaternion, targetQuaternion, scene.quaternion, t.progress);
      controls.update(); // Aggiorna i controlli durante l'animazione
    }
  });

  // Zoom della camera per enfatizzare il pin selezionato
  gsap.to(camera.position, {
    z: 4.5, // Avvicina la camera per mettere in risalto il pin
    duration: easingDuration,
    ease: 'power2.inOut'
  });
}

window.focusOnPin = focusOnPin;
init();
