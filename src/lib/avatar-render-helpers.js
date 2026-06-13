import * as THREE from "three";
import { resolveSkinTone, resolveBodyBuild, resolveHairColor, resolveOutfitColor, clampHeightScale } from "@/lib/avatar-config";

const LEG_HEIGHT = 0.85;
const TORSO_HEIGHT_BASE = 0.55;
const TORSO_WIDTH_BASE = 0.42;
const TORSO_DEPTH_BASE = 0.24;
const HEAD_RADIUS = 0.16;

function addCutoutPlane(group, width, height, positionY, positionZ) {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })
  );
  plane.scale.set(width, height, 1);
  plane.position.set(0, positionY, positionZ);
  plane.userData.spriteBaseHeight = height;
  group.add(plane);
  return plane;
}

function addHair(group, style, material, headY) {
  let mesh;
  switch (style) {
    case "long":
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(HEAD_RADIUS * 1.02, HEAD_RADIUS * 0.7, 0.42, 16), material);
      mesh.position.set(0, headY - 0.08, -0.015);
      break;
    case "ponytail": {
      mesh = new THREE.Group();
      const cap = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS * 1.04, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), material);
      cap.position.set(0, headY + HEAD_RADIUS * 0.06, 0);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(HEAD_RADIUS * 0.4, 0.34, 12), material);
      tail.position.set(0, headY - 0.08, -HEAD_RADIUS * 0.9);
      tail.rotation.x = Math.PI * 0.55;
      mesh.add(cap, tail);
      break;
    }
    case "afro":
      mesh = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS * 1.35, 18, 18), material);
      mesh.position.set(0, headY + HEAD_RADIUS * 0.15, 0);
      break;
    case "medium":
      mesh = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS * 1.08, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), material);
      mesh.position.set(0, headY + HEAD_RADIUS * 0.05, 0);
      break;
    case "short":
    default:
      mesh = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS * 1.04, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), material);
      mesh.position.set(0, headY + HEAD_RADIUS * 0.06, 0);
      break;
  }
  group.add(mesh);
  return mesh;
}

function addAccessory(group, accessory, { headY, torsoY, torsoW, torsoH }) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.35, metalness: 0.35 });
  switch (accessory) {
    case "glasses": {
      const rim = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.4 });
      const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 8, 16), rim);
      lensL.position.set(-0.07, headY + 0.01, HEAD_RADIUS * 0.92);
      const lensR = lensL.clone();
      lensR.position.x = 0.07;
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), rim);
      bridge.position.set(0, headY + 0.01, HEAD_RADIUS * 0.92);
      group.add(lensL, lensR, bridge);
      break;
    }
    case "cap": {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS * 1.08, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), mat);
      dome.position.set(0, headY + HEAD_RADIUS * 0.18, 0);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(HEAD_RADIUS * 1.1, HEAD_RADIUS * 1.1, 0.02, 16), mat);
      brim.position.set(0, headY + HEAD_RADIUS * 0.12, HEAD_RADIUS * 0.55);
      group.add(dome, brim);
      break;
    }
    case "headphones": {
      const band = new THREE.Mesh(new THREE.TorusGeometry(HEAD_RADIUS * 1.05, 0.018, 8, 24, Math.PI), mat);
      band.position.set(0, headY + HEAD_RADIUS * 0.55, 0);
      band.rotation.z = Math.PI;
      const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), mat);
      cupL.rotation.z = Math.PI / 2;
      cupL.position.set(-HEAD_RADIUS * 1.02, headY, 0);
      const cupR = cupL.clone();
      cupR.position.x = HEAD_RADIUS * 1.02;
      group.add(band, cupL, cupR);
      break;
    }
    case "scarf": {
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.55, 0.05, 8, 16), new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 }));
      scarf.position.set(0, torsoY + torsoH / 2, 0);
      scarf.rotation.x = Math.PI / 2.2;
      group.add(scarf);
      break;
    }
    default:
      break;
  }
}

// Builds a deterministic parametric humanoid avatar from a config object
// (see avatar-config.js). Returns the group plus media requests for any
// face/body cutout textures the caller should load and apply.
export function buildAvatarGroup(config) {
  const group = new THREE.Group();
  group.name = "avatar-rig";

  const build = resolveBodyBuild(config.body_build);
  const heightScale = clampHeightScale(config.height_scale);
  const skinColor = resolveSkinTone(config.skin_tone).color;
  const hairColor = resolveHairColor(config.hair_color).color;
  const topColor = resolveOutfitColor(config.outfit_top_color).color;
  const bottomColor = resolveOutfitColor(config.outfit_bottom_color).color;

  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.75 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.6 });
  const topMat = new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.85 });
  const bottomMat = new THREE.MeshStandardMaterial({ color: bottomColor, roughness: 0.85 });

  const [torsoWScale, torsoHScale, torsoDScale] = build.torsoScale;
  const limbScale = build.limbScale;

  const legGeo = new THREE.CylinderGeometry(0.085 * limbScale, 0.075 * limbScale, LEG_HEIGHT, 10);
  const legL = new THREE.Mesh(legGeo, bottomMat);
  legL.position.set(-0.11 * torsoWScale, LEG_HEIGHT / 2, 0);
  const legR = legL.clone();
  legR.position.x = 0.11 * torsoWScale;
  group.add(legL, legR);

  const torsoW = TORSO_WIDTH_BASE * torsoWScale;
  const torsoH = TORSO_HEIGHT_BASE * torsoHScale;
  const torsoD = TORSO_DEPTH_BASE * torsoDScale;
  const torsoY = LEG_HEIGHT + torsoH / 2;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW, torsoH, torsoD), topMat);
  torso.position.set(0, torsoY, 0);
  group.add(torso);

  const armLength = 0.62;
  const armGeo = new THREE.CylinderGeometry(0.06 * limbScale, 0.05 * limbScale, armLength, 10);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-(torsoW / 2 + 0.05 * limbScale), torsoY + 0.04, 0);
  const armR = armL.clone();
  armR.position.x = torsoW / 2 + 0.05 * limbScale;
  group.add(armL, armR);

  const headY = LEG_HEIGHT + torsoH + HEAD_RADIUS;
  const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS, 20, 20), skinMat);
  head.position.set(0, headY, 0);
  group.add(head);

  let hairMesh = null;
  if (config.hair_style !== "none") {
    hairMesh = addHair(group, config.hair_style, hairMat, headY);
  }

  addAccessory(group, config.accessory, { headY, torsoY, torsoW, torsoH });

  const totalHeight = headY + HEAD_RADIUS;
  const mediaRequests = [];

  if (config.body_cutout_url) {
    // Full-body cutout replaces the entire primitive figure with one
    // front-facing image plane, scaled to the avatar's overall height.
    [legL, legR, torso, armL, armR, head].forEach((mesh) => { mesh.visible = false; });
    if (hairMesh) hairMesh.visible = false;
    const plane = addCutoutPlane(group, totalHeight * 0.6, totalHeight, totalHeight / 2, torsoD / 2 + 0.01);
    mediaRequests.push({ kind: "image", mesh: plane, url: config.body_cutout_url });
  } else if (config.face_cutout_url) {
    // Selfie cutout sits on a proportioned, customizable body.
    head.visible = false;
    if (hairMesh) hairMesh.visible = false;
    const plane = addCutoutPlane(group, HEAD_RADIUS * 2.1, HEAD_RADIUS * 2.4, headY, HEAD_RADIUS * 0.95);
    mediaRequests.push({ kind: "image", mesh: plane, url: config.face_cutout_url });
  }

  group.scale.setScalar(heightScale);
  group.userData.eyeHeight = (headY - HEAD_RADIUS * 0.15) * heightScale;
  group.userData.totalHeight = totalHeight * heightScale;

  return { group, mediaRequests, eyeHeight: group.userData.eyeHeight, totalHeight: group.userData.totalHeight };
}

// Applies a loaded texture (face/body cutout) to a media-request mesh,
// preserving its aspect ratio within the configured base height.
export function applyAvatarCutoutTexture(mesh, texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  mesh.material.map = texture;
  mesh.material.color.set(0xffffff);
  mesh.material.needsUpdate = true;
  const baseHeight = mesh.userData.spriteBaseHeight;
  if (baseHeight && texture.image?.width && texture.image?.height) {
    const aspect = texture.image.width / texture.image.height;
    mesh.scale.set(baseHeight * aspect, baseHeight, 1);
  }
}

// Third-person follow-camera offset: pulls the camera back along the look
// direction (yaw + pitch) and up slightly, so the avatar stays in frame.
export function getThirdPersonOffset(yaw, pitch, distance = 2.4, heightOffset = 0.55) {
  const cosPitch = Math.cos(pitch);
  const forward = new THREE.Vector3(-Math.sin(yaw) * cosPitch, Math.sin(pitch), -Math.cos(yaw) * cosPitch);
  return forward.multiplyScalar(-distance).add(new THREE.Vector3(0, heightOffset, 0));
}
