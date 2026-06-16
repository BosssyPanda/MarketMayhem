// Pixel-art farm constants, ported from the Claude Design handoff (farm.js,
// "Cozy Carrots" direction). The canvas renderer reads these so the farm's
// colours stay in lockstep with the rest of the theme.

export const TILE = 16; // art-pixels per tile (rendered at integer scale, smoothing off)

export interface FarmPalette {
  grass: string;
  grassAlt: string;
  grassDark: string;
  grassLight: string;
  flower: string;
  flowerHi: string;
  soil: string;
  soilDark: string;
  soilLine: string;
  soilLight: string;
  leaf: string;
  leafDark: string;
  leafLight: string;
  crop: string;
  cropHi: string;
  metal: string;
  glass: string;
  droneDark: string;
  border: string;
}

// "Cozy Carrots" day-grassland palette.
export const COZY_CARROTS: FarmPalette = {
  grass: "#6aa23c",
  grassAlt: "#669c39",
  grassDark: "#4f7d2b",
  grassLight: "#8cc257",
  flower: "#f0d24a",
  flowerHi: "#fff0a6",
  soil: "#825232",
  soilDark: "#5f3a20",
  soilLine: "#6e4527",
  soilLight: "#9c6541",
  leaf: "#46a233",
  leafDark: "#327d24",
  leafLight: "#79c655",
  crop: "#e8833a",
  cropHi: "#ffb066",
  metal: "#3a3440",
  glass: "#bfe6f0",
  droneDark: "#7a2f1f",
  border: "#3d6128",
};

// Live drone accent (orange), read every frame so it matches the UI accent.
export const DRONE_ACCENT = "#e0653c";

// Per-crop body tint used for the ripe "fruit" flash on top of the leafy base.
// Falls back to palette.crop when a crop isn't listed.
export const CROP_TINT: Record<string, { body: string; hi: string }> = {
  WHEAT: { body: "#e0a82e", hi: "#f7d96a" },
  CORN: { body: "#f2d35a", hi: "#fff0a6" },
  PUMPKIN: { body: "#e8804f", hi: "#ffb98a" },
  CARROT: { body: "#e8743b", hi: "#ffb066" },
};

// Growth ticks per crop — mirrors lib/animate.ts CROP_GROW_TICKS so the canvas
// and the inspector agree on when a crop is "ripe".
export const CROP_GROW_TICKS: Record<string, number> = {
  WHEAT: 4,
  CORN: 6,
  PUMPKIN: 10,
  CARROT: 5,
};
