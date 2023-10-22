import { assets } from "../assets";
import type { Engine } from "./engine";
import type { Point } from "./types";

export class GameGrid {
  constructor(private readonly grid: string[]) {}

  draw(engine: Engine) {
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        const cell = this.grid[y][x];
        if (cell === "X") {
          engine.ctx.fillStyle = "#2D72C6";
          engine.ctx.fillRect(
            x * engine.gridToScreenRatio,
            y * engine.gridToScreenRatio,
            engine.gridToScreenRatio,
            engine.gridToScreenRatio
          );
        } else if (cell === "o") {
          const pos = {
            x: x * engine.gridToScreenRatio,
            y: y * engine.gridToScreenRatio,
          };

          engine.ctx.fillStyle = "#FFFC34";
          engine.ctx.beginPath();
          engine.ctx.arc(
            pos.x + engine.gridToScreenRatio / 2,
            pos.y + engine.gridToScreenRatio / 2,
            engine.gridToScreenRatio / 4,
            0,
            2 * Math.PI
          );
          engine.ctx.fill();
        }
      }
    }
  }

  getCell(pos: Point) {
    return this.grid[pos.y][pos.x];
  }

  clearCell(pos: Point) {
    const row = this.grid[pos.y];
    this.grid[pos.y] = row.substring(0, pos.x) + " " + row.substring(pos.x + 1);
  }

  getNeighbouringCell(pos: Point, dir: Point) {
    return this.grid[pos.y + dir.y][pos.x + dir.x];
  }

  getNeighbouringCells(pos: Point) {
    return [
      { y: pos.y - 1, x: pos.x },
      { y: pos.y + 1, x: pos.x },
      { y: pos.y, x: pos.x - 1 },
      { y: pos.y, x: pos.x + 1 },
    ].map((pos) => ({
      ...pos,
      cell: this.getCell(pos),
    }));
  }
}
