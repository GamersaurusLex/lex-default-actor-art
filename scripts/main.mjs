export const MODULE_ID = "lex-default-actor-art";
const ROOT = `modules/${MODULE_ID}/assets`;
export const LOOT_ART = {
  avatar: `${ROOT}/a14_crypt_offerings.avatar.webp`,
  token: `${ROOT}/a14_crypt_offerings.token.webp`
};

export function registerSettings() {
  for (const type of Actor.implementation.TYPES) {
    const label = game.i18n.localize(CONFIG.Actor.typeLabels?.[type] ?? type);
    for (const [part, title] of [["avatar", "Avatar"], ["token", "Token"]]) {
      game.settings.register(MODULE_ID, `${type}.${part}`, {
        name: `${label}: Default ${title}`,
        hint: "Only replaces generic artwork on newly created actors. Custom artwork and existing actors are preserved. Leave blank to use the system default. Settings are per world.",
        scope: "world",
        config: true,
        type: new foundry.data.fields.FilePathField({ categories: ["IMAGE"], blank: true, nullable: false }),
        default: type === "loot" ? LOOT_ART[part] : ""
      });
    }
  }
}

export function applyDefaultArt(actor, data, options = {}) {
  // Compendium entries/imports and duplicates keep their supplied artwork, including generic art.
  if (actor.parent || actor.inCompendium || options.pack
      || data._stats?.compendiumSource || data._stats?.duplicateSource || data.flags?.core?.sourceId) return;
  const defaults = actor.constructor.getDefaultArtwork({ type: actor.type });
  const generic = new Set(["", CONST.DEFAULT_TOKEN, Actor.implementation.DEFAULT_ICON,
    defaults.img, defaults.texture?.src]);
  const isGeneric = value => value == null || generic.has(value);
  const patch = {};
  const avatar = game.settings.get(MODULE_ID, `${actor.type}.avatar`);
  const token = game.settings.get(MODULE_ID, `${actor.type}.token`);
  if (avatar && isGeneric(data.img) && isGeneric(actor.img)) patch.img = avatar;
  const suppliedToken = data.prototypeToken?.texture?.src ?? data["prototypeToken.texture.src"];
  if (token && isGeneric(suppliedToken) && isGeneric(actor.prototypeToken?.texture?.src)) {
    patch["prototypeToken.texture.src"] = token;
  }
  if (Object.keys(patch).length) actor.updateSource(patch);
}

Hooks.once("setup", registerSettings);
Hooks.on("preCreateActor", applyDefaultArt);
