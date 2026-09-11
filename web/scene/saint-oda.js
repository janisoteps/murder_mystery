import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { animateCharacterModel, createInvestigatorModel, createNpcModel } from "./character-models.js";
import { createSurfaceMaterials } from "./surface-materials.js";

const PALETTE = {
  night: 0x071116,
  fog: 0x0b1a20,
  marsh: 0x14272a,
  wetStone: 0x3c4847,
  paleStone: 0x66706b,
  roof: 0x192426,
  wood: 0x3e2d20,
  darkWood: 0x211813,
  brass: 0xa8874e,
  candle: 0xffc56f,
  glassBlue: 0x4f7d88,
  glassRed: 0x824650,
  paper: 0xc9bea1,
  moss: 0x31463c
};

const WALK_SPEED = 4.3;
const INTERACTION_DISTANCE = 2.05;
const PLAYER_RADIUS = 0.38;

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.78,
    metalness: options.metalness ?? 0.04,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide
  });
}

function mesh(geometry, meshMaterial, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0 } = {}) {
  const result = new THREE.Mesh(geometry, meshMaterial);
  result.position.set(x, y, z);
  result.rotation.set(rx, ry, rz);
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

function box(width, height, depth, meshMaterial, position = {}) {
  return mesh(new THREE.BoxGeometry(width, height, depth), meshMaterial, position);
}

function cylinder(radiusTop, radiusBottom, height, segments, meshMaterial, position = {}) {
  return mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), meshMaterial, position);
}

function addWarmLight(parent, x, y, z, intensity = 2.5, distance = 8) {
  const light = new THREE.PointLight(PALETTE.candle, intensity, distance, 2);
  light.position.set(x, y, z);
  light.castShadow = intensity <= 5;
  if (light.castShadow) light.shadow.mapSize.set(512, 512);
  parent.add(light);
  return light;
}

function makeWindow(width, height, colors = [PALETTE.glassBlue, PALETTE.glassRed]) {
  const group = new THREE.Group();
  const frameMaterial = material(0x171d1b, { roughness: 0.9 });
  const glassMaterials = colors.map((color) => material(color, {
    emissive: color,
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide
  }));
  group.add(box(width + 0.2, 0.1, 0.14, frameMaterial, { y: height / 2 + 0.05 }));
  group.add(box(width + 0.2, 0.1, 0.14, frameMaterial, { y: -height / 2 - 0.05 }));
  group.add(box(0.1, height, 0.14, frameMaterial, { x: -width / 2 - 0.05 }));
  group.add(box(0.1, height, 0.14, frameMaterial, { x: width / 2 + 0.05 }));
  const paneWidth = (width - 0.12) / 2;
  group.add(box(paneWidth, height - 0.1, 0.16, glassMaterials[0], { x: -paneWidth / 2 - 0.03, z: -0.02 }));
  group.add(box(paneWidth, height - 0.1, 0.16, glassMaterials[1], { x: paneWidth / 2 + 0.03, z: -0.02 }));
  group.add(box(0.08, height, 0.2, frameMaterial, { z: -0.08 }));
  group.add(box(width, 0.08, 0.2, frameMaterial, { z: -0.08 }));
  return group;
}

function makeLantern() {
  const group = new THREE.Group();
  const iron = material(0x171c1b, { metalness: 0.45, roughness: 0.55 });
  const glow = material(0xe5a955, { emissive: 0xff9e36, emissiveIntensity: 2.2 });
  group.add(box(0.08, 0.7, 0.08, iron, { y: 0.7 }));
  group.add(box(0.5, 0.08, 0.08, iron, { y: 1.02 }));
  group.add(box(0.34, 0.5, 0.34, iron, { y: 0.68 }));
  group.add(box(0.2, 0.32, 0.2, glow, { y: 0.68 }));
  return group;
}

function makeWallTorch() {
  const group = new THREE.Group();
  const iron = material(0x24211c, { metalness: 0.68, roughness: 0.46 });
  const ember = material(0xff9b35, { emissive: 0xff6d16, emissiveIntensity: 3.2 });
  const flame = material(0xffd47a, { emissive: 0xffa13e, emissiveIntensity: 4.2, transparent: true, opacity: 0.94 });
  const bracket = cylinder(0.035, 0.045, 0.72, 8, iron, { y: 0.35, rz: -0.62 });
  const cup = cylinder(0.16, 0.09, 0.2, 12, iron, { x: 0.21, y: 0.73 });
  const coal = mesh(new THREE.SphereGeometry(0.1, 10, 8), ember, { x: 0.21, y: 0.86 });
  const fire = mesh(new THREE.SphereGeometry(0.11, 10, 8), flame, { x: 0.21, y: 1.03 });
  fire.scale.set(0.72, 1.65, 0.72);
  group.add(bracket, cup, coal, fire);
  group.userData.flame = fire;
  return group;
}

function makeInteractionRing(color = PALETTE.brass) {
  const ring = mesh(
    new THREE.RingGeometry(0.48, 0.58, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.68, side: THREE.DoubleSide }),
    { y: 0.035, rx: -Math.PI / 2 }
  );
  ring.castShadow = false;
  ring.receiveShadow = false;
  ring.visible = false;
  return ring;
}

function tombstone(height, width = 0.72, stoneMaterial = material(0x465350, { roughness: 0.98 })) {
  const group = new THREE.Group();
  group.add(box(width, height * 0.72, 0.22, stoneMaterial, { y: height * 0.36 }));
  group.add(mesh(new THREE.SphereGeometry(width / 2, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), stoneMaterial, {
    y: height * 0.72,
    rx: Math.PI / 2
  }));
  return group;
}

function pew(surfaces) {
  const group = new THREE.Group();
  const oak = surfaces.wood;
  const edge = surfaces.darkWood;
  group.add(box(3.15, 0.18, 0.64, oak, { y: 0.72 }));
  group.add(box(3.15, 0.92, 0.13, oak, { y: 1.12, z: 0.27, rx: -0.09 }));
  group.add(box(0.16, 0.76, 0.54, edge, { x: -1.42, y: 0.36 }));
  group.add(box(0.16, 0.76, 0.54, edge, { x: 1.42, y: 0.36 }));
  return group;
}

function shelf(surfaces, width = 3.1, height = 3.35) {
  const group = new THREE.Group();
  const oak = surfaces.darkWood;
  const paperColors = [0x82765c, 0x9c896b, 0x655d4e, 0xb09a74];
  group.add(box(width, height, 0.42, oak, { y: height / 2 }));
  group.add(box(width - 0.18, height - 0.2, 0.5, surfaces.wood, { y: height / 2, z: 0.11 }));
  for (let row = 0; row < 4; row += 1) {
    const y = 0.46 + row * 0.76;
    group.add(box(width, 0.11, 0.58, oak, { y, z: 0.17 }));
    let cursor = -width / 2 + 0.18;
    let index = 0;
    while (cursor < width / 2 - 0.2) {
      const bookWidth = 0.11 + ((index * 7 + row * 3) % 5) * 0.025;
      const bookHeight = 0.4 + ((index * 5 + row) % 4) * 0.055;
      const book = box(bookWidth, bookHeight, 0.34, material(paperColors[(index + row) % paperColors.length], { roughness: 0.95 }), {
        x: cursor + bookWidth / 2,
        y: y + 0.08 + bookHeight / 2,
        z: 0.37,
        rz: index % 7 === 0 ? -0.06 : 0
      });
      group.add(book);
      cursor += bookWidth + 0.028;
      index += 1;
    }
  }
  return group;
}

function candleCluster(count = 5) {
  const group = new THREE.Group();
  const wax = material(0xd8c89e, { roughness: 1 });
  const flame = material(0xffc562, { emissive: 0xff9a33, emissiveIntensity: 3 });
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const radius = index % 2 ? 0.24 : 0.12;
    const height = 0.34 + (index % 3) * 0.12;
    group.add(cylinder(0.035, 0.045, height, 8, wax, {
      x: Math.cos(angle) * radius,
      y: height / 2,
      z: Math.sin(angle) * radius
    }));
    group.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), flame, {
      x: Math.cos(angle) * radius,
      y: height + 0.05,
      z: Math.sin(angle) * radius
    }));
  }
  return group;
}

export function createSaintOdaScene(options) {
  const {
    container,
    investigators,
    people,
    discoveredFindingIds = [],
    onAreaChange,
    onPrompt,
    onMessage,
    onFinding,
    onTalk,
    onActiveChange,
    onTransition
  } = options;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.domElement.tabIndex = 0;
  container.replaceChildren(renderer.domElement);
  const surfaceLibrary = createSurfaceMaterials(renderer);
  const surfaces = surfaceLibrary.materials;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 120);
  const cameraOffset = new THREE.Vector3(17, 18, 19);
  const cameraLook = new THREE.Vector3();
  const cameraGoal = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const clock = new THREE.Clock();
  const keys = new Set();
  const figures = new Map();
  const savedPositions = { exterior: {}, interior: {} };
  const collected = new Set(discoveredFindingIds);
  const inspected = new Set();
  const disposableRoots = [];

  let world = null;
  let walkSurface = null;
  let area = "exterior";
  let activeInvestigatorId = investigators[0]?.id ?? null;
  let interactions = [];
  let collisions = [];
  let walkBounds = { minX: -16, maxX: 16, minZ: -16, maxZ: 18 };
  let moveTarget = null;
  let nearestInteraction = null;
  let animationFrame = null;
  let paused = false;
  let transitioning = false;
  let rain = null;
  let dust = null;
  let torchFlames = [];

  function addInteraction(definition) {
    const ring = makeInteractionRing(definition.color);
    ring.position.x = definition.position.x;
    ring.position.z = definition.position.z;
    world.add(ring);
    interactions.push({ radius: INTERACTION_DISTANCE, ...definition, ring });
  }

  function addCollision(minX, maxX, minZ, maxZ) {
    collisions.push({ minX, maxX, minZ, maxZ });
  }

  function addCharacterFlashlight(figure) {
    const beam = new THREE.SpotLight(0xeaf3df, 62, 12, 0.5, 0.62, 1.35);
    beam.position.set(0.55, 0.92, 0.48);
    beam.castShadow = true;
    beam.shadow.mapSize.set(512, 512);
    beam.shadow.bias = -0.00025;
    const target = new THREE.Object3D();
    target.position.set(0.55, 0.12, 7);
    figure.add(beam, target);
    beam.target = target;
    figure.userData.flashlight = beam;
  }

  function disposeObject(root) {
    root.traverse((child) => {
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) {
        child.material.forEach((entry) => {
          if (!entry.userData?.sharedSurface) entry.dispose?.();
        });
      } else if (!child.material?.userData?.sharedSurface) child.material?.dispose?.();
    });
  }

  function clearWorld() {
    if (world) {
      scene.remove(world);
      disposeObject(world);
    }
    disposableRoots.splice(0).forEach(disposeObject);
    figures.clear();
    interactions = [];
    collisions = [];
    nearestInteraction = null;
    moveTarget = null;
    rain = null;
    dust = null;
    torchFlames = [];
  }

  function addInvestigatorFigures(spawns) {
    investigators.forEach((investigator, index) => {
      const figure = createInvestigatorModel(investigator);
      const saved = savedPositions[area][investigator.id];
      const spawn = saved ?? spawns[index] ?? spawns[0];
      figure.position.set(spawn.x + index * 0.72, 0, spawn.z + index * 0.45);
      figure.rotation.y = Math.PI;
      addCharacterFlashlight(figure);
      world.add(figure);
      figures.set(investigator.id, figure);
    });
    updateActiveMarker();
  }

  function updateActiveMarker() {
    figures.forEach((figure, id) => {
      let marker = figure.getObjectByName("active-marker");
      if (!marker) {
        marker = makeInteractionRing(investigators.find((entry) => entry.id === id)?.color ?? PALETTE.brass);
        marker.name = "active-marker";
        marker.position.y = 0.01;
        figure.add(marker);
      }
      marker.visible = id === activeInvestigatorId;
    });
  }

  function addExteriorArchitecture() {
    const stone = surfaces.stone;
    const stoneLight = surfaces.paleStone;
    const roofMaterial = surfaces.slate;
    const doorMaterial = surfaces.darkWood;
    const church = new THREE.Group();

    church.add(box(8.8, 5.6, 14.2, stone, { y: 2.8, z: -0.5 }));
    church.add(box(5.4, 4.5, 7.4, stone, { x: 6.2, y: 2.25, z: -2.8 }));
    church.add(box(0.85, 6.4, 1.15, stoneLight, { x: -4.35, y: 3.2, z: 5.9 }));
    church.add(box(0.85, 6.4, 1.15, stoneLight, { x: 4.35, y: 3.2, z: 5.9 }));
    church.add(box(5.2, 0.42, 14.8, roofMaterial, { x: -2.05, y: 6.54, z: -0.5, rz: 0.55 }));
    church.add(box(5.2, 0.42, 14.8, roofMaterial, { x: 2.05, y: 6.54, z: -0.5, rz: -0.55 }));
    church.add(box(3.5, 0.36, 8, roofMaterial, { x: 4.92, y: 5.12, z: -2.8, rz: 0.48 }));
    church.add(box(3.5, 0.36, 8, roofMaterial, { x: 7.48, y: 5.12, z: -2.8, rz: -0.48 }));

    const door = box(2, 3.35, 0.32, doorMaterial, { y: 1.68, z: 6.7 });
    church.add(door);
    for (let index = -2; index <= 2; index += 1) {
      church.add(box(0.08, 3.1, 0.06, material(0x765e36, { metalness: 0.35 }), {
        x: index * 0.34,
        y: 1.68,
        z: 6.51
      }));
    }
    const doorLantern = makeLantern();
    doorLantern.position.set(-1.65, 2.35, 7.02);
    church.add(doorLantern);
    addWarmLight(church, -1.65, 2.75, 7.25, 3.1, 7);

    for (const x of [-3.9, 3.9]) {
      for (const z of [-4.4, 0.2]) {
        const window = makeWindow(1.05, 2.1);
        window.position.set(x, 3.05, z);
        window.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
        church.add(window);
      }
    }

    const bellGable = new THREE.Group();
    bellGable.add(box(0.65, 3.3, 1.6, stone, { x: -1.05, y: 7.9, z: 0 }));
    bellGable.add(box(0.65, 3.3, 1.6, stone, { x: 1.05, y: 7.9, z: 0 }));
    bellGable.add(box(2.75, 0.5, 1.8, stoneLight, { y: 9.3 }));
    bellGable.add(cylinder(0.52, 0.68, 0.85, 16, material(0x4b3820, { metalness: 0.72, roughness: 0.38 }), {
      y: 7.9,
      rz: Math.PI / 2
    }));
    bellGable.position.set(0, 0, -3.3);
    church.add(bellGable);

    for (const z of [-5.6, -1.2, 3.2]) {
      church.add(box(0.75, 4.5, 1.2, stoneLight, { x: -4.55, y: 2.25, z }));
      church.add(box(0.75, 4.5, 1.2, stoneLight, { x: 4.55, y: 2.25, z }));
    }
    world.add(church);
    addCollision(-5.05, 5.05, -8, 6.25);
    addCollision(5, 9.2, -6.7, 1.1);
  }

  function addExteriorLandscape() {
    const groundMaterial = surfaces.grass;
    const ground = mesh(new THREE.PlaneGeometry(64, 58), groundMaterial, { y: -0.05, rx: -Math.PI / 2 });
    ground.castShadow = false;
    world.add(ground);
    walkSurface = ground;

    const water = mesh(new THREE.PlaneGeometry(80, 24), material(0x07181f, {
      roughness: 0.35,
      metalness: 0.18,
      transparent: true,
      opacity: 0.94
    }), { x: 0, y: -0.22, z: -25, rx: -Math.PI / 2 });
    water.castShadow = false;
    world.add(water);

    const pathMaterial = surfaces.flagstone;
    for (let index = 0; index < 18; index += 1) {
      const width = 1.1 + (index % 4) * 0.16;
      const slab = box(width, 0.08, 1.15, pathMaterial, {
        x: Math.sin(index * 1.9) * 0.18,
        y: 0.01,
        z: 7.2 + index * 0.9,
        ry: (index % 3 - 1) * 0.04
      });
      slab.receiveShadow = true;
      world.add(slab);
    }

    const mossMaterial = material(PALETTE.moss, { roughness: 1 });
    for (let index = 0; index < 28; index += 1) {
      const angle = index * 2.399;
      const radius = 9 + (index % 7) * 1.65;
      const tuft = mesh(new THREE.ConeGeometry(0.28 + (index % 3) * 0.08, 0.5, 5), mossMaterial, {
        x: Math.cos(angle) * radius,
        y: 0.2,
        z: Math.sin(angle) * radius + 2,
        rz: Math.sin(index) * 0.25
      });
      world.add(tuft);
    }

    const graves = [
      [-8.1, -4.8, 0.08], [-10, -2.7, -0.05], [-8.7, 0.1, 0.04], [-11.5, 1.6, -0.08],
      [10.4, 3.8, 0.07], [12.2, 1.3, -0.06], [10.8, -1.1, 0.04], [13.4, -3.2, -0.04]
    ];
    graves.forEach(([x, z, tilt], index) => {
      const grave = tombstone(1.3 + (index % 3) * 0.18, 0.64 + (index % 2) * 0.15, surfaces.stone);
      grave.position.set(x, 0, z);
      grave.rotation.z = tilt;
      grave.rotation.y = index % 2 ? 0.18 : -0.12;
      world.add(grave);
      addCollision(x - 0.45, x + 0.45, z - 0.35, z + 0.35);
    });

    const bareTreeMaterial = material(0x1e211d, { roughness: 1 });
    [[-15, -6], [15, -8], [-16, 7], [17, 8]].forEach(([x, z], treeIndex) => {
      const tree = new THREE.Group();
      tree.add(cylinder(0.17, 0.34, 4.8, 7, bareTreeMaterial, { y: 2.4, rz: treeIndex % 2 ? 0.07 : -0.08 }));
      for (let branch = 0; branch < 5; branch += 1) {
        tree.add(cylinder(0.035, 0.1, 2.2 - branch * 0.12, 6, bareTreeMaterial, {
          x: (branch % 2 ? 1 : -1) * (0.45 + branch * 0.06),
          y: 3 + branch * 0.32,
          rz: (branch % 2 ? -1 : 1) * (0.65 + branch * 0.04)
        }));
      }
      tree.position.set(x, 0, z);
      world.add(tree);
      addCollision(x - 0.55, x + 0.55, z - 0.55, z + 0.55);
    });
  }

  function addRain() {
    const count = 1300;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 48;
      positions[index * 3 + 1] = Math.random() * 22;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 46;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const rainMaterial = new THREE.PointsMaterial({
      color: 0x9fc0c7,
      size: 0.055,
      transparent: true,
      opacity: 0.44,
      depthWrite: false
    });
    rain = new THREE.Points(geometry, rainMaterial);
    world.add(rain);
  }

  function buildExterior() {
    area = "exterior";
    scene.background = new THREE.Color(0x0c181d);
    scene.fog = new THREE.FogExp2(0x172a30, 0.019);
    renderer.toneMappingExposure = 0.94;
    world = new THREE.Group();
    scene.add(world);
    world.add(new THREE.HemisphereLight(0xa7c1c5, 0x1d2b24, 0.74));
    world.add(new THREE.AmbientLight(0x61777a, 0.14));
    const moon = new THREE.DirectionalLight(0xc8dcde, 1.2);
    moon.position.set(-12, 20, 9);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1536, 1536);
    moon.shadow.camera.left = -24;
    moon.shadow.camera.right = 24;
    moon.shadow.camera.top = 24;
    moon.shadow.camera.bottom = -24;
    world.add(moon);
    const stormFill = new THREE.DirectionalLight(0x789fb0, 0.38);
    stormFill.position.set(16, 10, -14);
    world.add(stormFill);

    addExteriorLandscape();
    addExteriorArchitecture();
    addRain();
    addInvestigatorFigures([{ x: -0.7, z: 19 }, { x: 0.7, z: 20 }]);
    walkBounds = { minX: -21, maxX: 21, minZ: -15, maxZ: 22 };

    addInteraction({
      id: "chapel-door",
      kind: "Door",
      label: "Enter Saint Oda",
      position: new THREE.Vector3(0, 0, 7.25),
      action: () => transitionArea("interior")
    });
    addInteraction({
      id: "marsh-notice",
      kind: "Inspect",
      label: "Read the storm notice",
      position: new THREE.Vector3(-5.9, 0, 10.4),
      action: () => inspectOnce("marsh-notice", "The parish notice has curled in the rain. Evening archive appointments were kept despite the storm warning.")
    });
    addInteraction({
      id: "old-grave",
      kind: "Inspect",
      label: "Examine the weathered grave",
      position: new THREE.Vector3(-8.6, 0, 0.8),
      action: () => inspectOnce("old-grave", "Salt has erased most of the name. The surviving date belongs to the year the Eidolon sank.")
    });
    addInteraction({
      id: "bell-rope",
      kind: "Listen",
      label: "Touch the old bell rope",
      position: new THREE.Vector3(5.1, 0, 6.7),
      action: () => inspectOnce("bell-rope", "The wet rope moves against the stone. High above, the little parish bell answers with one restrained iron note.")
    });
    onAreaChange?.("Western marsh · Exterior");
    onMessage?.("Rain moves across the graveyard in silver sheets. The chapel door waits beyond the flooded path.");
  }

  function addInteriorArchitecture() {
    const floorMaterial = surfaces.flagstone;
    const wallMaterial = surfaces.stone;
    const trimMaterial = surfaces.paleStone;

    const floor = mesh(new THREE.PlaneGeometry(18, 23), floorMaterial, { y: 0, z: -0.5, rx: -Math.PI / 2 });
    floor.castShadow = false;
    world.add(floor);
    walkSurface = floor;
    for (let line = -8; line <= 8; line += 1) {
      world.add(box(0.025, 0.012, 23, material(0x282922), { x: line, y: 0.018, z: -0.5 }));
    }
    for (let line = -11; line <= 10; line += 1) {
      world.add(box(18, 0.012, 0.025, material(0x282922), { y: 0.019, z: line }));
    }

    world.add(box(0.6, 5.6, 23, wallMaterial, { x: -9, y: 2.8, z: -0.5 }));
    world.add(box(18.6, 6.4, 0.6, wallMaterial, { y: 3.2, z: -12 }));

    for (const z of [-8.6, -4.4, 0.1, 4.8]) {
      const window = makeWindow(1.05, 2.2);
      window.position.set(-8.68, 3.1, z);
      window.rotation.y = Math.PI / 2;
      world.add(window);
      const glassColor = z % 2 ? 0x6b596b : 0x436e7a;
      const light = new THREE.PointLight(glassColor, 0.52, 4.5, 2);
      light.position.set(-7.7, 2.5, z);
      world.add(light);
    }

    for (let z = -9.5; z <= 8; z += 4.6) {
      world.add(box(0.95, 5.8, 0.9, trimMaterial, { x: -8.45, y: 2.9, z }));
    }

    for (const z of [-7.2, -1.9, 3.5, 8.0]) {
      const torch = makeWallTorch();
      torch.position.set(-8.55, 2.05, z);
      world.add(torch);
      torchFlames.push(torch.userData.flame);
      addWarmLight(world, -7.95, 3.0, z, 18, 5.2);
    }
    for (const x of [-4.8, 0.1, 5.2]) {
      const torch = makeWallTorch();
      torch.position.set(x, 2.05, -11.55);
      torch.rotation.y = -Math.PI / 2;
      world.add(torch);
      torchFlames.push(torch.userData.flame);
      addWarmLight(world, x, 3.0, -10.9, 18, 5.2);
    }

    const entryThreshold = box(2.8, 0.12, 0.5, surfaces.darkWood, { y: 0.06, z: 10.72 });
    world.add(entryThreshold);

    addCollision(-9.3, -8.35, -12, 11);
    addCollision(-9, 9, -12.3, -11.4);
  }

  function addNave() {
    for (let row = 0; row < 5; row += 1) {
      const z = 6.3 - row * 2.05;
      const leftPew = pew(surfaces);
      leftPew.position.set(-3.75, 0, z);
      const rightPew = pew(surfaces);
      rightPew.position.set(0.05, 0, z);
      world.add(leftPew, rightPew);
      addCollision(-5.45, -2.05, z - 0.48, z + 0.48);
      addCollision(-1.65, 1.75, z - 0.48, z + 0.48);
    }

    const altar = new THREE.Group();
    altar.add(box(5.8, 0.72, 1.45, surfaces.paleStone, { y: 0.36 }));
    altar.add(box(5.3, 0.12, 1.6, surfaces.paper, { y: 0.78 }));
    const candles = candleCluster(7);
    candles.position.set(-1.8, 0.84, 0);
    altar.add(candles);
    const secondCandles = candleCluster(5);
    secondCandles.position.set(1.9, 0.84, 0);
    altar.add(secondCandles);
    altar.position.set(-3.55, 0, -9.6);
    world.add(altar);
    addCollision(-6.7, -0.4, -10.55, -8.65);
    addWarmLight(world, -5.2, 2.2, -9.3, 2.8, 7);
    addWarmLight(world, -1.8, 2.2, -9.3, 2.8, 7);

    const cross = new THREE.Group();
    const darkWood = surfaces.darkWood;
    cross.add(box(0.32, 3.25, 0.25, darkWood, { y: 1.62 }));
    cross.add(box(1.85, 0.3, 0.25, darkWood, { y: 2.28 }));
    cross.position.set(-3.55, 2.2, -11.55);
    world.add(cross);

    const lectern = new THREE.Group();
    lectern.add(box(0.18, 1.25, 0.18, surfaces.darkWood, { y: 0.62 }));
    lectern.add(box(1.1, 0.14, 0.78, surfaces.wood, { y: 1.26, rx: -0.38 }));
    lectern.position.set(-6.8, 0, -6.9);
    world.add(lectern);
    addCollision(-7.5, -6.1, -7.5, -6.25);
  }

  function addArchive() {
    const desk = new THREE.Group();
    const oak = surfaces.wood;
    desk.add(box(3.6, 0.22, 1.65, oak, { y: 1.15 }));
    desk.add(box(0.22, 1.15, 1.4, oak, { x: -1.48, y: 0.57 }));
    desk.add(box(0.22, 1.15, 1.4, oak, { x: 1.48, y: 0.57 }));
    desk.add(box(1.25, 0.04, 0.92, surfaces.paper, { x: -0.45, y: 1.29, rz: 0.035 }));
    const lamp = makeLantern();
    lamp.scale.setScalar(0.78);
    lamp.position.set(1.05, 1.2, -0.2);
    desk.add(lamp);
    desk.position.set(5.2, 0, -2.5);
    desk.rotation.y = -0.06;
    world.add(desk);
    addCollision(3.1, 7.3, -3.65, -1.35);
    addWarmLight(world, 6.1, 2.45, -2.5, 3.2, 7.5);

    const backShelf = shelf(surfaces, 5.7, 3.55);
    backShelf.position.set(5.55, 0, -10.9);
    world.add(backShelf);
    addCollision(2.4, 8.7, -11.55, -10.1);

    const sideShelfA = shelf(surfaces, 4.25, 3.4);
    sideShelfA.position.set(8.35, 0, -7.7);
    sideShelfA.rotation.y = -Math.PI / 2;
    world.add(sideShelfA);
    const sideShelfB = shelf(surfaces, 3.2, 3.4);
    sideShelfB.position.set(8.35, 0, -4.0);
    sideShelfB.rotation.y = -Math.PI / 2;
    world.add(sideShelfB);
    addCollision(7.8, 9, -10, -2.2);

    const drawers = new THREE.Group();
    const cabinet = surfaces.wood;
    drawers.add(box(4.1, 2.75, 0.85, cabinet, { y: 1.38 }));
    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        drawers.add(box(0.48, 0.4, 0.12, surfaces.darkWood, {
          x: -1.66 + column * 0.55,
          y: 0.34 + row * 0.5,
          z: 0.48
        }));
        drawers.add(box(0.13, 0.05, 0.05, material(PALETTE.brass, { metalness: 0.65, roughness: 0.36 }), {
          x: -1.66 + column * 0.55,
          y: 0.34 + row * 0.5,
          z: 0.57
        }));
      }
    }
    drawers.position.set(3.9, 0, 0.25);
    world.add(drawers);
    addCollision(1.65, 6.2, -0.45, 0.98);

    const drawerTag = box(0.32, 0.04, 0.18, material(PALETTE.brass, { metalness: 0.72, roughness: 0.3 }), {
      x: 6.55,
      y: 0.07,
      z: 0.72,
      ry: -0.18
    });
    world.add(drawerTag);
  }

  function addInteriorAtmosphere() {
    const count = 420;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 17;
      positions[index * 3 + 1] = 0.2 + Math.random() * 6;
      positions[index * 3 + 2] = -11 + Math.random() * 22;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    dust = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0xe8d6a9,
      size: 0.035,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    }));
    world.add(dust);
  }

  function addNpcFigures() {
    const anchorById = {
      elias_nygaard: { x: 6.2, z: -5.4, color: 0x42453f, accent: 0x9a895f },
      petra_dahl: { x: 3.55, z: 3.35, color: 0x4f4038, accent: 0x7c5360 }
    };
    people.forEach((person, index) => {
      const anchor = anchorById[person.id] ?? { x: 4.2 + index, z: -5.4 + index * 1.4, color: 0x454b48, accent: 0x8c7958 };
      const npc = createNpcModel(person);
      npc.position.set(anchor.x, 0, anchor.z);
      npc.rotation.y = -Math.PI * 0.7;
      world.add(npc);
      addInteraction({
        id: `npc-${person.id}`,
        kind: "Talk",
        label: person.name,
        position: new THREE.Vector3(anchor.x, 0, anchor.z),
        color: 0x8ca8aa,
        action: () => onTalk?.(activeInvestigatorId, person.id)
      });
    });
  }

  function buildInterior() {
    area = "interior";
    scene.background = new THREE.Color(0x111514);
    scene.fog = new THREE.FogExp2(0x20241f, 0.014);
    renderer.toneMappingExposure = 0.96;
    world = new THREE.Group();
    scene.add(world);
    world.add(new THREE.HemisphereLight(0x9db7b7, 0x382b20, 0.46));
    world.add(new THREE.AmbientLight(0x777a6d, 0.17));
    const roofLight = new THREE.DirectionalLight(0xc4d5d2, 0.68);
    roofLight.position.set(-8, 15, 7);
    roofLight.castShadow = true;
    roofLight.shadow.mapSize.set(1024, 1024);
    world.add(roofLight);
    const naveFill = new THREE.DirectionalLight(0xffd39a, 0.28);
    naveFill.position.set(8, 10, 8);
    world.add(naveFill);

    addInteriorArchitecture();
    addNave();
    addArchive();
    addInteriorAtmosphere();
    addNpcFigures();
    addInvestigatorFigures([{ x: -0.6, z: 9.1 }, { x: 0.6, z: 9.4 }]);
    walkBounds = { minX: -8.2, maxX: 8.2, minZ: -11.1, maxZ: 10.15 };

    addInteraction({
      id: "interior-door",
      kind: "Door",
      label: "Return to the churchyard",
      position: new THREE.Vector3(0, 0, 9.9),
      action: () => transitionArea("exterior")
    });
    addInteraction({
      id: "votive-candles",
      kind: "Inspect",
      label: "Study the votive candles",
      position: new THREE.Vector3(-5.5, 0, -8.2),
      action: () => inspectOnce("votive-candles", "One candle was replaced recently. Warm wax covers an older pool that had already gone cold.")
    });
    addInteraction({
      id: "lectern-register",
      kind: "Inspect",
      label: "Open the chapel register",
      position: new THREE.Vector3(-6.55, 0, -6.2),
      action: () => inspectOnce("lectern-register", "The public register is ordinary: baptisms, burials, and storm memorials. Several visitors pressed too hard with the parish pen.")
    });
    addInteraction({
      id: "drawer-tag",
      kind: "Collect",
      label: "Loose brass drawer tag",
      position: new THREE.Vector3(6.55, 0, 0.72),
      available: () => !collected.has("drawer-tag"),
      action: async () => {
        const saved = await onFinding?.({
          id: "drawer-tag",
          title: "Loose brass drawer tag",
          type: "Collected object",
          description: "A small numbered tag worked loose from Saint Oda's private maritime index cabinet. The back carries fresh scratches around one rivet hole.",
          foundAtLocationId: "saint_oda_archive",
          image: "/assets/season_2/locations/saint_oda_archive_interior.png"
        }, activeInvestigatorId);
        if (!saved) return;
        collected.add("drawer-tag");
        onMessage?.("A numbered brass tag has worked loose from the private index cabinet. It is secured in the live inventory.");
      }
    });
    addInteraction({
      id: "archive-folio",
      kind: "Examine",
      label: "Compare the inquiry folios",
      position: new THREE.Vector3(4.55, 0, -3.95),
      available: () => !collected.has("d1_eidolon_redacted_finding"),
      action: async () => {
        if (activeInvestigatorId !== "linnea_berg") {
          onMessage?.("The paper looks old, but its physical history is difficult to read. Linnea's document expertise may reveal more.");
          return;
        }
        const saved = await onFinding?.({
          id: "d1_eidolon_redacted_finding",
          title: "Mismatched inquiry folios",
          type: "Canonical evidence preview",
          inventory: false
        }, activeInvestigatorId);
        if (!saved) return;
        collected.add("d1_eidolon_redacted_finding");
        onMessage?.("Linnea finds different fibre, trimming, and type pressure in the official sequence. Some inquiry pages were replaced after binding, and the finding is now on the Evidence Board.");
      }
    });
    addInteraction({
      id: "private-index",
      kind: "Inspect",
      label: "Examine the private index cabinet",
      position: new THREE.Vector3(3.9, 0, 1.15),
      action: () => inspectOnce("private-index", "Dozens of narrow drawers carry ship names, parish families, and dates. One drawer has a cleaner brass slot where its tag should be.")
    });
    addInteraction({
      id: "stained-light",
      kind: "Observe",
      label: "Watch the stained-glass light",
      position: new THREE.Vector3(-7.45, 0, -1.2),
      action: () => inspectOnce("stained-light", "Blue and oxblood light crosses the flagstones. Rain trembles in the old glass like a moving tide chart.")
    });
    onAreaChange?.("Chapel nave & archive · Interior");
    onMessage?.("The storm becomes a distant pressure beyond the stone. Candlelight leads from the nave into the crowded maritime archive.");
  }

  function inspectOnce(id, message) {
    inspected.add(id);
    onMessage?.(message);
  }

  function saveCurrentPositions() {
    figures.forEach((figure, id) => {
      savedPositions[area][id] = { x: figure.position.x, z: figure.position.z };
    });
  }

  function transitionArea(nextArea) {
    if (transitioning || nextArea === area) return;
    transitioning = true;
    paused = true;
    saveCurrentPositions();
    onTransition?.(true, nextArea);
    window.setTimeout(() => {
      clearWorld();
      if (nextArea === "interior") buildInterior();
      else buildExterior();
      const active = figures.get(activeInvestigatorId);
      if (active) cameraLook.copy(active.position);
      resize();
      window.setTimeout(() => {
        transitioning = false;
        paused = false;
        clock.getDelta();
        onTransition?.(false, nextArea);
        renderer.domElement.focus();
      }, 420);
    }, 390);
  }

  function collides(x, z) {
    if (x < walkBounds.minX || x > walkBounds.maxX || z < walkBounds.minZ || z > walkBounds.maxZ) return true;
    return collisions.some((obstacle) => (
      x + PLAYER_RADIUS > obstacle.minX
      && x - PLAYER_RADIUS < obstacle.maxX
      && z + PLAYER_RADIUS > obstacle.minZ
      && z - PLAYER_RADIUS < obstacle.maxZ
    ));
  }

  function tryMove(figure, deltaX, deltaZ) {
    let moved = false;
    const nextX = figure.position.x + deltaX;
    if (!collides(nextX, figure.position.z)) {
      figure.position.x = nextX;
      moved = moved || Math.abs(deltaX) > 0.0001;
    }
    const nextZ = figure.position.z + deltaZ;
    if (!collides(figure.position.x, nextZ)) {
      figure.position.z = nextZ;
      moved = moved || Math.abs(deltaZ) > 0.0001;
    }
    if (moved) figure.rotation.y = Math.atan2(deltaX, deltaZ);
    return moved;
  }

  function movementVector() {
    const horizontal = (keys.has("ArrowRight") ? 1 : 0)
      - (keys.has("ArrowLeft") ? 1 : 0);
    const vertical = (keys.has("ArrowUp") ? 1 : 0)
      - (keys.has("ArrowDown") ? 1 : 0);
    if (!horizontal && !vertical) return null;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    return forward.multiplyScalar(vertical).add(right.multiplyScalar(horizontal)).normalize();
  }

  function updateMovement(delta) {
    const active = figures.get(activeInvestigatorId);
    if (!active) return;
    const keyboardVector = movementVector();
    let direction = keyboardVector;
    if (keyboardVector) moveTarget = null;
    else if (moveTarget) {
      direction = moveTarget.clone().sub(active.position);
      direction.y = 0;
      if (direction.length() < 0.18) {
        moveTarget = null;
        direction = null;
      } else direction.normalize();
    }

    const moved = direction ? tryMove(active, direction.x * WALK_SPEED * delta, direction.z * WALK_SPEED * delta) : false;
    animateCharacterModel(active, moved, delta);
    figures.forEach((figure, id) => {
      if (id !== activeInvestigatorId) animateCharacterModel(figure, false, delta);
    });
  }

  function updateAtmosphere(delta, elapsed) {
    if (rain) {
      const positions = rain.geometry.attributes.position.array;
      for (let index = 0; index < positions.length; index += 3) {
        positions[index] -= delta * 1.2;
        positions[index + 1] -= delta * 12;
        if (positions[index + 1] < 0) positions[index + 1] = 18 + Math.random() * 5;
      }
      rain.geometry.attributes.position.needsUpdate = true;
    }
    if (dust) {
      dust.rotation.y += delta * 0.008;
      dust.position.y = Math.sin(elapsed * 0.18) * 0.08;
    }
    torchFlames.forEach((flame, index) => {
      const flicker = 1 + Math.sin(elapsed * (7.2 + index * 0.17) + index) * 0.1;
      flame.scale.set(0.72 * flicker, 1.65 + Math.sin(elapsed * 9.1 + index) * 0.13, 0.72 * flicker);
    });
  }

  function updateInteractions(elapsed) {
    const active = figures.get(activeInvestigatorId);
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    interactions.forEach((interaction) => {
      const available = interaction.available?.() ?? true;
      const distance = active ? active.position.distanceTo(interaction.position) : Number.POSITIVE_INFINITY;
      if (available && distance <= interaction.radius && distance < nearestDistance) {
        nearest = interaction;
        nearestDistance = distance;
      }
      interaction.ring.visible = false;
    });
    nearestInteraction = nearest;
    if (nearest) {
      nearest.ring.visible = true;
      const pulse = 1 + Math.sin(elapsed * 4.3) * 0.08;
      nearest.ring.scale.setScalar(pulse);
      nearest.ring.material.opacity = 0.56 + Math.sin(elapsed * 4.3) * 0.16;
      onPrompt?.({ kind: nearest.kind, label: nearest.label });
    } else onPrompt?.(null);
  }

  function updateCamera(delta) {
    const active = figures.get(activeInvestigatorId);
    if (!active) return;
    cameraGoal.set(active.position.x, 0.7, active.position.z);
    const smoothing = 1 - Math.exp(-delta * 4.2);
    cameraLook.lerp(cameraGoal, smoothing);
    camera.position.copy(cameraLook).add(cameraOffset);
    camera.lookAt(cameraLook);
  }

  function animate() {
    animationFrame = window.requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    if (!paused) {
      updateMovement(delta);
      updateInteractions(elapsed);
      updateAtmosphere(delta, elapsed);
      updateCamera(delta);
    }
    renderer.render(scene, camera);
  }

  function interact() {
    if (paused || transitioning || !nearestInteraction) return;
    nearestInteraction.action();
    updateInteractions(clock.elapsedTime);
  }

  function setActiveInvestigator(id) {
    if (!figures.has(id) || id === activeInvestigatorId) return;
    activeInvestigatorId = id;
    moveTarget = null;
    updateActiveMarker();
    onActiveChange?.(id);
    onMessage?.(`${investigators.find((entry) => entry.id === id)?.name ?? "The other investigator"} is now leading the search.`);
  }

  function onKeyDown(event) {
    if (paused || transitioning) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
      event.preventDefault();
      keys.add(event.code);
    }
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onCanvasPointerDown(event) {
    if (paused || transitioning || event.button !== 0 || !walkSurface) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(walkSurface, false)[0];
    if (!hit || collides(hit.point.x, hit.point.z)) return;
    moveTarget = new THREE.Vector3(hit.point.x, 0, hit.point.z);
    renderer.domElement.focus();
  }

  function resize() {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const aspect = width / height;
    const vertical = area === "interior" ? 12.2 : 14.6;
    camera.left = -(vertical * aspect) / 2;
    camera.right = (vertical * aspect) / 2;
    camera.top = vertical / 2;
    camera.bottom = -vertical / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  buildExterior();
  const active = figures.get(activeInvestigatorId);
  if (active) cameraLook.copy(active.position);
  updateCamera(1);
  resize();
  onActiveChange?.(activeInvestigatorId);
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp);
  renderer.domElement.addEventListener("pointerdown", onCanvasPointerDown);
  animate();
  renderer.domElement.focus();

  return {
    setActiveInvestigator,
    interact,
    pause() {
      paused = true;
      keys.clear();
    },
    resume() {
      if (transitioning) return;
      paused = false;
      clock.getDelta();
      renderer.domElement.focus();
    },
    destroy() {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      saveCurrentPositions();
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("pointerdown", onCanvasPointerDown);
      clearWorld();
      surfaceLibrary.dispose();
      renderer.dispose();
      container.replaceChildren();
      onPrompt?.(null);
    }
  };
}
