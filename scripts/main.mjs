export const MODULE_ID = "lex-default-actor-art";
const ROOT = `modules/${MODULE_ID}/assets`;
const MIGRATION_VERSION = 2;

export const BUILTIN_ART = {
  loot: { avatar: `${ROOT}/a14_crypt_offerings.avatar.webp`, token: `${ROOT}/a14_crypt_offerings.token.webp` },
  character: { avatar: `${ROOT}/default-character-avatar.webp`, token: `${ROOT}/default-character-token.webp` },
  npc: { avatar: `${ROOT}/default-npc-avatar.webp`, token: `${ROOT}/default-npc-token.webp` },
  vehicle: { avatar: `${ROOT}/default-vehicle-avatar.webp`, token: `${ROOT}/default-vehicle-token.webp` },
  familiar: { avatar: `${ROOT}/default-familiar-avatar.webp`, token: `${ROOT}/default-familiar-token.webp` },
  hazard: { avatar: `${ROOT}/default-hazard-avatar.webp`, token: `${ROOT}/default-hazard-token.webp` },
  party: { avatar: `${ROOT}/default-party-avatar.webp`, token: `${ROOT}/default-party-token.webp` },
  clue: { avatar: `${ROOT}/default-clue-avatar.webp`, token: `${ROOT}/default-clue-token.webp` }
};

export const LOOT_ART = BUILTIN_ART.loot;

const settingKey = (type, part) => `${type}.${part}`;
const useDefaultKey = (type, part) => `${settingKey(type, part)}.useDefault`;
const activeTypes = () => Actor.implementation.TYPES;
const typeLabel = type => game.i18n.localize(CONFIG.Actor.typeLabels?.[type] ?? type);
const getBuiltinArt = type => BUILTIN_ART[type] ?? BUILTIN_ART[type.split(".").at(-1)];

export function getConfiguredArt(type, part) {
  if (game.settings.get(MODULE_ID, useDefaultKey(type, part))) return getBuiltinArt(type)?.[part] ?? "";
  return game.settings.get(MODULE_ID, settingKey(type, part));
}

export function registerSettings() {
  for (const type of activeTypes()) {
    for (const part of ["avatar", "token"]) {
      game.settings.register(MODULE_ID, settingKey(type, part), {
        scope: "world",
        config: false,
        type: new foundry.data.fields.FilePathField({ categories: ["IMAGE"], blank: true, nullable: false }),
        default: type === "loot" ? BUILTIN_ART.loot[part] : ""
      });
      game.settings.register(MODULE_ID, useDefaultKey(type, part), {
        scope: "world",
        config: false,
        type: Boolean,
        default: Boolean(getBuiltinArt(type)?.[part])
      });
    }
  }
  game.settings.register(MODULE_ID, "artworkDefaultsMigrationVersion", {
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });
  game.settings.registerMenu(MODULE_ID, "configureArtwork", {
    name: "Configure Default Actor Artwork",
    label: "Configure Artwork",
    hint: "Choose module defaults or world-specific avatar and token artwork for newly created actors.",
    icon: "fa-solid fa-images",
    type: DefaultActorArtworkConfig,
    restricted: true
  });
}

export async function migrateArtworkSettings() {
  if (!game.user.isGM || game.settings.get(MODULE_ID, "artworkDefaultsMigrationVersion") >= MIGRATION_VERSION) return;
  for (const type of activeTypes()) {
    for (const part of ["avatar", "token"]) {
      const builtIn = getBuiltinArt(type)?.[part];
      const saved = game.settings.get(MODULE_ID, settingKey(type, part));
      if (builtIn && saved && saved !== builtIn) await game.settings.set(MODULE_ID, useDefaultKey(type, part), false);
    }
  }
  await game.settings.set(MODULE_ID, "artworkDefaultsMigrationVersion", MIGRATION_VERSION);
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class DefaultActorArtworkConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-config`,
    classes: [MODULE_ID],
    tag: "form",
    window: { title: "Lex's Default Actor Artwork", icon: "fa-solid fa-images", resizable: true },
    position: { width: 720, height: "auto" },
    form: { handler: this.#onSubmit, closeOnSubmit: true },
    actions: { browseFile: this.#browseFile, toggleModuleDefault: this.#toggleModuleDefault }
  };

  static PARTS = { form: { template: `modules/${MODULE_ID}/templates/default-actor-art-config.hbs` } };

  async _prepareContext() {
    return { types: activeTypes().map(type => ({
      type,
      label: typeLabel(type),
      parts: ["avatar", "token"].map(part => {
        const moduleDefault = getBuiltinArt(type)?.[part] ?? "";
        return {
          part,
          label: part === "avatar" ? "Avatar" : "Prototype Token",
          pathKey: settingKey(type, part),
          useDefaultKey: useDefaultKey(type, part),
          useDefault: game.settings.get(MODULE_ID, useDefaultKey(type, part)),
          hasModuleDefault: Boolean(moduleDefault),
          moduleDefault,
          customPath: game.settings.get(MODULE_ID, settingKey(type, part))
        };
      })
    })) };
  }

  static #browseFile(event, button) {
    foundry.applications.apps.FilePicker.fromButton(button).render(true);
  }

  static #toggleModuleDefault(event, input) {
    const card = input.closest(".artwork-field");
    card.querySelector("input[type='text']").disabled = input.checked;
    card.querySelector("button.file-picker").disabled = input.checked;
  }

  static async #onSubmit(event, form) {
    const writes = [];
    for (const type of activeTypes()) {
      for (const part of ["avatar", "token"]) {
        const useDefaultField = form.elements[useDefaultKey(type, part)];
        writes.push(game.settings.set(MODULE_ID, useDefaultKey(type, part), useDefaultField?.checked ?? false));
        writes.push(game.settings.set(MODULE_ID, settingKey(type, part), form.elements[settingKey(type, part)].value.trim()));
      }
    }
    await Promise.all(writes);
    ui.notifications.info("Default actor artwork saved.");
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
  const avatar = getConfiguredArt(actor.type, "avatar");
  const token = getConfiguredArt(actor.type, "token");
  if (avatar && isGeneric(data.img) && isGeneric(actor.img)) patch.img = avatar;
  const suppliedToken = data.prototypeToken?.texture?.src ?? data["prototypeToken.texture.src"];
  if (token && isGeneric(suppliedToken) && isGeneric(actor.prototypeToken?.texture?.src)) {
    patch["prototypeToken.texture.src"] = token;
  }
  if (Object.keys(patch).length) actor.updateSource(patch);
}

Hooks.once("setup", registerSettings);
Hooks.once("ready", migrateArtworkSettings);
Hooks.on("preCreateActor", applyDefaultArt);
