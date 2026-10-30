import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export function createViewer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  labels.domElement.className = 'label-layer';
  container.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 10, 30000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  controls.maxDistance = 9000;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(1500, 3000, 1800);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1800, right: 1800, top: 1800, bottom: -1800, near: 100, far: 8000 });
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.7);
  fill.position.set(-2000, 1200, -1500);
  scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.ShadowMaterial({ opacity: 0.18 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(4000, 40, 0x9aa3ad, 0xc9ced4);
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  scene.add(grid);

  // Theme-aware background
  const setBg = () => {
    const css = getComputedStyle(document.documentElement).getPropertyValue('--viewport-bg').trim() || '#eef0f3';
    scene.background = new THREE.Color(css);
  };
  setBg();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setBg);

  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    labels.setSize(w, h);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container);
  resize();

  // Transición de cámara (no bloquea el control libre: se cancela si el usuario arrastra)
  let camAnim = null;
  controls.addEventListener('start', () => { camAnim = null; });
  function flyTo(pos, target, ms = 900) {
    camAnim = {
      p0: camera.position.clone(), t0: controls.target.clone(),
      p1: new THREE.Vector3(...pos), t1: new THREE.Vector3(...target),
      start: performance.now(), ms,
    };
  }

  const VIEWS = {
    iso: [[2000, 1700, 1900], [0, 650, 150]],
    front: [[0, 900, -3200], [0, 650, 150]],
    side: [[3300, 800, 150], [0, 650, 150]],
    top: [[0, 4200, 151], [0, 600, 150]],
  };
  const view = (name) => flyTo(...VIEWS[name]);

  // Selección por clic (se ignora si hubo arrastre)
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  const pickHandlers = [];
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(scene.children, true).filter((h) => h.object.userData.pickId && isShown(h.object));
    pickHandlers.forEach((fn) => fn(hits[0] ? hits[0].object.userData.pickId : null));
  });
  const isShown = (o) => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };

  const frameHooks = [];
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (camAnim) {
      const k = Math.min((performance.now() - camAnim.start) / camAnim.ms, 1);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(camAnim.p0, camAnim.p1, e);
      controls.target.lerpVectors(camAnim.t0, camAnim.t1, e);
      if (k >= 1) camAnim = null;
    }
    controls.update();
    frameHooks.forEach((fn) => fn(dt));
    renderer.render(scene, camera);
    labels.render(scene, camera);
  });

  camera.position.fromArray(VIEWS.iso[0]);
  controls.target.fromArray(VIEWS.iso[1]);

  return {
    scene, camera, controls, renderer, flyTo, view,
    onPick: (fn) => pickHandlers.push(fn),
    onFrame: (fn) => frameHooks.push(fn),
    screenshot: () => renderer.domElement.toDataURL('image/png'),
  };
}
