// farm.js — crisp pixel-art farm renderer for the "code runs -> farm reacts" demo.
//
// Everything is drawn into a small offscreen canvas at art-pixel resolution
// (TILE = 16 art-pixels per tile) and then blitted to the visible canvas at an
// INTEGER scale with image smoothing OFF. That guarantees true, crunchy pixel
// art at any display size — no half-pixels, no blur.
//
// createFarm(displayCanvas, cfg) -> { draw(t), resize(), stats(t), cfg }
//   t is the loop time in ms (0 .. cfg.timeline.loop).
//   cfg.accent is read live every frame, so tweaking the drone colour is instant.

const TILE = 16;

// cheap deterministic hash -> 0..1, used for stable per-tile texture/flowers
function hash(n) {
  n = (n ^ 61) ^ (n >>> 16);
  n = n + (n << 3);
  n = n ^ (n >>> 4);
  n = Math.imul(n, 0x27d4eb2d);
  n = n ^ (n >>> 15);
  return (n >>> 0) / 4294967295;
}
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function createFarm(displayCanvas, cfg) {
  const cols = cfg.cols, rows = cfg.rows;
  const W = cols * TILE, H = rows * TILE;
  const N = cols * rows;
  const pal = cfg.pal;
  const T = cfg.timeline;

  // offscreen art-resolution buffer
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const g = off.getContext('2d');
  g.imageSmoothingEnabled = false;

  const ctx = displayCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // boustrophedon sweep order (snake across rows) so the drone never teleports
  const sweep = [];          // sweepRank -> {c,r,i}
  const rankOf = new Array(N); // tileIndex -> sweepRank
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < cols; c++) { const i = r * cols + c; rankOf[i] = sweep.length; sweep.push({ c, r, i }); }
    } else {
      for (let c = cols - 1; c >= 0; c--) { const i = r * cols + c; rankOf[i] = sweep.length; sweep.push({ c, r, i }); }
    }
  }

  // per-tile event times derived from its position in the sweep
  function times(rank) {
    const f = N > 1 ? rank / (N - 1) : 0;
    const t1 = lerp(T.tillStart, T.tillEnd, f);     // soil prepared
    const t2 = T.separatePlant
      ? lerp(T.plantStart, T.plantEnd, f)           // V1: a second, fast "plant whole field" ripple
      : t1 + 140;                                   // V2: tilled & planted in one pass
    const t3 = t2 + T.growDur;                       // fully grown
    const t4 = Math.max(lerp(T.harvestStart, T.harvestEnd, f), t3 + 200); // harvested
    return { t1, t2, t3, t4 };
  }

  let dispScale = 4, offX = 0, offY = 0, dpr = 1;
  function resize() {
    const rect = displayCanvas.getBoundingClientRect();
    dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    const dw = Math.max(1, Math.round(rect.width * dpr));
    const dh = Math.max(1, Math.round(rect.height * dpr));
    displayCanvas.width = dw;
    displayCanvas.height = dh;
    ctx.imageSmoothingEnabled = false;
    dispScale = Math.max(1, Math.floor(Math.min(dw / W, dh / H)));
    offX = Math.floor((dw - W * dispScale) / 2);
    offY = Math.floor((dh - H * dispScale) / 2);
  }

  // ---- tile painters (all in art-pixel coords) ----
  function px(x, y, w, h, color) { g.fillStyle = color; g.fillRect(x | 0, y | 0, w | 0, h | 0); }

  function grass(x, y, i) {
    px(x, y, TILE, TILE, pal.grass);
    // soft checker shade for a tended-lawn feel
    if (((x / TILE) + (y / TILE)) % 2 === 0) px(x, y, TILE, TILE, pal.grassAlt);
    // scattered darker blades + occasional highlight / flower, stable per tile
    const h1 = hash(i * 7 + 1), h2 = hash(i * 13 + 3), h3 = hash(i * 29 + 5);
    px(x + 2 + ((h1 * 10) | 0), y + 3 + ((h2 * 9) | 0), 1, 2, pal.grassDark);
    px(x + 9 - ((h2 * 7) | 0), y + 10 - ((h3 * 6) | 0), 1, 2, pal.grassDark);
    px(x + 5 + ((h3 * 6) | 0), y + 6, 1, 1, pal.grassLight);
    if (h1 > 0.86) { px(x + 4 + ((h2 * 6) | 0), y + 4 + ((h3 * 6) | 0), 2, 2, pal.flower); px(x + 5 + ((h2 * 6) | 0), y + 5 + ((h3 * 6) | 0), 1, 1, pal.flowerHi); }
  }

  function soil(x, y) {
    px(x, y, TILE, TILE, pal.soil);
    px(x, y, TILE, 1, pal.soilDark);
    px(x, y + TILE - 1, TILE, 1, pal.soilDark);
    // tilled furrows
    for (let fy = 2; fy < TILE - 1; fy += 4) {
      px(x + 1, y + fy, TILE - 2, 1, pal.soilLine);
      px(x + 1, y + fy + 1, TILE - 2, 1, pal.soilLight);
    }
  }

  function carrot(x, y, gp) {
    // leafy fronds rising from the soil; a flash of orange once mature
    const cx = x + 8;
    const baseY = y + 13;
    const h = Math.round(2 + gp * 8);
    px(cx - 1, baseY - h, 2, h, pal.leaf);
    px(cx - 3, baseY - h + 1, 2, Math.max(1, h - 2), pal.leafDark);
    px(cx + 1, baseY - h + 1, 2, Math.max(1, h - 2), pal.leafDark);
    px(cx - 1, baseY - h, 1, Math.max(1, (h / 2) | 0), pal.leafLight);
    if (gp > 0.72) { px(cx - 1, baseY - 1, 2, 2, pal.crop); px(cx, baseY, 1, 1, pal.cropHi); }
  }

  function wheat(x, y, gp) {
    const stalks = [4, 8, 12];
    const h = Math.round(3 + gp * 9);
    for (const sx of stalks) {
      const bx = x + sx;
      px(bx, y + 14 - h, 1, h, pal.leaf);
      if (gp > 0.45) {
        const gh = Math.round(gp * 5);
        px(bx - 1, y + 14 - h, 3, gh, pal.crop);
        px(bx, y + 14 - h - 1, 1, 1, pal.cropHi);
      }
    }
  }

  const cropFn = cfg.crop === 'wheat' ? wheat : carrot;

  function sparkle(x, y, kind) {
    g.fillStyle = kind === 'harvest' ? pal.cropHi : pal.grassLight;
    px(x + 4, y + 1, 1, 1); px(x + 9, y + 3, 1, 1); px(x + 6, y - 1, 1, 1);
  }

  function drone(cx, cy, t) {
    const x = Math.round(cx), y = Math.round(cy);
    // ground shadow (doesn't bob)
    g.fillStyle = 'rgba(18,28,12,0.20)';
    g.fillRect(x - 5, y + 8, 11, 3);
    // rotor arms
    px(x - 8, y - 2, 3, 2, pal.metal); px(x + 6, y - 2, 3, 2, pal.metal);
    // spinning blades (flicker)
    g.fillStyle = 'rgba(196,214,222,0.55)';
    if (Math.floor(t / 45) % 2) { g.fillRect(x - 11, y - 3, 8, 1); g.fillRect(x + 4, y - 3, 8, 1); }
    else { g.fillRect(x - 10, y - 3, 6, 1); g.fillRect(x + 5, y - 3, 6, 1); }
    // body
    px(x - 5, y - 2, 11, 7, pal.droneDark);
    g.fillStyle = cfg.accent; g.fillRect(x - 4, y - 1, 9, 5); // live accent
    // glass dome
    px(x - 2, y - 1, 4, 3, pal.glass);
    px(x - 2, y - 1, 1, 1, 'rgba(255,255,255,0.7)');
    // belly status light
    px(x + 1, y + 4, 2, 1, Math.floor(t / 250) % 2 ? '#ffe27a' : '#9a6a20');
  }

  function dronePos(t) {
    const bob = Math.round(Math.sin(t / 280) * 1.6);
    const center = (rank) => {
      const s = sweep[clamp(rank, 0, N - 1)];
      return { x: s.c * TILE + 8, y: s.r * TILE + 7 + bob };
    };
    if (t < T.tillStart) return center(0);
    if (t <= T.tillEnd) return center(Math.floor(((t - T.tillStart) / (T.tillEnd - T.tillStart)) * N));
    if (t < T.harvestStart) { const s = sweep[(N / 2) | 0]; return { x: s.c * TILE + 8, y: s.r * TILE + 7 + bob }; }
    if (t <= T.harvestEnd) return center(Math.floor(((t - T.harvestStart) / (T.harvestEnd - T.harvestStart)) * N));
    return center(0);
  }

  function draw(t) {
    // field
    for (let i = 0; i < N; i++) {
      const s = sweep[rankOf[i]];
      const x = s.c * TILE, y = s.r * TILE;
      const tm = times(rankOf[i]);
      if (t < tm.t1) {
        grass(x, y, i);
      } else if (t < tm.t2) {
        soil(x, y);
      } else if (t < tm.t3) {
        soil(x, y);
        cropFn(x, y, clamp((t - tm.t2) / T.growDur, 0, 1));
        if (Math.abs(t - tm.t2) < 150) sparkle(x, y, 'plant');
      } else if (t < tm.t4) {
        soil(x, y);
        const sway = Math.sin(t / 360 + i) * 0; // (kept subtle/none for crisp look)
        cropFn(x, y, 1 + sway);
      } else {
        soil(x, y);
        if (Math.abs(t - tm.t4) < 150) sparkle(x, y, 'harvest');
      }
    }
    // drone
    const p = dronePos(t);
    drone(p.x, p.y, t);

    // blit crisp
    ctx.fillStyle = pal.border;
    ctx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);
    ctx.drawImage(off, 0, 0, W, H, offX, offY, W * dispScale, H * dispScale);
  }

  function stats(t) {
    let tilled = 0, grown = 0, harvested = 0;
    for (let i = 0; i < N; i++) {
      const tm = times(rankOf[i]);
      if (t >= tm.t1) tilled++;
      if (t >= tm.t3 && t < tm.t4) grown++;
      if (t >= tm.t4) harvested++;
    }
    return { tilled, grown, harvested, total: N };
  }

  resize();
  return { draw, resize, stats, cfg };
}
