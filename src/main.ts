import { Puzzle, type Piece } from "./puzzle";
import { tracePiece } from "./shape";
import { drawPicture } from "./picture";
import "./style.css";

// World units: the stage is 800 × 460, the board 400 × 400 at (30, 30).
const STAGE_WIDTH = 800;
const BOARD = { x: 30, y: 30, width: 400, height: 400 };
const TRAY = { x: 470, y: 20, width: 300, height: 420 };

const stage = document.querySelector<HTMLDivElement>("#stage")!;
const boardEl = document.querySelector<HTMLDivElement>("#board")!;
const sizeSelect = document.querySelector<HTMLSelectElement>("#size")!;
const gridToggle = document.querySelector<HTMLInputElement>("#grid")!;
const statusEl = document.querySelector<HTMLSpanElement>("#status")!;
const picture = drawPicture(BOARD.width, BOARD.height);
const pictureUrl = picture.toDataURL();

let puzzle: Puzzle;
let peek = false;
const views = new Map<Piece, { canvas: HTMLCanvasElement; margin: number }>();

function newPuzzle(): void {
  for (const v of views.values()) v.canvas.remove();
  views.clear();
  puzzle = new Puzzle(Number(sizeSelect.value), BOARD, TRAY);
  const margin = Math.max(puzzle.pieceWidth, puzzle.pieceHeight) * 0.3;
  for (const piece of puzzle.pieces) {
    const canvas = renderPiece(piece, margin);
    stage.appendChild(canvas);
    views.set(piece, { canvas, margin });
  }
  layout();
}

function renderPiece(piece: Piece, margin: number): HTMLCanvasElement {
  const { pieceWidth: w, pieceHeight: h } = puzzle;
  const canvas = document.createElement("canvas");
  canvas.className = "piece";
  canvas.width = w + 2 * margin;
  canvas.height = h + 2 * margin;
  const g = canvas.getContext("2d")!;
  g.beginPath();
  tracePiece(g, piece.edges, w, h, margin);
  g.save();
  g.clip();
  g.drawImage(picture, margin - piece.col * w, margin - piece.row * h);
  g.restore();
  g.strokeStyle = "#0005";
  g.lineWidth = 1.2;
  g.stroke();
  return canvas;
}

function scale(): number {
  return stage.clientWidth / STAGE_WIDTH;
}

function layout(): void {
  const s = scale();
  Object.assign(boardEl.style, {
    left: `${BOARD.x * s}px`,
    top: `${BOARD.y * s}px`,
    width: `${BOARD.width * s}px`,
    height: `${BOARD.height * s}px`,
  });
  const cell = `${100 / puzzle.size}% ${100 / puzzle.size}%`;
  const layers = [];
  if (gridToggle.checked) {
    layers.push(`linear-gradient(#8885 1px, transparent 1px) 0 0 / ${cell}`);
    layers.push(`linear-gradient(90deg, #8885 1px, transparent 1px) 0 0 / ${cell}`);
  }
  boardEl.style.background = layers.join(", ");
  boardEl.classList.toggle("peek", peek);
  boardEl.style.setProperty("--picture", `url(${pictureUrl})`);

  for (const [piece, { canvas, margin }] of views) {
    canvas.style.width = `${canvas.width * s}px`;
    canvas.style.height = `${canvas.height * s}px`;
    canvas.style.left = `${(piece.x - margin) * s}px`;
    canvas.style.top = `${(piece.y - margin) * s}px`;
    canvas.classList.toggle("locked", piece.locked);
  }
  statusEl.textContent = puzzle.isSolved()
    ? "🎉 Solved!"
    : `${puzzle.placedCount()} / ${puzzle.pieces.length} placed`;
}

function isOpaqueAt(canvas: HTMLCanvasElement, clientX: number, clientY: number): boolean {
  const rect = canvas.getBoundingClientRect();
  const k = canvas.width / rect.width;
  const alpha = canvas
    .getContext("2d")!
    .getImageData((clientX - rect.left) * k, (clientY - rect.top) * k, 1, 1).data[3];
  return alpha > 10;
}

/** The topmost loose piece whose visible shape (not its transparent margin) is under the pointer. */
function pieceAt(clientX: number, clientY: number): [Piece, HTMLCanvasElement] | undefined {
  const canvases = [...stage.querySelectorAll<HTMLCanvasElement>("canvas.piece:not(.locked)")].reverse();
  for (const canvas of canvases) {
    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom)
      continue;
    if (!isOpaqueAt(canvas, clientX, clientY)) continue;
    const piece = [...views].find(([, v]) => v.canvas === canvas)![0];
    return [piece, canvas];
  }
  return undefined;
}

stage.addEventListener("pointerdown", (down) => {
  const hit = pieceAt(down.clientX, down.clientY);
  if (!hit) return;
  const [piece, canvas] = hit;
  down.preventDefault();
  stage.appendChild(canvas); // bring to front, and keep it there after the drop
  const s = scale();
  const from = { x: piece.x, y: piece.y };
  const offsetX = down.clientX / s - piece.x;
  const offsetY = down.clientY / s - piece.y;
  canvas.classList.add("dragging");
  canvas.setPointerCapture(down.pointerId);

  const move = (e: PointerEvent) => {
    piece.x = e.clientX / s - offsetX;
    piece.y = e.clientY / s - offsetY;
    layout();
  };
  const up = () => {
    canvas.classList.remove("dragging");
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    const dropped = { x: piece.x, y: piece.y };
    if (puzzle.drop(piece, dropped.x, dropped.y, from) === "rejected") {
      explode(canvas, dropped.x + puzzle.pieceWidth / 2, dropped.y + puzzle.pieceHeight / 2);
      flyBack(canvas);
    }
    layout();
  };
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
});

/** Burst of picture-coloured shards at a world point. */
function explode(source: HTMLCanvasElement, x: number, y: number): void {
  const s = scale();
  const g = source.getContext("2d")!;
  for (let i = 0; i < 28; i++) {
    const shard = document.createElement("div");
    shard.className = "shard";
    const px = (0.3 + Math.random() * 0.4) * source.width;
    const py = (0.3 + Math.random() * 0.4) * source.height;
    const [r, gr, b] = g.getImageData(px, py, 1, 1).data;
    const size = 4 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;
    const distance = (40 + Math.random() * 90) * s;
    Object.assign(shard.style, {
      left: `${x * s}px`,
      top: `${y * s}px`,
      width: `${size}px`,
      height: `${size}px`,
      background: `rgb(${r}, ${gr}, ${b})`,
    });
    stage.appendChild(shard);
    shard
      .animate(
        [
          { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(0.3) rotate(${Math.random() * 720 - 360}deg)`,
            opacity: 0,
          },
        ],
        { duration: 600 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.3,1)" },
      )
      .finished.then(() => shard.remove());
  }
}

/** Animate a rejected piece from where it was dropped back to where layout() puts it. */
function flyBack(canvas: HTMLCanvasElement): void {
  const before = canvas.getBoundingClientRect();
  requestAnimationFrame(() => {
    const after = canvas.getBoundingClientRect();
    canvas.animate(
      [
        {
          transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) scale(0.6) rotate(-20deg)`,
          opacity: 0.2,
        },
        { transform: "none", opacity: 1 },
      ],
      { duration: 450, easing: "cubic-bezier(.3,1.4,.5,1)" },
    );
  });
}

document.querySelector("#new")!.addEventListener("click", newPuzzle);
document.querySelector("#peek")!.addEventListener("click", () => {
  peek = !peek;
  layout();
});
sizeSelect.addEventListener("change", newPuzzle);
gridToggle.addEventListener("change", layout);
addEventListener("resize", layout);
newPuzzle();
