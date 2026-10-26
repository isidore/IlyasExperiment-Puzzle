import { Puzzle, type Piece } from "./puzzle";
import { tracePiece } from "./shape";
import { drawPicture } from "./picture";
import { context2d, element } from "./dom";
import { danceWave, showResultCard } from "./celebration";
import "./style.css";

// World units: the stage is 800 × 460, the board 400 × 400 at (30, 30).
const STAGE_WIDTH = 800;
const BOARD = { x: 30, y: 30, width: 400, height: 400 };
const TRAY = { x: 470, y: 20, width: 300, height: 420 };

const stage = element<HTMLDivElement>("#stage");
const boardEl = element<HTMLDivElement>("#board");
const sizeSelect = element<HTMLSelectElement>("#size");
const gridToggle = element<HTMLInputElement>("#grid");
const statusEl = element<HTMLSpanElement>("#status");
const picture = drawPicture(BOARD.width, BOARD.height);
const pictureUrl = picture.toDataURL();

let puzzle: Puzzle;
let peek = false;
let startedAt: number | undefined;
const views = new Map<Piece, { canvas: HTMLCanvasElement; margin: number }>();

function newPuzzle(): void {
  for (const v of views.values()) v.canvas.remove();
  views.clear();
  for (const card of stage.querySelectorAll(".result-card")) card.remove();
  startedAt = undefined;
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
  const g = context2d(canvas);
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
  const gridLines = gridToggle.checked
    ? ["linear-gradient(#8885 1px, transparent 1px)", "linear-gradient(90deg, #8885 1px, transparent 1px)"]
    : [];
  boardEl.style.backgroundImage = gridLines.join(", ");
  boardEl.style.backgroundSize = gridLines.map(() => cell).join(", ");
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
  const alpha = context2d(canvas).getImageData((clientX - rect.left) * k, (clientY - rect.top) * k, 1, 1)
    .data[3];
  return alpha > 10;
}

/** The topmost loose piece whose visible shape (not its transparent margin) is under the pointer. */
function pieceAt(clientX: number, clientY: number): [Piece, HTMLCanvasElement] | undefined {
  const topFirst = [...views].sort(([, a], [, b]) =>
    a.canvas.compareDocumentPosition(b.canvas) & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : -1,
  );
  for (const [piece, { canvas }] of topFirst) {
    if (piece.locked) continue;
    const rect = canvas.getBoundingClientRect();
    const inside =
      clientX >= rect.left && clientX < rect.right && clientY >= rect.top && clientY < rect.bottom;
    if (inside && isOpaqueAt(canvas, clientX, clientY)) return [piece, canvas];
  }
  return undefined;
}

stage.addEventListener("pointerdown", (down) => {
  const hit = pieceAt(down.clientX, down.clientY);
  if (!hit) return;
  const [piece, canvas] = hit;
  down.preventDefault();
  stage.appendChild(canvas); // bring to front, and keep it there after the drop
  startedAt ??= performance.now();
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
    const wasSolved = puzzle.isSolved();
    if (puzzle.drop(piece, dropped.x, dropped.y, from) === "rejected") {
      explode(canvas, dropped.x + puzzle.pieceWidth / 2, dropped.y + puzzle.pieceHeight / 2);
      flyBack(canvas);
    }
    layout();
    if (!wasSolved && puzzle.isSolved()) celebrate();
  };
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
});

function celebrate(): void {
  danceWave([...views].map(([piece, { canvas }]) => ({ canvas, row: piece.row, col: piece.col })));
  const seconds = (performance.now() - (startedAt ?? performance.now())) / 1000;
  const bestSeconds = recordBestTime(puzzle.size, seconds);
  showResultCard(
    stage,
    { seconds, moves: puzzle.moves, pieces: puzzle.pieces.length, bestSeconds },
    newPuzzle,
  );
}

/** Saves a new best time per puzzle size; returns the previous best (undefined on a first solve). */
function recordBestTime(size: number, seconds: number): number | undefined {
  const key = `jigsaw-best-${size}`;
  try {
    const stored = localStorage.getItem(key);
    const previous = stored === null ? undefined : Number(stored);
    if (previous === undefined || seconds < previous) localStorage.setItem(key, String(seconds));
    return previous;
  } catch {
    return undefined; // storage unavailable (private window etc.)
  }
}

/** Burst of picture-coloured shards at a world point. */
function explode(source: HTMLCanvasElement, x: number, y: number): void {
  const s = scale();
  const g = context2d(source);
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

element("#new").addEventListener("click", newPuzzle);
element("#peek").addEventListener("click", () => {
  peek = !peek;
  layout();
});
sizeSelect.addEventListener("change", newPuzzle);
gridToggle.addEventListener("change", layout);
addEventListener("resize", layout);
newPuzzle();
