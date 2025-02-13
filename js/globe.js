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
  controls.autoRotateSpeed = 0.02;
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
  const earthTexture = textureLoader.load('https://sghenzy.github.io/globe-interaction/img/convertite/Earth%20Night%20Map%202k.webp',
    function (texture) {
      texture.wrapS = THREE.RepeatWrapping; // Assicura il wrapping orizzontale
      /** texture.wrapT = THREE.RepeatWrapping; // Assicura il wrapping verticale **/
      texture.offset.x = -0.45; // Sposta la texture in orizzontale (da -1 a 1)
      texture.offset.y = 0.2;
    });

  const material = new THREE.MeshStandardMaterial({
    map: earthTexture,
    opacity: 1,
    transparent: false,
    depthWrite: true,
    depthTest: true
  });

  globe = new THREE.Mesh(geometry, material);
  globe.rotation.y = Math.PI / 2; // Ruota il globo di 90° verso sinistra

  scene.add(globe);
}


function animateGlobeEntry() {
  // Imposta la rotazione iniziale più indietro di 180° (-Math.PI / 2)
  globe.rotation.y = -Math.PI / 2;
  cloudLayer.rotation.y = -Math.PI / 2; // Anche il cloudLayer parte dalla stessa rotazione

  // Usa GSAP per animare dolcemente fino a Math.PI / 2
  gsap.to([globe.rotation, cloudLayer.rotation], {
    y: Math.PI / 2, // Arriva alla rotazione finale
    duration: 5,    // Durata dell'animazione in secondi
    ease: "power2.out"
  });
}

// Rileva quando il globo entra in vista con IntersectionObserver
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateGlobeEntry();
      observer.unobserve(entry.target); // Evita di ripetere l'animazione
    }
  });
}, { threshold: 0.5 });

// Assicurati che l'elemento #globe-container sia il contenitore corretto
const globeContainer = document.getElementById('globe-container');
if (globeContainer) {
  observer.observe(globeContainer);
}


 // LAYER DELLE NUVOLE

function addCloudLayer() {
  const geometry = new THREE.SphereGeometry(0.452, 64, 64);
  const textureLoader = new THREE.TextureLoader();
  const cloudsTexture = textureLoader.load('https://sghenzy.github.io/globe-interaction/img/convertite/fair_clouds_8k.jpg');

  const material = new THREE.MeshBasicMaterial({
    map: cloudsTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.2
  });

  cloudLayer = new THREE.Mesh(geometry, material);
  scene.add(cloudLayer);
}



function addPins() {
  const pinData = [
    { label: "Londra", lat: 51.5074, lon: -2.1278 },
    { label: "Roma", lat: 40.8566, lon: 3.3522 },
    { label: "Milano", lat: 44.4642, lon: 6.1900 },
    { label: "Dubai", lat: 15.276987, lon: -36.296249 },
    { label: "Parigi", lat: 46.9028, lon: 12.4964 },
    { label: "Praga", lat: 50.0755, lon: 14.4378 }
  ];

  const radius = 0.46; // Poco sopra la superficie del globo

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
  const pinGeometry = new THREE.SphereGeometry(0.009, 16, 16); // Ridotto da 0.015 a 0.01
  const pinMaterial = new THREE.MeshStandardMaterial({ color: '#570000' }); // Rosso
  const pin = new THREE.Mesh(pinGeometry, pinMaterial);

  // Creazione dell'etichetta
  /** const labelDiv = document.createElement('div');
  labelDiv.className = 'pin-label';
  labelDiv.textContent = labelText;
  labelDiv.style.position = 'absolute';
  labelDiv.style.color = 'white';
  labelDiv.style.fontSize = '12px';
  labelDiv.style.padding = '2px 5px';
  labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
  labelDiv.style.borderRadius = '4px';

  // Usa CSS2DObject per renderizzare il testo
  const label = new THREE.CSS2DObject(labelDiv);
  label.position.set(0.02, 0.02, 0); // Regola la posizione rispetto al pin
  pin.add(label); // Aggiungi il testo al pin **/
  
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
  cloudLayer.rotation.y += 0.00004;

  // Mantieni in rotazione le particelle di sfondo
  if (particleSystem) {
    particleSystem.rotation.y += 0.000001; // Rotazione lenta delle particelle
  }

  // Mantieni il controllo della rotazione del globo e dei gruppi orbitali
  if (controls.autoRotate) {
    orbitGroups.forEach(group => {
      group.rotation.y += 0.001; // Ruota i gruppi orbitali solo se l'auto-rotate è attivo
    });
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}


init();
