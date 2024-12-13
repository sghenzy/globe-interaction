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
  camera.position.set(1.5, 0, 5); // Sposta la camera verso destra
  camera.lookAt(0.5, 0, 0); // Mantieni il focus verso il centro della nuova scena

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
  globe.position.x = 0.5; // Sposta il globo verso destra
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
  cloudLayer.position.x = 0.5; // Sposta le nuvole verso destra
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
    orbitGroup.position.x = 0.5; // Sposta il gruppo orbitale verso destra
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
  } else {
    resetScene(); // Aggiunto: Reset scena se clicco fuori dai pin
  }
}

function focusOnPin(pinIndex) {
  const pin = pins[pinIndex];
  if (!pin) return;

  orbitGroups.forEach(group => group.rotation.y = group.rotation.y);
  controls.autoRotate = false;

  if (selectedPin) {
    selectedPin.material.color.set('rgb(144, 238, 144)');
  }

  pin.material.color.set('rgb(0, 102, 255)');
  selectedPin = pin;

  const pinWorldPosition = new THREE.Vector3();
  pin.getWorldPosition(pinWorldPosition);

  addInfoBox(pinWorldPosition, pin.userData.label);
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
  box.style.backgroundColor = ' rgba(214, 214, 214, 50)';
  box.style.backdropFilter = 'blur(10px)'; 
  box.style.padding = '10px';
  box.style.borderRadius = '5px';
  box.style.color = 'black';
  box.style.fontFamily = 'Gotham, sans-serif';
  box.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  box.innerHTML = `
    <h3 style="margin: 0; margin-bottom: 1vh;">${pinLabel}</h3>
    <p style="margin: 0;">Breve descrizione del pin selezionato</p>
  `;

  document.body.appendChild(box);

  // Imposta una distanza fissa maggiore per il box dal pin
  const fixedDistance = 250; // Distanza fissa aumentata in pixel
  const screenPosition = pinPosition.clone().project(camera);
  const halfWidth = window.innerWidth / 2;
  const halfHeight = window.innerHeight / 2;

  // Coordinate del pin sullo schermo
  const pinX = (screenPosition.x * halfWidth) + halfWidth;
  const pinY = -(screenPosition.y * halfHeight) + halfHeight;

  // Calcola la direzione dal pin per posizionare il box
  const directionX = pinX - halfWidth;
  const directionY = pinY - halfHeight;
  const length = Math.sqrt(directionX * directionX + directionY * directionY);

  // Normalizza la direzione per applicare la distanza fissa
  const normalizedX = directionX / length;
  const normalizedY = directionY / length;

  // Calcola la posizione del box applicando la distanza fissa
  const boxX = pinX + normalizedX * fixedDistance;
  let boxY = pinY + normalizedY * fixedDistance + 30;

  // Assicura che il box non sia più vicino di 5vh dal bordo inferiore
  const maxBoxY = window.innerHeight - (window.innerHeight * 0.09); // Limite inferiore
  if (boxY + box.offsetHeight > maxBoxY) {
    boxY = maxBoxY - box.offsetHeight; // Riposiziona il box sopra il limite
  }

  // Applica la posizione del box
  box.style.left = `${boxX - box.offsetWidth / 2}px`; // Centra il box orizzontalmente
  box.style.top = `${boxY}px`; // Posiziona il box con il limite inferiore

  // Disegna la linea dal pin al box
  drawLineToBox(pinPosition, boxX, boxY, box);
}


function drawLineToBox(pinPosition, boxX, boxY, box) {
  // Calcola la posizione centrata del box
  const boxCenterX = boxX;
  const boxCenterY = boxY;

  // Converti le coordinate 2D del box al centro in coordinate 3D
  const boxWorldPosition = new THREE.Vector3(
    (boxCenterX / window.innerWidth) * 2 - 1,
    -(boxCenterY / window.innerHeight) * 2 + 1,
    0
  ).unproject(camera);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x807d7d });
  const lineGeometry = new THREE.BufferGeometry();

  // Imposta i punti della linea
  lineGeometry.setFromPoints([pinPosition, boxWorldPosition]);

  // Rimuovi la linea precedente se esiste
  if (scene.userData.lastLine) {
    scene.remove(scene.userData.lastLine);
  }

  // Aggiungi la nuova linea
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.userData.lastLine = line;
  scene.add(line);
}

function addParticles() {
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 5000;
  const positions = new Float32Array(particlesCount * 3);
  const opacities = new Float32Array(particlesCount); // Nuovo attributo per l'opacità

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let i = 0; i < particlesCount; i++) {
    // Genera posizione casuale 3D
    const distance = Math.random() * 10 + 2;
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.acos((Math.random() * 2) - 1);

    const x = distance * Math.sin(angle2) * Math.cos(angle1);
    const y = distance * Math.sin(angle2) * Math.sin(angle1);
    const z = distance * Math.cos(angle2);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Calcola la distanza radiale proiettata
    const screenPosition = new THREE.Vector3(x, y, z).project(camera);
    const screenX = (screenPosition.x * centerX) + centerX;
    const screenY = -(screenPosition.y * centerY) + centerY;
    const distanceFromCenter = Math.sqrt(
      (screenX - centerX) ** 2 + (screenY - centerY) ** 2
    );

    // Calcola l'opacità basata sulla distanza dal centro
    opacities[i] = 1 - Math.min(distanceFromCenter / maxDistance, 1);
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.01,
    transparent: true,
    vertexColors: false // Opacità personalizzata
  });

  // Usa un aggiornamento per gestire l'opacità variabile
  particlesMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      `void main() {`,
      `attribute float opacity;
       varying float vOpacity;
       void main() {
         vOpacity = opacity;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `void main() {`,
      `varying float vOpacity;
       void main() {`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
      `gl_FragColor = vec4(outgoingLight, vOpacity);`
    );
  };

  particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particleSystem);
}


function animate() {
  requestAnimationFrame(animate);

  // Mantieni in rotazione il livello delle nuvole
  cloudLayer.rotation.y += 0.0004;

  // Mantieni in rotazione le particelle di sfondo
  if (particleSystem) {
    particleSystem.rotation.y += 0.0002; // Rotazione lenta delle particelle
  }

  // Mantieni il controllo della rotazione del globo e dei gruppi orbitali
  if (controls.autoRotate) {
    orbitGroups.forEach(group => {
      group.rotation.y += 0.0002; // Ruota i gruppi orbitali solo se l'auto-rotate è attivo
    });
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}


init();
