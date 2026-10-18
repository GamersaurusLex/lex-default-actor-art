import assert from "node:assert/strict";
import { test } from "node:test";

const listeners = new Map();
const settings = new Map();
globalThis.Hooks = { once: (name, fn) => listeners.set(name, fn), on: (name, fn) => listeners.set(name, fn) };
globalThis.CONST = { DEFAULT_TOKEN: "icons/svg/mystery-man.svg" };
globalThis.CONFIG = { Actor: { typeLabels: { loot: "Loot", npc: "NPC" } } };
globalThis.foundry = { data: { fields: { FilePathField: class { constructor(options) { this.options = options; } } } } };
globalThis.game = { i18n: { localize: x => x }, settings: {
  register: (_id, key, config) => settings.set(key, config.default),
  get: (_id, key) => settings.get(key)
} };
class TestActor {
  static TYPES = ["loot", "npc"];
  static DEFAULT_ICON = CONST.DEFAULT_TOKEN;
  static getDefaultArtwork({ type, img }) {
    const path = img ?? `systems/test/${type}.svg`;
    return { img: path, texture: { src: path } };
  }
  constructor(type = "loot", img = `systems/test/${type}.svg`, token = img) {
    this.type = type; this.img = img; this.prototypeToken = { texture: { src: token } }; this.updates = [];
  }
  updateSource(patch) { this.updates.push(patch); }
}
globalThis.Actor = { implementation: TestActor };
const { MODULE_ID, LOOT_ART, applyDefaultArt } = await import("../scripts/main.mjs");
listeners.get("setup")();

test("native settings and creation-only artwork safety", () => {
  assert.equal(settings.size, 4);
  assert.equal(listeners.size, 2, "no update/ready handlers or migrations");
  assert.equal(listeners.get("preCreateActor"), applyDefaultArt);
  const make = (data = {}, img, token, options) => {
    const actor = new TestActor(data.type ?? "loot", img, token);
    applyDefaultArt(actor, data, options);
    return actor.updates;
  };
  assert.deepEqual(make(), [{ img: LOOT_ART.avatar, "prototypeToken.texture.src": LOOT_ART.token }]);
  assert.deepEqual(make({ img: "custom.webp" }, "custom.webp", "custom-token.webp"), []);
  assert.deepEqual(make({}, "custom.webp", "systems/test/loot.svg"), [{ "prototypeToken.texture.src": LOOT_ART.token }]);
  assert.deepEqual(make({ prototypeToken: { texture: { src: "custom.webp" } } }), [{ img: LOOT_ART.avatar }]);
  assert.deepEqual(make({ img: "custom.webp" }), [{ "prototypeToken.texture.src": LOOT_ART.token }]);
  assert.deepEqual(make({ _stats: { compendiumSource: "Compendium.test.actors.x" } }), []);
  assert.deepEqual(make({ _stats: { duplicateSource: "Actor.x" } }), []);
  assert.deepEqual(make({ flags: { core: { sourceId: "Compendium.test.actors.x" } } }), []);
  assert.deepEqual(make({}, undefined, undefined, { pack: "world.actors" }), []);
  assert.deepEqual(make({ type: "npc" }), [], "unconfigured types are untouched");
  settings.set("loot.avatar", ""); settings.set("loot.token", "");
  assert.deepEqual(make(), [], "blank disables each default");
  settings.set("npc.avatar", "npc-avatar.webp"); settings.set("npc.token", "npc-token.webp");
  assert.deepEqual(make({ type: "npc" }), [{ img: "npc-avatar.webp", "prototypeToken.texture.src": "npc-token.webp" }]);
  assert.equal(MODULE_ID, "lex-default-actor-art");
});
