import { assets } from "../assets";
import { ActorPos } from "./actor";
import type { Engine } from "./engine";
import type { GameGrid } from "./grid";
import type { Pacman } from "./pacman";
import type { Point } from "./types";

type AIType = "blinky" | "pinky" | "inky" | "clyde";
export type AIState = "chase" | "scatter";

type AIBehaviour = {
  aiType: AIType;
  scatterTarget: Point;
  chaseTarget: (pacman: Pacman, ghost: Ghost, ghosts: Ghost[]) => Point;
};

function getAIBehaviour(aiType: AIType): AIBehaviour {
  switch (aiType) {
    case "blinky":
      return {
        aiType,
        scatterTarget: { x: 32, y: 0 },
        chaseTarget: (pacman) => pacman.getPos(),
      };
    case "inky":
      return {
        aiType,
        scatterTarget: { x: 32, y: 32 },
        chaseTarget: (pacman, _, ghosts) => {
          const blinkyPos = ghosts.find((ghost) => ghost.type === "blinky")!;
          const pacmanPos = pacman.getPos();
          const facingDir = pacman.getFacingDir();

          const cursor = {
            x: pacmanPos.x + facingDir.x * 2,
            y: pacmanPos.y + facingDir.y * 2,
          };
          const fromBlinky = {
            x: cursor.x - blinkyPos.getPos().x,
            y: cursor.y - blinkyPos.getPos().y,
          };

          return {
            x: fromBlinky.x * 2,
            y: fromBlinky.y * 2,
          };
        },
      };
    case "pinky":
      return {
        aiType,
        scatterTarget: { x: 0, y: 0 },
        chaseTarget: (pacman) => {
          const pacmanPos = pacman.getPos();
          const facingDir = pacman.getFacingDir();
          return {
            x: pacmanPos.x + facingDir.x * 2,
            y: pacmanPos.y + facingDir.y * 2,
          };
        },
      };
    case "clyde":
      return {
        aiType,
        scatterTarget: { x: 0, y: 32 },
        chaseTarget: (pacman, ghost) => {
          const pacmanPos = pacman.getPos();
          const clydePos = ghost.getPos();
          const distance = Math.sqrt(
            (pacmanPos.x - clydePos.x) ** 2 + (pacmanPos.y - clydePos.y) ** 2
          );
          if (distance > 8) {
            return pacmanPos;
          } else {
            return { x: 0, y: 32 };
          }
        },
      };
  }
}

export class Ghost {
  private pos: ActorPos;
  private nextPos: Point;
  private speed: number;
  private mode: AIState;
  private target: Point = { x: 0, y: 0 };
  private dir: Point = { x: 0, y: 0 };
  private behaviour: AIBehaviour;

  constructor(aiType: AIType, pos: Point, speed: number) {
    this.pos = new ActorPos(pos.x, pos.y);
    this.nextPos = pos;
    this.speed = speed;
    this.mode = "scatter";
    this.behaviour = getAIBehaviour(aiType);
  }

  get type() {
    return this.behaviour.aiType;
  }

  setMode(state: AIState) {
    this.mode = state;
  }

  getPos() {
    return this.pos;
  }

  setPos(pos: Point) {
    this.pos = new ActorPos(pos.x, pos.y);
    this.nextPos = pos;
  }

  update(engine: Engine, grid: GameGrid, pacman: Pacman, ghosts: Ghost[]) {
    if (this.pos.x === this.nextPos.x && this.pos.y === this.nextPos.y) {
      this.target =
        this.mode === "scatter"
          ? this.behaviour.scatterTarget
          : this.behaviour.chaseTarget(pacman, this, ghosts);

      const directions = [
        { y: -1, x: 0 },
        { y: 1, x: 0 },
        { y: 0, x: -1 },
        { y: 0, x: 1 },
      ].filter(
        (dir) =>
          (this.dir.x === 0 && this.dir.y === 0) ||
          dir.x !== -this.dir.x ||
          dir.y !== -this.dir.y
      );

      const cells = directions
        .map((dir) => {
          const pos = { y: this.pos.y + dir.y, x: this.pos.x + dir.x };
          return {
            ...pos,
            cell: grid.getCell(pos),
            distanceToTarget: Math.sqrt(
              (pos.x - this.target.x) ** 2 + (pos.y - this.target.y) ** 2
            ),
          };
        })
        .filter((cell) => cell.cell !== "X");

      cells.sort((a, b) => a.distanceToTarget - b.distanceToTarget);

      const nextCell = cells[0];
      if (!nextCell) {
        this.dir = { x: -this.dir.x, y: -this.dir.y };
        this.nextPos = {
          x: this.pos.x + this.dir.x,
          y: this.pos.y + this.dir.y,
        };
      } else {
        this.nextPos = { x: nextCell.x, y: nextCell.y };
        this.dir = {
          x: Math.sign(this.nextPos.x - this.pos.x),
          y: Math.sign(this.nextPos.y - this.pos.y),
        };
      }
    }

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

  draw(engine: Engine) {
    const pos = {
      x: (this.pos.rawX + 0.5) * engine.gridToScreenRatio,
      y: (this.pos.rawY + 0.5) * engine.gridToScreenRatio,
    };
    const image = assets[this.behaviour.aiType];

    engine.ctx.translate(pos.x, pos.y);
    engine.ctx.drawImage(
      image,
      -engine.gridToScreenRatio / 2,
      -engine.gridToScreenRatio / 2,
      engine.gridToScreenRatio,
      engine.gridToScreenRatio
    );
    engine.ctx.translate(-pos.x, -pos.y);
  }
}
