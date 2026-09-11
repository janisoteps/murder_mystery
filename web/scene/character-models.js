import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

function standard(color, roughness = 0.82, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function part(geometry, partMaterial, x = 0, y = 0, z = 0) {
  const result = new THREE.Mesh(geometry, partMaterial);
  result.position.set(x, y, z);
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

function capsule(radius, length, partMaterial) {
  return part(new THREE.CapsuleGeometry(radius, length, 6, 12), partMaterial);
}

function roundedTorso(width, height, depth, partMaterial) {
  const torso = part(new THREE.CapsuleGeometry(width * 0.34, height * 0.55, 7, 12), partMaterial);
  torso.scale.set(1, 1, depth / width);
  return torso;
}

function makeArm(side, cloth, skin, glove) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side * 0.53, 1.74, 0);
  shoulder.rotation.z = side * 0.08;

  const upper = capsule(0.115, 0.32, cloth);
  upper.position.y = -0.22;
  const elbow = part(new THREE.SphereGeometry(0.115, 10, 8), cloth, 0, -0.45, 0);
  const forearm = capsule(0.095, 0.28, cloth);
  forearm.position.set(0, -0.65, 0.035);
  forearm.rotation.x = -0.08;
  const hand = part(new THREE.SphereGeometry(0.105, 10, 8), glove ?? skin, 0, -0.88, 0.07);
  hand.scale.set(0.84, 1.12, 0.72);
  shoulder.add(upper, elbow, forearm, hand);
  return shoulder;
}

function makeLeg(side, trousers, boots) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.22, 1.28, 0);
  const thigh = capsule(0.145, 0.48, trousers);
  thigh.position.y = -0.34;
  const knee = part(new THREE.SphereGeometry(0.14, 10, 8), trousers, 0, -0.66, 0);
  const shin = capsule(0.125, 0.42, trousers);
  shin.position.set(0, -0.91, 0);
  const boot = part(new THREE.BoxGeometry(0.27, 0.22, 0.48), boots, 0, -1.18, 0.1);
  boot.rotation.x = -0.04;
  hip.add(thigh, knee, shin, boot);
  return hip;
}

function addFace(head, skin, hair, style) {
  const eye = standard(style.eyeColor ?? 0x53666b, 0.45);
  const white = standard(0xd9d4c7, 0.65);
  const lip = standard(0x8b5e5b, 0.82);
  for (const side of [-1, 1]) {
    const eyeWhite = part(new THREE.SphereGeometry(0.047, 8, 6), white, side * 0.092, 0.03, 0.238);
    eyeWhite.scale.set(1.2, 0.68, 0.42);
    const iris = part(new THREE.SphereGeometry(0.025, 8, 6), eye, side * 0.092, 0.03, 0.27);
    iris.scale.z = 0.45;
    head.add(eyeWhite, iris);
  }
  const nose = part(new THREE.SphereGeometry(0.055, 8, 6), skin, 0, -0.035, 0.268);
  nose.scale.set(0.72, 1.2, 0.9);
  const mouth = part(new THREE.BoxGeometry(0.105, 0.018, 0.018), lip, 0, -0.13, 0.263);
  head.add(nose, mouth);

  const cap = part(new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.57), hair, 0, 0.09, -0.01);
  cap.scale.set(1.02, 0.96, 1.02);
  head.add(cap);
  if (style.hair === "bob") {
    const back = part(new THREE.CapsuleGeometry(0.23, 0.28, 6, 12), hair, 0, -0.02, -0.12);
    back.scale.set(1.08, 1, 0.82);
    head.add(back);
    const sideHairLeft = capsule(0.075, 0.27, hair);
    sideHairLeft.position.set(-0.25, -0.08, 0);
    const sideHairRight = capsule(0.075, 0.27, hair);
    sideHairRight.position.set(0.25, -0.08, 0);
    head.add(sideHairLeft, sideHairRight);
  } else if (style.hair === "short") {
    const fringe = part(new THREE.BoxGeometry(0.3, 0.1, 0.09), hair, -0.04, 0.17, 0.23);
    fringe.rotation.z = -0.13;
    head.add(fringe);
  } else if (style.hair === "swept") {
    const fringe = capsule(0.065, 0.34, hair);
    fringe.position.set(-0.1, 0.16, 0.18);
    fringe.rotation.z = 1.18;
    head.add(fringe);
  }
}

function makeHumanoid(style) {
  const root = new THREE.Group();
  const skin = standard(style.skin ?? 0xd0ad8d, 0.9);
  const hair = standard(style.hairColor ?? 0x49362b, 0.88);
  const coat = standard(style.coat, 0.87);
  const coatDark = standard(style.coatDark ?? style.coat, 0.88);
  const shirt = standard(style.shirt ?? 0xc6b997, 0.82);
  const scarf = standard(style.accent, 0.8);
  const trousers = standard(style.trousers ?? 0x252b2c, 0.9);
  const boots = standard(style.boots ?? 0x171819, 0.72, 0.08);

  const pelvis = part(new THREE.BoxGeometry(0.72, 0.38, 0.48), coatDark, 0, 1.05, 0);
  pelvis.scale.x = style.build === "broad" ? 1.08 : 0.94;
  const torso = roundedTorso(style.build === "broad" ? 1.02 : 0.9, 1.25, 0.62, coat);
  torso.position.set(0, 1.43, 0);
  const shoulderYoke = part(
    new THREE.BoxGeometry(style.build === "broad" ? 1.12 : 1.02, 0.28, 0.58),
    coat,
    0,
    1.73,
    0
  );
  const collar = part(new THREE.CylinderGeometry(0.27, 0.32, 0.16, 12), shirt, 0, 1.96, 0);
  const neck = part(new THREE.CylinderGeometry(0.115, 0.125, 0.22, 12), skin, 0, 2.08, 0);
  const head = new THREE.Group();
  head.position.set(0, 2.36, 0);
  const face = part(new THREE.SphereGeometry(0.285, 18, 14), skin);
  face.scale.set(style.faceWidth ?? 0.94, 1.08, 0.92);
  head.add(face);
  addFace(head, skin, hair, style);

  const leftArm = makeArm(-1, coat, skin, style.gloves ? boots : null);
  const rightArm = makeArm(1, coat, skin, style.gloves ? boots : null);
  const leftLeg = makeLeg(-1, trousers, boots);
  const rightLeg = makeLeg(1, trousers, boots);
  root.add(pelvis, torso, shoulderYoke, collar, neck, head, leftArm, rightArm, leftLeg, rightLeg);

  const flashlightMetal = standard(0x2b3131, 0.36, 0.72);
  const flashlightLens = standard(0xdbe9dc, 0.18, 0.08);
  flashlightLens.emissive.set(0xc8dfce);
  flashlightLens.emissiveIntensity = 1.2;
  const flashlightBody = part(new THREE.CylinderGeometry(0.065, 0.072, 0.34, 12), flashlightMetal, 0.04, -0.87, 0.18);
  flashlightBody.rotation.x = Math.PI / 2;
  const flashlightHead = part(new THREE.CylinderGeometry(0.1, 0.072, 0.1, 12), flashlightMetal, 0.04, -0.87, 0.36);
  flashlightHead.rotation.x = Math.PI / 2;
  const lens = part(new THREE.CircleGeometry(0.078, 14), flashlightLens, 0.04, -0.87, 0.415);
  rightArm.add(flashlightBody, flashlightHead, lens);

  if (style.scarf) {
    const scarfBand = part(new THREE.CylinderGeometry(0.25, 0.27, 0.16, 12), scarf, 0, 2.02, 0);
    const scarfTail = part(new THREE.BoxGeometry(0.16, 0.58, 0.07), scarf, 0.15, 1.75, 0.31);
    scarfTail.rotation.z = -0.08;
    root.add(scarfBand, scarfTail);
  }

  if (style.coatSkirt) {
    const coatBody = part(
      new THREE.BoxGeometry(style.build === "broad" ? 0.96 : 0.86, 0.94, 0.55),
      coatDark,
      0,
      1.38,
      0
    );
    root.add(coatBody);
  }

  root.scale.setScalar(style.scale ?? 0.92);
  root.userData.walkPhase = Math.random() * Math.PI * 2;
  root.userData.rig = { leftArm, rightArm, leftLeg, rightLeg, head, torso };
  root.userData.style = style;
  return root;
}

const INVESTIGATOR_STYLES = {
  linnea_berg: {
    coat: 0x596368,
    coatDark: 0x3d464a,
    accent: 0xa65364,
    trousers: 0x30373a,
    boots: 0x211c1b,
    hairColor: 0xc0b49d,
    eyeColor: 0x6c8178,
    hair: "bob",
    scarf: true,
    coatSkirt: true,
    faceWidth: 0.9,
    scale: 0.91
  },
  erik_halden: {
    coat: 0x344e61,
    coatDark: 0x273b4a,
    accent: 0x8398a5,
    trousers: 0x252d34,
    boots: 0x181a1c,
    hairColor: 0x806e51,
    eyeColor: 0x537c94,
    hair: "short",
    scarf: true,
    coatSkirt: true,
    gloves: true,
    build: "broad",
    scale: 0.94
  }
};

const NPC_STYLES = {
  elias_nygaard: {
    coat: 0x343836,
    coatDark: 0x222624,
    accent: 0xb4a279,
    shirt: 0xd2d0c5,
    trousers: 0x2b2d2a,
    hairColor: 0xb4aea0,
    eyeColor: 0x62736c,
    hair: "short",
    coatSkirt: true,
    faceWidth: 0.94,
    scale: 0.92
  },
  petra_dahl: {
    coat: 0x62493e,
    coatDark: 0x49342d,
    accent: 0x8d5662,
    trousers: 0x303334,
    hairColor: 0x332823,
    eyeColor: 0x52635e,
    hair: "swept",
    scarf: true,
    coatSkirt: true,
    scale: 0.9
  }
};

export function createInvestigatorModel(investigator) {
  return makeHumanoid(INVESTIGATOR_STYLES[investigator.id] ?? {
    coat: investigator.color,
    coatDark: investigator.color,
    accent: 0xb9a272,
    hair: "short",
    coatSkirt: true
  });
}

export function createNpcModel(person) {
  return makeHumanoid(NPC_STYLES[person.id] ?? {
    coat: 0x4b514e,
    coatDark: 0x363b39,
    accent: 0x8c7958,
    hairColor: 0x514138,
    hair: "short",
    coatSkirt: true,
    scale: 0.91
  });
}

export function animateCharacterModel(model, moving, delta) {
  const rig = model.userData.rig;
  if (!rig) return;
  model.userData.walkPhase += delta * (moving ? 8.5 : 1.4);
  const phase = model.userData.walkPhase;
  const stride = moving ? Math.sin(phase) * 0.52 : 0;
  rig.leftLeg.rotation.x += (stride - rig.leftLeg.rotation.x) * 0.32;
  rig.rightLeg.rotation.x += (-stride - rig.rightLeg.rotation.x) * 0.32;
  rig.leftArm.rotation.x += (-stride * 0.65 - rig.leftArm.rotation.x) * 0.28;
  rig.rightArm.rotation.x += (stride * 0.65 - rig.rightArm.rotation.x) * 0.28;
  rig.head.rotation.y = Math.sin(phase * 0.35) * (moving ? 0.035 : 0.08);
  rig.torso.rotation.z = Math.sin(phase * 0.5) * (moving ? 0.015 : 0.008);
  model.position.y = moving ? Math.abs(Math.sin(phase)) * 0.035 : Math.sin(phase * 0.5) * 0.008;
}
