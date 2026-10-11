import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  BINDINGS,
  BOARD_X,
  BOARD_Y,
  BITE_SECONDS,
  BEST_LABEL,
  CELL,
  CLEARED_TEXT,
  COMBO_MAX,
  COMBO_WINDOW,
  COIL_DEBUG_VERSION,
  CUES,
  CUE_PATHS,
  DIRECTIONS,
  GAMEOVER_TEXT,
  GRID_COLS,
  GRID_ROWS,
  INTERIOR_MAX_COL,
  INTERIOR_MAX_ROW,
  INTERIOR_MIN_COL,
  INTERIOR_MIN_ROW,
  MODE,
  MODE_LABEL,
  OBSTACLE_CELLS,
  OVER_ITEMS,
  PAUSE_ITEMS,
  PELLET_POINTS,
  SCORE_LABEL,
  SPRITE_PATHS,
  START_CELLS,
  START_DIR,
  STAGE_CX,
  TICK_SECONDS,
  TITLE_ITEMS,
  TITLE_TEXT,
  TAGLINE_TEXT,
  TURN_QUEUE_MAX,
  type Cell,
  type Direction,
  type Screen,
} from "./constants";

export const BACKGROUND = "#070b18";
type Rect = { x: number; y: number; w: number; h: number };
type SpriteSet = {
  head: readonly ImageBitmap[];
  body: ImageBitmap;
  corner: ImageBitmap;
  tail: ImageBitmap;
};
export interface CoilState {
  screen: Screen;
  menuIndex: number;
  titleIndex: number;
  score: number;
  best: number;
  combo: number;
  comboWindow: number;
  muted: boolean;
  ticks: number;
  simTime: number;
  dir: Direction;
  turns: Direction[];
  snake: Cell[];
  pellet: Cell | null;
  obstacles: Cell[];
  steering: boolean;
  travel: boolean;
  pelletRespawn: boolean;
  nextPellet: Cell | null;
  accumulator: number;
  bite: number;
  pointerIndex: number;
  sprites: SpriteSet;
}
export interface CoilDebugApi {
  version: number;
  reset(s: DeepReadonly<CoilState>): CoilState;
  reconcile(s: DeepReadonly<CoilState>): CoilState;
  snapshot(s: DeepReadonly<CoilState>): unknown;
  menuItemRect(s: DeepReadonly<CoilState>, i: number): Rect | null;
  setScreen(s: DeepReadonly<CoilState>, v: Screen): CoilState;
  setMenuIndex(s: DeepReadonly<CoilState>, v: number): CoilState;
  setScore(s: DeepReadonly<CoilState>, v: number): CoilState;
  setBest(s: DeepReadonly<CoilState>, v: number): CoilState;
  setCombo(s: DeepReadonly<CoilState>, v: number): CoilState;
  setComboWindow(s: DeepReadonly<CoilState>, v: number): CoilState;
  setSnake(s: DeepReadonly<CoilState>, v: Cell[]): CoilState;
  setDirection(s: DeepReadonly<CoilState>, v: Direction): CoilState;
  clearTurns(s: DeepReadonly<CoilState>): CoilState;
  setSnakeSteering(s: DeepReadonly<CoilState>, v: boolean): CoilState;
  setSnakeTravel(s: DeepReadonly<CoilState>, v: boolean): CoilState;
  setPellet(s: DeepReadonly<CoilState>, c: number, r: number): CoilState;
  clearPellet(s: DeepReadonly<CoilState>): CoilState;
  setPelletRespawn(s: DeepReadonly<CoilState>, v: boolean): CoilState;
  setNextPellet(s: DeepReadonly<CoilState>, c: number, r: number): CoilState;
  drawPelletCell(s: DeepReadonly<CoilState>): Cell | null;
}
const copyCell = (c: Cell): Cell => ({ col: c.col, row: c.row });
const menu = (screen: Screen): readonly string[] =>
  screen === "title"
    ? TITLE_ITEMS
    : screen === "paused"
      ? PAUSE_ITEMS
      : screen === "gameover" || screen === "cleared"
        ? OVER_ITEMS
        : screen === "howto"
          ? ["BACK"]
          : [];
const rect = (i: number): Rect => ({
  x: STAGE_CX - 150,
  y: 466 + i * 56,
  w: 300,
  h: 44,
});
const clone = (s: DeepReadonly<CoilState>): CoilState => ({
  ...s,
  snake: s.snake.map(copyCell),
  turns: [...s.turns],
  obstacles: s.obstacles.map(copyCell),
  pellet: s.pellet && copyCell(s.pellet),
  nextPellet: s.nextPellet && copyCell(s.nextPellet),
});
const validCell = (s: DeepReadonly<CoilState>, c: Cell) =>
  c.col >= INTERIOR_MIN_COL &&
  c.col <= INTERIOR_MAX_COL &&
  c.row >= INTERIOR_MIN_ROW &&
  c.row <= INTERIOR_MAX_ROW &&
  !s.snake.some((x) => x.col === c.col && x.row === c.row) &&
  !s.obstacles.some((x) => x.col === c.col && x.row === c.row);
const randomCell = (s: DeepReadonly<CoilState>): Cell | null => {
  const cells: Cell[] = [];
  for (let r = INTERIOR_MIN_ROW; r <= INTERIOR_MAX_ROW; r++)
    for (let c = INTERIOR_MIN_COL; c <= INTERIOR_MAX_COL; c++) {
      const cell = { col: c, row: r };
      if (validCell(s, cell)) cells.push(cell);
    }
  return cells.length ? cells[Math.floor(Math.random() * cells.length)]! : null;
};
const fresh = (s?: DeepReadonly<CoilState>): CoilState => ({
  screen: "title",
  menuIndex: 0,
  titleIndex: 0,
  score: 0,
  best: s?.best ?? 0,
  combo: 1,
  comboWindow: 0,
  muted: s?.muted ?? false,
  ticks: 0,
  simTime: 0,
  dir: START_DIR as Direction,
  turns: [],
  snake: START_CELLS.map(copyCell),
  pellet: null,
  obstacles: OBSTACLE_CELLS.map(copyCell),
  steering: true,
  travel: true,
  pelletRespawn: true,
  nextPellet: null,
  accumulator: 0,
  bite: 0,
  pointerIndex: -1,
  sprites: s?.sprites as SpriteSet,
});
const validInt = (n: number, min: number, max = Infinity) =>
  Number.isInteger(n) && n >= min && n <= max;
const menuIndex = (s: DeepReadonly<CoilState>, i: number) => {
  if (
    !validInt(i, 0) ||
    (menu(s.screen).length ? i >= menu(s.screen).length : i !== 0)
  )
    throw new RangeError(`menu index ${i}`);
};
const direction = (d: string): d is Direction =>
  (DIRECTIONS as readonly string[]).includes(d);
export const game: Game<CoilState, CoilDebugApi> = {
  async initialize(api: InitApi<CoilState>) {
    for (const name of ACTIONS)
      api.input.register(name, { keys: [...BINDINGS[name]] });
    const [head0, head1, head2, head3, body, corner, tail] = await Promise.all(
      [
        ...SPRITE_PATHS.head,
        SPRITE_PATHS.body,
        SPRITE_PATHS.corner,
        SPRITE_PATHS.tail,
      ].map((p) => api.assets.loadImage(p)),
    );
    for (const [cue, path] of Object.entries(CUE_PATHS))
      await api.audio.load(cue, path);
    const state = fresh();
    state.sprites = {
      head: [head0!, head1!, head2!, head3!],
      body,
      corner,
      tail,
    };
    const names: Record<
      string,
      (s: DeepReadonly<CoilState>) => string | number | boolean
    > = {
      screen: (s) => s.screen,
      score: (s) => s.score,
      best: (s) => s.best,
      combo: (s) => s.combo,
      window: (s) => s.comboWindow,
      dir: (s) => s.dir,
      length: (s) => s.snake.length,
      head: (s) => `${s.snake[0]?.col},${s.snake[0]?.row}`,
      pellet: (s) => (s.pellet ? `${s.pellet.col},${s.pellet.row}` : "none"),
    };
    for (const [n, fn] of Object.entries(names))
      api.diagnostics.register(n, fn);
    const debug: CoilDebugApi = {
      version: COIL_DEBUG_VERSION,
      reset: (s) => fresh(s),
      reconcile: (s) => clone(s),
      snapshot: (s) => ({
        version: COIL_DEBUG_VERSION,
        screen: s.screen,
        menuIndex: s.menuIndex,
        titleIndex: s.titleIndex,
        mode: MODE,
        score: s.score,
        best: s.best,
        combo: s.combo,
        comboWindow: s.comboWindow,
        muted: s.muted,
        ticks: s.ticks,
        simTime: s.simTime,
        dir: s.dir,
        turns: [...s.turns],
        snake: s.snake.map(copyCell),
        pellet: s.pellet && copyCell(s.pellet),
        obstacles: s.obstacles.map(copyCell),
        steering: s.steering,
        travel: s.travel,
        pelletRespawn: s.pelletRespawn,
        nextPellet: s.nextPellet && copyCell(s.nextPellet),
      }),
      menuItemRect: (s, i) => {
        if (!validInt(i, 0)) throw new RangeError(`menu index ${i}`);
        return i < menu(s.screen).length ? rect(i) : null;
      },
      setScreen: (s, v) => {
        if (
          !(
            [
              "title",
              "howto",
              "playing",
              "paused",
              "gameover",
              "cleared",
            ] as string[]
          ).includes(v)
        )
          throw Error(`screen ${v}`);
        return { ...clone(s), screen: v };
      },
      setMenuIndex: (s, v) => {
        menuIndex(s, v);
        return { ...clone(s), menuIndex: v };
      },
      setScore: (s, v) => {
        if (!validInt(v, 0)) throw new RangeError(`score ${v}`);
        return { ...clone(s), score: v };
      },
      setBest: (s, v) => {
        if (!validInt(v, 0)) throw new RangeError(`best ${v}`);
        return { ...clone(s), best: v };
      },
      setCombo: (s, v) => {
        if (!validInt(v, 1, COMBO_MAX)) throw new RangeError(`combo ${v}`);
        return { ...clone(s), combo: v };
      },
      setComboWindow: (s, v) => {
        if (!Number.isFinite(v) || v < 0 || v > COMBO_WINDOW)
          throw new RangeError(`combo window ${v}`);
        return { ...clone(s), comboWindow: v };
      },
      setSnake: (s, v) => {
        if (
          !v.length ||
          v.some(
            (c, i) =>
              !Number.isInteger(c.col) ||
              !Number.isInteger(c.row) ||
              c.col < 1 ||
              c.col > 28 ||
              c.row < 1 ||
              c.row > 16 ||
              s.obstacles.some((o) => o.col === c.col && o.row === c.row) ||
              (i > 0 &&
                Math.abs(c.col - v[i - 1]!.col) +
                  Math.abs(c.row - v[i - 1]!.row) !==
                  1),
          ) ||
          new Set(v.map((c) => `${c.col},${c.row}`)).size !== v.length
        )
          throw Error("invalid snake chain");
        return { ...clone(s), snake: v.map(copyCell) };
      },
      setDirection: (s, v) => {
        if (!direction(v)) throw Error(`direction ${v}`);
        return { ...clone(s), dir: v };
      },
      clearTurns: (s) => ({ ...clone(s), turns: [] }),
      setSnakeSteering: (s, v) => ({ ...clone(s), steering: v }),
      setSnakeTravel: (s, v) => ({ ...clone(s), travel: v }),
      setPellet: (s, c, r) => {
        const p = { col: c, row: r };
        if (!validCell(s, p)) throw Error("invalid pellet cell");
        return { ...clone(s), pellet: p };
      },
      clearPellet: (s) => ({ ...clone(s), pellet: null }),
      setPelletRespawn: (s, v) => ({ ...clone(s), pelletRespawn: v }),
      setNextPellet: (s, c, r) => {
        if (!validInt(c, 0, GRID_COLS - 1) || !validInt(r, 0, GRID_ROWS - 1))
          throw Error("invalid next pellet cell");
        return { ...clone(s), nextPellet: { col: c, row: r } };
      },
      drawPelletCell: (s) => randomCell(s),
    };
    return [state, debug];
  },
  update(state, api: UpdateApi, dt) {
    let s = clone(state);
    if (api.input.pressed("mute")) api.audio.setMuted(!api.audio.muted());
    s.muted = api.audio.muted();
    const items = menu(s.screen);
    const ptr = api.input.pointer();
    const samples = api.input.pointerSamples();
    let pressed = s.pointerIndex;
    if (items.length) {
      for (const sample of samples) {
        const i = items.findIndex((_, n) => {
          const r = rect(n);
          return (
            sample.x >= r.x &&
            sample.x <= r.x + r.w &&
            sample.y >= r.y &&
            sample.y <= r.y + r.h
          );
        });
        if (sample.type === "down") {
          pressed = i;
          s.pointerIndex = i;
        }
        if (sample.type === "move" && i >= 0) s.menuIndex = i;
        if (sample.type === "up") {
          if (i >= 0) s.menuIndex = i;
          if (i >= 0 && pressed === i) s = activate(s, api);
          pressed = -1;
          s.pointerIndex = -1;
        }
      }
      if (ptr.x >= 0 && ptr.y >= 0 && ptr.x <= 1280 && ptr.y <= 720) {
        const i = items.findIndex((_, n) => {
          const r = rect(n);
          return (
            ptr.x >= r.x &&
            ptr.x <= r.x + r.w &&
            ptr.y >= r.y &&
            ptr.y <= r.y + r.h
          );
        });
        if (i >= 0) s.menuIndex = i;
      }
    }
    if (s.screen !== "playing") {
      if (api.input.pressed("up"))
        s.menuIndex =
          (s.menuIndex + items.length - 1) % Math.max(items.length, 1);
      if (api.input.pressed("down"))
        s.menuIndex = (s.menuIndex + 1) % Math.max(items.length, 1);
      if (api.input.pressed("confirm")) s = activate(s, api);
      if (api.input.pressed("back")) {
        if (
          s.screen === "howto" ||
          s.screen === "gameover" ||
          s.screen === "cleared"
        )
          s = { ...s, screen: "title", menuIndex: s.titleIndex };
        else if (s.screen === "paused")
          s = { ...s, screen: "playing", menuIndex: 0 };
      }
    } else {
      if (api.input.pressed("pause") || api.input.pressed("back"))
        s = { ...s, screen: "paused", menuIndex: 0 };
      for (const d of DIRECTIONS)
        if (
          api.input.pressed(d) &&
          s.steering &&
          s.turns.length < TURN_QUEUE_MAX
        )
          s.turns.push(d);
    }
    if (s.screen === "playing") {
      s.simTime += dt;
      s.bite = Math.max(0, s.bite - dt);
      s.accumulator += dt;
      while (s.accumulator + 1e-9 >= TICK_SECONDS && s.screen === "playing") {
        s.accumulator -= TICK_SECONDS;
        s.ticks++;
        if (s.steering && s.turns.length) {
          const d = s.turns.shift()!;
          if (
            s.dir === "left" || s.dir === "right"
              ? d === "up" || d === "down"
              : d === "left" || d === "right"
          )
            s.dir = d;
        }
        if (s.travel) {
          const delta = {
            up: [0, -1],
            down: [0, 1],
            left: [-1, 0],
            right: [1, 0],
          }[s.dir]!;
          const h = {
            col: s.snake[0]!.col + delta[0]!,
            row: s.snake[0]!.row + delta[1]!,
          };
          const eat =
            !!s.pellet && h.col === s.pellet.col && h.row === s.pellet.row;
          const body = eat ? s.snake : s.snake.slice(0, -1);
          if (
            h.col === 0 ||
            h.row === 0 ||
            h.col === GRID_COLS - 1 ||
            h.row === GRID_ROWS - 1 ||
            s.obstacles.some((c) => c.col === h.col && c.row === h.row) ||
            body.some((c) => c.col === h.col && c.row === h.row)
          ) {
            s.screen = "gameover";
            s.menuIndex = 0;
            api.audio.play(CUES.death);
            api.audio.stop(CUES.music);
            s.accumulator = 0;
            break;
          }
          s.snake = [h, ...(eat ? s.snake : s.snake.slice(0, -1))];
          if (eat) {
            const old = s.combo;
            s.combo = s.comboWindow > 0 ? Math.min(COMBO_MAX, s.combo + 1) : 1;
            s.score += PELLET_POINTS * s.combo;
            s.best = Math.max(s.best, s.score);
            s.comboWindow = COMBO_WINDOW;
            s.bite = BITE_SECONDS;
            s.pellet = null;
            api.audio.play(CUES.eat);
            if (s.combo > old) api.audio.play(CUES.comboUp);
            if (s.pelletRespawn) {
              const p =
                s.nextPellet && validCell(s, s.nextPellet)
                  ? s.nextPellet
                  : randomCell(s);
              s.nextPellet = null;
              s.pellet = p;
              if (!p) {
                s.screen = "cleared";
                s.menuIndex = 0;
                api.audio.stop(CUES.music);
              }
            }
          }
        }
        if (s.comboWindow > 0) {
          s.comboWindow = Math.max(0, s.comboWindow - TICK_SECONDS);
          if (s.comboWindow === 0) s.combo = 1;
        }
      }
    } else s.accumulator = 0;
    s.best = Math.max(s.best, s.score);
    return s;
  },
  render(state, api: RenderApi) {
    const c = api.ctx;
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#0c1425";
    c.fillRect(BOARD_X, BOARD_Y, GRID_COLS * CELL, GRID_ROWS * CELL);
    c.fillStyle = "#17263d";
    c.fillRect(BOARD_X, BOARD_Y, GRID_COLS * CELL, CELL);
    c.fillRect(
      BOARD_X,
      BOARD_Y + (GRID_ROWS - 1) * CELL,
      GRID_COLS * CELL,
      CELL,
    );
    c.fillRect(BOARD_X, BOARD_Y, CELL, GRID_ROWS * CELL);
    c.fillRect(
      BOARD_X + (GRID_COLS - 1) * CELL,
      BOARD_Y,
      CELL,
      GRID_ROWS * CELL,
    );
    c.strokeStyle = "#172941";
    c.lineWidth = 1;
    for (let x = 0; x <= GRID_COLS; x++) {
      c.beginPath();
      c.moveTo(BOARD_X + x * CELL, BOARD_Y);
      c.lineTo(BOARD_X + x * CELL, BOARD_Y + GRID_ROWS * CELL);
      c.stroke();
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      c.beginPath();
      c.moveTo(BOARD_X, BOARD_Y + y * CELL);
      c.lineTo(BOARD_X + GRID_COLS * CELL, BOARD_Y + y * CELL);
      c.stroke();
    }
    const draw = (img: ImageBitmap, cell: Cell, rot: number) => {
      c.save();
      c.translate(
        BOARD_X + (cell.col + 0.5) * CELL,
        BOARD_Y + (cell.row + 0.5) * CELL,
      );
      c.rotate((rot * Math.PI) / 2);
      c.drawImage(img, -CELL / 2, -CELL / 2, CELL, CELL);
      c.restore();
    };
    const angle = (d: Direction) => ({ right: 0, down: 1, left: 2, up: 3 })[d];
    const cells = state.snake;
    cells.forEach((cell, i) => {
      if (i === 0) {
        const frame =
          state.bite > 0
            ? Math.min(
                3,
                1 +
                  Math.floor(((BITE_SECONDS - state.bite) / BITE_SECONDS) * 3),
              )
            : 0;
        draw(state.sprites.head[frame]!, cell, angle(state.dir));
        return;
      }
      const prev = cells[i - 1]!,
        next = cells[i + 1];
      if (!next) {
        const d: Direction =
          prev.col > cell.col
            ? "right"
            : prev.col < cell.col
              ? "left"
              : prev.row > cell.row
                ? "down"
                : "up";
        draw(state.sprites.tail, cell, angle(d));
        return;
      }
      const a = { x: prev.col - cell.col, y: prev.row - cell.row },
        b = { x: next.col - cell.col, y: next.row - cell.row };
      if (a.x + b.x === 0 || a.y + b.y === 0) {
        draw(state.sprites.body, cell, a.x === 0 ? 1 : 0);
      } else {
        const rot =
          (a.x === 1 && b.y === 1) || (b.x === 1 && a.y === 1)
            ? 0
            : (a.x === -1 && b.y === 1) || (b.x === -1 && a.y === 1)
              ? 1
              : (a.x === -1 && b.y === -1) || (b.x === -1 && a.y === -1)
                ? 2
                : 3;
        draw(state.sprites.corner, cell, rot);
      }
    });
    if (state.pellet) {
      const x = BOARD_X + (state.pellet.col + 0.5) * CELL,
        y = BOARD_Y + (state.pellet.row + 0.5) * CELL;
      c.shadowColor = "#ff426e";
      c.shadowBlur = 20;
      c.fillStyle = "#ff527d";
      c.beginPath();
      c.arc(x, y, 9, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = "#ffd4df";
      c.beginPath();
      c.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
      c.fill();
    }
    c.textAlign = "left";
    c.fillStyle = "#7f9bb8";
    c.font = "700 13px monospace";
    c.fillText(SCORE_LABEL, BOARD_X, 29);
    c.fillText(BEST_LABEL, BOARD_X + 180, 29);
    c.fillText("MODE", BOARD_X + 680, 29);
    c.fillText(state.muted ? "◖ MUTED" : "◖ SOUND ON", BOARD_X + 790, 29);
    c.textAlign = "left";
    c.fillStyle = "#e9f7ff";
    c.font = "700 32px monospace";
    c.fillText(String(state.score).padStart(5, "0"), BOARD_X, 68);
    c.fillText(String(state.best).padStart(5, "0"), BOARD_X + 180, 68);
    c.fillStyle = "#36f3ca";
    c.fillText(MODE_LABEL, BOARD_X + 680, 68);
    if (state.combo >= 2) {
      c.fillStyle = "#ffd166";
      c.fillText(`x${state.combo}`, BOARD_X + 460, 60);
      c.fillStyle = "#223349";
      c.fillRect(BOARD_X + 460, 76, 112, 5);
      c.fillStyle = "#ffd166";
      c.fillRect(
        BOARD_X + 460,
        76,
        (112 * state.comboWindow) / COMBO_WINDOW,
        5,
      );
    }
    if (state.screen !== "playing") {
      c.fillStyle = "rgba(4,8,20,.78)";
      c.fillRect(0, 0, 1280, 720);
      c.textAlign = "center";
      if (state.screen === "title") {
        c.fillStyle = "#44f5d4";
        c.font = "900 86px monospace";
        c.fillText(TITLE_TEXT, STAGE_CX, 250);
        c.fillStyle = "#a5bfd3";
        c.font = "700 18px monospace";
        c.fillText(TAGLINE_TEXT, STAGE_CX, 286);
      } else {
        c.fillStyle = "#44f5d4";
        c.font = "800 40px monospace";
        c.fillText(
          state.screen === "howto"
            ? "HOW TO PLAY"
            : state.screen === "paused"
              ? "PAUSED"
              : state.screen === "cleared"
                ? CLEARED_TEXT
                : GAMEOVER_TEXT,
          STAGE_CX,
          300,
        );
      }
      if (state.screen === "howto") {
        c.fillStyle = "#c2d5e8";
        c.font = "15px monospace";
        [
          "The serpent never stops. Turns resolve on the next tick.",
          "Turn at right angles; walls and your own body end the run.",
          "Pellets grow your coil. Chain them quickly to build x5 combo.",
          "Arrows / WASD steer · Enter confirms · P pauses · M mutes",
        ].forEach((t, i) => c.fillText(t, STAGE_CX, 365 + i * 27));
      }
      const opts = menu(state.screen);
      opts.forEach((item, i) => {
        const r = rect(i);
        c.fillStyle = i === state.menuIndex ? "#173c4c" : "#111e32";
        c.fillRect(r.x, r.y, r.w, r.h);
        c.strokeStyle = i === state.menuIndex ? "#44f5d4" : "#29405a";
        c.strokeRect(r.x, r.y, r.w, r.h);
        c.fillStyle = i === state.menuIndex ? "#eaffff" : "#9cb3c8";
        c.font = "700 17px monospace";
        c.fillText(item, STAGE_CX, r.y + 28);
      });
      c.textAlign = "left";
    }
  },
};
function activate(s: CoilState, api: UpdateApi): CoilState {
  const i = s.menuIndex;
  if (s.screen === "title") {
    const n = { ...s, titleIndex: i };
    if (i === 0) {
      const freshState = fresh(s);
      freshState.screen = "playing";
      freshState.pellet = randomCell(freshState);
      api.audio.loop(CUES.music);
      return freshState;
    }
    return { ...n, screen: "howto", menuIndex: 0 };
  }
  if (s.screen === "howto")
    return { ...s, screen: "title", menuIndex: s.titleIndex };
  if (s.screen === "paused") {
    if (i === 0) return { ...s, screen: "playing", menuIndex: 0 };
    if (i === 1) {
      const f = fresh(s);
      f.screen = "playing";
      f.pellet = randomCell(f);
      api.audio.loop(CUES.music);
      return f;
    }
    api.audio.stop(CUES.music);
    return { ...s, screen: "title", menuIndex: s.titleIndex };
  }
  if (s.screen === "gameover" || s.screen === "cleared") {
    if (i === 0) {
      const f = fresh(s);
      f.screen = "playing";
      f.pellet = randomCell(f);
      api.audio.loop(CUES.music);
      return f;
    }
    return { ...s, screen: "title", menuIndex: s.titleIndex };
  }
  return s;
}
