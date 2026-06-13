import { describe, it, expect } from "vitest";
import {
  buildSampleWorldConfig,
  computeThreeDWorldWarnings,
  createThreeDWorldConfig,
  evaluatePublishChecklist,
  getThreeDWorldPublishErrors,
} from "@/lib/three-d-world-validation";

function makeDoor(overrides = {}) {
  return { id: "door_1", type: "door", title: "Exit", destinationRoomId: "room_lobby", position: { x: 4, y: 0, z: 4 }, ...overrides };
}

describe("computeThreeDWorldWarnings", () => {
  it("does not flag the sample world's room_-prefixed destinations as broken links", () => {
    const config = buildSampleWorldConfig();
    const siblingRooms = [{ id: "abc-1", room_key: "room1" }];
    const warnings = computeThreeDWorldWarnings(config, siblingRooms);
    expect(warnings.filter((warning) => warning.id === "broken_door_link")).toEqual([]);
  });

  it("requires an unlock condition on locked doors", () => {
    const config = createThreeDWorldConfig({ objects: [makeDoor({ locked: true, unlockCondition: "" })] });
    const warnings = computeThreeDWorldWarnings(config, []);
    expect(warnings.some((warning) => warning.id === "broken_door_link" && warning.severity === "required")).toBe(true);
  });

  it("flags a blocked custom spawn point as required", () => {
    const config = createThreeDWorldConfig({
      spawnPoint: "custom_xyz",
      spawnPointCustom: { x: 0, y: 0, z: -3 },
      objects: [makeDoor(), { id: "panel", type: "text_panel", title: "Panel", position: { x: 0, y: 1, z: -3 } }],
    });
    const warnings = computeThreeDWorldWarnings(config, []);
    expect(warnings.some((warning) => warning.id === "spawn_blocked" && warning.severity === "required")).toBe(true);
  });

  it("flags a blocked named spawn point as recommended only", () => {
    const config = createThreeDWorldConfig({
      spawnPoint: "front_center",
      objects: [makeDoor(), { id: "panel", type: "text_panel", title: "Panel", position: { x: 0, y: 1, z: 0 } }],
    });
    const warnings = computeThreeDWorldWarnings(config, []);
    const spawn = warnings.filter((warning) => warning.id === "spawn_blocked");
    expect(spawn).toHaveLength(1);
    expect(spawn[0].severity).toBe("recommended");
  });

  it("does not flag an unblocked named spawn point", () => {
    const config = createThreeDWorldConfig({ spawnPoint: "front_center", objects: [makeDoor()] });
    const warnings = computeThreeDWorldWarnings(config, []);
    expect(warnings.some((warning) => warning.id === "spawn_blocked")).toBe(false);
  });
});

describe("evaluatePublishChecklist", () => {
  it("fails has_spawn_point when a required spawn_blocked warning is active", () => {
    const config = createThreeDWorldConfig({
      selectedTemplate: "portal_room",
      spawnPoint: "custom_xyz",
      spawnPointCustom: { x: 0, y: 0, z: -3 },
      previewChecked: true,
      objects: [makeDoor(), { id: "panel", type: "text_panel", title: "Panel", position: { x: 0, y: 1, z: -3 } }],
    });
    const checklist = evaluatePublishChecklist(config, []);
    const spawnItem = checklist.results.find((item) => item.id === "has_spawn_point");
    expect(spawnItem.passed).toBe(false);
    expect(checklist.canPublish).toBe(false);
  });

  it("can publish a clean configured world once preview is checked", () => {
    const config = createThreeDWorldConfig({
      selectedTemplate: "portal_room",
      previewChecked: true,
      objects: [makeDoor()],
    });
    const checklist = evaluatePublishChecklist(config, []);
    expect(checklist.requiredFailures).toEqual([]);
    expect(checklist.canPublish).toBe(true);
  });
});

describe("getThreeDWorldPublishErrors", () => {
  it("blocks publish for an unconfigured 3D world room", () => {
    const rooms = [{ page_type: "three_d_world", room_key: "world1" }];
    const errors = getThreeDWorldPublishErrors(rooms);
    expect(errors.some((error) => error.includes("world1"))).toBe(true);
  });

  it("passes a fully configured 3D world room", () => {
    const config = createThreeDWorldConfig({ selectedTemplate: "portal_room", previewChecked: true, objects: [makeDoor()] });
    const rooms = [{ page_type: "three_d_world", room_key: "world1", threeDWorldConfig: config }];
    expect(getThreeDWorldPublishErrors(rooms)).toEqual([]);
  });
});
