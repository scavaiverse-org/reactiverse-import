import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { X, ChevronLeft, ChevronRight, Play, Pause, Trophy, Gift, MessageCircle, ShoppingBag, Compass, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import { getThreeDWorldConfig } from "@/lib/three-d-world-validation";
import { getWorldTemplate, getMoodPreset } from "@/lib/three-d-world-seed";
import { getSafeMediaUrl, getSafeNavigationUrl } from "@/lib/walkthrough-media-url";
import {
  EYE_HEIGHT, titleCase, resolveColor, getRoomDimensions, getSurfaceVisuals, resolveMoodVisuals,
  buildRoomShell, buildLighting, buildObjectGroup, OBJECT_ICONS, objectLabelText,
  getSpawnPosition, getStations, clampToRoom, isDoorUnlocked, createCanvasTexture,
} from "@/lib/three-d-world-render-helpers";

const GROUND_MODES = new Set(["free_walk", "click_to_move", "click_to_move_guided"]);
const TOUR_MODES = new Set(["guided_walkthrough", "auto_walkthrough", "fixed_view_guided"]);
const MOVE_SPEED = 2.6;
const STATION_DWELL_SECONDS = 6;

function isObjectUnlocked(object, collectedIds, collectibles) {
  if (!object.lockCondition) return true;
  return isDoorUnlocked({ id: object.id, locked: true, unlockCondition: object.lockCondition }, collectedIds, collectibles);
}

function unlockHint(condition = "") {
  const hint = String(condition || "").replace(/^visitor_collects_/, "").replace(/_/g, " ").trim();
  return hint ? `Find ${titleCase(hint)} to unlock this.` : "This is locked for now.";
}

// Object types that visitors can click for an interaction; everything else
// (light_source, direction_sign decoration) is purely environmental.
const INTERACTIVE_TYPES = new Set([
  "image_frame", "video_wall", "audio_point", "text_panel", "artifact_display", "memory_capsule",
  "door", "portal", "product_booth", "npc_guide", "quiz_station", "collectible", "floating_button", "direction_sign",
]);

function FallbackWorld({ room }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-24">
      <div className="max-w-md rounded-2xl border border-white/10 bg-background/70 p-8 text-center backdrop-blur-xl">
        <Box className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">{room?.title || "3D World"}</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">This 3D World room has not been built yet. Check back soon.</p>
      </div>
    </div>
  );
}

export default function ThreeDWorldRoom({ room, context = {} }) {
  const config = getThreeDWorldConfig(room);
  const mountRef = useRef(null);
  const [hud, setHud] = useState({
    score: 0,
    collectedCount: 0,
    totalCollectibles: 0,
    questSteps: [],
    badges: [],
    completionReward: "",
    allCollected: false,
  });
  const [panel, setPanel] = useState(null);
  const [dialogue, setDialogue] = useState(null);
  const [toast, setToast] = useState(null);
  const [tour, setTour] = useState({ active: false, index: 0, playing: false, stations: [], label: "" });
  const [transitioning, setTransitioning] = useState(false);
  const [joystickActive, setJoystickActive] = useState(false);
  const engineRef = useRef({});

  const reduceFx = !!(context.reducedMotion || context.calmMode);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!config) return undefined;
    const mount = mountRef.current;
    if (!mount) return undefined;

    const dims = getRoomDimensions(config);
    const surfaces = getSurfaceVisuals(config);
    const mood = resolveMoodVisuals(config);
    const template = getWorldTemplate(config.selectedTemplate);
    const gamification = config.gamification || {};
    const collectibles = gamification.collectibles || [];
    const movementMode = config.movementMode || "click_to_move";
    const isGroundMode = GROUND_MODES.has(movementMode);
    const isTourMode = TOUR_MODES.has(movementMode);
    const stations = getStations(config, dims);

    // -- Scene / camera / renderer -----------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(mood.skyColor);
    if (mood.fogDensity > 0) scene.fog = new THREE.FogExp2(mood.fogColor, mood.fogDensity);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camera.rotation.order = "YXZ";
    const spawn = getSpawnPosition(config, dims);
    camera.position.set(spawn.x, spawn.y, spawn.z);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const shell = buildRoomShell(dims, surfaces, (config.zones || []).length);
    scene.add(shell.group);
    buildLighting(mood, dims).forEach((light) => scene.add(light));

    if (mood.glowIntensity > 0) {
      const accentGlow = new THREE.PointLight(mood.accentColor, mood.glowIntensity * 2, dims.depth);
      accentGlow.position.set(0, dims.height * 0.7, -dims.depth * 0.35);
      scene.add(accentGlow);
    }

    // Guided path: a soft line connecting tour stations along the floor.
    if (config.guidedPathEnabled || movementMode === "click_to_move_guided") {
      const points = stations.map((station) => new THREE.Vector3(station.position.x, 0.03, station.position.z));
      if (points.length > 1) {
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const pathLine = new THREE.Line(pathGeometry, new THREE.LineBasicMaterial({ color: mood.accentColor, transparent: true, opacity: 0.5 }));
        scene.add(pathLine);
      }
    }

    // -- Audio listener -------------------------------------------------------
    const listener = new THREE.AudioListener();
    camera.add(listener);
    scene.add(camera);
    const audioLoader = new THREE.AudioLoader();
    const positionalSounds = [];

    // -- Object placement ------------------------------------------------------
    const objectGroups = new Map();
    const interactiveGroups = [];
    const animatedEntries = [];
    const pulseQueue = [];
    const textureResources = [];
    const videoResources = [];
    const collectedIds = new Set();
    const quizCorrect = new Set();
    const shownZones = new Set();
    let questDialogueShown = false;
    let zoneDialogueShown = false;

    const isMobile = mount.clientWidth < 768;
    const rules = config.performanceSettings || {};
    const templateLimit = template?.recommendedObjectLimit || 80;
    const objectLimit = isMobile ? Math.min(Number(rules.maxObjectsMobile) || 40, templateLimit) : Math.max(Number(rules.maxObjectsDesktop) || 80, templateLimit);

    const placeObject = (object) => {
      const result = buildObjectGroup(object);
      if (!result) return null;
      const { group } = result;
      const position = object.position || {};
      const rotation = object.rotation || {};
      const scale = object.scale || {};
      group.position.set(Number(position.x) || 0, Number(position.y) || 0, Number(position.z) || 0);
      group.rotation.set(
        THREE.MathUtils.degToRad(Number(rotation.x) || 0),
        THREE.MathUtils.degToRad(Number(rotation.y) || 0),
        THREE.MathUtils.degToRad(Number(rotation.z) || 0)
      );
      group.scale.set(Number(scale.x) || 1, Number(scale.y) || 1, Number(scale.z) || 1);
      group.userData.baseScale = group.scale.clone();
      scene.add(group);
      objectGroups.set(object.id, group);
      if (result.interactive && INTERACTIVE_TYPES.has(object.type)) interactiveGroups.push(group);
      result.animated.forEach((entry) => animatedEntries.push({ ...entry, group, baseY: entry.mesh.position.y }));

      result.mediaRequests.forEach((request) => {
        if (request.kind === "image") {
          const safeUrl = getSafeMediaUrl(request.url);
          if (!safeUrl) return;
          new THREE.TextureLoader().load(safeUrl, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            request.mesh.material.map = texture;
            request.mesh.material.color.set(0xffffff);
            request.mesh.material.needsUpdate = true;
            textureResources.push(texture);
          });
        }
        if (request.kind === "video") {
          const safeUrl = getSafeMediaUrl(request.object.videoUrl);
          if (!safeUrl) return;
          const video = document.createElement("video");
          video.crossOrigin = "anonymous";
          video.src = safeUrl;
          video.loop = request.object.loop !== false;
          video.muted = request.object.mute !== false;
          video.playsInline = true;
          if (request.object.autoplay !== false) video.play().catch(() => {});
          const videoTexture = new THREE.VideoTexture(video);
          videoTexture.colorSpace = THREE.SRGBColorSpace;
          request.mesh.material.map = videoTexture;
          request.mesh.material.color.set(0xffffff);
          request.mesh.material.needsUpdate = true;
          textureResources.push(videoTexture);
          videoResources.push(video);
        }
      });

      if (object.type === "audio_point" && object.audioUrl) {
        const safeUrl = getSafeMediaUrl(object.audioUrl);
        if (safeUrl) {
          const sound = new THREE.PositionalAudio(listener);
          sound.setRefDistance(Math.max(1, Number(object.triggerRadius) || 2));
          sound.setLoop(object.loop !== false);
          sound.setVolume(0.5);
          group.add(sound);
          audioLoader.load(safeUrl, (buffer) => sound.setBuffer(buffer));
          positionalSounds.push({ sound, group, radius: Math.max(1, Number(object.triggerRadius) || 2) });
        }
      }

      return group;
    };

    const allObjects = (config.objects || []).filter((object) => object.visible !== false);
    const lockedObjects = [];
    let placedCount = 0;
    allObjects.forEach((object) => {
      if (placedCount >= objectLimit) return;
      if (!isObjectUnlocked(object, collectedIds, collectibles)) {
        lockedObjects.push(object);
        return;
      }
      if (placeObject(object)) placedCount += 1;
    });

    // -- Gamification HUD setup -----------------------------------------------
    const refreshGamificationHud = () => {
      const allCollected = collectibles.length > 0 && collectedIds.size >= collectibles.length;
      setHud({
        score: hudScore,
        collectedCount: collectedIds.size,
        totalCollectibles: collectibles.length,
        questSteps: gamification.questSteps || [],
        badges: allCollected ? (gamification.badges || []) : [],
        completionReward: allCollected ? gamification.completionReward || "" : "",
        allCollected,
      });
    };
    let hudScore = 0;
    if (gamification.enabled) refreshGamificationHud();

    // -- Door / portal lock visuals --------------------------------------------
    const refreshLockVisuals = (group) => {
      const object = group.userData.threeDObject;
      if (!object || (object.type !== "door" && object.type !== "portal")) return;
      const unlocked = isDoorUnlocked(object, collectedIds, collectibles);
      const colorKey = object.type === "door"
        ? (unlocked ? resolveColor(object.color, 0x4a3826) : 0x5c2222)
        : (unlocked ? resolveColor(object.color, 0x67e8f9) : 0xef4444);
      if (group.userData.panelMesh) {
        group.userData.panelMesh.material.color.setHex(colorKey);
        group.userData.panelMesh.material.emissive.setHex(colorKey);
      }
      if (group.userData.torusMesh) {
        group.userData.torusMesh.material.color.setHex(colorKey);
        group.userData.torusMesh.material.emissive.setHex(colorKey);
      }
      if (group.userData.discMesh) group.userData.discMesh.material.color.setHex(colorKey);
      if (group.userData.labelMesh) {
        const icon = unlocked ? OBJECT_ICONS[object.type] : "🔒";
        const oldMap = group.userData.labelMesh.material.map;
        const texture = createCanvasTexture(`${icon} ${objectLabelText(object) || titleCase(object.type)}`, {});
        group.userData.labelMesh.material.map = texture;
        group.userData.labelMesh.material.needsUpdate = true;
        oldMap?.dispose();
      }
    };

    // -- NPC dialogue ------------------------------------------------------------
    const npcConfig = config.npcGuide || {};
    const dialogueLines = (npcConfig.dialogueSteps?.length
      ? npcConfig.dialogueSteps.map((step) => (typeof step === "string" ? step : step.text || step.line || ""))
      : [npcConfig.openingLine, npcConfig.script].filter(Boolean)
    ).filter(Boolean);

    const openDialogue = () => {
      if (!npcConfig.enabled || !dialogueLines.length) return;
      setDialogue({ step: 0, lines: dialogueLines, name: npcConfig.npcType ? titleCase(npcConfig.npcType) : "Guide" });
    };

    if (npcConfig.triggerType === "on_room_start") {
      setTimeout(() => { if (!cancelled) openDialogue(); }, 900);
    }

    const checkQuestComplete = () => {
      if (questDialogueShown || npcConfig.triggerType !== "on_quest_complete") return;
      const totalQuiz = allObjects.filter((object) => object.type === "quiz_station").length;
      let complete = false;
      if (collectibles.length > 0) complete = collectedIds.size >= collectibles.length;
      else if (totalQuiz > 0) complete = quizCorrect.size >= totalQuiz;
      if (complete) {
        questDialogueShown = true;
        openDialogue();
      }
    };

    // -- Collecting items --------------------------------------------------------
    const collectItem = (object, group) => {
      if (collectedIds.has(object.id)) return;
      collectedIds.add(object.id);
      const matched = collectibles.find((entry) => entry.id === object.id || entry.name === object.title || entry.name === object.name);
      const points = Number(matched?.rewardPoints ?? object.rewardPoints) || 0;
      hudScore += points;
      if (group) {
        scene.remove(group);
        const index = interactiveGroups.indexOf(group);
        if (index >= 0) interactiveGroups.splice(index, 1);
      }
      setToast(`${OBJECT_ICONS.collectible} ${objectLabelText(object) || "Item"} collected${points ? ` (+${points} pts)` : ""}`);
      if (gamification.enabled) refreshGamificationHud();

      objectGroups.forEach((doorGroup) => refreshLockVisuals(doorGroup));

      lockedObjects.slice().forEach((pending) => {
        if (placedCount >= objectLimit) return;
        if (isObjectUnlocked(pending, collectedIds, collectibles)) {
          if (placeObject(pending)) {
            placedCount += 1;
            const removeIndex = lockedObjects.indexOf(pending);
            if (removeIndex >= 0) lockedObjects.splice(removeIndex, 1);
          }
        }
      });

      checkQuestComplete();
      context.track?.("three_d_world_collectible_collected", { room_id: room.id, object_id: object.id, points });
    };

    // -- Navigation -----------------------------------------------------------
    let cancelled = false;
    const navigateTo = (destinationRoomId) => {
      if (!destinationRoomId) return;
      setTransitioning(true);
      context.track?.("three_d_world_navigation", { room_id: room.id, destination: destinationRoomId });
      setTimeout(() => { if (!cancelled) context.goToRoom?.(destinationRoomId); }, 420);
    };

    const tryNavigation = (object, group) => {
      const unlocked = isDoorUnlocked(object, collectedIds, collectibles);
      if (!unlocked) {
        setToast(`${OBJECT_ICONS.door} ${unlockHint(object.unlockCondition)}`);
        refreshLockVisuals(group);
        return;
      }
      navigateTo(object.destinationRoomId);
    };

    // -- Click action dispatch -----------------------------------------------
    const runClickAction = (object, group, action) => {
      switch (action) {
        case "go_to_room":
          navigateTo(object.destinationRoomId);
          return;
        case "open_external_link": {
          const url = getSafeNavigationUrl(object.linkUrl || object.targetUrl || object.mediaUrl);
          if (url) window.open(url, "_blank", "noopener,noreferrer");
          return;
        }
        case "play_audio":
          setPanel({ type: "audio", object });
          return;
        case "play_video":
          setPanel({ type: "video", object });
          return;
        case "collect_item":
          collectItem(object, group);
          return;
        case "start_quiz":
          if (object.question) setPanel({ type: "quiz", object });
          return;
        case "unlock_door":
          setToast("Conditions met — connected doors will unlock as you progress.");
          return;
        case "trigger_animation":
          pulseQueue.push({ group, start: clock.getElapsedTime(), duration: 0.6 });
          return;
        case "show_story":
          setPanel({ type: "story", object });
          return;
        case "open_popup":
        default:
          setPanel({ type: "info", object });
      }
    };

    const handleInteraction = (group) => {
      const object = group.userData.threeDObject || {};
      switch (object.type) {
        case "door":
        case "portal":
          tryNavigation(object, group);
          return;
        case "collectible":
          collectItem(object, group);
          return;
        case "quiz_station":
          if (object.question) setPanel({ type: "quiz", object });
          return;
        case "npc_guide":
          if (npcConfig.enabled && dialogueLines.length) openDialogue();
          else setPanel({ type: "info", object });
          return;
        case "product_booth":
          setPanel({ type: "product", object });
          return;
        case "floating_button":
          runClickAction(object, group, object.actionType || object.clickAction);
          return;
        default:
          runClickAction(object, group, object.clickAction);
      }
    };

    // -- Movement & camera ------------------------------------------------------
    let yaw = spawn.yaw || 0;
    let pitch = 0;
    camera.rotation.set(pitch, yaw, 0);

    const keys = new Set();
    const moveVector = { x: 0, y: 0 };
    let moveTarget = null;
    let pointerDown = false;
    let moved = false;
    let lastX = 0;
    let lastY = 0;

    let tourIndex = 0;
    let tourPlaying = movementMode === "auto_walkthrough" && !reduceFx;
    let tourActive = isTourMode;
    let dwellTimer = 0;
    const lookTarget = stations.length
      ? new THREE.Vector3(stations[0].lookAt.x, stations[0].lookAt.y, stations[0].lookAt.z)
      : new THREE.Vector3(0, EYE_HEIGHT, -dims.depth / 2);

    if (isTourMode && stations.length) {
      camera.position.set(stations[0].position.x, stations[0].position.y, stations[0].position.z);
      setTour({ active: true, index: 0, playing: tourPlaying, stations: stations.map((s) => s.name), label: stations[0].name });
    }

    const setTourIndex = (index) => {
      tourIndex = Math.max(0, Math.min(stations.length - 1, index));
      dwellTimer = 0;
      setTour((prev) => ({ ...prev, index: tourIndex, label: stations[tourIndex]?.name || "" }));
    };
    const toggleTourPlaying = () => {
      tourPlaying = !tourPlaying;
      setTour((prev) => ({ ...prev, playing: tourPlaying }));
    };
    const toggleAutoTour = () => {
      tourActive = !tourActive;
      if (tourActive) {
        tourIndex = 0;
        dwellTimer = 0;
        tourPlaying = true;
        setTour({ active: true, index: 0, playing: true, stations: stations.map((s) => s.name), label: stations[0]?.name || "" });
      } else {
        setTour({ active: false, index: 0, playing: false, stations: [], label: "" });
      }
    };
    engineRef.current = { setTourIndex, toggleTourPlaying, toggleAutoTour };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const setPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (event) => {
      pointerDown = true;
      moved = false;
      lastX = event.clientX;
      lastY = event.clientY;
      listener.context.resume?.();
    };

    const onPointerMove = (event) => {
      if (!pointerDown || !isGroundMode) return;
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) moved = true;
      yaw -= deltaX * 0.0035;
      pitch = Math.max(-1.0, Math.min(1.0, pitch - deltaY * 0.0035));
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const onPointerUp = (event) => {
      if (!pointerDown) return;
      pointerDown = false;
      if (moved) return;
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactiveGroups, true);
      if (hits.length) {
        let target = hits[0].object;
        while (target && !target.userData?.interactive) target = target.parent;
        if (target) {
          handleInteraction(target);
          return;
        }
      }
      if (isGroundMode && (movementMode === "click_to_move" || movementMode === "click_to_move_guided")) {
        const floorHit = raycaster.intersectObject(shell.floorMesh, false)[0];
        if (floorHit) {
          const clamped = clampToRoom(floorHit.point.x, floorHit.point.z, dims, 0.5);
          moveTarget = clamped;
        }
      }
    };

    const onKeyDown = (event) => keys.add(event.key.toLowerCase());
    const onKeyUp = (event) => keys.delete(event.key.toLowerCase());

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // -- Joystick (mobile free movement) -----------------------------------------
    const isMobileControls = isGroundMode && config.mobileControls !== false && isMobile;
    setJoystickActive(isMobileControls);
    const onJoystickMove = (event) => { moveVector.x = event.detail?.x || 0; moveVector.y = event.detail?.y || 0; };
    window.addEventListener("three-d-world-joystick", onJoystickMove);

    // -- Resize -----------------------------------------------------------------
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // -- Animation loop -----------------------------------------------------------
    const clock = new THREE.Clock();
    let animationFrame;
    const animate = () => {
      const delta = Math.min(0.05, clock.getDelta());
      const elapsed = clock.getElapsedTime();

      if (!reduceFx) {
        animatedEntries.forEach((entry) => {
          const { mesh, type, baseY, group } = entry;
          switch (type) {
            case "spin": mesh.rotation.y += delta * 0.6; break;
            case "rotate": mesh.rotation.y += delta * 0.35; break;
            case "bob": mesh.position.y = baseY + Math.sin(elapsed * 1.6 + group.id) * 0.08; break;
            case "pulse": {
              const scale = 1 + Math.sin(elapsed * 2.4 + group.id) * 0.12;
              mesh.scale.setScalar(scale);
              break;
            }
            case "sway": mesh.rotation.z = Math.sin(elapsed * 1.1 + group.id) * 0.06; break;
            default: break;
          }
        });
      }

      for (let i = pulseQueue.length - 1; i >= 0; i -= 1) {
        const entry = pulseQueue[i];
        const t = (elapsed - entry.start) / entry.duration;
        if (t >= 1) {
          entry.group.scale.copy(entry.group.userData.baseScale);
          pulseQueue.splice(i, 1);
        } else {
          const factor = 1 + Math.sin(t * Math.PI) * 0.18;
          entry.group.scale.copy(entry.group.userData.baseScale).multiplyScalar(factor);
        }
      }

      positionalSounds.forEach(({ sound, group, radius }) => {
        if (!sound.buffer) return;
        const distance = camera.position.distanceTo(group.position);
        if (distance < radius && !sound.isPlaying) sound.play();
        else if (distance >= radius * 1.4 && sound.isPlaying) sound.stop();
      });

      if (isTourMode || tourActive) {
        const station = stations[tourIndex];
        if (station) {
          camera.position.lerp(new THREE.Vector3(station.position.x, station.position.y, station.position.z), 0.04);
          lookTarget.lerp(new THREE.Vector3(station.lookAt.x, station.lookAt.y, station.lookAt.z), 0.04);
          const direction = lookTarget.clone().sub(camera.position);
          if (direction.lengthSq() > 0.0001) {
            yaw = Math.atan2(-direction.x, -direction.z);
            pitch = Math.max(-1, Math.min(1, Math.atan2(direction.y, Math.hypot(direction.x, direction.z))));
          }
          if (tourPlaying && (movementMode === "auto_walkthrough" || tourActive) && stations.length > 1) {
            dwellTimer += delta;
            if (dwellTimer >= STATION_DWELL_SECONDS) {
              dwellTimer = 0;
              setTourIndex((tourIndex + 1) % stations.length);
            }
          }
        }
      } else if (isGroundMode) {
        const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        let move = new THREE.Vector3();
        if (keys.has("w") || keys.has("arrowup")) move.add(forward);
        if (keys.has("s") || keys.has("arrowdown")) move.sub(forward);
        if (keys.has("a") || keys.has("arrowleft")) move.sub(right);
        if (keys.has("d") || keys.has("arrowright")) move.add(right);
        if (moveVector.x || moveVector.y) {
          move.add(forward.clone().multiplyScalar(-moveVector.y));
          move.add(right.clone().multiplyScalar(moveVector.x));
        }
        if (move.lengthSq() > 0) {
          move.normalize().multiplyScalar(MOVE_SPEED * delta);
          moveTarget = null;
          const next = clampToRoom(camera.position.x + move.x, camera.position.z + move.z, dims, 0.5);
          camera.position.x = next.x;
          camera.position.z = next.z;
        } else if (moveTarget) {
          const dx = moveTarget.x - camera.position.x;
          const dz = moveTarget.z - camera.position.z;
          const distance = Math.hypot(dx, dz);
          if (distance < 0.08) {
            moveTarget = null;
          } else {
            const step = Math.min(MOVE_SPEED * delta, distance);
            camera.position.x += (dx / distance) * step;
            camera.position.z += (dz / distance) * step;
          }
        }
        camera.position.y = EYE_HEIGHT;
        camera.rotation.set(pitch, yaw, 0);

        if (npcConfig.triggerType === "on_zone_enter" && !zoneDialogueShown) {
          stations.forEach((station, index) => {
            const distance = Math.hypot(camera.position.x - station.position.x, camera.position.z - station.position.z);
            if (distance < 1.6 && !shownZones.has(station.id)) {
              shownZones.add(station.id);
              if (index === 0 || shownZones.size === stations.length) return;
              zoneDialogueShown = true;
              openDialogue();
            }
          });
        }
      } else {
        camera.rotation.set(pitch, yaw, 0);
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("three-d-world-joystick", onJoystickMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      videoResources.forEach((video) => { video.pause(); video.src = ""; });
      textureResources.forEach((texture) => texture.dispose());
      positionalSounds.forEach(({ sound }) => { if (sound.isPlaying) sound.stop(); });
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (material.map && !textureResources.includes(material.map)) material.map.dispose?.();
            material.dispose?.();
          });
        }
      });
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [room?.id]);

  if (!config) return <FallbackWorld room={room} />;

  const gamification = config.gamification || {};
  const template = getWorldTemplate(config.selectedTemplate);
  const mood = getMoodPreset(config.moodPreset);
  const movementMode = config.movementMode || "click_to_move";
  const isGroundMode = GROUND_MODES.has(movementMode);
  const showAutoTourToggle = isGroundMode && config.autoWalkthroughEnabled;

  const closePanel = () => setPanel(null);
  const closeDialogue = () => setDialogue(null);
  const advanceDialogue = () => {
    if (!dialogue) return;
    if (dialogue.step + 1 >= dialogue.lines.length) { setDialogue(null); return; }
    setDialogue({ ...dialogue, step: dialogue.step + 1 });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div ref={mountRef} className="absolute inset-0 touch-none" />

      <div className={`pointer-events-none fixed inset-0 z-30 bg-black transition-opacity duration-500 ${transitioning ? "opacity-100" : "opacity-0"}`} />

      <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-2 sm:left-6 sm:top-6">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-background/60 px-3 py-1.5 text-xs backdrop-blur-xl">
          <Box className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold">{room.title || template?.name || "3D World"}</span>
          {mood && <span className="text-muted-foreground">· {mood.name}</span>}
        </div>
        {room.narration && (
          <div className="pointer-events-auto max-w-xs rounded-2xl border border-white/10 bg-background/50 p-3 text-xs leading-6 text-foreground/80 backdrop-blur-xl">
            {room.narration}
          </div>
        )}
      </div>

      {gamification.enabled && (
        <div className="pointer-events-auto absolute right-4 top-4 z-10 w-56 rounded-2xl border border-white/15 bg-background/65 p-3 text-xs backdrop-blur-xl sm:right-6 sm:top-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold"><Trophy className="h-3.5 w-3.5 text-amber-300" /> Score</span>
            <span className="font-bold text-foreground">{hud.score}</span>
          </div>
          {hud.totalCollectibles > 0 && (
            <div className="mt-2 flex items-center justify-between text-muted-foreground">
              <span>{OBJECT_ICONS.collectible} Collectibles</span>
              <span>{hud.collectedCount} / {hud.totalCollectibles}</span>
            </div>
          )}
          {hud.questSteps.length > 0 && (
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {hud.questSteps.map((step, index) => (
                <li key={step.id || index} className="flex items-start gap-1.5"><span className="mt-0.5">{hud.allCollected ? "✅" : "•"}</span><span>{step.label || step.title || step}</span></li>
              ))}
            </ul>
          )}
          {hud.allCollected && (
            <div className="mt-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-2 text-emerald-200">
              <p className="flex items-center gap-1.5 font-semibold"><Gift className="h-3.5 w-3.5" /> Quest complete!</p>
              {hud.completionReward && <p className="mt-1">{hud.completionReward}</p>}
              {hud.badges.map((badge, index) => <p key={index} className="mt-1">{badge.name || badge}</p>)}
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-20 max-w-sm -translate-x-1/2 rounded-full border border-white/15 bg-background/80 px-4 py-2 text-center text-xs font-medium text-foreground shadow-xl backdrop-blur-xl">
          {toast}
        </div>
      )}

      {tour.active && tour.stations.length > 0 && (
        <div className="pointer-events-auto absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-background/70 px-3 py-2 backdrop-blur-xl sm:bottom-28">
          <div className="flex items-center gap-2 text-xs">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => engineRef.current.setTourIndex?.(tour.index - 1)} disabled={tour.index === 0}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <span className="min-w-24 text-center font-semibold">{tour.label}</span>
            {movementMode === "auto_walkthrough" ? (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => engineRef.current.toggleTourPlaying?.()}>{tour.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</Button>
            ) : (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => engineRef.current.setTourIndex?.(tour.index + 1)} disabled={tour.index >= tour.stations.length - 1}><ChevronRight className="h-3.5 w-3.5" /></Button>
            )}
          </div>
        </div>
      )}

      {showAutoTourToggle && (
        <div className="pointer-events-auto absolute bottom-24 right-4 z-10 sm:bottom-28 sm:right-6">
          <Button size="sm" variant="outline" className="bg-background/70 backdrop-blur-xl" onClick={() => engineRef.current.toggleAutoTour?.()}>
            <Compass className="h-4 w-4" /> {tour.active ? "Exit Tour" : "Auto Tour"}
          </Button>
        </div>
      )}

      {joystickActive && <Joystick />}

      {dialogue && (
        <div className="pointer-events-auto absolute inset-x-4 bottom-24 z-20 mx-auto max-w-md rounded-2xl border border-white/15 bg-background/90 p-4 shadow-2xl backdrop-blur-xl sm:bottom-28">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary"><MessageCircle className="h-3.5 w-3.5" /> {dialogue.name}</p>
            <button onClick={closeDialogue} className="rounded-full p-1 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary"><X className="h-3.5 w-3.5" /></button>
          </div>
          <p className="mt-2 text-sm leading-7 text-foreground/85">{dialogue.lines[dialogue.step]}</p>
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={advanceDialogue}>{dialogue.step + 1 >= dialogue.lines.length ? "Got it" : "Next"}</Button>
          </div>
        </div>
      )}

      {panel && <ObjectPanel panel={panel} onClose={closePanel} onSubmitQuiz={(object, correct, reward) => {
        if (correct) setToast(`✅ Correct!${reward ? ` +${reward} pts` : ""}`);
        else setToast("❌ Not quite — try again.");
      }} />}
    </div>
  );
}

function Joystick() {
  const baseRef = useRef(null);
  const activeRef = useRef(false);
  const originRef = useRef({ x: 0, y: 0 });

  const emit = (x, y) => window.dispatchEvent(new CustomEvent("three-d-world-joystick", { detail: { x, y } }));

  const onPointerDown = () => {
    activeRef.current = true;
    const rect = baseRef.current.getBoundingClientRect();
    originRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };
  const onPointerMove = (event) => {
    if (!activeRef.current) return;
    const dx = event.clientX - originRef.current.x;
    const dy = event.clientY - originRef.current.y;
    const max = 36;
    const clampedX = Math.max(-max, Math.min(max, dx));
    const clampedY = Math.max(-max, Math.min(max, dy));
    emit(clampedX / max, clampedY / max);
  };
  const onPointerUp = () => {
    activeRef.current = false;
    emit(0, 0);
  };

  return (
    <div
      ref={baseRef}
      className="pointer-events-auto absolute bottom-24 left-4 z-10 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-background/40 backdrop-blur-xl sm:bottom-28 sm:left-6"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div className="h-10 w-10 rounded-full border border-white/30 bg-white/15" />
    </div>
  );
}

function ObjectPanel({ panel, onClose, onSubmitQuiz }) {
  const { type, object } = panel;
  const [selected, setSelected] = useState(null);
  const title = objectLabelText(object) || titleCase(object.type || "Details");

  const submitQuiz = () => {
    const correctIndex = typeof object.correctAnswer === "number" ? object.correctAnswer : null;
    const isCorrect = correctIndex != null
      ? selected === correctIndex
      : String(selected) === String(object.correctAnswer);
    onSubmitQuiz(object, isCorrect, isCorrect ? Number(object.reward) || 0 : 0);
    if (isCorrect) onClose();
  };

  let body = null;
  if (type === "quiz") {
    body = (
      <div className="space-y-2">
        <p className="text-sm leading-6 text-foreground/85">{object.question}</p>
        <div className="space-y-1.5">
          {(object.answers || []).map((answer, index) => (
            <button
              key={index}
              onClick={() => setSelected(index)}
              className={`block w-full rounded-lg border px-3 py-2 text-left text-xs transition ${selected === index ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-white/5 hover:border-primary/40"}`}
            >
              {answer}
            </button>
          ))}
        </div>
        <Button size="sm" disabled={selected == null} onClick={submitQuiz}>Submit</Button>
      </div>
    );
  } else if (type === "product") {
    const linkUrl = getSafeNavigationUrl(object.linkUrl);
    body = (
      <div className="space-y-3">
        {object.imageUrl && <ResolvedMedia url={object.imageUrl} mediaType="image" alt={object.productName || "Product"} className="h-40 w-full rounded-xl object-cover" fallbackVisual fallbackCompact />}
        <p className="text-xs uppercase tracking-widest text-primary">{object.brandName}</p>
        <p className="text-sm font-semibold">{object.productName}</p>
        {object.price && <p className="text-sm text-foreground/80">{object.price}</p>}
        {linkUrl && <a href={linkUrl} target="_blank" rel="noreferrer"><Button size="sm"><ShoppingBag className="h-3.5 w-3.5" /> {object.ctaText || "View"}</Button></a>}
      </div>
    );
  } else if (type === "audio") {
    body = (
      <div className="space-y-2">
        <ResolvedMedia url={object.audioUrl} mediaType="audio" alt={title} className="w-full" controls />
        {object.transcript && <p className="text-xs leading-6 text-muted-foreground">{object.transcript}</p>}
      </div>
    );
  } else if (type === "video") {
    body = <ResolvedMedia url={object.videoUrl} mediaType="video" alt={title} className="aspect-video w-full rounded-xl" controls fallbackVisual fallbackCompact />;
  } else if (type === "story") {
    body = <p className="text-sm leading-7 text-foreground/85">{object.story || object.body || object.description || "No story configured for this item yet."}</p>;
  } else {
    const mediaUrl = object.imageUrl || object.videoUrl || object.mediaUrl || object.modelUrl;
    body = (
      <div className="space-y-3">
        {mediaUrl && <ResolvedMedia url={mediaUrl} mediaType={object.videoUrl ? "video" : "image"} alt={title} className="max-h-56 w-full rounded-xl object-cover" controls fallbackVisual fallbackCompact />}
        <p className="text-sm leading-7 text-foreground/85">{object.description || object.body || object.story || "No details configured for this item yet."}</p>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto fixed inset-x-4 bottom-24 z-30 mx-auto max-w-md rounded-3xl border border-white/15 bg-background/90 p-5 shadow-2xl backdrop-blur-xl sm:bottom-28">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-3">{body}</div>
    </div>
  );
}
