import assert from "node:assert/strict";
import { test } from "node:test";

const listeners = new Map();
const settings = new Map();
globalThis.Hooks = { once: (name, fn) => listeners.set(name, fn), on: (name, fn) => listeners.set(name, fn) };
globalThis.CONST = { DEFAULT_TOKEN: "icons/svg/mystery-man.svg" };
globalThis.CONFIG = { Actor: { typeLabels: { loot: "Loot", npc: "NPC", "delta-green-clues.clue": "Clue" } } };
class ApplicationV2 {}
globalThis.foundry = {
  data: { fields: { FilePathField: class { constructor(options) { this.options = options; } } } },
  applications: {
    api: { ApplicationV2, HandlebarsApplicationMixin: Base => class extends Base {} },
    apps: { FilePicker: { fromButton: () => ({ render: () => {} }) } }
  }
};
const menus = new Map();
globalThis.game = { user: { isGM: true }, i18n: { localize: x => x }, settings: {
  register: (_id, key, config) => settings.set(key, config.default),
  registerMenu: (_id, key, config) => menus.set(key, config),
  get: (_id, key) => settings.get(key),
  set: async (_id, key, value) => settings.set(key, value)
} };
globalThis.ui = { notifications: { info: () => {} } };
class TestActor {
  static TYPES = ["loot", "npc", "delta-green-clues.clue"];
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
const { MODULE_ID, BUILTIN_ART, LOOT_ART, applyDefaultArt, getConfiguredArt } = await import("../scripts/main.mjs");
listeners.get("setup")();

test("native settings and creation-only artwork safety", () => {
  assert.equal(settings.size, 13, "three actor types, four settings each, and the migration marker");
  assert.equal(menus.get("configureArtwork").type.name, "DefaultActorArtworkConfig");
  assert.equal(settings.get("npc.avatar.useDefault"), true);
  assert.equal(listeners.size, 3, "setup, ready migration, and creation hook only");
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
  assert.deepEqual(make({ type: "npc" }), [{ img: BUILTIN_ART.npc.avatar, "prototypeToken.texture.src": BUILTIN_ART.npc.token }]);
  assert.deepEqual(make({ type: "delta-green-clues.clue" }), [{ img: BUILTIN_ART.clue.avatar, "prototypeToken.texture.src": BUILTIN_ART.clue.token }]);
  settings.set("loot.avatar.useDefault", false); settings.set("loot.token.useDefault", false);
  settings.set("loot.avatar", ""); settings.set("loot.token", "");
  assert.deepEqual(make(), [], "blank disables each default");
  settings.set("npc.avatar.useDefault", false); settings.set("npc.token.useDefault", false);
  settings.set("npc.avatar", "npc-avatar.webp"); settings.set("npc.token", "npc-token.webp");
  assert.deepEqual(make({ type: "npc" }), [{ img: "npc-avatar.webp", "prototypeToken.texture.src": "npc-token.webp" }]);
  assert.equal(getConfiguredArt("npc", "avatar"), "npc-avatar.webp");
  assert.equal(MODULE_ID, "lex-default-actor-art");
});
