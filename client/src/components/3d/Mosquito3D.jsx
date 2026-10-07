import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Mosquito3D({ className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 460;
    const height = container.clientHeight || 460;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.05, 5.3);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x06b6d4, 2.8); // Cyan key
    dirLight1.position.set(3, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x14b8a6, 2.0); // Teal fill
    dirLight2.position.set(-3, -2, -2);
    scene.add(dirLight2);

    const redRimLight = new THREE.PointLight(0xf43f5e, 2.5, 6); // Bio-hazard red warning rim
    redRimLight.position.set(0, -1, 1.5);
    scene.add(redRimLight);

    const redBackLight = new THREE.PointLight(0xdc2626, 3.2, 7); // Reflection from prohibition sign
    redBackLight.position.set(0, 0, -1.0);
    scene.add(redBackLight);

    const frontRedLight = new THREE.DirectionalLight(0xff2222, 2.2); // Key light on front 3D cross mark
    frontRedLight.position.set(0, 2, 4);
    scene.add(frontRedLight);

    // 4. Materials
    const blackChitinMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.35,
      metalness: 0.5,
    });

    const whiteStripeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.1,
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.15,
      metalness: 0.85,
    });

    const proboscisMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.7,
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xa5f3fc,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
    });

    const holoLineMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
    });

    // 5. Construct Mosquito Hierarchy
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const mosquito = new THREE.Group();
    rootGroup.add(mosquito);

    // Initial slight pitch and tilt
    mosquito.rotation.x = 0.2;
    mosquito.rotation.y = -0.35;

    // --- THORAX (Center Body) ---
    const thoraxGeom = new THREE.SphereGeometry(0.32, 24, 24);
    const thoraxMesh = new THREE.Mesh(thoraxGeom, blackChitinMat);
    thoraxMesh.scale.set(0.85, 0.8, 1.25);
    mosquito.add(thoraxMesh);

    // Signature Lyre Pattern Stripes on Thorax (White bands)
    [-0.1, 0.05, 0.18].forEach((zOffset) => {
      const stripeGeom = new THREE.TorusGeometry(0.28, 0.02, 8, 24);
      const stripeMesh = new THREE.Mesh(stripeGeom, whiteStripeMat);
      stripeMesh.position.set(0, 0.04, zOffset);
      stripeMesh.rotation.x = Math.PI / 2;
      mosquito.add(stripeMesh);
    });

    // --- HEAD ---
    const headGeom = new THREE.SphereGeometry(0.2, 20, 20);
    const headMesh = new THREE.Mesh(headGeom, blackChitinMat);
    headMesh.position.set(0, 0.05, 0.52);
    mosquito.add(headMesh);

    // Large Compound Eyes
    [-1, 1].forEach((side) => {
      const eyeGeom = new THREE.SphereGeometry(0.09, 16, 16);
      const eyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
      eyeMesh.position.set(side * 0.11, 0.08, 0.58);
      eyeMesh.scale.set(1.1, 1.2, 1);
      mosquito.add(eyeMesh);
    });

    // Antennae (Sensory hairs)
    [-1, 1].forEach((side) => {
      const antennaCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.06, 0.15, 0.65),
        new THREE.Vector3(side * 0.14, 0.28, 0.78),
        new THREE.Vector3(side * 0.22, 0.35, 0.85),
      ]);
      const antGeom = new THREE.TubeGeometry(antennaCurve, 12, 0.012, 6, false);
      const antMesh = new THREE.Mesh(antGeom, whiteStripeMat);
      mosquito.add(antMesh);
    });

    // Proboscis (Long dangerous piercing needle)
    const probCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.02, 0.66),
      new THREE.Vector3(0, -0.22, 1.05),
      new THREE.Vector3(0, -0.45, 1.45),
    ]);
    const probGeom = new THREE.TubeGeometry(probCurve, 16, 0.018, 8, false);
    const probMesh = new THREE.Mesh(probGeom, proboscisMat);
    mosquito.add(probMesh);

    // Tip of Proboscis warning glow needle
    const tipGeom = new THREE.SphereGeometry(0.025, 8, 8);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tipMesh = new THREE.Mesh(tipGeom, tipMat);
    tipMesh.position.set(0, -0.45, 1.45);
    mosquito.add(tipMesh);

    // --- ABDOMEN (Segmented Tail) ---
    const abdomenGroup = new THREE.Group();
    abdomenGroup.position.set(0, -0.06, -0.38);
    mosquito.add(abdomenGroup);

    const segmentsCount = 7;
    for (let i = 0; i < segmentsCount; i++) {
      const t = i / segmentsCount;
      const radius = 0.26 * (1 - t * 0.65);
      const length = 0.18;
      const segGeom = new THREE.CylinderGeometry(radius * 0.9, radius, length, 16);
      const isWhiteStripe = i % 2 === 1;
      const segMat = isWhiteStripe ? whiteStripeMat : blackChitinMat;
      const segMesh = new THREE.Mesh(segGeom, segMat);

      segMesh.position.set(0, -i * 0.08, -i * 0.14);
      segMesh.rotation.x = -0.55;
      abdomenGroup.add(segMesh);
    }

    // --- 6 BANDED ARTICULATED LEGS ---
    const legPairs = [
      { side: -1, z: 0.16, angle: 0.6, length: 1.1 },
      { side: 1, z: 0.16, angle: -0.6, length: 1.1 },
      { side: -1, z: -0.02, angle: 1.3, length: 1.35 },
      { side: 1, z: -0.02, angle: -1.3, length: 1.35 },
      { side: -1, z: -0.2, angle: 2.1, length: 1.6 },
      { side: 1, z: -0.2, angle: -2.1, length: 1.6 },
    ];

    legPairs.forEach(({ side, z, angle, length }) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.2, -0.08, z);

      // 3 segments: Femur, Tibia, Tarsus
      const p1 = new THREE.Vector3(0, 0, 0);
      const p2 = new THREE.Vector3(
        side * Math.cos(angle) * (length * 0.35),
        0.35 * length,
        Math.sin(angle) * (length * 0.25)
      );
      const p3 = new THREE.Vector3(
        side * Math.cos(angle) * (length * 0.7),
        -0.45 * length,
        Math.sin(angle) * (length * 0.6)
      );
      const p4 = new THREE.Vector3(
        side * Math.cos(angle) * (length * 0.95),
        -0.95 * length,
        Math.sin(angle) * (length * 0.85)
      );

      const legCurve = new THREE.CatmullRomCurve3([p1, p2, p3, p4]);
      const legGeom = new THREE.TubeGeometry(legCurve, 20, 0.016, 6, false);
      const legMesh = new THREE.Mesh(legGeom, blackChitinMat);
      legGroup.add(legMesh);

      // White banding rings on legs (Aedes aegypti signature markings)
      [0.3, 0.55, 0.75, 0.9].forEach((pct) => {
        const pt = legCurve.getPoint(pct);
        const ringGeom = new THREE.SphereGeometry(0.026, 8, 8);
        const ringMesh = new THREE.Mesh(ringGeom, whiteStripeMat);
        ringMesh.position.copy(pt);
        legGroup.add(ringMesh);
      });

      mosquito.add(legGroup);
    });

    // --- WINGS (Translucent fluttering pair) ---
    const wings = [];
    [-1, 1].forEach((side) => {
      const wingPivot = new THREE.Group();
      wingPivot.position.set(side * 0.12, 0.22, 0.05);

      // Elongated aerodynamic wing shape
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.bezierCurveTo(side * 0.3, 0.1, side * 0.45, 0.8, side * 0.15, 1.45);
      wingShape.bezierCurveTo(side * 0.02, 1.6, -side * 0.08, 1.45, -side * 0.15, 0.9);
      wingShape.bezierCurveTo(-side * 0.18, 0.4, -side * 0.08, 0.1, 0, 0);

      const wingGeometry = new THREE.ShapeGeometry(wingShape);
      const wingMesh = new THREE.Mesh(wingGeometry, wingMat);
      wingMesh.rotation.x = -Math.PI / 2.3;
      wingMesh.rotation.y = side * 0.2;
      wingPivot.add(wingMesh);

      // Vein lines inside wing
      const veinGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.08, 0.6, 0.01),
        new THREE.Vector3(side * 0.12, 1.3, 0.01),
      ]);
      const veinLine = new THREE.Line(veinGeom, holoLineMat);
      veinLine.rotation.x = -Math.PI / 2.3;
      wingPivot.add(veinLine);

      mosquito.add(wingPivot);
      wings.push({ pivot: wingPivot, side });
    });

    // --- 3D ANIMATING PROHIBITION / "NO MOSQUITO" CROSS MARK IN FRONT ---
    const crossMarkGroup = new THREE.Group();
    // Position in front of the mosquito body (z = 0.45)
    crossMarkGroup.position.set(0, 0, 0.45);
    rootGroup.add(crossMarkGroup);

    const redProhibitionMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.2,
      metalness: 0.35,
      emissive: 0x991b1b,
      emissiveIntensity: 0.3,
    });

    // 3D Outer Torus Ring
    const ringGeom = new THREE.TorusGeometry(1.36, 0.08, 32, 80);
    const ringMesh = new THREE.Mesh(ringGeom, redProhibitionMat);
    crossMarkGroup.add(ringMesh);

    // 3D Diagonal Slash Bar (Top-Left to Bottom-Right across front)
    const slashGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.7, 24);
    const slashMesh = new THREE.Mesh(slashGeom, redProhibitionMat);
    slashMesh.rotation.z = Math.PI / 4;
    crossMarkGroup.add(slashMesh);

    // 6. Mouse Interaction & Drag Rotation
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0.2;
    let targetRotationY = -0.35;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotationY += deltaX * 0.012;
        targetRotationX += deltaY * 0.012;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handleMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        mouseX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("touchmove", handleTouchMove, { passive: true });

    // 7. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Ultra-fast wing buzz vibration (80Hz flutter)
      wings.forEach(({ pivot, side }) => {
        const flutter = Math.sin(elapsedTime * 75) * 0.42;
        pivot.rotation.z = side * (0.35 + flutter);
        pivot.rotation.x = Math.cos(elapsedTime * 75) * 0.15;
      });

      // Realistic hovering & bobbing physics
      mosquito.position.y = Math.sin(elapsedTime * 2.8) * 0.14;
      mosquito.position.x = Math.cos(elapsedTime * 2.1) * 0.08;
      mosquito.position.z = Math.sin(elapsedTime * 1.7) * 0.05;

      // Gentle banking and abdominal breath
      abdomenGroup.rotation.x = -0.08 + Math.sin(elapsedTime * 4.2) * 0.04;

      // 3D Prohibition Cross Mark Animated Hover & Breathing
      crossMarkGroup.position.y = Math.sin(elapsedTime * 2.4) * 0.08;
      crossMarkGroup.position.x = Math.cos(elapsedTime * 1.9) * 0.04;
      crossMarkGroup.rotation.z = Math.sin(elapsedTime * 1.6) * 0.025;

      // Mouse Look / Interactive Rotation
      if (!isDragging) {
        const idleRotY = targetRotationY + mouseX * 0.65;
        const idleRotX = targetRotationX - mouseY * 0.45;
        rootGroup.rotation.y += (idleRotY - rootGroup.rotation.y) * 0.06;
        rootGroup.rotation.x += (idleRotX - rootGroup.rotation.x) * 0.06;
      } else {
        rootGroup.rotation.y += (targetRotationY - rootGroup.rotation.y) * 0.15;
        rootGroup.rotation.x += (targetRotationX - rootGroup.rotation.x) * 0.15;
      }


      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("touchmove", handleTouchMove);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="h-[420px] w-[420px] sm:h-[460px] sm:w-[460px] cursor-grab active:cursor-grabbing relative z-10"
        title="Interactive 3D Mosquito: Click and drag to rotate"
      />




      {/* Soft Radial Ambient Glow */}
      <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-rose-500/15 via-red-500/10 to-transparent blur-3xl pointer-events-none" />
    </div>
  );
}
