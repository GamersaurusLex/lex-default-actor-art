# Lex's Default Actor Artwork

A small Foundry VTT v14 module with native image-picker settings for every actor type registered by the active game system. No dependencies, custom settings application, macros, or background migration.

## Configure

Enable **Lex's Default Actor Artwork** in the desired world. Under **Game Settings → Lex's Default Actor Artwork**, choose a default avatar and prototype-token image for each type. Settings are world-specific. Changes apply immediately to subsequent actor creation; existing actors and placed tokens are never updated.

Loot starts with the two chest images supplied by Gamersaurus Lex. Other types start blank. Clear either field to leave that part of the artwork unchanged. The supplied images are included inside the module, so they do not need separate Asset Library uploads.

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

## Development check

Verified in the local Dev world on Foundry 14.367 with SF2e 1.5.1: all ten live checks passed, covering native settings, new Loot artwork, inherited token artwork, custom/imported artwork preservation, configured NPC artwork, blank settings, and unchanged pre-existing actors. Other game systems have not yet been live-tested.

Run with the bundled Node runtime:

```sh
/Users/cleggivey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/main.test.mjs
```

Disabling the module stops future automatic artwork assignment. It does not revert art already assigned when actors were created.
