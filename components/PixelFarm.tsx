"use client";

import { useEffect, useRef } from "react";
import type { DerivedState } from "@/lib/animate";
import { COZY_CARROTS, CROP_GROW_TICKS, CROP_TINT, DRONE_ACCENT, TILE } from "@/lib/farmPalette";
import { useReducedMotion } from "@/lib/motion";
import type { FarmState } from "@/lib/types";

// Crisp pixel-art farm renderer, ported from the design handoff's farm.js and
// rewired to draw OUR real state. Everything is painted into an offscreen
// art-resolution buffer (TILE art-pixels per tile) then blitted to the visible
// canvas at an integer scale with image smoothing OFF — true pixels at any size.
//
// The farm stays a pure function of (farmState, state): the rAF loop only adds
// visual smoothing (drone glide, bob, rotor flicker, plant/harvest sparkles),
// all of which are disabled under prefers-reduced-motion.

interface Sparkle {
  x: number;
  y: number;
  kind: "plant" | "harvest";
  born: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

// deterministic hash -> 0..1 for stable per-tile grass texture / flowers
function hash(n: number) {
  n = (n ^ 61) ^ (n >>> 16);
  n = n + (n << 3);
  n = n ^ (n >>> 4);
  n = Math.imul(n, 0x27d4eb2d);
  n = n ^ (n >>> 15);
  return (n >>> 0) / 4294967295;
}

export default function PixelFarm({
  width,
  height,
  state,
  farmState,
}: {
  width: number;
  height: number;
  state: DerivedState;
  farmState: FarmState;
  running?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  // mutable render inputs read by the rAF loop without re-subscribing
  const dataRef = useRef({ width, height, state, farmState, reduced });
  useEffect(() => {
    dataRef.current = { width, height, state, farmState, reduced };
  }, [width, height, state, farmState, reduced]);

  // live-interpolated drone position (tile coords) + transient sparkles
  const droneRef = useRef<{ x: number; y: number } | null>(null);
  const sparklesRef = useRef<Sparkle[]>([]);
  const lastActionRef = useRef<string>("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // jsdom / no 2d context — render nothing, don't crash
    ctx.imageSmoothingEnabled = false;

    const off = document.createElement("canvas");
    const g = off.getContext("2d");
    if (!g) return;
    g.imageSmoothingEnabled = false;

    let raf = 0;
    let disp = { scale: 4, offX: 0, offY: 0, W: 0, H: 0 };

    const sizeOff = () => {
      const { width: cols, height: rows } = dataRef.current;
      const W = cols * TILE;
      const H = rows * TILE;
      if (off.width !== W || off.height !== H) {
        off.width = W;
        off.height = H;
        g.imageSmoothingEnabled = false;
      }
      return { W, H };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      const dw = Math.max(1, Math.round(rect.width * dpr));
      const dh = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = dw;
      canvas.height = dh;
      ctx.imageSmoothingEnabled = false;
      const { W, H } = sizeOff();
      const scale = Math.max(1, Math.floor(Math.min(dw / W, dh / H)));
      disp = { scale, offX: Math.floor((dw - W * scale) / 2), offY: Math.floor((dh - H * scale) / 2), W, H };
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const pal = COZY_CARROTS;
    const px = (x: number, y: number, w: number, h: number, color: string) => {
      g.fillStyle = color;
      g.fillRect(x | 0, y | 0, w | 0, h | 0);
    };

    const grass = (x: number, y: number, i: number) => {
      px(x, y, TILE, TILE, pal.grass);
      if ((x / TILE + y / TILE) % 2 === 0) px(x, y, TILE, TILE, pal.grassAlt);
      const h1 = hash(i * 7 + 1);
      const h2 = hash(i * 13 + 3);
      const h3 = hash(i * 29 + 5);
      px(x + 2 + ((h1 * 10) | 0), y + 3 + ((h2 * 9) | 0), 1, 2, pal.grassDark);
      px(x + 9 - ((h2 * 7) | 0), y + 10 - ((h3 * 6) | 0), 1, 2, pal.grassDark);
      px(x + 5 + ((h3 * 6) | 0), y + 6, 1, 1, pal.grassLight);
      if (h1 > 0.86) {
        px(x + 4 + ((h2 * 6) | 0), y + 4 + ((h3 * 6) | 0), 2, 2, pal.flower);
        px(x + 5 + ((h2 * 6) | 0), y + 5 + ((h3 * 6) | 0), 1, 1, pal.flowerHi);
      }
    };

    const soil = (x: number, y: number) => {
      px(x, y, TILE, TILE, pal.soil);
      px(x, y, TILE, 1, pal.soilDark);
      px(x, y + TILE - 1, TILE, 1, pal.soilDark);
      for (let fy = 2; fy < TILE - 1; fy += 4) {
        px(x + 1, y + fy, TILE - 2, 1, pal.soilLine);
        px(x + 1, y + fy + 1, TILE - 2, 1, pal.soilLight);
      }
    };

    const tintFor = (crop: string) => CROP_TINT[crop] ?? { body: pal.crop, hi: pal.cropHi };

    const carrot = (x: number, y: number, gp: number, crop: string) => {
      const t = tintFor(crop);
      const cx = x + 8;
      const baseY = y + 13;
      const h = Math.round(2 + gp * 8);
      px(cx - 1, baseY - h, 2, h, pal.leaf);
      px(cx - 3, baseY - h + 1, 2, Math.max(1, h - 2), pal.leafDark);
      px(cx + 1, baseY - h + 1, 2, Math.max(1, h - 2), pal.leafDark);
      px(cx - 1, baseY - h, 1, Math.max(1, (h / 2) | 0), pal.leafLight);
      if (gp > 0.72) {
        px(cx - 1, baseY - 1, 2, 2, t.body);
        px(cx, baseY, 1, 1, t.hi);
      }
    };

    const wheat = (x: number, y: number, gp: number, crop: string) => {
      const t = tintFor(crop);
      const h = Math.round(3 + gp * 9);
      for (const sx of [4, 8, 12]) {
        const bx = x + sx;
        px(bx, y + 14 - h, 1, h, pal.leaf);
        if (gp > 0.45) {
          const gh = Math.round(gp * 5);
          px(bx - 1, y + 14 - h, 3, gh, t.body);
          px(bx, y + 14 - h - 1, 1, 1, t.hi);
        }
      }
    };

    const corn = (x: number, y: number, gp: number, crop: string) => {
      const t = tintFor(crop);
      const cx = x + 8;
      const h = Math.round(4 + gp * 9);
      px(cx, y + 14 - h, 1, h, pal.leafDark);
      px(cx - 2, y + 14 - ((h * 0.7) | 0), 2, 2, pal.leaf);
      px(cx + 1, y + 14 - ((h * 0.5) | 0), 2, 2, pal.leafLight);
      if (gp > 0.6) {
        const ch = Math.round(gp * 5);
        px(cx - 1, y + 13 - h, 2, ch, t.body);
        px(cx, y + 13 - h, 1, 1, t.hi);
      }
    };

    const pumpkin = (x: number, y: number, gp: number, crop: string) => {
      const t = tintFor(crop);
      px(x + 4, y + 7, 2, 2, pal.leaf);
      px(x + 10, y + 8, 2, 2, pal.leafDark);
      const r = Math.round(1 + gp * 4);
      const cx = x + 8;
      const cy = y + 13;
      px(cx - r, cy - r, r * 2, r * 2, t.body);
      if (gp > 0.6) px(cx - 1, cy - r, 1, r * 2, t.hi);
    };

    const cropPainter = (crop: string) => {
      if (crop === "WHEAT") return wheat;
      if (crop === "CORN") return corn;
      if (crop === "PUMPKIN") return pumpkin;
      return carrot; // CARROT + default
    };

    const sparkle = (x: number, y: number, kind: "plant" | "harvest", a: number) => {
      g.globalAlpha = a;
      g.fillStyle = kind === "harvest" ? pal.cropHi : pal.grassLight;
      g.fillRect(x + 4, y + 1, 1, 1);
      g.fillRect(x + 9, y + 3, 1, 1);
      g.fillRect(x + 6, y - 1, 1, 1);
      g.globalAlpha = 1;
    };

    const drone = (cxf: number, cyf: number, t: number, animate: boolean) => {
      const x = Math.round(cxf);
      const y = Math.round(cyf);
      g.fillStyle = "rgba(18,28,12,0.20)";
      g.fillRect(x - 5, y + 8, 11, 3);
      px(x - 8, y - 2, 3, 2, pal.metal);
      px(x + 6, y - 2, 3, 2, pal.metal);
      g.fillStyle = "rgba(196,214,222,0.55)";
      if (!animate || Math.floor(t / 45) % 2) {
        g.fillRect(x - 11, y - 3, 8, 1);
        g.fillRect(x + 4, y - 3, 8, 1);
      } else {
        g.fillRect(x - 10, y - 3, 6, 1);
        g.fillRect(x + 5, y - 3, 6, 1);
      }
      px(x - 5, y - 2, 11, 7, pal.droneDark);
      g.fillStyle = DRONE_ACCENT;
      g.fillRect(x - 4, y - 1, 9, 5);
      px(x - 2, y - 1, 4, 3, pal.glass);
      px(x - 2, y - 1, 1, 1, "rgba(255,255,255,0.7)");
      px(x + 1, y + 4, 2, 1, !animate || Math.floor(t / 250) % 2 ? "#ffe27a" : "#9a6a20");
    };

    const draw = (now: number) => {
      const { width: cols, height: rows, state: s, reduced: rm } = dataRef.current;
      const animate = !rm;

      // ground
      g.fillStyle = pal.grass;
      g.fillRect(0, 0, cols * TILE, rows * TILE);

      // tiles
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = c * TILE;
          const y = r * TILE;
          const key = `${c},${r}`;
          const tile = s.tileStates.get(key);
          if (!tile) {
            grass(x, y, i);
            continue;
          }
          soil(x, y);
          const grow = CROP_GROW_TICKS[tile.crop] ?? 5;
          const gp = tile.ripe ? 1 : clamp((s.tick - tile.plantedTick) / grow, 0.12, 1);
          cropPainter(tile.crop)(x, y, gp, tile.crop);
        }
      }

      // sparkles (transient, fade over 420ms)
      if (animate) {
        sparklesRef.current = sparklesRef.current.filter((sp) => now - sp.born < 420);
        for (const sp of sparklesRef.current) {
          const a = 1 - (now - sp.born) / 420;
          sparkle(sp.x * TILE, sp.y * TILE, sp.kind, a);
        }
      } else {
        sparklesRef.current = [];
      }

      // drone glide + bob
      const target = { x: s.drone.x, y: s.drone.y };
      if (!droneRef.current) droneRef.current = { ...target };
      const d = droneRef.current;
      const k = animate ? 0.2 : 1;
      d.x = lerp(d.x, target.x, k);
      d.y = lerp(d.y, target.y, k);
      const bob = animate ? Math.sin(now / 280) * 1.6 : 0;
      drone(d.x * TILE + 8, d.y * TILE + 7 + bob, now, animate);

      // blit crisp
      ctx.fillStyle = pal.border;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(off, 0, 0, disp.W, disp.H, disp.offX, disp.offY, disp.W * disp.scale, disp.H * disp.scale);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // Detect new plant/harvest actions as playback advances and spawn a sparkle.
  useEffect(() => {
    const a = state.lastAction;
    if (!a) return;
    const id = `${a.type}:${"at" in a ? a.at.join(",") : "to" in a ? a.to.join(",") : ""}:${state.tick}`;
    if (id === lastActionRef.current) return;
    lastActionRef.current = id;
    if ((a.type === "plant" || a.type === "harvest") && !reduced) {
      sparklesRef.current.push({ x: a.at[0], y: a.at[1], kind: a.type, born: performance.now() });
    }
  }, [state.lastAction, state.tick, reduced]);

  return <canvas ref={canvasRef} className="farm-canvas" role="img" aria-label="pixel-art farm" />;
}
