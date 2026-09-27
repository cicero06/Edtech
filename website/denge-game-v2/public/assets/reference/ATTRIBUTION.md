# Asset attribution

## town-atlas.png

`public/assets/reference/town-atlas.png` is the **source atlas** that every sprite in
`public/assets/{buildings,nature,agriculture,water,ground,props}/` was sliced out of.

- Pack: **"RPG Town Tile Map"**
- Author: **Luis Zuno (@ansimuz)** — <https://ansimuz.com>
- The credit/signature panel is baked into the bottom-right of the atlas
  (region `x=226 y=240 w=126 h=48`). That region is deliberately **not** sliced into
  any game sprite.

The atlas is kept here only as the slicing source. The game never loads it —
see `tools/slice-assets.mjs` and `src/Game/data/assets.ts`.

> Before shipping publicly, confirm this pack's licence terms and add the required
> in-game credit. This has **not** been verified by the migration work.

## characters/

`player.png`, `npc-01.png`, `npc-02.png` were already in the project before the
PNG-world migration. Their origin/licence is **unknown and unverified**.

## ground/grass-tile-1..3.png

Already in the project before the migration (previously at
`public/assets/tiles/town/`). Origin/licence **unknown and unverified**.

## allassets.png (smooth illustrated set)

`allassets.png` is the **source sheet** for every `smooth: true` texture in
`src/Game/data/assets.ts` — buildings, trees, fields, fountain, benches, lamps,
vehicles, water/road tiles and the `player-boy` / `lina` / `mayor` / `woman`
character strips. It was supplied by the project owner (generated artwork);
sliced by `tools/slice-allassets.mjs`. Licence: **project-owned, unverified**.

## yenikarakterler.png

`public/assets/characters/yenikarakterler.png` was supplied by the project owner.
`tools/slice-allassets.mjs` produces the Aylin, Rıza, Nuri and Kemal
four-direction strips from it. Origin and redistribution rights have not been
independently verified; confirm them before public release.

## town-hall-source.png / mansion-source.png

Hi-res single-building renders supplied alongside `allassets.png`
(`town hall.png`, `house-01.png` in the original delivery). The town hall is a
full campus composite and is kept as **reference for the civic-district layout**;
the mansion is sliced into `buildings/mansion.png`. Licence: **project-owned,
unverified**.

## videos/

The MP4 files were supplied by the project owner. The startup sequence uses
`Camera_descending_onto_game_map.mp4` without modifying the source file.
`intro-clouds.jpg` and `intro-town.jpg` are frames extracted from that video
at 0 and 9.96 seconds. The original Lina introduction MP4 is retained.
`lina-masked.mp4` and `lina-poster.png` are derivatives produced locally by
`tools/prepare-lina.swift` (Apple Vision foreground masking, silent RGB+matte)
and `tools/mux-lina-audio.swift` (original audio passthrough). The processed
MP4 stores RGB and alpha side by side with the original audio passed through;
the browser composites Lina over the town without uploading video to a service.
Video, voice and soundtrack distribution rights have not been independently
verified; confirm the source service's terms before public release.

## maps/legacy-tiled/

Retired Tiled project files plus the original opaque tileset. Kept for reference
only; nothing in `src/` loads them. Safe to delete once you are confident the PNG
world is the way forward.
