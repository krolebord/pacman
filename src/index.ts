import { type Engine } from "./game/engine";
import { Game } from "./game/game";
import type { Size } from "./game/types";

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const scoreLabel = document.getElementById("score-label") as HTMLSpanElement;

if (!ctx) {
  throw new Error("Could not get canvas context");
}

const gridSize = { width: 28, height: 31 } as const;

const screenSize = {
  width: window.innerWidth - 18,
  height: window.innerHeight - 18 - 64,
};
const gridToScreenRatio = getGridToScreenRatio(gridSize, screenSize);

canvas.width = gridSize.width * gridToScreenRatio;
canvas.height = gridSize.height * gridToScreenRatio;

const engine: Engine = {
  ctx,
  lastTick: performance.now(),
  lastRender: performance.now(),
  gridToScreenRatio,
  stopMain: 0,
  tickLength: 20,
  setHeader(content) {
    scoreLabel.innerHTML = content;
  },
};

const game = new Game(engine);

window.onkeydown = (e) => {
  game.handleKeyDown(e);
};

const render = (tFrame: number) => {
  const timeSinceTick = tFrame - engine.lastTick;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-over";

  game.draw();
};

const update = (lastUpdate: number) => {
  game.update();
};

main(performance.now()); // Start the cycle

function main(tFrame: number) {
  engine.stopMain = window.requestAnimationFrame(main);
  const nextTick = engine.lastTick + engine.tickLength;
  let numTicks = 0;

  // If tFrame < nextTick then 0 ticks need to be updated (0 is default for numTicks).
  // If tFrame = nextTick then 1 tick needs to be updated (and so forth).
  // Note: As we mention in summary, you should keep track of how large numTicks is.
  // If it is large, then either your game was asleep, or the machine cannot keep up.
  if (tFrame > nextTick) {
    const timeSinceTick = tFrame - engine.lastTick;
    numTicks = Math.floor(timeSinceTick / engine.tickLength);
  }

  queueUpdates(numTicks);
  render(tFrame);
  engine.lastRender = tFrame;
}

function queueUpdates(numTicks: number) {
  for (let i = 0; i < numTicks; i++) {
    engine.lastTick += engine.tickLength; // Now lastTick is this tick.
    update(engine.lastTick);
  }
}

function getGridToScreenRatio(gridSize: Size, screenSize: Size) {
  if (screenSize.height > screenSize.width) {
    return screenSize.width / gridSize.width;
  }
  return screenSize.height / gridSize.height;
}
