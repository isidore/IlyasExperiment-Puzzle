export interface Stats {
  seconds: number;
  moves: number;
  pieces: number;
  bestSeconds?: number;
}

/** "m:ss", e.g. 167 → "2:47". */
export function formatTime(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Every piece hops once, in a diagonal wave from the top-left corner. */
export function danceWave(pieces: { canvas: HTMLCanvasElement; row: number; col: number }[]): void {
  for (const { canvas, row, col } of pieces) {
    canvas.animate(
      [
        { transform: "none" },
        { transform: "translateY(-14%) rotate(-6deg) scale(1.08)", offset: 0.4 },
        { transform: "translateY(3%) scale(0.97)", offset: 0.7 },
        { transform: "none" },
      ],
      { duration: 650, delay: (row + col) * 90, easing: "ease-in-out" },
    );
  }
}

/** A "You did it!" card with the stats. Drag it by its body to see the picture underneath. */
export function showResultCard(stage: HTMLElement, stats: Stats, onPlayAgain: () => void): HTMLElement {
  const card = document.createElement("div");
  card.className = "result-card";
  const best =
    stats.bestSeconds === undefined ? "First solve at this size!" : `Best: ${formatTime(stats.bestSeconds)}`;
  card.innerHTML = `
    <h2>🧩 You did it!</h2>
    <div class="stats">
      <div><b>${formatTime(stats.seconds)}</b>time</div>
      <div><b>${stats.moves}</b>moves</div>
      <div><b>${stats.pieces}</b>pieces</div>
    </div>
    <div class="best">${best}</div>
    <button type="button">Play again</button>
    <div class="hint">Drag me to see the picture</div>`;
  card.querySelector("button")?.addEventListener("click", onPlayAgain);
  stage.appendChild(card);
  card.animate(
    [
      { opacity: 0, transform: "translate(-50%, 30%)" },
      { opacity: 1, transform: "translate(-50%, -50%)" },
    ],
    { duration: 600, delay: 1300, easing: "cubic-bezier(.3,1.3,.5,1)", fill: "backwards" },
  );
  makeDraggable(card);
  return card;
}

function makeDraggable(card: HTMLElement): void {
  card.addEventListener("pointerdown", (down) => {
    if ((down.target as HTMLElement).closest("button")) return;
    down.preventDefault();
    const startLeft = card.offsetLeft;
    const startTop = card.offsetTop;
    card.setPointerCapture(down.pointerId);
    card.classList.add("dragging");
    const move = (e: PointerEvent) => {
      card.style.left = `${startLeft + e.clientX - down.clientX}px`;
      card.style.top = `${startTop + e.clientY - down.clientY}px`;
    };
    const up = () => {
      card.classList.remove("dragging");
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerup", up);
    };
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerup", up);
  });
}
