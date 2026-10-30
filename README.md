# Lex's Default Actor Artwork

A small Foundry VTT v14 module with a native configuration window for default actor artwork. It only changes generic artwork on newly created actors.

## Configure

Enable **Lex's Default Actor Artwork** in the desired world. Under **Game Settings → Lex's Default Actor Artwork**, click **Configure Artwork**. Each actor type has separate Avatar and Prototype Token controls:

- **Use Lex Default** uses the matching WebP bundled with the module.
- Clear that checkbox to choose a world-specific image with Foundry's native file picker.
- Clear the checkbox and leave the path blank to retain the active system's ordinary default art.

Settings are world-specific. Changes apply immediately to subsequent actor creation; existing actors and placed tokens are never updated.

The module bundles defaults for Loot, Character/PC, NPC, Vehicle, Familiar, Hazard, Party, and Clue when the active system or another enabled module registers that actor type. Base, Army, and any other actor types retain system defaults until a GM chooses a world-specific override. The supplied images are included inside the module, so they do not need separate Asset Library uploads.

## Preservation rules

- Only the native `preCreateActor` hook changes artwork, before a new world actor is saved.
- Each image changes only if both the requested and pending artwork are blank or known core/system defaults.
- Explicit custom avatar and token paths are preserved independently.
- Compendium entries, imports with source metadata, and duplicates with source metadata are conservatively skipped.
- Actors and tokens that already exist are never scanned or updated.
- No other token settings, inventory, ownership, or game rules are changed.

The module detects default art using the system's public `getDefaultArtwork({type})` method and Foundry's generic defaults. An unrecognized image is preserved, not guessed to be generic. Systems must expose their actor types and default artwork through Foundry's public v14 APIs; types without configured defaults remain unchanged.

## Installation

For a local Foundry server, place this folder at `Data/modules/lex-default-actor-art`, restart the server to discover the module, then enable it per world. The directory name must match the manifest ID.

For Foundry or Forge installation by manifest URL, use:

https://github.com/GamersaurusLex/lex-default-actor-art/releases/latest/download/module.json

Enable the module separately in each world and configure its world-specific image settings. Requires Foundry VTT v14.

The bundled chest artwork was generated with Grok and supplied by Gamersaurus Lex, who confirmed redistribution rights.

## Changelog

### 0.1.1

First public release. Adds GitHub manifest and archive URLs to the Staging-tested 0.1.0 candidate; runtime behavior is unchanged. Native avatar/token settings per actor type, bundled Loot artwork, and creation-only preservation safeguards.

### 0.2.0

Adds built-in WebP artwork for Character/PC, NPC, Vehicle, Familiar, Hazard, Party, and Clue in addition to Loot. Replaces the long flat setting list with a Foundry v14-native configuration window supporting a per-image **Use Lex Default** toggle and a world-specific native file picker. Existing custom image paths are preserved during the one-time settings migration.

## Development check

Verified in the local Dev world on Foundry 14.367 with SF2e 1.5.1: all ten live checks passed, covering native settings, new Loot artwork, inherited token artwork, custom/imported artwork preservation, configured NPC artwork, blank settings, and unchanged pre-existing actors. Other game systems have not yet been live-tested.

Run with the bundled Node runtime:

```sh
/Users/cleggivey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/main.test.mjs
```

Disabling the module stops future automatic artwork assignment. It does not revert art already assigned when actors were created.
