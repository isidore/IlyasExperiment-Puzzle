import { context2d } from "./dom";

/** A generated sunset picture, so the puzzle needs no image files. */
export function drawPicture(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = context2d(canvas);
  const sx = width / 400,
    sy = height / 400;
  g.scale(sx, sy);

  const sky = g.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, "#ffb46b");
  sky.addColorStop(0.55, "#ff6f91");
  sky.addColorStop(1, "#5b3a8c");
  g.fillStyle = sky;
  g.fillRect(0, 0, 400, 400);

  g.fillStyle = "#fff3c4";
  g.beginPath();
  g.arc(280, 150, 55, 0, Math.PI * 2);
  g.fill();

  mountains(g, "#2d1e4f", [
    [0, 300],
    [90, 200],
    [170, 280],
    [260, 190],
    [400, 310],
  ]);
  mountains(g, "#1a1233", [
    [0, 350],
    [120, 290],
    [230, 340],
    [330, 300],
    [400, 340],
  ]);

  g.fillStyle = "#fff";
  g.font = "bold 28px system-ui, sans-serif";
  g.fillText("Ilyas Experiment", 20, 44);
  return canvas;
}

function mountains(g: CanvasRenderingContext2D, color: string, ridge: [number, number][]): void {
  g.fillStyle = color;
  g.beginPath();
  const [[startX, startY], ...rest] = ridge;
  g.moveTo(startX, startY);
  for (const [x, y] of rest) g.lineTo(x, y);
  g.lineTo(400, 400);
  g.lineTo(0, 400);
  g.fill();
}
