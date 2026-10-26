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
  views.forEach((v) => v.canvas.remove());
  views.clear();
  puzzle = new Puzzle(Number(sizeSelect.value), BOARD, TRAY);
  const margin = Math.max(puzzle.pieceWidth, puzzle.pieceHeight) * 0.3;
  for (const piece of puzzle.pieces) {
    const canvas = renderPiece(piece, margin);
    stage.appendChild(canvas);
    views.set(piece, { canvas, margin });
    enableDragging(piece, canvas);
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
  const alpha = canvas.getContext("2d")!.getImageData((clientX - rect.left) * k, (clientY - rect.top) * k, 1, 1).data[3];
  return alpha > 10;
}

function enableDragging(piece: Piece, canvas: HTMLCanvasElement): void {
  canvas.addEventListener("pointerdown", (down) => {
    if (piece.locked || !isOpaqueAt(canvas, down.clientX, down.clientY)) return;
    down.preventDefault();
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
      puzzle.drop(piece, piece.x, piece.y, from);
      layout();
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
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
