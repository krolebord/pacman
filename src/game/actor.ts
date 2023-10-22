export class ActorPos {
  constructor(public rawX: number, public rawY: number) {}

  get x() {
    return Math.round(this.rawX);
  }

  get y() {
    return Math.round(this.rawY);
  }

  get raw() {
    return { x: this.rawX, y: this.rawY };
  }
}
