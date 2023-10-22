import { assets } from "../assets";
import type { Engine } from "./engine";
import type { GameGrid } from "./grid";
import type { Point } from "./types";
import { ActorPos } from "./actor";

export class Pacman {
  private pos: ActorPos;
  private dir: Point;
  private facingDir: Point;
  private inputDir: Point;
  private speed: number;

  constructor(pos: Point, speed: number) {
    this.pos = new ActorPos(pos.x, pos.y);
    this.dir = { x: 0, y: 0 };
    this.facingDir = { x: 1, y: 0 };
    this.inputDir = { x: 0, y: 0 };
    this.speed = speed;
  }

  getPos() {
    return this.pos;
  }

  getFacingDir() {
    return this.facingDir;
  }

  update(engine: Engine, grid: GameGrid) {
    if (this.inputDir.x !== this.dir.x || this.inputDir.y != this.dir.y) {
      const nextInputCell = grid.getNeighbouringCell(this.pos, this.inputDir);
      if (nextInputCell !== "X") {
        this.dir = this.inputDir;
        this.facingDir = this.inputDir;
      }
    }

    const nextCell = grid.getNeighbouringCell(this.pos, this.dir);
    if (nextCell === "X") {
      this.dir.x = 0;
      this.dir.y = 0;
      this.pos.rawX = this.pos.x;
      this.pos.rawY = this.pos.y;
    } else {
      const ticksPerSecond = 1000 / engine.tickLength;
      if (this.dir.x !== 0) {
        this.pos.rawX += (this.dir.x * this.speed) / ticksPerSecond;
        this.pos.rawY = this.pos.y;
      }
      if (this.dir.y !== 0) {
        this.pos.rawX = this.pos.x;
        this.pos.rawY += (this.dir.y * this.speed) / ticksPerSecond;
      }
    }
  }

  draw(engine: Engine) {
    const pos = {
      x: (this.pos.rawX + 0.5) * engine.gridToScreenRatio,
      y: (this.pos.rawY + 0.5) * engine.gridToScreenRatio,
    };
    const image = assets.pacman;
    const angle = Math.atan2(this.facingDir.y, this.facingDir.x);

    engine.ctx.translate(pos.x, pos.y);
    engine.ctx.rotate(angle);
    engine.ctx.drawImage(
      image,
      -engine.gridToScreenRatio / 2,
      -engine.gridToScreenRatio / 2,
      engine.gridToScreenRatio,
      engine.gridToScreenRatio
    );
    engine.ctx.rotate(-angle);
    engine.ctx.translate(-pos.x, -pos.y);
  }

  setInputDir(dir: Point) {
    this.inputDir = dir;
  }

  setPos(pos: Point) {
    this.pos.rawX = pos.x;
    this.pos.rawY = pos.y;
  }
}
