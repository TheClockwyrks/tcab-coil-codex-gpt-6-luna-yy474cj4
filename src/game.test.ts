import { describe, expect, it } from "vitest";
import type { InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import { game } from "./game";

async function setup() {
  const api = {
    input: { register: () => undefined },
    assets: { loadImage: async () => ({}) as ImageBitmap },
    audio: { load: async () => undefined },
    diagnostics: { register: () => undefined },
  } as unknown as InitApi<import("./game").CoilState>;
  return game.initialize(api);
}

const updateApi = {
  input: {
    pressed: () => false,
    pointer: () => ({ x: 0, y: 0, down: false, device: "mouse", buttons: [] }),
    pointerSamples: () => [],
  },
  audio: {
    muted: () => false,
    setMuted: () => undefined,
    play: () => undefined,
    loop: () => undefined,
    stop: () => undefined,
  },
} as unknown as UpdateApi;

describe("Coil simulation", () => {
  it("keeps whole ticks and remainder independent of frame partitioning", async () => {
    const [initial, debug] = await setup();
    const state = debug.setScreen(initial, "playing");
    const once = game.update(state, updateApi, 0.25);
    const split = game.update(
      game.update(state, updateApi, 0.125),
      updateApi,
      0.125,
    );
    expect(debug.snapshot(once)).toMatchObject({ ticks: 2, simTime: 0.25 });
    expect(debug.snapshot(split)).toMatchObject({ ticks: 2, simTime: 0.25 });
    expect(once.snake).toEqual(split.snake);
  });

  it("scores a pellet, grows once, and raises the combo on a quick second eat", async () => {
    const [initial, debug] = await setup();
    let state = debug.setScreen(initial, "playing");
    state = debug.setSnake(state, [{ col: 15, row: 8 }]);
    state = debug.setDirection(state, "right");
    state = debug.setPellet(state, 16, 8);
    state = game.update(state, updateApi, 0.125);
    expect(state.score).toBe(10);
    expect(state.snake).toHaveLength(2);
    expect(state.combo).toBe(1);
  });
});
