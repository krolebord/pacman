import type { Engine } from "./engine";
import type { Ghost } from "./ghost";
import type { GameGrid } from "./grid";
import type { Pacman } from "./pacman";

export class PacmanAI {
  private currentPath: { x: number; y: number }[] = [];

  update(grid: GameGrid, pacman: Pacman, ghosts: Ghost[]) {
    const pacmanPos = pacman.getPos();

    const prev = new DoubleMap<{ x: number; y: number }>();
    const distances = new DoubleMap<number>();
    const visited = new DoubleMap<boolean>();
    const queue: { x: number; y: number }[] = [pacmanPos];

    distances.set(pacmanPos.x, pacmanPos.y, 0);

    while (queue.length > 0) {
      const pos = queue.shift()!;
      const cell = grid.getCell(pos);

      visited.set(pos.x, pos.y, true);

      const neighbours = grid.getNeighbouringCells(pos).filter(
        (x) =>
          x.cell !== "X" &&
          ghosts.every((g) => {
            const gPos = g.getPos();
            const gDir = g.getDir();
            const gNext = {
              x: gPos.x + gDir.x,
              y: gPos.y + gDir.y,
            };
            return (
              gPos.x !== x.x ||
              gPos.y !== x.y ||
              gNext.x !== pos.x ||
              gNext.y !== pos.y
            );
          })
      );

      const nextDistance = distances.get(pos.x, pos.y)! + 1;
      neighbours.forEach((neighbour) => {
        const distance = distances.get(neighbour.x, neighbour.y);

        if (distance === null || distance > nextDistance) {
          distances.set(neighbour.x, neighbour.y, nextDistance);
          prev.set(neighbour.x, neighbour.y, pos);
        }

        if (visited.has(neighbour.x, neighbour.y)) return;
        queue.push(neighbour);
      });

      if (cell === "o") {
        const path = [];
        let current = pos;
        while (current) {
          path.push(current);
          current = prev.get(current.x, current.y)!;
        }
        this.currentPath = path;

        if (this.currentPath.length < 2) return;

        const last = this.currentPath[this.currentPath.length - 2];

        const pacmanDir = {
          x: last.x - pacmanPos.x,
          y: last.y - pacmanPos.y,
        };
        pacman.setInputDir(pacmanDir);
        return;
      }
    }
    this.currentPath = [];
  }

  draw(engine: Engine) {
    if (this.currentPath.length < 2) return;

    let prev = this.currentPath[0];
    engine.ctx.strokeStyle = "red";
    for (let i = 1; i < this.currentPath.length; i++) {
      const next = this.currentPath[i];
      engine.ctx.beginPath();
      engine.ctx.moveTo(
        prev.x * engine.gridToScreenRatio + engine.gridToScreenRatio / 2,
        prev.y * engine.gridToScreenRatio + engine.gridToScreenRatio / 2
      );
      engine.ctx.lineTo(
        next.x * engine.gridToScreenRatio + engine.gridToScreenRatio / 2,
        next.y * engine.gridToScreenRatio + engine.gridToScreenRatio / 2
      );
      engine.ctx.stroke();
      engine.ctx.closePath();

      prev = next;
    }
  }
}

export class DoubleMap<T> {
  readonly arr = [] as T[][];

  get(x: number, y: number) {
    const row = this.arr[y];
    if (!row) {
      this.arr[y] = [];
      return null;
    } else {
      return row[x] ?? null;
    }
  }

  set(x: number, y: number, value: T) {
    const row = this.arr[y];
    if (!row) {
      this.arr[y] = [];
    }
    this.arr[y][x] = value;
  }

  has(x: number, y: number) {
    const row = this.arr[y];
    if (!row) {
      return false;
    } else {
      return row[x] !== undefined;
    }
  }

  log() {
    this.arr.forEach((row) => {
      console.log(row.map((x) => x?.toString()[0]).join(" "));
    });
  }
}
