export type Engine = {
  ctx: CanvasRenderingContext2D;
  lastRender: number;
  lastTick: number;
  tickLength: number;
  stopMain: number;
  gridToScreenRatio: number;
  setHeader: (header: string) => void;
};
