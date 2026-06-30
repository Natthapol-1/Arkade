// ─── Notes ────────────────────────────────────────────────────────────────────
export const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type NoteName = (typeof NOTES)[number];

export const NOTE_FREQUENCIES: Record<NoteName, number> = {
  C: 261.63, D: 293.66, E: 329.63,
  F: 349.23, G: 392.00, A: 440.00, B: 493.88,
};

export const NOTE_KEY_MAP: Record<string, NoteName> = {
  '1': 'C', '2': 'D', '3': 'E', '4': 'F', '5': 'G', '6': 'A', '7': 'B',
};

export const NOTE_COLORS: Record<NoteName, string> = {
  C: '#ff6b6b', D: '#ff9f43', E: '#ffd32a',
  F: '#00ff88', G: '#00d4ff', A: '#a29bfe', B: '#fd79a8',
};

// ─── Melodies ─────────────────────────────────────────────────────────────────
export interface Melody {
  id: number;
  name: string;
  notes: NoteName[];
  color: string;
}

export const ALL_MELODIES = [
  { name: 'Ode to Joy', notes: ['E','E','F','G','G','F','E','D'] },
  { name: 'Twinkle Twinkle', notes: ['C','C','G','G','A','A','G'] },
  { name: 'Happy Birthday', notes: ['G','G','A','G','C','B'] },
  { name: 'Frere Jacques', notes: ['C','D','E','C','C','D','E','C'] },
  { name: 'Marys Lamb', notes: ['E','D','C','D','E','E','E'] },
  { name: 'Jingle Bells', notes: ['E','E','E','E','E','E','E','G','C','D','E'] },
  { name: 'Row Your Boat', notes: ['C','C','C','D','E','E','D','E','F','G'] },
  { name: 'London Bridge', notes: ['G','A','G','F','E','F','G'] },
  { name: 'Old MacDonald', notes: ['G','G','G','D','E','E','D'] },
  { name: 'The Saints', notes: ['C','E','F','G','C','E','F','G'] },
  { name: 'Fur Elise', notes: ['E','D','E','D','E','B','D','C','A'] },
  { name: 'Amazing Grace', notes: ['G','C','E','C','E','D','C','A','G'] },
];

export let MELODIES: Melody[] = [];

export function randomizeMelodies(rand: (max: number) => number) {
  const shuffled = [...ALL_MELODIES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const colors = ['#00d4ff', '#ffd32a', '#ff6b6b', '#00ff88'];
  MELODIES = shuffled.slice(0, 4).map((m, i) => ({
    id: i,
    name: m.name,
    notes: m.notes as NoteName[],
    color: colors[i]
  }));
}

// ─── Chords / Power-ups ───────────────────────────────────────────────────────
export type ChordEffect = 'speed' | 'vision' | 'immune' | 'invisible' | 'slow_ghosts' | 'reveal' | 'heal';

export interface ChordDef {
  notes: NoteName[];
  name: string;
  effect: ChordEffect;
  duration: number;
  description: string;
  color: string;
}

export const CHORDS: ChordDef[] = [
  { notes: ['C','E','G'], name: 'C Major', effect: 'speed',        duration: 1200, description: '+50% Speed',    color: '#00ff88' },
  { notes: ['D','F','A'], name: 'D Minor', effect: 'vision',       duration: 3600, description: 'Show Melodies', color: '#00d4ff' },
  { notes: ['E','G','B'], name: 'E Minor', effect: 'immune',       duration: 1080, description: 'Ghost Immune',  color: '#ffaa00' },
  { notes: ['A','C','E'], name: 'A Minor', effect: 'invisible',    duration: 1080, description: 'Invisible',     color: '#cc44ff' },
  { notes: ['F','A','C'], name: 'F Major', effect: 'slow_ghosts',  duration: 1500, description: 'Slow Ghosts',   color: '#ff6699' },
  { notes: ['G','B','D'], name: 'G Major', effect: 'reveal',       duration: 480,  description: 'Reveal Map',    color: '#ffdd44' },
  { notes: ['B','D','F'], name: 'B Dim',   effect: 'heal',         duration: 120, description: '+1 Life',       color: '#ff4444' },
];

// ─── Tile types ───────────────────────────────────────────────────────────────
export const T_WALL     = 0;
export const T_PATH     = 1;
export const T_DOT      = 2;
export const T_NOTE_C   = 3;
export const T_NOTE_D   = 4;
export const T_NOTE_E   = 5;
export const T_NOTE_F   = 6;
export const T_NOTE_G   = 7;
export const T_NOTE_A   = 8;
export const T_NOTE_B   = 9;
export const T_MELODY_0 = 10;
export const T_MELODY_1 = 11;
export const T_MELODY_2 = 12;
export const T_MELODY_3 = 13;
export const T_MELODY_4 = 14;
export const T_MELODY_5 = 15;
export const T_MELODY_6 = 16;
export const T_CHORD_0  = 17;
export const T_CHORD_1  = 18;
export const T_CHORD_2  = 19;
export const T_CHORD_3  = 20;
export const T_CHORD_4  = 21;
export const T_CHORD_5  = 22;
export const T_CHORD_6  = 23;

export const NOTE_TILES   = [T_NOTE_C, T_NOTE_D, T_NOTE_E, T_NOTE_F, T_NOTE_G, T_NOTE_A, T_NOTE_B];
export const MELODY_TILES = [T_MELODY_0, T_MELODY_1, T_MELODY_2, T_MELODY_3];
export const CHORD_TILES  = [T_CHORD_0, T_CHORD_1, T_CHORD_2, T_CHORD_3, T_CHORD_4, T_CHORD_5, T_CHORD_6];

export function tileToNote(tile: number): NoteName | null {
  const idx = tile - T_NOTE_C;
  return idx >= 0 && idx < 7 ? NOTES[idx] : null;
}
export function noteToTile(note: NoteName): number {
  return T_NOTE_C + NOTES.indexOf(note);
}
export function tileMelodyId(tile: number): number | null {
  const idx = tile - T_MELODY_0;
  return idx >= 0 && idx < 4 ? idx : null;
}
export function tileChordId(tile: number): number | null {
  const idx = tile - T_CHORD_0;
  return idx >= 0 && idx < 6 ? idx : null;
}

// ─── Sprint constants ─────────────────────────────────────────────────────────
export const SPRINT_MULTIPLIER           = 2.2;
export const GHOST_SPRINT_MULTIPLIER     = 1.89;
export const SPRINT_DURATION_TICKS       = 50;
export const SPRINT_COOLDOWN_TICKS       = 220;
export const GHOST_SPRINT_DURATION_TICKS = 70;
export const GHOST_SPRINT_COOLDOWN_TICKS = 200;

// ─── Map/Game constants ───────────────────────────────────────────────────────
export const TILE_SIZE  = 48;
export const MAP_COLS   = 41;
export const MAP_ROWS   = 41;
export const MAP_SEED   = 42;

export const INITIAL_VISION  = 3;
export const MIN_VISION      = 2;
export const MAX_VISION      = 7;
export const VISION_DECAY    = 0.0015;
export const VISION_DOT_RESTORE     = 0.04;
export const VISION_NOTE_RESTORE    = 0.1;
export const VISION_MELODY_RESTORE  = 2.0;

export const INITIAL_SPEED   = 3.2;
export const MIN_SPEED       = 1.5;
export const MAX_SPEED       = 6.0;
export const SPEED_DECAY     = 0.00004;
export const SPEED_DOT_RESTORE      = 0.03;
export const SPEED_NOTE_RESTORE     = 0.1;
export const SPEED_MELODY_RESTORE   = 0.5;

// ─── Maze generator ───────────────────────────────────────────────────────────
function seededRand(seed: number) {
  let s = seed;
  return function (max: number): number {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return Math.abs(s) % max;
  };
}

export function generateMap(): number[][] {
  const W = MAP_COLS;
  const H = MAP_ROWS;

  // Init all walls
  const grid: number[][] = Array.from({ length: H }, () => Array(W).fill(T_WALL));

  const randomSeed = Math.floor(Math.random() * 1000000);
  const rand = seededRand(randomSeed);

  // Randomize the 4 melodies for this game instance
  randomizeMelodies(rand);

  // Iterative DFS maze — cells live at ODD coordinates
  const stack: [number, number][] = [[1, 1]];
  const visited = new Set<number>();
  const key = (x: number, y: number) => y * W + x;

  visited.add(key(1, 1));
  grid[1][1] = T_DOT;

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const dirs = [
      [2, 0], [-2, 0], [0, 2], [0, -2],
    ].filter(([dx, dy]) => {
      const nx = cx + dx, ny = cy + dy;
      return nx > 0 && nx < W - 1 && ny > 0 && ny < H - 1 && !visited.has(key(nx, ny));
    });

    if (dirs.length === 0) {
      stack.pop();
      continue;
    }
    // Fisher-Yates shuffle the candidates
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    const [dx, dy] = dirs[0];
    const nx = cx + dx, ny = cy + dy;
    // Carve wall between
    grid[cy + dy / 2][cx + dx / 2] = T_DOT;
    grid[ny][nx] = T_DOT;
    visited.add(key(nx, ny));
    stack.push([nx, ny]);
  }

  // Add extra connections to break up perfect-maze feel
  for (let attempt = 0; attempt < 80; attempt++) {
    const x = 1 + rand(W - 2);
    const y = 1 + rand(H - 2);
    if (grid[y][x] === T_WALL) {
      const nbrs = [
        grid[y - 1]?.[x], grid[y + 1]?.[x],
        grid[y]?.[x - 1], grid[y]?.[x + 1],
      ].filter(t => t !== undefined);
      const pathCount = nbrs.filter(t => t !== T_WALL).length;
      if (pathCount >= 2) grid[y][x] = T_DOT;
    }
  }

  // Dead-end removal — carve new corridors until no cell has only 1 exit
  const UDIRS4 = [[0,-1],[0,1],[-1,0],[1,0]] as [number,number][];
  for (let pass = 0; pass < 6; pass++) {
    for (let cy = 1; cy < H - 1; cy += 2) {
      for (let cx = 1; cx < W - 1; cx += 2) {
        if (grid[cy][cx] === T_WALL) continue;
        // Count open corridors
        let open = 0;
        for (const [dx, dy] of UDIRS4) {
          if (grid[cy + dy]?.[cx + dx] !== T_WALL) open++;
        }
        if (open !== 1) continue; // not a dead end
        // Try to carve through a closed corridor into an adjacent path cell
        const opts = UDIRS4.filter(([dx, dy]) => {
          const nx = cx + dx * 2, ny = cy + dy * 2;
          return nx > 0 && nx < W - 1 && ny > 0 && ny < H - 1
            && grid[cy + dy][cx + dx] === T_WALL
            && grid[ny][nx] !== T_WALL;
        });
        if (opts.length > 0) {
          const [dx, dy] = opts[rand(opts.length)];
          grid[cy + dy][cx + dx] = T_DOT;
        }
      }
    }
  }

  // Thin dot density — remove ~35% of dots so not every corridor tile has one
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (grid[r][c] === T_DOT && rand(100) < 35) {
        grid[r][c] = T_PATH;
      }
    }
  }

  // Gather all path tiles
  const pathTiles: [number, number][] = [];
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (grid[r][c] !== T_WALL) pathTiles.push([c, r]);
    }
  }

  // Shuffle path tiles for placement
  for (let i = pathTiles.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [pathTiles[i], pathTiles[j]] = [pathTiles[j], pathTiles[i]];
  }

  // Player start = tile closest to center
  // (kept as T_DOT — engine reads player start separately)

  let placed = 0;

  // Melody spots: one in each corner of the map
  const melodyRegions = [
    { minX: 1,  maxX: 16, minY: 1,  maxY: 16 },
    { minX: 24, maxX: 39, minY: 1,  maxY: 16 },
    { minX: 1,  maxX: 16, minY: 24, maxY: 39 },
    { minX: 24, maxX: 39, minY: 24, maxY: 39 },
  ];

  const melodyTileTypes = [T_MELODY_0, T_MELODY_1, T_MELODY_2, T_MELODY_3];
  const usedMelodyTiles = new Set<number>();

  for (let m = 0; m < 4; m++) {
    const reg = melodyRegions[m];
    for (const [px, py] of pathTiles) {
      const k = key(px, py);
      if (
        px >= reg.minX && px <= reg.maxX &&
        py >= reg.minY && py <= reg.maxY &&
        !usedMelodyTiles.has(k)
      ) {
        grid[py][px] = melodyTileTypes[m];
        usedMelodyTiles.add(k);
        break;
      }
    }
  }

  // Chord spots: 7 spread across the map
  const chordRegions = [
    { minX: 5, maxX: 15, minY: 5, maxY: 20 },
    { minX: 25, maxX: 36, minY: 5, maxY: 20 },
    { minX: 5, maxX: 15, minY: 20, maxY: 36 },
    { minX: 25, maxX: 36, minY: 20, maxY: 36 },
    { minX: 14, maxX: 28, minY: 5, maxY: 18 },
    { minX: 14, maxX: 28, minY: 22, maxY: 36 },
    { minX: 14, maxX: 28, minY: 18, maxY: 22 }, // Center region for the 7th chord
  ];

  const chordTileTypes = [T_CHORD_0, T_CHORD_1, T_CHORD_2, T_CHORD_3, T_CHORD_4, T_CHORD_5, T_CHORD_6];
  const usedChordTiles = new Set<number>();

  for (let c = 0; c < 7; c++) {
    const reg = chordRegions[c];
    for (const [px, py] of pathTiles) {
      const k = key(px, py);
      if (
        px >= reg.minX && px <= reg.maxX &&
        py >= reg.minY && py <= reg.maxY &&
        !usedMelodyTiles.has(k) && !usedChordTiles.has(k)
      ) {
        grid[py][px] = chordTileTypes[c];
        usedChordTiles.add(k);
        break;
      }
    }
  }

  // Note pickups: compute needed counts × 2, scatter across remaining path tiles
  const noteCounts: Record<NoteName, number> = { C: 0, D: 0, E: 0, F: 0, G: 0, A: 0, B: 0 };
  for (const melody of MELODIES) {
    for (const n of melody.notes) noteCounts[n]++;
  }

  const noteQueue: NoteName[] = [];
  for (const note of NOTES) {
    if (noteCounts[note] > 0) {
      // Spawn exactly what is needed + 1 spare note maximum for each required note type
      const count = noteCounts[note] + 1;
      for (let i = 0; i < count; i++) noteQueue.push(note);
    } else {
      // If note isn't needed at all, maybe spawn 1 just in case, or 0? 
      // The prompt said "not more than 1 spare notes total on board", so 1 spare for unused notes too.
      noteQueue.push(note);
    }
  }
  // Shuffle noteQueue
  for (let i = noteQueue.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [noteQueue[i], noteQueue[j]] = [noteQueue[j], noteQueue[i]];
  }

  let noteIdx = 0;
  const reservedKeys = new Set([...usedMelodyTiles, ...usedChordTiles]);

  for (const [px, py] of pathTiles) {
    if (noteIdx >= noteQueue.length) break;
    const k = key(px, py);
    if (reservedKeys.has(k)) continue;
    if (grid[py][px] !== T_DOT) continue;

    // Place every ~8th tile as a note pickup — rest stay as regular dots
    placed++;
    if (placed % 8 === 0) {
      grid[py][px] = noteToTile(noteQueue[noteIdx]);
      noteIdx++;
    }
  }

  return grid;
}

// Compute player start tile (first odd-coord path tile near center)
export function getPlayerStart(grid: number[][]): [number, number] {
  const cx = Math.floor(MAP_COLS / 2);
  const cy = Math.floor(MAP_ROWS / 2);
  let best: [number, number] = [1, 1];
  let bestDist = Infinity;
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (grid[r][c] !== T_WALL) {
        const d = Math.abs(c - cx) + Math.abs(r - cy);
        if (d < bestDist) { bestDist = d; best = [c, r]; }
      }
    }
  }
  return best;
}

// Ghost start positions: 4 corners + 2 mid-edge points
export function getGhostStarts(grid: number[][]): [number, number][] {
  const starts: [number, number][] = [
    [1, 1], [MAP_COLS - 2, 1],
    [1, MAP_ROWS - 2], [MAP_COLS - 2, MAP_ROWS - 2],
    [Math.floor(MAP_COLS / 2), 1],
    [1, Math.floor(MAP_ROWS / 2)],
  ];
  return starts.map(([cx, cy]) => {
    for (let r = Math.max(0, cy - 4); r < Math.min(MAP_ROWS, cy + 4); r++) {
      for (let c = Math.max(0, cx - 4); c < Math.min(MAP_COLS, cx + 4); c++) {
        if (grid[r][c] !== T_WALL) return [c, r] as [number, number];
      }
    }
    return [1, 1] as [number, number];
  });
}
