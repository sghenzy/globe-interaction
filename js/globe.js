let scene, camera, renderer, globe, controls, particleSystem;
    const pins = [];
    const infoTextLeft = document.getElementById('info-text-left');
    const infoTextRight = document.getElementById('info-text-right');
    const bodyTextLeft = document.getElementById('body-text-left');
    const bodyTextRight = document.getElementById('body-text-right');

    const pinDescriptions = [
      { 
        left: { title: "Parigi sinistro", body: "Questa è la descrizione di Parigi sul lato sinistro." },
        right: { title: "Parigi destro", body: "Questa è la descrizione di Parigi sul lato destro." }
      },
      { 
        left: { title: "Roma sinistro", body: "Descrizione di Roma, lato sinistro." },
        right: { title: "Roma destro", body: "Descrizione di Roma, lato destro." }
      },
      { 
        left: { title: "New York sinistro", body: "Descrizione di New York, lato sinistro." },
        right: { title: "New York destro", body: "Descrizione di New York, lato destro." }
      }
    ];

    let initialCameraPosition;
    let isPinClicked = false;
    let currentDescriptionIndex;
    let selectedPin = null;
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

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
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
      controls.enableZoom = false;
      controls.minDistance = 2;
      controls.maxDistance = 5;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;

      container.addEventListener('pointerdown', onPointerDown);
      infoTextLeft.addEventListener('mousemove', onCardHover);
      infoTextRight.addEventListener('mousemove', onCardHover);
      container.addEventListener('click', onGlobeClick);
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
        const pinMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const pin = new THREE.Mesh(pinGeometry, pinMaterial);

        const phi = (90 - pos.lat * 180) * (Math.PI / 180);
        const theta = (pos.lon * 360) * (Math.PI / 180);

        pin.position.x = Math.sin(phi) * Math.cos(theta);
        pin.position.y = Math.cos(phi);
        pin.position.z = Math.sin(phi) * Math.sin(theta);
        
        pin.userData.descriptionIndex = index;
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

    function onPointerDown(event) {
      if (cameraMoving) return;

      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pins);

      if (intersects.length > 0) {
        const pin = intersects[0].object;
        controls.autoRotate = false;
        isPinClicked = true;
        selectedPin = pin;
        cameraMoving = true;

        const targetPosition = pin.position.clone().normalize().multiplyScalar(2.5);
        const offset = new THREE.Vector3(0, 0.5, 1);
        const cameraPosition = targetPosition.clone().add(offset);

        gsap.to(camera.position, {
          x: cameraPosition.x,
          y: cameraPosition.y,
          z: cameraPosition.z,
          duration: 2,
          ease: 'power2.inOut',
          onUpdate: () => controls.update(),
          onComplete: () => { cameraMoving = false; }
        });

        gsap.to(controls.target, {
          x: pin.position.x,
          y: pin.position.y,
          z: pin.position.z,
          duration: 2,
          ease: 'power2.inOut'
        });

        currentDescriptionIndex = pin.userData.descriptionIndex;
        showText();
      }
    }

    function onGlobeClick(event) {
      if (cameraMoving) return;

      if (isPinClicked) {
        cameraMoving = true;

        gsap.to(camera.position, {
          x: initialCameraPosition.x,
          y: initialCameraPosition.y,
          z: initialCameraPosition.z,
          duration: 2,
          ease: 'power2.inOut',
          onUpdate: () => controls.update(),
          onComplete: () => { 
            controls.autoRotate = true;
            cameraMoving = false;
            isPinClicked = false;
            selectedPin = null;
            hideText();
          }
        });

        gsap.to(controls.target, {
          x: 0,
          y: 0,
          z: 0,
          duration: 2,
          ease: 'power2.inOut'
        });
      }
    }

    function onCardHover(event) {
      const boundingBox = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - boundingBox.left;
      const mouseY = event.clientY - boundingBox.top;

      const rotateX = -((mouseY / boundingBox.height) - 0.5) * 20;
      const rotateY = ((mouseX / boundingBox.width) - 0.5) * 20;

      gsap.to(event.currentTarget, {
        rotationX: rotateX,
        rotationY: rotateY,
        duration: 0.3,
        ease: 'power2.out'
      });
    }

    function showText() {
      const description = pinDescriptions[currentDescriptionIndex];
      
      infoTextLeft.querySelector('.title-left').innerText = description.left.title;
      infoTextRight.querySelector('.title-right').innerText = description.right.title;

      gsap.to(infoTextLeft, { opacity: 1, duration: 1, scale: 1.2, ease: 'power2.out' });
      gsap.to(infoTextRight, { opacity: 1, duration: 1, scale: 1.2, ease: 'power2.out' });

      typeText(bodyTextLeft, description.left.body);
      typeText(bodyTextRight, description.right.body);

      gsap.to(infoTextLeft.querySelector('.title-left'), { opacity: 1, duration: 0.5 });
      gsap.to(infoTextRight.querySelector('.title-right'), { opacity: 1, duration: 0.5 });
    }

    function typeText(element, text) {
      element.innerHTML = '';
      gsap.to(element, { opacity: 1, duration: 0.5 });

      for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.innerText = text[i];
        span.style.opacity = '0';
        element.appendChild(span);

        gsap.to(span, {
          opacity: 1,
          delay: i * 0.05,
          ease: 'power2.out'
        });
      }
    }

    function hideText() {
      gsap.to(infoTextLeft, { opacity: 0, duration: 0.5 });
      gsap.to(infoTextRight, { opacity: 0, duration: 0.5 });
      gsap.to(bodyTextLeft, { opacity: 0, duration: 0.5 });
      gsap.to(bodyTextRight, { opacity: 0, duration: 0.5 });
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate);

      if (!isPinClicked) {
        globe.rotation.y += 0.0001;
      }

      if (selectedPin && !cameraMoving) {
        const target = selectedPin.position.clone().normalize().multiplyScalar(2.5);
        camera.lookAt(target);

        camera.position.x += Math.sin(Date.now() * 0.001) * rotationSpeed;
        camera.position.y += Math.cos(Date.now() * 0.001) * rotationSpeed;
      }

      controls.update();
      renderer.render(scene, camera);
    }

    init();