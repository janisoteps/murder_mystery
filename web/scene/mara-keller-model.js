import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

function seeded(seed = 7301) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function textureCanvas(size, painter) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  painter(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function woolTexture() {
  return textureCanvas(256, (context, size) => {
    const random = seeded(4811);
    context.fillStyle = "#a7a7a7";
    context.fillRect(0, 0, size, size);
    for (let index = 0; index < 6500; index += 1) {
      const shade = 100 + Math.floor(random() * 90);
      context.strokeStyle = `rgba(${shade},${shade},${shade},${0.08 + random() * 0.18})`;
      context.lineWidth = 0.35 + random() * 0.8;
      const x = random() * size;
      const y = random() * size;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + (random() - 0.5) * 5, y + (random() - 0.5) * 2);
      context.stroke();
    }
  });
}

function knitTexture() {
  return textureCanvas(256, (context, size) => {
    context.fillStyle = "#aaaaaa";
    context.fillRect(0, 0, size, size);
    context.lineWidth = 1;
    for (let y = 0; y < size; y += 8) {
      for (let x = 0; x < size; x += 6) {
        context.strokeStyle = "rgba(55,55,55,.34)";
        context.beginPath();
        context.moveTo(x, y);
        context.quadraticCurveTo(x + 3, y + 4, x, y + 8);
        context.stroke();
        context.strokeStyle = "rgba(235,235,235,.24)";
        context.beginPath();
        context.moveTo(x + 1.5, y);
        context.quadraticCurveTo(x + 4.5, y + 4, x + 1.5, y + 8);
        context.stroke();
      }
    }
  });
}

function leatherTexture() {
  return textureCanvas(256, (context, size) => {
    const random = seeded(9921);
    const image = context.createImageData(size, size);
    for (let index = 0; index < image.data.length; index += 4) {
      const value = 117 + Math.floor((random() - 0.5) * 34);
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    context.strokeStyle = "rgba(25,25,25,.12)";
    for (let index = 0; index < 90; index += 1) {
      const y = random() * size;
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(size * 0.3, y + random() * 4, size * 0.7, y - random() * 4, size, y + random() * 2);
      context.stroke();
    }
  });
}

function skinTexture() {
  return textureCanvas(256, (context, size) => {
    const random = seeded(3047);
    const image = context.createImageData(size, size);
    for (let index = 0; index < image.data.length; index += 4) {
      const value = 144 + Math.floor((random() - 0.5) * 25);
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
    context.putImageData(image, 0, 0);
  });
}

function makeMaterials() {
  const wool = woolTexture();
  wool.repeat.set(5, 7);
  const knit = knitTexture();
  knit.repeat.set(7, 10);
  const leather = leatherTexture();
  leather.repeat.set(4, 4);
  const skin = skinTexture();
  skin.repeat.set(4, 5);

  const coat = new THREE.MeshPhysicalMaterial({
    color: 0x26384f,
    roughness: 0.94,
    metalness: 0,
    bumpMap: wool,
    bumpScale: 0.009,
    sheen: 0.18,
    sheenColor: new THREE.Color(0x59667a),
    sheenRoughness: 0.92
  });
  const coatEdge = coat.clone();
  coatEdge.color.setHex(0x1d2c40);
  const sweater = new THREE.MeshPhysicalMaterial({
    color: 0x796c68,
    roughness: 0.96,
    bumpMap: knit,
    bumpScale: 0.014,
    sheen: 0.12,
    sheenColor: new THREE.Color(0xa89b94)
  });
  const scarf = new THREE.MeshPhysicalMaterial({
    color: 0x541a32,
    roughness: 0.98,
    bumpMap: wool,
    bumpScale: 0.012,
    sheen: 0.12,
    sheenColor: new THREE.Color(0x8b5368)
  });
  const trousers = new THREE.MeshPhysicalMaterial({
    color: 0x302a2a,
    roughness: 0.9,
    bumpMap: wool,
    bumpScale: 0.005,
    sheen: 0.08
  });
  const skinMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd1a18c,
    roughness: 0.72,
    metalness: 0,
    bumpMap: skin,
    bumpScale: 0.002,
    clearcoat: 0.025,
    clearcoatRoughness: 0.72
  });
  const cheekSkin = skinMaterial.clone();
  cheekSkin.color.setHex(0xd4a08d);
  const leatherMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x2f1a18,
    roughness: 0.67,
    metalness: 0.02,
    bumpMap: leather,
    bumpScale: 0.012,
    clearcoat: 0.08,
    clearcoatRoughness: 0.74
  });
  const bootLeather = leatherMaterial.clone();
  bootLeather.color.setHex(0x421915);
  bootLeather.roughness = 0.57;
  const hair = new THREE.MeshPhysicalMaterial({
    color: 0x241512,
    roughness: 0.74,
    sheen: 0.48,
    sheenColor: new THREE.Color(0x6f4335),
    sheenRoughness: 0.68
  });
  const hairLight = hair.clone();
  hairLight.color.setHex(0x38211c);
  const shirt = new THREE.MeshPhysicalMaterial({ color: 0xe2ddd0, roughness: 0.88 });
  const eyeWhite = new THREE.MeshPhysicalMaterial({ color: 0xe8e2d8, roughness: 0.36, clearcoat: 0.36 });
  const iris = new THREE.MeshPhysicalMaterial({ color: 0x4b3a2d, roughness: 0.29, clearcoat: 0.48 });
  const pupil = new THREE.MeshBasicMaterial({ color: 0x0b0806 });
  const lip = new THREE.MeshPhysicalMaterial({ color: 0x955f5d, roughness: 0.62, clearcoat: 0.08 });
  const brass = new THREE.MeshStandardMaterial({ color: 0x8b6741, roughness: 0.35, metalness: 0.78 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xbfc2c1, roughness: 0.28, metalness: 0.9 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x17191a, roughness: 0.3, metalness: 0.82 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x121111, roughness: 0.9 });
  const notebook = new THREE.MeshPhysicalMaterial({ color: 0x111317, roughness: 0.82, clearcoat: 0.05 });
  const page = new THREE.MeshStandardMaterial({ color: 0xd8d0be, roughness: 0.95 });

  return {
    coat, coatEdge, sweater, scarf, trousers, skin: skinMaterial, cheekSkin, leather: leatherMaterial,
    bootLeather, hair, hairLight, shirt, eyeWhite, iris, pupil, lip, brass, silver, darkMetal, rubber,
    notebook, page, textures: [wool, knit, leather, skin]
  };
}

function mesh(geometry, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.rotation.set(rx, ry, rz);
  object.scale.set(sx, sy, sz);
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function ellipsoid(material, radius, scale, position = {}) {
  return mesh(new THREE.SphereGeometry(radius, 48, 32), material, { ...position, sx: scale.x, sy: scale.y, sz: scale.z });
}

function capsule(material, radius, length, position = {}, segments = 24) {
  return mesh(new THREE.CapsuleGeometry(radius, length, 12, segments), material, position);
}

function roundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function extruded(shape, depth, material, position = {}, bevel = 0.006) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSegments: 3,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 16
  });
  geometry.center();
  return mesh(geometry, material, position);
}

function tube(points, radius, material, segments = 24) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 8, false), material);
}

function cylinderBetween(start, end, radius, material, radialSegments = 12) {
  const direction = end.clone().sub(start);
  const result = mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments), material);
  result.position.copy(start).add(end).multiplyScalar(0.5);
  result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return result;
}

function addCoatTorso(root, materials, rig) {
  const torso = new THREE.Group();
  // Center the coat between the pelvis and neck. Its local geometry extends
  // roughly half a metre in each direction, so a higher origin reaches the head.
  torso.position.set(0, 0.93, 0);
  root.add(torso);

  const sweaterBody = capsule(materials.sweater, 0.205, 0.34, { y: 0.11, sy: 1, sx: 1.12, sz: 0.65 }, 32);
  torso.add(sweaterBody);

  const shirtCollarShape = new THREE.Shape();
  shirtCollarShape.moveTo(-0.01, -0.055);
  shirtCollarShape.lineTo(0.105, 0.055);
  shirtCollarShape.lineTo(0.02, 0.075);
  shirtCollarShape.lineTo(-0.06, 0.005);
  shirtCollarShape.closePath();
  const shirtCollarLeft = extruded(shirtCollarShape, 0.018, materials.shirt, { x: -0.055, y: 0.39, z: 0.17, rz: -0.08 });
  const shirtCollarRight = shirtCollarLeft.clone();
  shirtCollarRight.scale.x = -1;
  shirtCollarRight.position.x = 0.055;
  torso.add(shirtCollarLeft, shirtCollarRight);

  const backShape = new THREE.Shape();
  backShape.moveTo(-0.34, -0.5);
  backShape.lineTo(-0.32, 0.26);
  backShape.quadraticCurveTo(-0.27, 0.48, -0.16, 0.51);
  backShape.lineTo(0.16, 0.51);
  backShape.quadraticCurveTo(0.27, 0.48, 0.32, 0.26);
  backShape.lineTo(0.34, -0.5);
  backShape.quadraticCurveTo(0, -0.56, -0.34, -0.5);
  const coatBack = extruded(backShape, 0.08, materials.coat, { z: -0.11 }, 0.012);
  torso.add(coatBack);

  const leftShape = new THREE.Shape();
  leftShape.moveTo(-0.02, -0.52);
  leftShape.lineTo(-0.35, -0.5);
  leftShape.lineTo(-0.32, 0.27);
  leftShape.quadraticCurveTo(-0.27, 0.47, -0.14, 0.5);
  leftShape.lineTo(-0.02, 0.37);
  leftShape.lineTo(-0.06, 0.1);
  leftShape.closePath();
  const coatLeft = extruded(leftShape, 0.09, materials.coat, { z: 0.135 }, 0.01);
  const coatRight = coatLeft.clone();
  coatRight.scale.x = -1;
  torso.add(coatLeft, coatRight);

  const lapelShape = new THREE.Shape();
  lapelShape.moveTo(0, -0.18);
  lapelShape.lineTo(-0.16, 0.28);
  lapelShape.lineTo(-0.08, 0.48);
  lapelShape.lineTo(0.055, 0.34);
  lapelShape.lineTo(0.08, 0.03);
  lapelShape.closePath();
  const leftLapel = extruded(lapelShape, 0.025, materials.coatEdge, { x: -0.065, y: 0.08, z: 0.215, rz: -0.05 }, 0.004);
  const rightLapel = leftLapel.clone();
  rightLapel.scale.x = -1;
  rightLapel.position.x = 0.065;
  torso.add(leftLapel, rightLapel);

  const collarShape = roundedRectShape(0.25, 0.11, 0.025);
  const collarBack = extruded(collarShape, 0.05, materials.coatEdge, { y: 0.43, z: -0.01, rx: -0.25 }, 0.005);
  torso.add(collarBack);

  for (const side of [-1, 1]) {
    const pocketShape = roundedRectShape(0.21, 0.25, 0.025);
    const pocket = extruded(pocketShape, 0.022, materials.coatEdge, { x: side * 0.195, y: -0.255, z: 0.2 }, 0.004);
    const flap = extruded(roundedRectShape(0.225, 0.06, 0.012), 0.028, materials.coat, { x: side * 0.195, y: -0.13, z: 0.222, rx: -0.05 }, 0.004);
    torso.add(pocket, flap);
  }

  for (const [x, y] of [[-0.065, 0.02], [0.065, -0.12], [-0.065, -0.28], [0.065, -0.42]]) {
    const button = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 20), materials.leather, { x, y, z: 0.235, rx: Math.PI / 2 });
    const buttonInset = mesh(new THREE.TorusGeometry(0.011, 0.0023, 6, 18), materials.brass, { x, y, z: 0.244 });
    torso.add(button, buttonInset);
  }

  const centerSeam = mesh(new THREE.BoxGeometry(0.008, 0.58, 0.008), materials.coatEdge, { y: -0.22, z: -0.163 });
  torso.add(centerSeam);

  const tails = [];
  for (const side of [-1, 1]) {
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0.25);
    tailShape.lineTo(side * 0.31, 0.22);
    tailShape.lineTo(side * 0.33, -0.38);
    tailShape.quadraticCurveTo(side * 0.18, -0.42, 0, -0.38);
    tailShape.closePath();
    const tail = extruded(tailShape, 0.055, materials.coat, { y: -0.45, z: -0.1 }, 0.008);
    torso.add(tail);
    tails.push(tail);
  }

  rig.torso = torso;
  rig.torsoRestY = torso.position.y;
  rig.coatTails = tails;
}

function createLeg(side, materials) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.12, 0.91, 0);

  const thigh = capsule(materials.trousers, 0.105, 0.27, { y: -0.2, sx: 0.86, sz: 0.82 }, 28);
  hip.add(thigh);
  const crease = mesh(new THREE.BoxGeometry(0.006, 0.36, 0.007), materials.trousers, { x: side * -0.02, y: -0.2, z: 0.092 });
  hip.add(crease);

  const knee = new THREE.Group();
  knee.position.y = -0.43;
  hip.add(knee);
  const shin = capsule(materials.trousers, 0.092, 0.28, { y: -0.2, sx: 0.9, sz: 0.78 }, 28);
  knee.add(shin);

  const boot = new THREE.Group();
  boot.position.set(0, -0.32, 0.025);
  knee.add(boot);
  const ankle = capsule(materials.bootLeather, 0.088, 0.14, { y: 0.045, sx: 0.95, sz: 0.94 }, 28);
  const foot = ellipsoid(materials.bootLeather, 0.1, { x: 1.0, y: 0.58, z: 1.72 }, { y: -0.07, z: 0.07 });
  const sole = mesh(new THREE.BoxGeometry(0.19, 0.028, 0.35), materials.rubber, { y: -0.145, z: 0.07 });
  const heel = mesh(new THREE.BoxGeometry(0.15, 0.045, 0.105), materials.rubber, { y: -0.16, z: -0.045 });
  boot.add(ankle, foot, sole, heel);
  for (let index = 0; index < 4; index += 1) {
    const y = 0.02 - index * 0.034;
    const z = 0.102 + index * 0.018;
    boot.add(cylinderBetween(new THREE.Vector3(-0.055, y, z), new THREE.Vector3(0.055, y - 0.014, z), 0.004, materials.rubber, 6));
  }

  return { hip, knee, boot };
}

function createHand(materials, side) {
  const hand = new THREE.Group();
  const palm = ellipsoid(materials.skin, 0.065, { x: 0.66, y: 1.05, z: 0.45 });
  hand.add(palm);
  for (let index = 0; index < 4; index += 1) {
    const finger = capsule(materials.skin, 0.009, 0.055 - index * 0.003, {
      x: side * (-0.026 + index * 0.017), y: -0.073, z: 0.008, sx: 0.85, sz: 0.85
    }, 12);
    finger.rotation.z = side * (index - 1.5) * 0.025;
    hand.add(finger);
  }
  const thumb = capsule(materials.skin, 0.012, 0.045, { x: side * 0.052, y: -0.025, z: 0.018, rz: side * -0.78 }, 12);
  hand.add(thumb);
  return hand;
}

function createFlashlight(materials) {
  const flashlight = new THREE.Group();
  // Counter the bent forearm so the torch points forward and slightly down.
  flashlight.rotation.x = 2.48;
  const body = mesh(new THREE.CylinderGeometry(0.027, 0.029, 0.18, 24), materials.darkMetal);
  const grip = mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.1, 24), materials.rubber, { y: -0.025 });
  const head = mesh(new THREE.CylinderGeometry(0.052, 0.031, 0.055, 24), materials.darkMetal, { y: 0.105 });
  const rim = mesh(new THREE.TorusGeometry(0.047, 0.006, 10, 28), materials.silver, { y: 0.134, rx: Math.PI / 2 });
  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xdde8dd,
    roughness: 0.12,
    transmission: 0.12,
    emissive: 0xdde8dd,
    emissiveIntensity: 0
  });
  const lens = mesh(new THREE.CircleGeometry(0.043, 28), lensMaterial, { y: 0.138, rx: -Math.PI / 2 });
  const switchMesh = mesh(new THREE.BoxGeometry(0.019, 0.032, 0.012), materials.brass, { y: 0.015, z: -0.03 });
  flashlight.add(body, grip, head, rim, lens, switchMesh);
  flashlight.userData.lensMaterial = lensMaterial;
  return flashlight;
}

function createArm(side, materials, mode) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side * 0.335, 1.32, 0);

  const sleeve = capsule(materials.coat, 0.084, 0.235, { y: -0.17, sx: 0.92, sz: 0.9 }, 28);
  const sleeveSeam = mesh(new THREE.BoxGeometry(0.006, 0.25, 0.008), materials.coatEdge, { x: side * 0.082, y: -0.17 });
  shoulder.add(sleeve, sleeveSeam);

  const elbow = new THREE.Group();
  elbow.position.y = -0.35;
  shoulder.add(elbow);
  const forearm = capsule(materials.coat, 0.073, 0.205, { y: -0.15, sx: 0.9, sz: 0.88 }, 28);
  const cuff = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.052, 24), materials.coatEdge, { y: -0.28 });
  elbow.add(forearm, cuff);

  const hand = createHand(materials, side);
  hand.position.y = -0.36;
  elbow.add(hand);

  if (mode === "flashlight") {
    shoulder.rotation.x = -0.15;
    shoulder.rotation.z = side * 0.055;
    elbow.rotation.x = -0.68;
    const flashlight = createFlashlight(materials);
    flashlight.position.set(side * -0.005, -0.065, 0.035);
    hand.add(flashlight);
    return { shoulder, elbow, hand, flashlight };
  }

  shoulder.rotation.x = 0.05;
  shoulder.rotation.z = side * 0.05;
  elbow.rotation.x = -1.1;
  elbow.rotation.z = side * -0.16;
  return { shoulder, elbow, hand, flashlight: null };
}

function addNotebook(leftArm, materials) {
  const notebook = new THREE.Group();
  notebook.position.set(0.035, -0.03, 0.06);
  notebook.rotation.set(-0.1, -0.25, -0.08);
  const cover = extruded(roundedRectShape(0.16, 0.23, 0.012), 0.026, materials.notebook, {}, 0.004);
  const pages = extruded(roundedRectShape(0.145, 0.213, 0.008), 0.027, materials.page, { z: 0.002 }, 0.002);
  const spine = mesh(new THREE.BoxGeometry(0.018, 0.215, 0.035), materials.notebook, { x: -0.073 });
  notebook.add(pages, cover, spine);
  leftArm.hand.add(notebook);
  return notebook;
}

function addWatch(leftArm, materials) {
  const watch = new THREE.Group();
  watch.position.set(0, -0.31, 0.012);
  const band = mesh(new THREE.TorusGeometry(0.054, 0.008, 8, 28), materials.leather, { rx: Math.PI / 2 });
  const caseMesh = mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.012, 28), materials.silver, { z: 0.052, rx: Math.PI / 2 });
  const face = mesh(new THREE.CircleGeometry(0.026, 28), materials.shirt, { z: 0.059 });
  const handOne = mesh(new THREE.BoxGeometry(0.003, 0.017, 0.002), materials.darkMetal, { y: 0.006, z: 0.061, rz: 0.35 });
  const handTwo = mesh(new THREE.BoxGeometry(0.003, 0.013, 0.002), materials.darkMetal, { y: 0.004, z: 0.062, rz: -0.75 });
  watch.add(band, caseMesh, face, handOne, handTwo);
  leftArm.elbow.add(watch);
}

function addScarf(root, materials, rig) {
  const scarf = new THREE.Group();
  scarf.position.set(0, 1.445, 0);
  root.add(scarf);
  const wrapOne = mesh(new THREE.TorusGeometry(0.13, 0.045, 14, 44), materials.scarf, { rx: Math.PI / 2, sx: 1.1, sy: 0.92 });
  const wrapTwo = mesh(new THREE.TorusGeometry(0.116, 0.038, 14, 44), materials.scarf, { y: -0.045, z: 0.015, rx: Math.PI / 2, sx: 1.08 });
  scarf.add(wrapOne, wrapTwo);

  const tailShape = roundedRectShape(0.095, 0.46, 0.018);
  const longTail = extruded(tailShape, 0.028, materials.scarf, { x: 0.07, y: -0.29, z: 0.19, rz: -0.07 }, 0.006);
  const shortTail = extruded(roundedRectShape(0.088, 0.34, 0.018), 0.028, materials.scarf, { x: -0.05, y: -0.23, z: 0.202, rz: 0.045 }, 0.006);
  scarf.add(longTail, shortTail);
  rig.scarfTails = [longTail, shortTail];
}

function addSatchel(root, materials, rig) {
  const satchel = new THREE.Group();
  satchel.position.set(-0.38, 0.78, -0.015);
  satchel.rotation.z = -0.035;
  root.add(satchel);

  const body = extruded(roundedRectShape(0.31, 0.28, 0.035), 0.11, materials.leather, { z: 0.025 }, 0.012);
  const gusset = mesh(new THREE.BoxGeometry(0.275, 0.22, 0.125), materials.leather, { y: -0.018, z: 0.005 });
  const flapShape = roundedRectShape(0.315, 0.185, 0.03);
  const flap = extruded(flapShape, 0.02, materials.leather, { y: 0.055, z: 0.093, rx: -0.08 }, 0.007);
  const buckle = mesh(new THREE.TorusGeometry(0.026, 0.0045, 8, 4), materials.brass, { y: -0.065, z: 0.112, rz: Math.PI / 4 });
  const strapTab = mesh(new THREE.BoxGeometry(0.035, 0.12, 0.018), materials.leather, { y: -0.035, z: 0.108 });
  satchel.add(gusset, body, flap, buckle, strapTab);

  const strapPoints = [
    new THREE.Vector3(0.25, 1.41, 0.03),
    new THREE.Vector3(0.1, 1.24, 0.19),
    new THREE.Vector3(-0.14, 1.01, 0.2),
    new THREE.Vector3(-0.34, 0.85, 0.08)
  ];
  const strap = tube(strapPoints, 0.019, materials.leather, 48);
  strap.scale.x = 0.78;
  root.add(strap);

  const gloveGroup = new THREE.Group();
  gloveGroup.position.set(0.18, -0.01, 0.105);
  for (let index = 0; index < 4; index += 1) {
    gloveGroup.add(capsule(materials.leather, 0.011, 0.09, { x: index * 0.022, y: 0.02 + index * 0.004, rz: -0.12 }, 12));
  }
  satchel.add(gloveGroup);
  rig.satchel = satchel;
}

function addFace(head, materials, rig) {
  const cranium = ellipsoid(materials.skin, 0.1, { x: 0.96, y: 1.22, z: 0.95 }, { y: 0.018 });
  const jaw = ellipsoid(materials.skin, 0.083, { x: 0.94, y: 0.9, z: 0.88 }, { y: -0.062, z: 0.012 });
  const leftCheek = ellipsoid(materials.cheekSkin, 0.043, { x: 1.0, y: 0.78, z: 0.45 }, { x: -0.052, y: -0.016, z: 0.079 });
  const rightCheek = leftCheek.clone();
  rightCheek.position.x = 0.052;
  head.add(cranium, jaw, leftCheek, rightCheek);

  const eyeGroups = [];
  for (const side of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.038, 0.027, 0.091);
    const white = ellipsoid(materials.eyeWhite, 0.022, { x: 1.15, y: 0.66, z: 0.38 });
    const iris = ellipsoid(materials.iris, 0.011, { x: 1, y: 1, z: 0.28 }, { z: 0.019 });
    const pupil = ellipsoid(materials.pupil, 0.0048, { x: 1, y: 1, z: 0.3 }, { z: 0.024 });
    const glint = ellipsoid(materials.eyeWhite, 0.0018, { x: 1, y: 1, z: 0.4 }, { x: -0.002, y: 0.002, z: 0.027 });
    eyeGroup.add(white, iris, pupil, glint);
    head.add(eyeGroup);
    eyeGroups.push(eyeGroup);

    const brow = tube([
      new THREE.Vector3(side * 0.018, 0.066, 0.101),
      new THREE.Vector3(side * 0.039, 0.072, 0.105),
      new THREE.Vector3(side * 0.064, 0.067, 0.096)
    ], 0.0042, materials.hair, 16);
    head.add(brow);
  }

  const noseBridge = ellipsoid(materials.skin, 0.03, { x: 0.48, y: 1.35, z: 0.42 }, { y: 0.005, z: 0.096 });
  const noseTip = ellipsoid(materials.skin, 0.025, { x: 0.72, y: 0.62, z: 0.92 }, { y: -0.018, z: 0.111 });
  const nostrilLeft = ellipsoid(materials.lip, 0.004, { x: 1.5, y: 0.5, z: 0.4 }, { x: -0.012, y: -0.027, z: 0.132 });
  const nostrilRight = nostrilLeft.clone();
  nostrilRight.position.x = 0.012;
  head.add(noseBridge, noseTip, nostrilLeft, nostrilRight);

  const upperLip = capsule(materials.lip, 0.0055, 0.035, { y: -0.066, z: 0.09, rz: Math.PI / 2, sx: 0.9, sz: 0.45 }, 18);
  const lowerLip = capsule(materials.lip, 0.0065, 0.034, { y: -0.075, z: 0.089, rz: Math.PI / 2, sx: 0.92, sz: 0.5 }, 18);
  const mouthLine = mesh(new THREE.BoxGeometry(0.052, 0.0022, 0.002), materials.pupil, { y: -0.071, z: 0.095 });
  head.add(upperLip, lowerLip, mouthLine);

  for (const side of [-1, 1]) {
    const ear = ellipsoid(materials.skin, 0.031, { x: 0.38, y: 0.88, z: 0.46 }, { x: side * 0.099, y: -0.002 });
    const earring = ellipsoid(materials.silver, 0.006, { x: 0.55, y: 0.9, z: 0.55 }, { x: side * 0.105, y: -0.024, z: 0.005 });
    head.add(ear, earring);
  }

  rig.eyeGroups = eyeGroups;
}

function addHair(head, materials, rig) {
  const cap = mesh(
    new THREE.SphereGeometry(0.104, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.58),
    materials.hair,
    { y: 0.045, z: -0.014, sx: 1.04, sy: 1.12, sz: 1.02 }
  );
  head.add(cap);

  const locks = [];
  const random = seeded(8827);
  for (let index = 0; index < 28; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const layer = Math.floor(index / 2);
    const angle = -1.12 + (layer / 13) * 2.24;
    const startX = Math.sin(angle) * 0.086;
    const startZ = Math.cos(angle) * 0.074 - 0.018;
    const startY = 0.105 - Math.abs(angle) * 0.012;
    const length = 0.18 + random() * 0.09;
    const endX = startX + side * (0.006 + random() * 0.015);
    const endZ = startZ + 0.005 + random() * 0.018;
    const points = [
      new THREE.Vector3(startX, startY, startZ),
      new THREE.Vector3(startX + side * 0.012, startY - length * 0.42, startZ + (random() - 0.5) * 0.018),
      new THREE.Vector3(endX, startY - length, endZ)
    ];
    const lock = tube(points, 0.009 + random() * 0.004, index % 5 === 0 ? materials.hairLight : materials.hair, 18);
    head.add(lock);
    locks.push(lock);
  }

  const partLine = tube([
    new THREE.Vector3(-0.017, 0.132, 0.03),
    new THREE.Vector3(-0.013, 0.119, 0.073),
    new THREE.Vector3(-0.01, 0.098, 0.09)
  ], 0.002, materials.skin, 12);
  head.add(partLine);

  const fringeLeft = tube([
    new THREE.Vector3(-0.012, 0.126, 0.073),
    new THREE.Vector3(-0.051, 0.105, 0.095),
    new THREE.Vector3(-0.079, 0.055, 0.081)
  ], 0.015, materials.hairLight, 20);
  const fringeRight = tube([
    new THREE.Vector3(-0.006, 0.126, 0.073),
    new THREE.Vector3(0.035, 0.105, 0.098),
    new THREE.Vector3(0.071, 0.065, 0.083)
  ], 0.014, materials.hair, 20);
  head.add(fringeLeft, fringeRight);
  locks.push(fringeLeft, fringeRight);
  rig.hairLocks = locks;
}

function addHead(root, materials, rig) {
  const neck = mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.16, 32), materials.skin, { y: 1.43 });
  root.add(neck);
  const head = new THREE.Group();
  head.position.set(0, 1.57, 0.006);
  root.add(head);
  addFace(head, materials, rig);
  addHair(head, materials, rig);
  rig.head = head;
}

export function createMaraKellerModel() {
  const materials = makeMaterials();
  const root = new THREE.Group();
  root.name = "mara-keller-detailed-model";
  const rig = {};

  const pelvis = ellipsoid(materials.trousers, 0.18, { x: 1.45, y: 0.72, z: 0.72 }, { y: 0.94 });
  root.add(pelvis);
  addCoatTorso(root, materials, rig);

  const leftLeg = createLeg(-1, materials);
  const rightLeg = createLeg(1, materials);
  root.add(leftLeg.hip, rightLeg.hip);
  rig.leftLeg = leftLeg;
  rig.rightLeg = rightLeg;

  const leftArm = createArm(-1, materials, "notebook");
  const rightArm = createArm(1, materials, "flashlight");
  root.add(leftArm.shoulder, rightArm.shoulder);
  rig.leftArm = leftArm;
  rig.rightArm = rightArm;
  rig.flashlightMount = rightArm.flashlight;
  addNotebook(leftArm, materials);
  addWatch(leftArm, materials);

  addHead(root, materials, rig);
  addScarf(root, materials, rig);
  addSatchel(root, materials, rig);

  const wetSnowMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc6d2d6, roughness: 0.24, transparent: true, opacity: 0.42 });
  for (const [x, y, z, size] of [[-0.24, 1.49, 0.01, 0.012], [0.28, 1.41, 0.02, 0.009], [-0.17, 0.62, 0.19, 0.006]]) {
    root.add(ellipsoid(wetSnowMaterial, size, { x: 1.3, y: 0.3, z: 0.7 }, { x, y, z }));
  }

  root.userData.rig = rig;
  root.userData.materials = materials;
  root.userData.walkTime = 0;
  root.userData.idleTime = Math.random() * Math.PI * 2;
  root.userData.blinkOffset = Math.random() * 3;
  root.userData.flashlightOn = false;
  root.scale.setScalar(1.74 / 1.75);
  return root;
}

export function setMaraFlashlight(model, enabled) {
  model.userData.flashlightOn = Boolean(enabled);
  const lens = model.userData.rig?.flashlightMount?.userData?.lensMaterial;
  if (lens) lens.emissiveIntensity = enabled ? 4.5 : 0;
}

function approach(current, target, rate, delta) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-rate * delta));
}

export function animateMaraKeller(model, { moving = false, delta = 0, speed = 1 } = {}) {
  const rig = model.userData.rig;
  if (!rig) return;
  model.userData.idleTime += delta;
  model.userData.walkTime += delta * (moving ? 7.4 * speed : 1.1);
  const phase = model.userData.walkTime;
  const stride = moving ? Math.sin(phase) : 0;
  const liftLeft = moving ? Math.max(0, Math.sin(phase)) : 0;
  const liftRight = moving ? Math.max(0, -Math.sin(phase)) : 0;

  rig.leftLeg.hip.rotation.x = approach(rig.leftLeg.hip.rotation.x, stride * 0.48, 10, delta);
  rig.rightLeg.hip.rotation.x = approach(rig.rightLeg.hip.rotation.x, -stride * 0.48, 10, delta);
  rig.leftLeg.knee.rotation.x = approach(rig.leftLeg.knee.rotation.x, -liftRight * 0.42, 12, delta);
  rig.rightLeg.knee.rotation.x = approach(rig.rightLeg.knee.rotation.x, -liftLeft * 0.42, 12, delta);
  rig.leftLeg.boot.rotation.x = approach(rig.leftLeg.boot.rotation.x, -stride * 0.12, 10, delta);
  rig.rightLeg.boot.rotation.x = approach(rig.rightLeg.boot.rotation.x, stride * 0.12, 10, delta);

  rig.leftArm.shoulder.rotation.x = approach(rig.leftArm.shoulder.rotation.x, 0.05 - stride * 0.08, 8, delta);
  rig.rightArm.shoulder.rotation.x = approach(rig.rightArm.shoulder.rotation.x, -0.15 + stride * 0.1, 8, delta);
  rig.rightArm.elbow.rotation.x = approach(rig.rightArm.elbow.rotation.x, -0.68 - Math.abs(stride) * 0.05, 8, delta);
  rig.leftArm.elbow.rotation.x = approach(rig.leftArm.elbow.rotation.x, -1.1, 9, delta);

  const breath = Math.sin(model.userData.idleTime * 1.45) * 0.004;
  rig.torso.position.y = rig.torsoRestY + breath;
  rig.torso.rotation.z = approach(rig.torso.rotation.z, moving ? stride * 0.012 : Math.sin(model.userData.idleTime * 0.45) * 0.004, 5, delta);
  rig.head.rotation.y = approach(rig.head.rotation.y, moving ? -stride * 0.025 : Math.sin(model.userData.idleTime * 0.36) * 0.045, 3, delta);
  rig.head.rotation.z = approach(rig.head.rotation.z, moving ? stride * 0.01 : Math.sin(model.userData.idleTime * 0.29) * 0.008, 3, delta);

  rig.coatTails.forEach((tail, index) => {
    tail.rotation.x = approach(tail.rotation.x, moving ? -0.06 - Math.abs(stride) * 0.06 : 0, 5, delta);
    tail.rotation.z = (index ? -1 : 1) * (moving ? stride * 0.018 : 0);
  });
  rig.scarfTails.forEach((tail, index) => {
    tail.rotation.x = approach(tail.rotation.x, moving ? -0.08 - Math.abs(stride) * 0.06 : 0, 4, delta);
    tail.rotation.z += Math.sin(model.userData.idleTime * 1.2 + index) * 0.00035;
  });
  rig.satchel.rotation.z = approach(rig.satchel.rotation.z, -0.035 + (moving ? stride * 0.04 : 0), 4, delta);

  const blinkPhase = (model.userData.idleTime + model.userData.blinkOffset) % 4.7;
  const blink = blinkPhase > 4.52 ? Math.max(0.08, Math.abs(blinkPhase - 4.61) / 0.09) : 1;
  rig.eyeGroups.forEach((eye) => {
    eye.scale.y = blink;
  });

  model.position.y = moving ? Math.abs(Math.sin(phase)) * 0.018 : 0;
}

export function disposeMaraKellerModel(model) {
  const materials = new Set();
  const geometries = new Set();
  model.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    if (Array.isArray(child.material)) child.material.forEach((material) => materials.add(material));
    else if (child.material) materials.add(child.material);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  model.userData.materials?.textures?.forEach((texture) => texture.dispose());
}
