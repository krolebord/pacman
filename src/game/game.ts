import type { Engine } from "./engine";
import { Ghost, type AIState } from "./ghost";
import { GameGrid } from "./grid";
import { Pacman } from "./pacman";
import { PacmanAI } from "./pacman-ai";
import type { Point } from "./types";

const ghostSpawn = {
  x: 13,
  y: 11,
};

const leftPortalPos = { x: 0, y: 14 };
const leftPortalOutPos = { x: 1, y: 14 };
const rightPortalPos = { x: 27, y: 14 };
const rightPortalOutPos = { x: 26, y: 14 };

export class Game {
  private score = 0;
  private ai = true;
  private pacman = new Pacman(
    { x: 13, y: 23 },
    Math.round(Math.random() * 4) + 6
  );
  private pacmanAI = new PacmanAI();

  private modeTimer = 0;
  private modeTimers = [
    { mode: "scatter", time: 7 } as const,
    { mode: "chase", time: 20 } as const,
    { mode: "scatter", time: 7 } as const,
    { mode: "chase", time: 20 } as const,
    { mode: "scatter", time: 5 } as const,
    { mode: "chase", time: 20 } as const,
    { mode: "scatter", time: 5 } as const,
    { mode: "chase", time: Infinity } as const,
  ].reverse();

  private lastGhostSpawn = 0;
  private ghostSpawns: Ghost[] = [
    new Ghost("blinky", ghostSpawn, Math.round(Math.random() * 4) + 3),
    new Ghost("inky", ghostSpawn, Math.round(Math.random() * 4) + 3),
    new Ghost("pinky", ghostSpawn, Math.round(Math.random() * 4) + 3),
    new Ghost("clyde", ghostSpawn, Math.round(Math.random() * 4) + 3),
  ].reverse();

  private ghostMode: AIState = "scatter";
  private ghosts: Ghost[] = [];

  private grid = new GameGrid([
    "XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "XooooooooooooXXooooooooooooX",
    "XoXXXXoXXXXXoXXoXXXXXoXXXXoX",
    "XOXXXXoXXXXXoXXoXXXXXoXXXXOX",
    "XoXXXXoXXXXXoXXoXXXXXoXXXXoX",
    "XooooooooooooooooooooooooooX",
    "XoXXXXoXXoXXXXXXXXoXXoXXXXoX",
    "XoXXXXoXXoXXXXXXXXoXXoXXXXoX",
    "XooooooXXooooXXooooXXooooooX",
    "XXXXXXoXXXXX XX XXXXXoXXXXXX",
    "XXXXXXoXXXXX XX XXXXXoXXXXXX",
    "XXXXXXoXX          XXoXXXXXX",
    "XXXXXXoXX XXXXXXXX XXoXXXXXX",
    "XXXXXXoXX X      X XXoXXXXXX",
    "      o   X      X   o      ",
    "XXXXXXoXX X      X XXoXXXXXX",
    "XXXXXXoXX XXXXXXXX XXoXXXXXX",
    "XXXXXXoXX          XXoXXXXXX",
    "XXXXXXoXX XXXXXXXX XXoXXXXXX",
    "XXXXXXoXX XXXXXXXX XXoXXXXXX",
    "XooooooooooooXXooooooooooooX",
    "XoXXXXoXXXXXoXXoXXXXXoXXXXoX",
    "XoXXXXoXXXXXoXXoXXXXXoXXXXoX",
    "XOooXXooooooo  oooooooXXooOX",
    "XXXoXXoXXoXXXXXXXXoXXoXXoXXX",
    "XXXoXXoXXoXXXXXXXXoXXoXXoXXX",
    "XooooooXXooooXXooooXXooooooX",
    "XoXXXXXXXXXXoXXoXXXXXXXXXXoX",
    "XoXXXXXXXXXXoXXoXXXXXXXXXXoX",
    "XooooooooooooooooooooooooooX",
    "XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  ]);

  constructor(private readonly engine: Engine) {}

  update() {
    if (
      performance.now() - this.modeTimer >
      this.modeTimers[this.modeTimers.length - 1].time * 1000
    ) {
      this.modeTimers.pop()!;
      const { mode } = this.modeTimers[this.modeTimers.length - 1];
      this.modeTimer = performance.now();
      this.setGhostMode(mode);
    }

    if (
      Date.now() - this.lastGhostSpawn > 12_000 &&
      this.ghostSpawns.length > 0
    ) {
      this.lastGhostSpawn = Date.now();
      const ghost = this.ghostSpawns.pop()!;
      ghost.setMode(this.ghostMode);
      this.ghosts.push(ghost);
    }

    this.ghosts.forEach((ghost) =>
      ghost.update(this.engine, this.grid, this.pacman, this.ghosts)
    );

    this.pacman.update(this.engine, this.grid);
    if (this.ai) {
      this.pacmanAI.update(this.grid, this.pacman, this.ghosts);
    }

    const pacmanPos = this.pacman.getPos();
    const pacmanCell = this.grid.getCell(pacmanPos);
    if (pacmanCell === "o") {
      this.collectCoin(pacmanPos);
    }

    [this.pacman, ...this.ghosts].forEach((actor) => {
      const actorPos = actor.getPos();
      if (actorPos.x === leftPortalPos.x && actorPos.y === leftPortalPos.y) {
        actor.setPos(rightPortalOutPos);
      } else if (
        actorPos.x === rightPortalPos.x &&
        actorPos.y === rightPortalPos.y
      ) {
        actor.setPos(leftPortalOutPos);
      }
    });

    if (
      this.ghosts.some(
        (x) => x.getPos().x === pacmanPos.x && x.getPos().y === pacmanPos.y
      )
    ) {
      this.engine.setHeader("Game Over");
      cancelAnimationFrame(this.engine.stopMain);
    }
  }

  draw() {
    this.engine.setHeader(
      `Score: ${this.score} (AI: ${this.ai ? "on" : "off"})`
    );
    this.pacman.draw(this.engine);
    if (this.ai) {
      this.pacmanAI.draw(this.engine);
    }
    this.ghosts.forEach((ghost) => ghost.draw(this.engine));
    this.grid.draw(this.engine);
  }

  collectCoin(pos: Point) {
    this.grid.clearCell(pos);

    this.score += 10;

    if (this.score === 2400) {
      this.engine.setHeader("You Win!");
      cancelAnimationFrame(this.engine.stopMain);
    }
  }

  handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowUp":
        this.pacman.setInputDir({ x: 0, y: -1 });
        break;
      case "ArrowDown":
        this.pacman.setInputDir({ x: 0, y: 1 });
        break;
      case "ArrowLeft":
        this.pacman.setInputDir({ x: -1, y: 0 });
        break;
      case "ArrowRight":
        this.pacman.setInputDir({ x: 1, y: 0 });
        break;
      case " ":
        this.ai = !this.ai;
        break;
    }
  }

  setGhostMode(mode: AIState) {
    this.ghostMode = mode;
    this.ghosts.forEach((ghost) => ghost.setMode(mode));
  }
}
