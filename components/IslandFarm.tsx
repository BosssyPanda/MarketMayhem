"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { DerivedState } from "@/lib/animate";
import { CROP_GROW_TICKS } from "@/lib/farmPalette";
import { useReducedMotion } from "@/lib/motion";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

// The approved floating-island scene (ported from public/island.html), now wired
// to game state: the panda flies the work route to `state.drone` and dips to
// plant/harvest while the playWidth×playHeight play grid grows crops seed→wheat —
// all a pure function of deriveState (same contract as PixelFarm). When idle the
// panda keeps its decorative sky orbit. Fixed 9×9 island, 15-minute day/night,
// full post chain (GTAO + bloom + tilt-shift + god-rays + warm grade), OrbitControls
// on. Under prefers-reduced-motion the panda/crops snap to state with no idle motion.
export default function IslandFarm({
  state,
  playWidth,
  playHeight,
  running = false,
  onReady,
  onError,
}: {
  state: DerivedState;
  playWidth: number;
  playHeight: number;
  running?: boolean;
  onReady?: () => void;
  onError?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  // The heavy scene is built once; the rAF loop reads fresh game state each frame
  // through this ref (synced after every render) instead of rebuilding on change.
  const dataRef = useRef({ state, playWidth, playHeight, running, reduced: !!reduced });
  useEffect(() => {
    dataRef.current = { state, playWidth, playHeight, running, reduced: !!reduced };
  }, [state, playWidth, playHeight, running, reduced]);

  // Ready/error handshake so FarmView only falls back to 2D on a real failure
  // (no WebGL / init throw / long hang) — never just because the bundle was slow.
  const cbRef = useRef({ onReady, onError });
  useEffect(() => {
    cbRef.current = { onReady, onError };
  }, [onReady, onError]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // jsdom / no-WebGL guard so the health-check in FarmView can fall back cleanly.
    let renderer: THREE.WebGLRenderer;
    try {
      // Permissive context so weaker / integrated GPUs and software renderers
      // still get a WebGL context (otherwise the farm would be blank). We force
      // the 3D island on every machine, so getting *a* context matters most.
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      cbRef.current.onError?.();
      return;
    }

    let cleanup = () => {};
    try {
    const animate0 = !dataRef.current.reduced; // initial setup defaults; per-frame uses dataRef
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0];

    const sizeOf = () => {
      const w = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    };
    let { w: VW, h: VH } = sizeOf();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x8aa6bd, 32, 72);
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.3;
    } catch {
      scene.environmentIntensity = 0.18;
    }

    // GLSL gradient sky dome
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(60, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          top: { value: new THREE.Color(0xaecfe2) },
          mid: { value: new THREE.Color(0x8fafc6) },
          bottom: { value: new THREE.Color(0x9c8f7a) },
          sunDir: { value: new THREE.Vector3(0, 1, 0) },
          sunCol: { value: new THREE.Color(0xffd9a0) },
          sunGlow: { value: 1.0 },
        },
        vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
          varying vec3 vP; uniform vec3 top,mid,bottom,sunDir,sunCol; uniform float sunGlow;
          void main(){
            vec3 dir = normalize(vP);
            float h = dir.y * 0.5 + 0.5;
            vec3 c = h > 0.5 ? mix(mid, top, (h - 0.5) * 2.0) : mix(bottom, mid, h * 2.0);
            float a = max(dot(dir, sunDir), 0.0);
            c += sunCol * (pow(a, 110.0) * 0.5 + pow(a, 7.0) * 0.1) * sunGlow;
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    );
    scene.add(sky);

    // SUN: bright core + soft halo + wide corona (bloom turns it into a glowing sun)
    const sun3 = new THREE.Group();
    const sunCore = new THREE.Mesh(new THREE.SphereGeometry(4.4, 40, 30), new THREE.MeshBasicMaterial({ color: 0xffe7a6, fog: false, transparent: true }));
    const sunHalo = new THREE.Mesh(new THREE.SphereGeometry(8.5, 40, 30), new THREE.MeshBasicMaterial({ color: 0xffc878, fog: false, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }));
    const sunCorona = new THREE.Mesh(new THREE.SphereGeometry(15.0, 40, 30), new THREE.MeshBasicMaterial({ color: 0xff9a48, fog: false, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
    sun3.add(sunCore, sunHalo, sunCorona);
    scene.add(sun3);
    // MOON: pale body + maria + many craters + faint halo
    const moon3 = new THREE.Group();
    const moonBody = new THREE.Mesh(new THREE.SphereGeometry(3.6, 40, 30), new THREE.MeshBasicMaterial({ color: 0xe4ebf6, fog: false, transparent: true }));
    moon3.add(moonBody);
    const maria = new THREE.Mesh(new THREE.SphereGeometry(1.2, 18, 14), new THREE.MeshBasicMaterial({ color: 0xc6cfe0, fog: false, transparent: true }));
    maria.position.set(0.9, 0.6, 3.0);
    maria.scale.set(1.3, 1.0, 0.25);
    moon3.add(maria);
    for (let i = 0; i < 11; i++) {
      const cr = new THREE.Mesh(new THREE.SphereGeometry(rand(0.25, 0.6), 14, 12), new THREE.MeshBasicMaterial({ color: 0xbcc6da, fog: false, transparent: true }));
      cr.position.copy(new THREE.Vector3().randomDirection().multiplyScalar(3.45));
      cr.scale.z = 0.35;
      cr.lookAt(0, 0, 0);
      moon3.add(cr);
    }
    const moonHalo = new THREE.Mesh(new THREE.SphereGeometry(6.0, 40, 30), new THREE.MeshBasicMaterial({ color: 0xc6cfe8, fog: false, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    moon3.add(moonHalo);
    scene.add(moon3);
    const starGeo = new THREE.BufferGeometry();
    const STAR_N = 320;
    const sarr = new Float32Array(STAR_N * 3);
    for (let i = 0; i < STAR_N; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(54);
      sarr[i * 3] = v.x;
      sarr[i * 3 + 1] = Math.abs(v.y) * 0.8 + 4;
      sarr[i * 3 + 2] = v.z;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(sarr, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.32, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    scene.add(stars);

    const camera = new THREE.PerspectiveCamera(36, VW / VH, 0.1, 200);
    camera.position.set(17, 13, 19);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.5, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 10;
    controls.maxDistance = 48;
    controls.minPolarAngle = 0.4;
    controls.maxPolarAngle = 1.35;
    controls.autoRotate = animate0;
    controls.autoRotateSpeed = 0.45;

    // ---------- lighting (driven by the day/night cycle) ----------
    const hemi = new THREE.HemisphereLight(0xdce9f2, 0x6f5a38, 0.45);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffcf8a, 1.25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    const sc = sun.shadow.camera;
    sc.left = -9;
    sc.right = 9;
    sc.top = 9;
    sc.bottom = -9;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    scene.add(sun);

    // day/night: orbit the sun, recolor sky + lights + fog, fade stars/moon
    let nightFactor = 0;
    let dayFactor = 0;
    let sunsetFactor = 0;
    const SKY = {
      dayTop: new THREE.Color(0xaecfe2), dayMid: new THREE.Color(0x8fafc6), dayBot: new THREE.Color(0xcbb892),
      setTop: new THREE.Color(0x3a2c64), setMid: new THREE.Color(0xcf5536), setBot: new THREE.Color(0xffa544),
      nightTop: new THREE.Color(0x080b18), nightMid: new THREE.Color(0x121830), nightBot: new THREE.Color(0x223052),
    };
    const sunDay = new THREE.Color(0xfff1d4);
    const sunSet = new THREE.Color(0xff7a2e);
    const hemiDaySky = new THREE.Color(0xdce9f2);
    const hemiNightSky = new THREE.Color(0x1c2740);
    const smooth = (a: number, b: number, x: number) => {
      const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    };
    const _c = new THREE.Color();
    function setDayNight(d: number) {
      const ang = d * Math.PI * 2;
      const e = Math.sin(ang); // sun elevation -1..1
      sun.position.set(Math.cos(ang) * 18, e * 16, 7);
      const dayF = smooth(-0.05, 0.32, e); // 0 night .. 1 day
      const setF = THREE.MathUtils.clamp(1 - Math.abs(e) / 0.33, 0, 1) * smooth(-0.25, 0.05, e);
      nightFactor = 1 - dayF;
      dayFactor = dayF;
      sunsetFactor = setF;
      sun.intensity = smooth(-0.04, 0.28, e) * 1.4;
      sun.color.copy(sunDay).lerp(sunSet, setF * 0.85);
      hemi.intensity = THREE.MathUtils.lerp(0.26, 0.5, dayF);
      hemi.color.copy(hemiNightSky).lerp(hemiDaySky, dayF);
      scene.environmentIntensity = THREE.MathUtils.lerp(0.17, 0.32, dayF);
      renderer.toneMappingExposure = THREE.MathUtils.lerp(0.94, 1.05, dayF);
      for (const pl of nightLights) pl.intensity = nightFactor * 1.5;
      fireflies.material.opacity = nightFactor * 0.9;
      // sky gradient
      const u = (sky.material as THREE.ShaderMaterial).uniforms;
      u.top.value.copy(SKY.nightTop).lerp(SKY.dayTop, dayF).lerp(SKY.setTop, setF * 0.62);
      u.mid.value.copy(SKY.nightMid).lerp(SKY.dayMid, dayF).lerp(SKY.setMid, setF * 0.9);
      u.bottom.value.copy(SKY.nightBot).lerp(SKY.dayBot, dayF).lerp(SKY.setBot, setF * 0.96);
      scene.fog!.color.copy(u.mid.value);
      // celestial discs
      const dir = sun.position.clone().normalize();
      sun3.position.copy(dir).multiplyScalar(52);
      const sop = smooth(-0.12, 0.05, e);
      (sunCore.material as THREE.MeshBasicMaterial).color.copy(_c.copy(sunDay).lerp(sunSet, setF));
      (sunHalo.material as THREE.MeshBasicMaterial).color.copy((sunCore.material as THREE.MeshBasicMaterial).color);
      (sunCore.material as THREE.MeshBasicMaterial).opacity = sop;
      (sunHalo.material as THREE.MeshBasicMaterial).opacity = sop * (0.3 + setF * 0.3);
      (sunCorona.material as THREE.MeshBasicMaterial).color.copy((sunCore.material as THREE.MeshBasicMaterial).color);
      (sunCorona.material as THREE.MeshBasicMaterial).opacity = sop * (0.12 + setF * 0.3);
      moon3.position.copy(dir).multiplyScalar(-52);
      for (const m of moon3.children) {
        const mm = (m as THREE.Mesh).material as THREE.Material | undefined;
        if (mm) mm.opacity = (1 - dayF) * (m === moonHalo ? 0.22 : 1);
      }
      stars.material.opacity = (1 - dayF) * 0.9;
      // feed the sun into the sky-glow shader
      const su = (sky.material as THREE.ShaderMaterial).uniforms;
      su.sunDir.value.copy(dir);
      su.sunCol.value.copy((sunCore.material as THREE.MeshBasicMaterial).color);
      su.sunGlow.value = smooth(-0.05, 0.3, e);
    }

    // ---------- post FX: GTAO + bloom + god-rays + warm grade/vignette (best effort) ----------
    // Keep the island scene on screen even when a public browser/GPU rejects one
    // optional post-processing pass. Only WebGL renderer creation is a real fatal
    // error for this component.
    let composer: EffectComposer | null = null;
    let gtao: GTAOPass | null = null;
    let godrays: ShaderPass | null = null;
    let gradePass: ShaderPass | null = null;
    let renderFrame = () => renderer.render(scene, camera);
    // volumetric god-rays: radial light-scatter from the sun's screen position.
    const GodRays = {
      uniforms: { tDiffuse: { value: null }, uSun: { value: new THREE.Vector2(0.5, 0.75) }, uIntensity: { value: 0.0 }, uDecay: { value: 0.95 }, uDensity: { value: 0.75 }, uWeight: { value: 0.4 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `
        varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 uSun; uniform float uIntensity,uDecay,uDensity,uWeight;
        const int N = 64;
        void main(){
          vec3 base = texture2D(tDiffuse, vUv).rgb;
          if (uIntensity <= 0.001) { gl_FragColor = vec4(base, 1.0); return; }
          vec2 delta = (vUv - uSun) * (uDensity / float(N));
          vec2 coord = vUv; float illum = 1.0; vec3 sum = vec3(0.0);
          for (int i = 0; i < N; i++) {
            coord -= delta;
            vec3 s = texture2D(tDiffuse, coord).rgb;
            float lum = max(max(s.r, s.g), s.b);
            s *= smoothstep(1.15, 2.6, lum);
            sum += s * illum * uWeight; illum *= uDecay;
          }
          gl_FragColor = vec4(base + sum * uIntensity, 1.0);
        }`,
    };
    // (tilt-shift DOF removed — the whole screen stays sharp)
    const GradeShader = {
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uTime;
        float rnd(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          c.r += 0.05; c.b -= 0.025; c = clamp(c, 0.0, 1.0);
          float l = dot(c, vec3(0.299,0.587,0.114));
          c = mix(vec3(l), c, 1.13);
          float d = distance(vUv, vec2(0.5, 0.46));
          c *= smoothstep(0.92, 0.32, d);
          c += (rnd(vUv * 1024.0 + uTime) - 0.5) * 0.015;
          gl_FragColor = vec4(c, 1.0);
        }`,
    };
    try {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      try {
        gtao = new GTAOPass(scene, camera, VW, VH);
        try {
          gtao.updateGtaoMaterial({ radius: 0.3, scale: 0.7, samples: 16 }); // softer AO — no mottled wash
        } catch {
          /* GTAO params optional */
        }
        try {
          (gtao as unknown as { blendIntensity: number }).blendIntensity = 0.6;
        } catch {
          /* optional */
        }
        composer.addPass(gtao);
      } catch {
        gtao = null;
      }
      try {
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(VW, VH), 0.1, 0.55, 0.92)); // gentle bloom
      } catch {
        /* bloom optional */
      }
      try {
        godrays = new ShaderPass(GodRays);
        composer.addPass(godrays);
      } catch {
        godrays = null;
      }
      try {
        composer.addPass(new OutputPass());
      } catch {
        /* output pass optional */
      }
      try {
        gradePass = new ShaderPass(GradeShader);
        composer.addPass(gradePass);
      } catch {
        gradePass = null;
      }
      renderFrame = () => {
        if (!composer) {
          renderer.render(scene, camera);
          return;
        }
        try {
          composer.render();
        } catch {
          composer = null;
          gtao = null;
          godrays = null;
          gradePass = null;
          renderer.render(scene, camera);
        }
      };
    } catch {
      composer = null;
      gtao = null;
      godrays = null;
      gradePass = null;
    }

    function resize() {
      const s = sizeOf();
      VW = s.w;
      VH = s.h;
      renderer.setSize(VW, VH, false);
      composer?.setSize(VW, VH);
      gtao?.setSize(VW, VH);
      camera.aspect = VW / VH;
      camera.updateProjectionMatrix();
    }
    resize();

    // ---------- island ----------
    const island = new THREE.Group();
    scene.add(island);
    const swayers: { o: THREE.Object3D; phase: number; amp: number }[] = [];
    const COLS = 9;
    const ROWS = 9;
    const STEP = 1.0;
    const TILE = 0.96;
    const SCAR_C = (COLS / 2) | 0;
    const SCAR_R = (ROWS / 2) | 0; // scarecrow's grass tile (centre)
    const half = (n: number) => (n - 1) / 2;

    // island = a grid of short soil slabs; tops hoed into tilled farmland.
    const H = 0.62; // short slab
    const sideShades = [0x8a5a34, 0x805231, 0x946239, 0x7a4d2c, 0x8f5d36];
    const topShades = [0x6e4a28, 0x664424, 0x744e2c, 0x5e3f22, 0x6b4826];
    const ridgeShades = [0x8a6038, 0x956840, 0x815a34, 0x8f6440];
    const grassTop = new THREE.MeshStandardMaterial({ color: 0x6f9d49, roughness: 1, metalness: 0, flatShading: true });
    const patchMat = new THREE.MeshStandardMaterial({ color: 0x4f351d, roughness: 1, metalness: 0, flatShading: true });
    const mat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, flatShading: true });
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const wx = (c - half(COLS)) * STEP;
        const wz = (r - half(ROWS)) * STEP;
        const isScare = c === SCAR_C && r === SCAR_R;
        const side = mat(pick(sideShades));
        const block = new THREE.Mesh(new THREE.BoxGeometry(TILE, H, TILE), [side, side, isScare ? grassTop : mat(pick(topShades)), side, side, side]);
        block.position.set(wx, -H / 2, wz);
        block.castShadow = true;
        block.receiveShadow = true;
        island.add(block);
        if (isScare) continue; // grass tile under the scarecrow — no furrows / no crops
        const along = (c + r) % 2 === 0;
        const ridgeMat = mat(pick(ridgeShades));
        for (let k = -2; k <= 2; k++) {
          const fr = new THREE.Mesh(new THREE.BoxGeometry(along ? TILE * 0.92 : 0.11, 0.05, along ? 0.11 : TILE * 0.92), ridgeMat);
          if (along) fr.position.set(wx, 0.02, wz + k * 0.18);
          else fr.position.set(wx + k * 0.18, 0.02, wz);
          fr.castShadow = true;
          fr.receiveShadow = true;
          island.add(fr);
        }
        if (Math.random() < 0.5) {
          const patch = new THREE.Mesh(new THREE.BoxGeometry(rand(0.12, 0.26), 0.02, rand(0.12, 0.26)), patchMat);
          patch.position.set(wx + rand(-0.3, 0.3), 0.045, wz + rand(-0.3, 0.3));
          patch.receiveShadow = true;
          island.add(patch);
        }
      }
    // little nub feet under the rim (reference underside)
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const edge = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;
        if (!edge || Math.random() < 0.45) continue;
        const wx = (c - half(COLS)) * STEP;
        const wz = (r - half(ROWS)) * STEP;
        const nub = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.18), mat(pick(sideShades)));
        nub.position.set(wx + rand(-0.16, 0.16), -H - 0.05, wz + rand(-0.16, 0.16));
        nub.castShadow = true;
        island.add(nub);
      }

    // ---------- crops (GLTF) with wind sway ----------
    const loader = new GLTFLoader();
    const tileWorld = (c: number, r: number) => new THREE.Vector3((c - half(COLS)) * STEP, 0.02, (r - half(ROWS)) * STEP);
    function prep(root: THREE.Object3D, targetH: number) {
      root.traverse((o) => {
        const me = o as THREE.Mesh;
        if (!me.isMesh) return;
        me.castShadow = true;
        me.receiveShadow = true;
        const mats = Array.isArray(me.material) ? me.material : [me.material];
        for (const m of mats) {
          const sm = m as THREE.MeshStandardMaterial;
          if (!sm) continue;
          sm.metalness = 0;
          sm.roughness = 0.95;
          sm.envMapIntensity = 0.22;
          sm.needsUpdate = true;
        }
      });
      const b = new THREE.Box3().setFromObject(root);
      const s = new THREE.Vector3();
      b.getSize(s);
      root.scale.setScalar(targetH / (s.y || 1));
      const b2 = new THREE.Box3().setFromObject(root);
      const cen = new THREE.Vector3();
      b2.getCenter(cen);
      root.position.x -= cen.x;
      root.position.z -= cen.z;
      root.position.y -= b2.min.y;
      return root;
    }
    const load = (u: string, h: number): Promise<THREE.Object3D | null> =>
      new Promise((res) => loader.load(u, (g: { scene: THREE.Object3D }) => res(prep(g.scene, h)), undefined, () => res(null)));

    // ---------- ambient wind (GPU vertex displacement on the wheat) ----------
    // Shared uniforms (one object, referenced by every wheat material) so the whole
    // field is driven by a single per-frame update. uStalkH/uStalkMinY weight the
    // sway toward the tips. customProgramCacheKey keeps all clones on one program.
    const windUniforms = {
      uTime: { value: 0 },
      uWind: { value: 0.18 },
      uStalkH: { value: 1 },
      uStalkMinY: { value: 0 },
    };
    function applyWind(mat: THREE.Material) {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = windUniforms.uTime;
        shader.uniforms.uWind = windUniforms.uWind;
        shader.uniforms.uStalkH = windUniforms.uStalkH;
        shader.uniforms.uStalkMinY = windUniforms.uStalkMinY;
        shader.vertexShader =
          "uniform float uTime;\nuniform float uWind;\nuniform float uStalkH;\nuniform float uStalkMinY;\n" +
          shader.vertexShader.replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
            {
              // World-space sway converted to object space via inverse(mat3(modelMatrix))
              // — cancels the model's large node scale + per-clone random rotation.
              vec4 wp = modelMatrix * vec4(transformed, 1.0);
              float hf = clamp((position.y - uStalkMinY) / uStalkH, 0.0, 1.0);
              float ph = wp.x * 0.6 + wp.z * 0.5;
              float gust = sin(uTime * 1.2 + ph) * 0.6 + sin(uTime * 0.55 + ph * 0.4) * 0.4;
              vec2 wind = vec2(0.85, 0.5) * gust * uWind * hf;
              transformed += inverse(mat3(modelMatrix)) * vec3(wind.x, 0.0, wind.y);
            }`,
          );
      };
      mat.customProgramCacheKey = () => "wheatWind";
      mat.needsUpdate = true;
    }

    // play-grid → island-tile mapping. The play area is anchored at a FIXED far
    // corner of the 9×9 (island 0,0) so the panda always starts its work at the same
    // corner on every run. (clamp keeps it valid if a grid ever exceeds the board.)
    function anchorFor(w: number, h: number) {
      const cOff = clamp(0, 0, Math.max(0, COLS - w));
      const rOff = clamp(0, 0, Math.max(0, ROWS - h));
      return { cOff, rOff };
    }

    // one crop slot per island tile (9×9, scarecrow tile excluded). Each holds a
    // seed sprout + a wheat clone (own materials). The whole field shows ripe wheat
    // by default ("covered"); play-grid tiles override with the live grow stage, and
    // a per-tile pulse plays the plant pop / harvest cut→regrow on the acted tile.
    interface CropSlot {
      group: THREE.Group;
      seed: THREE.Object3D;
      wheat: THREE.Object3D | null;
      mats: THREE.MeshStandardMaterial[];
      base: THREE.Color[];
      baseScale: number;
      actT: number; // seconds elapsed since the last plant/harvest action (counts up)
      actKind: "plant" | "harvest" | null;
    }
    const cropSlots: (CropSlot | null)[] = new Array(COLS * ROWS).fill(null);
    const slotIndex = (ic: number, ir: number) => ir * COLS + ic;
    const GROW = 2; // seed → ripe in 2 seconds (all three stages, ~0.67s each)
    const CUT = 0.3; // quick visible harvest cut before the fast regrow
    const GREEN = new THREE.Color(0x5f8f33);
    const seedMat = new THREE.MeshStandardMaterial({ color: 0x6fae3c, roughness: 1, metalness: 0, flatShading: true });
    const seedGeo = new THREE.ConeGeometry(0.05, 0.16, 5);
    function setSlotStage(slot: CropSlot, gp: number, ripe: boolean, pulseScale = 1) {
      slot.group.visible = true;
      const seedStage = !ripe && gp < 0.3;
      slot.seed.visible = seedStage;
      if (seedStage) {
        slot.seed.scale.setScalar(Math.max(0.001, pulseScale));
        if (slot.wheat) slot.wheat.visible = false;
        return;
      }
      if (!slot.wheat) return;
      slot.wheat.visible = true;
      let f: number;
      let greenMix: number;
      if (ripe || gp >= 1) {
        f = 1; // ripe wheat (natural model colour)
        greenMix = 0;
      } else if (gp < 0.62) {
        f = 0.5; // stage 2 — short green wheat
        greenMix = 0.8;
      } else {
        f = 0.78; // stage 3 — taller, heads forming
        greenMix = 0.42;
      }
      slot.wheat.scale.setScalar(Math.max(0.001, slot.baseScale * f * pulseScale));
      for (let i = 0; i < slot.mats.length; i++) slot.mats[i].color.copy(slot.base[i]).lerp(GREEN, greenMix);
    }

    Promise.all([load("/models/wheat.glb", 0.85)]).then(([wheat]) => {
      const CLUSTER = 4; // 4×4 stalks per tile → dense enough to fully cover the ground
      const inset = TILE / 2 - 0.08;
      // stalk height range (object space) → tip-weighted wind in the shader
      if (wheat) {
        let lo = Infinity;
        let hi = -Infinity;
        wheat.traverse((o) => {
          const me = o as THREE.Mesh;
          if (!me.isMesh || !me.geometry) return;
          me.geometry.computeBoundingBox();
          const bb = me.geometry.boundingBox;
          if (bb) {
            lo = Math.min(lo, bb.min.y);
            hi = Math.max(hi, bb.max.y);
          }
        });
        if (hi > lo) {
          windUniforms.uStalkMinY.value = lo;
          windUniforms.uStalkH.value = hi - lo;
        }
      }
      for (let ir = 0; ir < ROWS; ir++)
        for (let ic = 0; ic < COLS; ic++) {
          if (ic === SCAR_C && ir === SCAR_R) continue; // scarecrow tile stays grass
          const group = new THREE.Group();
          const w = tileWorld(ic, ir);
          group.position.set(w.x, w.y, w.z);
          island.add(group);
          const seed = new THREE.Mesh(seedGeo, seedMat);
          seed.position.y = 0.08;
          seed.castShadow = true;
          seed.visible = false;
          group.add(seed);
          let wheatGroup: THREE.Object3D | null = null;
          const mats: THREE.MeshStandardMaterial[] = [];
          const base: THREE.Color[] = [];
          if (wheat) {
            wheatGroup = new THREE.Group();
            for (let i = 0; i < CLUSTER; i++)
              for (let j = 0; j < CLUSTER; j++) {
                const cl = wheat.clone(true);
                cl.position.x += (i / (CLUSTER - 1) - 0.5) * 2 * inset + rand(-0.03, 0.03);
                cl.position.z += (j / (CLUSTER - 1) - 0.5) * 2 * inset + rand(-0.03, 0.03);
                cl.rotation.y = Math.random() * Math.PI * 2;
                cl.scale.multiplyScalar(rand(0.92, 1.12));
                cl.traverse((o) => {
                  const me = o as THREE.Mesh;
                  if (!me.isMesh) return;
                  me.castShadow = true;
                  const src = Array.isArray(me.material) ? me.material : [me.material];
                  const cloned = src.map((m) => (m as THREE.MeshStandardMaterial).clone());
                  me.material = cloned.length === 1 ? cloned[0] : cloned;
                  for (const cm of cloned) {
                    applyWind(cm);
                    // force solid — the source material was alpha-blended (see-through)
                    cm.transparent = false;
                    cm.depthWrite = true;
                    cm.depthTest = true;
                    cm.opacity = 1;
                    cm.needsUpdate = true;
                    mats.push(cm);
                    base.push(cm.color.clone());
                  }
                });
                wheatGroup.add(cl);
              }
            group.add(wheatGroup);
          }
          // baseScale 1 → the cluster scales as a whole; clones keep their own size
          const slot: CropSlot = { group, seed, wheat: wheatGroup, mats, base, baseScale: 1, actT: 0, actKind: null };
          setSlotStage(slot, 1, true); // default: fully-grown ripe wheat (covered field)
          cropSlots[slotIndex(ic, ir)] = slot;
        }
    });

    // ---------- flying panda with wings + straw hat ----------
    function buildPanda() {
      const g = new THREE.Group();
      const white = new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.82, metalness: 0 });
      const black = new THREE.MeshStandardMaterial({ color: 0x2a2a31, roughness: 0.78, metalness: 0 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.5, metalness: 0 });
      const straw = new THREE.MeshStandardMaterial({ color: 0xd7b466, roughness: 1, metalness: 0, flatShading: true });

      const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 22), white);
      body.scale.set(1, 0.96, 0.88);
      body.castShadow = true;
      g.add(body);
      const band = new THREE.Mesh(new THREE.SphereGeometry(0.425, 28, 22), black);
      band.scale.set(1.01, 0.42, 0.9);
      band.position.y = 0.12;
      g.add(band);

      for (const sx of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.18, 6, 12), black);
        arm.position.set(0.34 * sx, 0.0, 0.05);
        arm.rotation.z = sx * 0.55;
        arm.castShadow = true;
        g.add(arm);
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.15, 6, 12), black);
        leg.position.set(0.19 * sx, -0.34, 0.08);
        leg.castShadow = true;
        g.add(leg);
      }

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 22), white);
      head.position.set(0, 0.5, 0.12);
      head.castShadow = true;
      g.add(head);
      const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.15, 22, 18), white);
      muzzle.scale.set(1, 0.78, 0.9);
      muzzle.position.set(0, 0.42, 0.36);
      g.add(muzzle);
      for (const sx of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 16), black);
        ear.scale.set(1, 1, 0.7);
        ear.position.set(0.2 * sx, 0.73, 0.06);
        ear.castShadow = true;
        g.add(ear);
      }
      for (const sx of [-1, 1]) {
        const patch = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 14), black);
        patch.scale.set(0.8, 1.35, 0.5);
        patch.rotation.z = sx * 0.55;
        patch.position.set(0.12 * sx, 0.52, 0.35);
        g.add(patch);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 12), dark);
        eye.position.set(0.12 * sx, 0.5, 0.42);
        g.add(eye);
        const glint = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), white);
        glint.position.set(0.135 * sx, 0.525, 0.44);
        g.add(glint);
      }
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 12), dark);
      nose.scale.set(1.3, 0.85, 1);
      nose.position.set(0, 0.44, 0.49);
      g.add(nose);

      const wings: { pivot: THREE.Group; sx: number }[] = [];
      for (const sx of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(0.3 * sx, 0.14, -0.06);
        g.add(pivot);
        for (let f = 0; f < 3; f++) {
          const feat = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), black);
          feat.scale.set(0.09, 0.52 - f * 0.09, 0.95 - f * 0.16);
          feat.position.set(0.34 * sx, -f * 0.05, -0.04 - f * 0.14);
          feat.castShadow = true;
          pivot.add(feat);
        }
        wings.push({ pivot, sx });
      }

      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.04, 22), straw);
      brim.position.set(0, 0.74, 0.08);
      brim.castShadow = true;
      g.add(brim);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.26, 22), straw);
      cone.position.set(0, 0.88, 0.08);
      cone.castShadow = true;
      g.add(cone);

      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 14), white);
      tail.position.set(0, -0.05, -0.42);
      tail.castShadow = true;
      g.add(tail);
      g.userData.wings = wings;
      g.userData.head = head;
      g.name = "panda";
      return g;
    }
    const panda = buildPanda();
    panda.position.set(0, 2.4, 0);
    island.add(panda);

    // ---------- clouds + birds + pollen ----------
    const clouds = new THREE.Group();
    scene.add(clouds);
    for (let i = 0; i < 11; i++) {
      const cl = new THREE.Group();
      const m = new THREE.MeshStandardMaterial({ color: 0xf5f8fc, roughness: 1, metalness: 0, flatShading: true });
      for (let j = 0; j < 8; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(rand(1.0, 2.2), 10, 8), m);
        puff.position.set(rand(-3.0, 3.0), rand(-0.4, 0.4), rand(-1.5, 1.5));
        puff.scale.y = 0.55;
        cl.add(puff);
      }
      const a = rand(0, 6.28);
      const radc = rand(36, 54);
      cl.position.set(Math.cos(a) * radc, rand(16, 28), Math.sin(a) * radc);
      cl.userData = { speed: rand(0.2, 0.5), rad: radc, y: cl.position.y, ang: a };
      clouds.add(cl);
    }
    const birds = new THREE.Group();
    scene.add(birds);
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Group();
      const m = new THREE.MeshStandardMaterial({ color: 0x2f2e36, roughness: 1, side: THREE.DoubleSide });
      const wl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), m);
      const wr = wl.clone();
      wl.position.x = -0.26;
      wr.position.x = 0.26;
      b.add(wl, wr);
      b.userData = { ang: rand(0, 6.28), rad: rand(7, 12), y: rand(5, 8), speed: rand(0.25, 0.5), wl, wr, ph: rand(0, 6.28) };
      birds.add(b);
    }
    const POLLEN = 140;
    const pgeo = new THREE.BufferGeometry();
    const parr = new Float32Array(POLLEN * 3);
    for (let i = 0; i < POLLEN; i++) {
      parr[i * 3] = rand(-6, 6);
      parr[i * 3 + 1] = rand(-1, 5);
      parr[i * 3 + 2] = rand(-6, 6);
    }
    pgeo.setAttribute("position", new THREE.BufferAttribute(parr, 3));
    const pollen = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: 0xfff2c8, size: 0.06, transparent: true, opacity: 0.7, depthWrite: false }));
    island.add(pollen);

    // night lanterns (warm point lights) + glowing fireflies
    const nightLights: THREE.PointLight[] = [];
    for (const [x, z] of [[-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2], [0, 0]]) {
      const pl = new THREE.PointLight(0xffce86, 0, 15, 2);
      pl.position.set(x, 3.0, z);
      island.add(pl);
      nightLights.push(pl);
    }
    const FF = 110;
    const fgeo = new THREE.BufferGeometry();
    const farr = new Float32Array(FF * 3);
    for (let i = 0; i < FF; i++) {
      farr[i * 3] = rand(-6.6, 6.6);
      farr[i * 3 + 1] = rand(0.3, 3.6);
      farr[i * 3 + 2] = rand(-6.6, 6.6);
    }
    fgeo.setAttribute("position", new THREE.BufferAttribute(farr, 3));
    const fireflies = new THREE.Points(fgeo, new THREE.PointsMaterial({ color: 0xfff09a, size: 0.14, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    island.add(fireflies);

    // ---------- realistic scarecrow on the centre grass tile ----------
    function buildScarecrow() {
      const g = new THREE.Group();
      const wood = new THREE.MeshStandardMaterial({ color: 0x6e4a26, roughness: 1, metalness: 0, flatShading: true });
      const straw = new THREE.MeshStandardMaterial({ color: 0xd9b25a, roughness: 1, metalness: 0, flatShading: true });
      const burlap = new THREE.MeshStandardMaterial({ color: 0xc9a468, roughness: 1, metalness: 0, flatShading: true });
      const shirt = new THREE.MeshStandardMaterial({ color: 0xb5532f, roughness: 1, metalness: 0, flatShading: true });
      const dark = new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.7, metalness: 0 });
      const rope = new THREE.MeshStandardMaterial({ color: 0xb79256, roughness: 1, metalness: 0 });
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.9, 7), wood);
      post.position.y = 0.95;
      post.castShadow = true;
      g.add(post);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.5, 7), wood);
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 1.45;
      bar.castShadow = true;
      g.add(bar);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.72, 12), shirt);
      body.position.y = 1.24;
      body.castShadow = true;
      g.add(body);
      for (let i = 0; i < 12; i++) {
        const s = new THREE.Mesh(new THREE.ConeGeometry(0.03, rand(0.16, 0.3), 4), straw);
        const a = rand(0, 6.28);
        s.position.set(Math.cos(a) * 0.22, 0.9, Math.sin(a) * 0.18);
        s.rotation.set(Math.PI + rand(-0.4, 0.4), 0, rand(-0.4, 0.4));
        s.castShadow = true;
        g.add(s);
      }
      for (const sx of [-1, 1])
        for (let i = 0; i < 6; i++) {
          const s = new THREE.Mesh(new THREE.ConeGeometry(0.025, rand(0.12, 0.22), 4), straw);
          s.position.set(0.72 * sx, 1.45, 0);
          s.rotation.set(rand(-0.6, 0.6), 0, (sx * Math.PI) / 2 + rand(-0.5, 0.5));
          s.castShadow = true;
          g.add(s);
        }
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), burlap);
      head.scale.set(1, 1.12, 1);
      head.position.y = 1.78;
      head.castShadow = true;
      g.add(head);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 16), rope);
      tie.rotation.x = Math.PI / 2;
      tie.position.y = 1.62;
      g.add(tie);
      const stitch = (x: number, rot: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.018, 0.018), dark);
        m.position.set(x, 1.83, 0.225);
        m.rotation.z = rot;
        g.add(m);
      };
      stitch(-0.09, 0.6);
      stitch(-0.09, -0.6);
      stitch(0.09, 0.6);
      stitch(0.09, -0.6);
      for (let i = -2; i <= 2; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.02), dark);
        m.position.set(i * 0.04, 1.71, 0.235);
        g.add(m);
      }
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 18), straw);
      brim.position.y = 1.97;
      brim.castShadow = true;
      g.add(brim);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.18, 16), straw);
      crown.position.y = 2.06;
      crown.castShadow = true;
      g.add(crown);
      const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.05, 16), dark);
      hatBand.position.y = 2.0;
      g.add(hatBand);
      const patch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.02), new THREE.MeshStandardMaterial({ color: 0x8a6f3a, roughness: 1, metalness: 0, flatShading: true }));
      patch.position.set(-0.12, 1.2, 0.28);
      g.add(patch);
      for (let i = 0; i < 3; i++) {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8), dark);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(0.02, 1.36 - i * 0.13, 0.3);
        g.add(btn);
      }

      // ---- detailed hanging lantern ----
      const metal = new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 0.45, metalness: 0.7 });
      const lant = new THREE.Group();
      lant.position.set(0.66, 1.04, 0.06);
      g.add(lant);
      const mk = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, shadow: boolean) => {
        const me = new THREE.Mesh(geo, m);
        me.position.set(x, y, z);
        if (shadow) me.castShadow = true;
        lant.add(me);
        return me;
      };
      mk(new THREE.CylinderGeometry(0.085, 0.07, 0.05, 6), metal, 0, 0.12, 0, true);
      mk(new THREE.ConeGeometry(0.06, 0.06, 6), metal, 0, 0.17, 0, true);
      mk(new THREE.CylinderGeometry(0.07, 0.088, 0.04, 6), metal, 0, -0.11, 0, true);
      for (const [px, pz] of [[-0.052, -0.052], [0.052, -0.052], [-0.052, 0.052], [0.052, 0.052]]) mk(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4), metal, px, 0, pz, false);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.17, 0.085), new THREE.MeshStandardMaterial({ color: 0xffd089, emissive: 0xff9a2e, emissiveIntensity: 1.3, transparent: true, opacity: 0.82, roughness: 0.3 }));
      lant.add(glass);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.08, 8), new THREE.MeshBasicMaterial({ color: 0xffe07a }));
      flame.position.y = -0.02;
      lant.add(flame);
      mk(new THREE.TorusGeometry(0.03, 0.008, 6, 12), metal, 0, 0.2, 0, false);
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.46, 4), metal);
      chain.position.set(-0.04, 0.42, 0.0);
      chain.rotation.z = 0.18;
      lant.add(chain);
      const llight = new THREE.PointLight(0xffb24d, 0, 6, 2);
      lant.add(llight);

      const pkMat = new THREE.MeshStandardMaterial({ color: 0xe07b32, roughness: 1, metalness: 0, flatShading: true });
      for (const [px, pz, sP] of [[0.34, 0.26, 1.0], [0.16, 0.42, 0.7]]) {
        const pk = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), pkMat);
        pk.scale.set(1.3 * sP, 0.9 * sP, 1.3 * sP);
        pk.position.set(px, 0.16 * sP, pz);
        pk.castShadow = true;
        g.add(pk);
      }

      g.userData.light = llight;
      g.userData.lantern = { light: llight, glass: glass.material, flame };
      return g;
    }
    const scarecrow = buildScarecrow();
    scarecrow.position.set((SCAR_C - half(COLS)) * STEP, 0.0, (SCAR_R - half(ROWS)) * STEP);
    island.add(scarecrow);
    nightLights.push(scarecrow.userData.light);

    // ---------- edges: grassy overhang lip + rock base band + hanging roots + rim pebbles ----------
    const lip = new THREE.Mesh(new THREE.BoxGeometry(COLS * STEP + 0.2, 0.12, ROWS * STEP + 0.2), new THREE.MeshStandardMaterial({ color: 0x6f9d49, roughness: 1, metalness: 0, flatShading: true }));
    lip.position.y = -0.05;
    lip.castShadow = true;
    lip.receiveShadow = true;
    island.add(lip);
    const baseBand = new THREE.Mesh(new THREE.BoxGeometry(COLS * STEP + 0.08, 0.16, ROWS * STEP + 0.08), new THREE.MeshStandardMaterial({ color: 0x5a4026, roughness: 1, metalness: 0, flatShading: true }));
    baseBand.position.y = -0.66;
    baseBand.castShadow = true;
    baseBand.receiveShadow = true;
    island.add(baseBand);
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x49331f, roughness: 1, metalness: 0 });
    const pebMat = new THREE.MeshStandardMaterial({ color: 0x8d8576, roughness: 1, metalness: 0, flatShading: true });
    {
      const rim = half(COLS) * STEP + 0.42;
      for (let i = 0; i < 26; i++) {
        const side = i % 4;
        const t = rand(-rim, rim);
        let x: number;
        let z: number;
        if (side === 0) {
          x = t;
          z = -rim;
        } else if (side === 1) {
          x = t;
          z = rim;
        } else if (side === 2) {
          x = -rim;
          z = t;
        } else {
          x = rim;
          z = t;
        }
        if (Math.random() < 0.5) {
          const len = rand(0.3, 1.1);
          const root = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.045, len, 5), rootMat);
          root.position.set(x, -0.55 - len / 2, z);
          root.rotation.set(rand(-0.2, 0.2), 0, rand(-0.2, 0.2));
          root.castShadow = true;
          island.add(root);
        } else {
          const p = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.05, 0.13), 0), pebMat);
          p.position.set(x * 0.96, 0.03, z * 0.96);
          p.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
          p.castShadow = true;
          island.add(p);
        }
      }
    }

    // ---------- perimeter post-and-rail fence with a gate ----------
    const fenceWood = new THREE.MeshStandardMaterial({ color: 0x6e4a26, roughness: 1, metalness: 0, flatShading: true });
    {
      const edge = half(COLS) * STEP + 0.5;
      const N = COLS;
      const gateIdx = (N / 2) | 0;
      const post = (x: number, z: number, h: number) => {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.07, h, 0.07), fenceWood);
        p.position.set(x, h / 2 - 0.05, z);
        p.castShadow = true;
        p.receiveShadow = true;
        island.add(p);
      };
      const rail = (x: number, z: number, len: number, horiz: boolean, y: number) => {
        const rr = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.05, 0.05, horiz ? 0.05 : len), fenceWood);
        rr.position.set(x, y, z);
        rr.castShadow = true;
        island.add(rr);
      };
      for (let i = 0; i <= N; i++) {
        const t = (i - N / 2) * STEP;
        post(t, -edge, 0.55);
        post(t, edge, 0.55);
        post(-edge, t, 0.55);
        post(edge, t, 0.55);
      }
      for (let i = 0; i < N; i++) {
        const mid = (i - N / 2 + 0.5) * STEP;
        const gate = i === gateIdx - 1 || i === gateIdx;
        for (const y of [0.1, 0.32]) {
          if (!gate) rail(mid, -edge, STEP, true, y);
          rail(mid, edge, STEP, true, y);
          rail(-edge, mid, STEP, false, y);
          rail(edge, mid, STEP, false, y);
        }
      }
      const gx = (gateIdx - N / 2) * STEP;
      post(gx - STEP / 2, -edge, 0.72);
      post(gx + STEP / 2, -edge, 0.72);
    }

    // ---------- crows (perched, occasional flap) ----------
    const crows: THREE.Group[] = [];
    function buildCrow() {
      const g = new THREE.Group();
      const b = new THREE.MeshStandardMaterial({ color: 0x1b1a20, roughness: 0.85, metalness: 0, flatShading: true });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), b);
      body.scale.set(1, 0.9, 1.4);
      body.castShadow = true;
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), b);
      head.position.set(0, 0.09, 0.12);
      g.add(head);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0xe0a82e, roughness: 1, flatShading: true }));
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.09, 0.23);
      g.add(beak);
      const wings: { w: THREE.Mesh; sx: number }[] = [];
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), b);
        w.scale.set(0.4, 0.08, 0.7);
        w.position.set(0.12 * sx, 0.02, 0);
        w.castShadow = true;
        g.add(w);
        wings.push({ w, sx });
      }
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), b);
      tail.scale.set(0.5, 0.1, 1.0);
      tail.position.set(0, 0, -0.18);
      g.add(tail);
      g.userData.wings = wings;
      g.userData.ph = rand(0, 6.28);
      return g;
    }
    {
      const c1 = buildCrow();
      c1.position.copy(scarecrow.position).add(new THREE.Vector3(-0.72, 1.5, 0));
      c1.rotation.y = -0.6;
      island.add(c1);
      crows.push(c1);
      const c2 = buildCrow();
      c2.position.set(half(COLS) * STEP + 0.5, 0.52, (2 - half(ROWS)) * STEP);
      c2.rotation.y = 2.3;
      island.add(c2);
      crows.push(c2);
    }

    // ---------- butterflies (drift over the field by day) ----------
    const butterflies: THREE.Group[] = [];
    const bflyCols = [0xffd24a, 0xe2674f, 0x6fa8e0, 0xe28ad0, 0xffffff];
    for (let i = 0; i < 16; i++) {
      const g = new THREE.Group();
      const m = new THREE.MeshStandardMaterial({ color: bflyCols[i % bflyCols.length], roughness: 0.8, metalness: 0, side: THREE.DoubleSide, transparent: true, flatShading: true });
      const wings: { w: THREE.Mesh; sx: number }[] = [];
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.CircleGeometry(0.09, 6), m);
        w.position.x = 0.05 * sx;
        wings.push({ w, sx });
        g.add(w);
      }
      g.userData = { wings, mat: m, ph: rand(0, 6.28), rad: rand(2, 6), sp: rand(0.25, 0.55), yb: rand(0.9, 2.4) };
      island.add(g);
      butterflies.push(g);
    }

    // ---------- shooting stars (night) ----------
    const shootingStars: THREE.Mesh[] = [];
    let ssTimer = 0;

    // gold sparkle trail from the panda
    const coins: THREE.Mesh[] = [];
    const coinGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xf4cf52, metalness: 0.2, roughness: 0.5, emissive: 0xc28a1c, emissiveIntensity: 0.9 });
    function spawnCoin(p: THREE.Vector3) {
      const m = new THREE.Mesh(coinGeo, coinMat);
      m.position.copy(p);
      m.rotation.x = Math.PI / 2;
      m.userData = { vy: -rand(0.6, 1.1), life: 0, spin: rand(2, 5) };
      m.castShadow = true;
      island.add(m);
      coins.push(m);
      if (coins.length > 36) {
        const old = coins.shift();
        if (old) island.remove(old);
      }
    }

    // ---------- panda flight + crop growth state ----------
    const pandaTarget = new THREE.Vector3();
    let pandaHeading = 0;
    let dipT = 0;
    const DIP = 0.45; // seconds of the plant/harvest dip
    let lastActId = "";

    // ---------- animate ----------
    const clock = new THREE.Clock();
    let coinT = 0;
    const CYCLE = 900; // seconds per full day↔night (15 min)
    setDayNight(0.3); // start mid-morning

    let raf = 0;
    let readyFired = false;
    // Adaptive quality: sample FPS for the first ~1.5s; if the GPU is struggling,
    // drop the two heaviest post-FX passes + the pixel ratio so weak machines
    // stay smooth (strong machines keep the full chain).
    let prevRunning = false;
    let fpsAccum = 0;
    let fpsFrames = 0;
    let perfChecked = false;
    function tick() {
      const d = dataRef.current;
      const animate = !d.reduced;
      const st = d.state;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      if (!perfChecked) {
        fpsAccum += dt;
        fpsFrames++;
        if (fpsAccum >= 1.5) {
          perfChecked = true;
          if (fpsFrames / fpsAccum < 45) {
            if (gtao) gtao.enabled = false;
            if (godrays) godrays.enabled = false;
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.3));
            resize();
          }
        }
      }
      island.position.y = animate ? Math.sin(t * 0.7) * 0.18 : 0;
      setDayNight(animate ? (t / CYCLE + 0.28) % 1 : 0.32);
      stars.rotation.y = t * 0.006;
      controls.autoRotate = animate && !d.running;

      for (const sw of swayers) sw.o.rotation.z = animate ? Math.sin(t * 1.6 + sw.phase) * sw.amp : 0;

      // play-grid anchor (avoids the centre scarecrow tile)
      const { cOff, rOff } = anchorFor(d.playWidth, d.playHeight);

      // a new plant/harvest → dip the panda + a gold burst over that tile
      const act = st.lastAction;
      if (act) {
        const id = `${act.type}:${"at" in act ? act.at.join(",") : "to" in act ? act.to.join(",") : ""}:${st.tick}`;
        if (id !== lastActId) {
          lastActId = id;
          if ((act.type === "plant" || act.type === "harvest") && "at" in act) {
            dipT = DIP;
            const ic = cOff + act.at[0];
            const ir = rOff + act.at[1];
            const aw = tileWorld(ic, ir);
            for (let k = 0; k < 7; k++) {
              const a = (k / 7) * Math.PI * 2;
              spawnCoin(new THREE.Vector3(aw.x + Math.cos(a) * 0.18, 0.45 + Math.random() * 0.2, aw.z + Math.sin(a) * 0.18));
            }
            const slot = cropSlots[slotIndex(ic, ir)];
            if (slot) {
              slot.actT = 0;
              slot.actKind = act.type;
            }
          }
        }
      }

      // panda: idle = decorative sky orbit; running = fly the work route + dip to act.
      // The work route always starts at the fixed corner (play grid anchored at 0,0),
      // so the panda flies in and begins harvesting there every run.
      if (d.running) {
        const tw = tileWorld(cOff + st.drone.x, rOff + st.drone.y);
        pandaTarget.set(tw.x, 1.25 + (animate ? Math.sin(t * 2.4) * 0.08 : 0), tw.z);
        // Run just started: snap onto the start tile so the FIRST harvest is on
        // that tile (the corner), not whatever tile the panda was gliding past.
        if (!prevRunning) panda.position.copy(pandaTarget);
        const dx = pandaTarget.x - panda.position.x;
        const dz = pandaTarget.z - panda.position.z;
        if (Math.hypot(dx, dz) > 0.02) pandaHeading = Math.atan2(dx, dz);
        if (animate) {
          panda.position.lerp(pandaTarget, 0.2);
          // snap the last sliver so the panda actually arrives over the tile (no hover)
          if (Math.hypot(pandaTarget.x - panda.position.x, pandaTarget.z - panda.position.z) < 0.05) {
            panda.position.x = pandaTarget.x;
            panda.position.z = pandaTarget.z;
          }
        } else panda.position.copy(pandaTarget);
        panda.rotation.y = animate ? THREE.MathUtils.lerp(panda.rotation.y, pandaHeading, 0.1) : pandaHeading;
        panda.rotation.z = 0;
        if (dipT > 0) panda.position.y -= Math.sin((1 - dipT / DIP) * Math.PI) * 0.85;
      } else if (animate) {
        panda.position.x = Math.cos(t * 0.55) * 1.8;
        panda.position.z = Math.sin(t * 0.55) * 1.8;
        panda.position.y = 2.4 + Math.sin(t * 2.0) * 0.14;
        panda.rotation.y = -t * 0.55;
        panda.rotation.z = Math.sin(t * 0.55) * 0.18;
      } else {
        panda.position.set(0, 2.0, 0);
        panda.rotation.set(0, 0, 0);
      }
      dipT = Math.max(0, dipT - dt);
      const flap = animate ? 0.35 + Math.sin(t * 12) * 0.6 : 0.18;
      for (const w of panda.userData.wings as { pivot: THREE.Group; sx: number }[]) w.pivot.rotation.z = w.sx * flap;
      if (panda.userData.head) (panda.userData.head as THREE.Object3D).rotation.x = animate ? Math.sin(t * 1.6) * 0.07 : 0;

      // crops: the whole field is covered with ripe wheat; play-grid tiles show the
      // live grow stage; the acted tile plays a plant pop / harvest cut→regrow pulse
      for (let ir = 0; ir < ROWS; ir++)
        for (let ic = 0; ic < COLS; ic++) {
          const slot = cropSlots[slotIndex(ic, ir)];
          if (!slot) continue;
          let gp = 1;
          let isRipe = true;
          let pulseScale = 1;
          if (slot.actKind) {
            // an action is animating on this tile — quick cut, then a 2s regrow
            slot.actT += dt;
            if (slot.actKind === "harvest" && slot.actT < CUT) {
              pulseScale = 1 - slot.actT / CUT; // quick cut — wheat picked up
            } else {
              const base = slot.actKind === "harvest" ? CUT : 0;
              const p = clamp((slot.actT - base) / GROW, 0, 1); // seed → ripe over 2s
              gp = p;
              isRipe = p >= 1;
              if (p >= 1) slot.actKind = null; // tween done → fall back to default
            }
          } else if (d.running) {
            // during a run, play tiles reflect the live grow state (seed→ripe).
            // At rest the field stays fully ripe (no stray seeds on load) — growth
            // is only ~2s, so a persisted mid-growth tile would never sit idle.
            const gx = ic - cOff;
            const gy = ir - rOff;
            if (gx >= 0 && gx < d.playWidth && gy >= 0 && gy < d.playHeight) {
              const tile = st.tileStates.get(`${gx},${gy}`);
              if (tile) {
                isRipe = tile.ripe || tile.stage === "ripe";
                const grow = CROP_GROW_TICKS[tile.crop] ?? 5;
                gp = isRipe ? 1 : clamp((st.tick - tile.plantedTick) / grow, 0, 1);
              }
            }
          }
          setSlotStage(slot, gp, isRipe, pulseScale);
        }

      // gold sparkle trail behind the panda (decorative — idle motion only)
      if (animate) {
        coinT += dt;
        if (coinT > 0.22) {
          coinT = 0;
          spawnCoin(panda.getWorldPosition(new THREE.Vector3()).sub(island.position).add(new THREE.Vector3(0, -0.2, 0)));
        }
      }
      for (let i = coins.length - 1; i >= 0; i--) {
        const m = coins[i];
        m.userData.life += dt;
        m.position.y += m.userData.vy * dt;
        m.rotation.z += m.userData.spin * dt;
        const a = 1 - m.userData.life / 1.3;
        m.scale.setScalar(Math.max(0.001, a));
        if (m.userData.life > 1.3) {
          island.remove(m);
          coins.splice(i, 1);
        }
      }

      // ambient decoration (drifts / flaps / twinkles) — frozen under reduced motion
      if (animate) {
      // clouds drift
      for (const cl of clouds.children) {
        cl.userData.ang += cl.userData.speed * dt * 0.06;
        cl.position.x = Math.cos(cl.userData.ang) * cl.userData.rad;
        cl.position.z = Math.sin(cl.userData.ang) * cl.userData.rad;
      }
      // birds fly + flap
      for (const b of birds.children) {
        const u = b.userData;
        u.ang += u.speed * dt * 0.12;
        b.position.set(Math.cos(u.ang) * u.rad, u.y + Math.sin(t + u.ph) * 0.3, Math.sin(u.ang) * u.rad);
        b.rotation.y = -u.ang;
        const fl = Math.sin(t * 9 + u.ph) * 0.6;
        u.wl.rotation.z = 0.3 + fl;
        u.wr.rotation.z = -0.3 - fl;
      }
      // pollen drift up
      const pa = pollen.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < POLLEN; i++) {
        let y = pa.getY(i) + dt * 0.25;
        if (y > 5) y = -1;
        pa.setY(i, y);
        pa.setX(i, pa.getX(i) + Math.sin(t * 0.5 + i) * dt * 0.05);
      }
      pa.needsUpdate = true;
      const fa = fireflies.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < FF; i++) {
        fa.setX(i, fa.getX(i) + Math.sin(t * 0.6 + i) * dt * 0.12);
        fa.setY(i, fa.getY(i) + Math.cos(t * 0.5 + i * 1.3) * dt * 0.08);
      }
      fa.needsUpdate = true;
      fireflies.material.opacity = nightFactor * 0.9 * (0.55 + 0.45 * Math.sin(t * 3.2));

      // lantern flame flicker
      const L = scarecrow.userData.lantern;
      const flick = 0.78 + Math.sin(t * 11) * 0.13 + Math.sin(t * 23.7) * 0.06;
      L.glass.emissiveIntensity = (0.55 + nightFactor * 1.5) * flick;
      L.light.intensity = nightFactor * 1.7 * flick;
      L.flame.scale.set(1 + Math.sin(t * 17) * 0.12, 0.8 + Math.sin(t * 14) * 0.22, 1);

      // crows: mostly folded wings, occasional flap
      for (const cw of crows) {
        const f = Math.sin(t * 9 + cw.userData.ph);
        const a = 0.08 + Math.max(0, f) * 0.5;
        for (const wg of cw.userData.wings as { w: THREE.Mesh; sx: number }[]) wg.w.rotation.z = wg.sx * a;
      }

      // butterflies drift over the field by day
      for (const bf of butterflies) {
        const u = bf.userData;
        const a = t * u.sp + u.ph;
        bf.position.set(Math.cos(a) * u.rad, u.yb + Math.sin(t * 1.5 + u.ph) * 0.4, Math.sin(a) * u.rad);
        bf.rotation.y = -a;
        const fl = Math.sin(t * 16 + u.ph) * 0.9;
        for (const wg of u.wings as { w: THREE.Mesh; sx: number }[]) wg.w.rotation.y = wg.sx * (0.5 + fl);
        u.mat.opacity = dayFactor * 0.95;
        bf.visible = dayFactor > 0.05;
      }

      // shooting stars at night
      ssTimer += dt;
      if (nightFactor > 0.55 && ssTimer > 2.2 && Math.random() < 0.45) {
        ssTimer = 0;
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, fog: false }));
        m.position.set(rand(-22, 22), rand(14, 22), rand(-20, -6));
        m.userData = { vel: new THREE.Vector3(rand(-7, -3), rand(-3.5, -1.5), rand(2, 6)), life: 0, max: rand(0.7, 1.3) };
        scene.add(m);
        shootingStars.push(m);
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const m = shootingStars[i];
        m.userData.life += dt;
        m.position.addScaledVector(m.userData.vel, dt);
        (m.material as THREE.MeshBasicMaterial).opacity = 1 - m.userData.life / m.userData.max;
        m.scale.set(1, 1, 1 + (m.userData.life / m.userData.max) * 9);
        if (m.userData.life > m.userData.max) {
          scene.remove(m);
          shootingStars.splice(i, 1);
        }
      }
      } // end ambient block (frozen under reduced motion)

      if (gradePass) gradePass.uniforms.uTime.value = t;
      // ambient wheat wind (frozen under reduced motion)
      windUniforms.uTime.value = t;
      windUniforms.uWind.value = animate ? 0.18 : 0;
      if (godrays) {
        const sp = sun3.position.clone().project(camera);
        godrays.uniforms.uSun.value.set(sp.x * 0.5 + 0.5, sp.y * 0.5 + 0.5);
        godrays.uniforms.uIntensity.value = sp.z < 1 ? dayFactor * (0.12 + sunsetFactor * 0.95) : 0.0;
      }
      controls.update();
      renderFrame();
      if (!readyFired) {
        readyFired = true;
        cbRef.current.onReady?.();
      }
      prevRunning = d.running;
      raf = requestAnimationFrame(tick);
    }

    // always loop: tick() honours reduced motion internally (panda + crops still
    // reflect the run; only the ambient idle motion is frozen).
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentElement ?? canvas);

    cleanup = () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      composer?.dispose();
      pmrem.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        const me = o as THREE.Mesh;
        if (me.geometry) me.geometry.dispose();
        const m = me.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
        else if (m) m.dispose();
      });
    };
    } catch {
      try {
        renderer.dispose();
      } catch {
        /* ignore cleanup failure */
      }
      // any unexpected init failure → let FarmView drop to the 2D fallback
      cbRef.current.onError?.();
    }
    // Scene built once; live game state + reduced-motion read per-frame via dataRef.
    return cleanup;
  }, []);

  return <canvas ref={canvasRef} className="island3d" />;
}
