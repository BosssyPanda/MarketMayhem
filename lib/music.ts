// File-based background soundtrack — plays the tracks in random order, each in
// full, then a random silent gap before the next. A track that just played is
// blocked until NO_REPEAT_WINDOW (10) other tracks have played, so nothing recurs
// for a long stretch. Uses a single HTMLAudioElement. Audio only starts on a user
// gesture (browsers block autoplay); setOn(true) is expected from a click.

export interface MusicHandle {
  setOn(on: boolean): void;
  isOn(): boolean;
  dispose(): void;
}

// served from public/music (see public/music/*.mp3)
const TRACKS = [
  // original 10
  "Steps_Through_the_Grove",
  "Rapid_Growth",
  "Dusk_on_the_Porch",
  "Porch_Light_Out",
  "Sun_on_the_Barley",
  "The_Pavement_Shuffle",
  "A_Proof_of_Autumn",
  "Morning_on_the_Unbroken_Soil",
  "Midnight_at_the_Weathered_Barn",
  "Midnight_at_the_Farmhouse",
  // added 11
  "The_Silent_Ascent",
  "Mountains_at_First_Light",
  "Before_the_Snow_Settles",
  "Beyond_The_Silver_Ridge",
  "The_Last_Gate_of_the_Valley",
  "Before_The_Leaves_Fall",
  "The_Waltz_of_Departures",
  "A_Sovereign_Mourning",
  "The_Final_Gallop",
  "Crown_of_the_Ancient_Peak",
  "Statues_in_the_Rising_Tide",
].map((name) => `/music/${name}.mp3`);

const VOLUME = 0.5;
const GAP_MIN_MS = 30_000; // silent gap between tracks (Minecraft-style)
const GAP_MAX_MS = 90_000;
// A track that just played can't return until this many OTHER tracks have played.
// Must stay below TRACKS.length so there's always at least one eligible track.
const NO_REPEAT_WINDOW = 10;

export function createMusic(): MusicHandle {
  let audio: HTMLAudioElement | null = null;
  let on = false;
  let gapTimer: ReturnType<typeof setTimeout> | null = null;
  // The most recently played tracks (newest last), capped at NO_REPEAT_WINDOW.
  // The next track is chosen at random from everything NOT in this window.
  const recent: string[] = [];

  const clearGap = () => {
    if (gapTimer) {
      clearTimeout(gapTimer);
      gapTimer = null;
    }
  };

  // Pick a uniformly random track that hasn't played within the last
  // NO_REPEAT_WINDOW tracks, then record it in the window. With 21 tracks and a
  // window of 10 there are always >= 11 eligible, so a just-played track waits out
  // 10 others before it can return.
  const nextTrack = (): string => {
    const blocked = new Set(recent);
    let pool = TRACKS.filter((track) => !blocked.has(track));
    if (pool.length === 0) pool = TRACKS; // safety net if the window ever >= track count
    const track = pool[Math.floor(Math.random() * pool.length)];
    recent.push(track);
    if (recent.length > NO_REPEAT_WINDOW) recent.shift();
    return track;
  };

  const playNext = () => {
    if (!on || !audio) return;
    clearGap();
    audio.src = nextTrack();
    audio.currentTime = 0;
    void audio.play().catch(() => {
      /* autoplay/gesture blocked — wait for the next user toggle */
    });
  };

  const scheduleNext = () => {
    if (!on) return;
    clearGap();
    const gap = GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS);
    gapTimer = setTimeout(playNext, gap);
  };

  const ensure = () => {
    if (audio || typeof Audio === "undefined") return;
    audio = new Audio();
    audio.volume = VOLUME;
    audio.preload = "auto";
    audio.addEventListener("ended", scheduleNext);
  };

  return {
    setOn(next: boolean) {
      if (next === on) return;
      on = next;
      try {
        if (next) {
          ensure();
          playNext(); // start immediately on the user gesture (also covers mid-gap)
        } else {
          clearGap();
          audio?.pause();
        }
        if (typeof localStorage !== "undefined") localStorage.setItem("fwr_music", next ? "on" : "off");
      } catch {
        /* audio unavailable — no-op */
      }
    },
    isOn() {
      return on;
    },
    dispose() {
      on = false;
      clearGap();
      if (audio) {
        audio.removeEventListener("ended", scheduleNext);
        audio.pause();
        audio.src = "";
        audio = null;
      }
    },
  };
}
