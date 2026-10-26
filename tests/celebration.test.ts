// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { danceWave, formatTime, recordBestTime, showResultCard } from "../src/celebration";

describe("formatTime", () => {
  it("shows minutes and zero-padded seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(7)).toBe("0:07");
    expect(formatTime(167)).toBe("2:47");
    expect(formatTime(600)).toBe("10:00");
  });

  it("rounds to whole seconds", () => {
    expect(formatTime(59.6)).toBe("1:00");
  });
});

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("recordBestTime", () => {
  it("returns undefined on the first solve and remembers the time", () => {
    const storage = memoryStorage();
    expect(recordBestTime(storage, 4, 90)).toBeUndefined();
    expect(recordBestTime(storage, 4, 120)).toBe(90);
  });

  it("only keeps a faster time", () => {
    const storage = memoryStorage();
    recordBestTime(storage, 4, 90);
    recordBestTime(storage, 4, 120);
    expect(recordBestTime(storage, 4, 60)).toBe(90);
    expect(recordBestTime(storage, 4, 200)).toBe(60);
  });

  it("keeps a separate best per puzzle size", () => {
    const storage = memoryStorage();
    recordBestTime(storage, 4, 90);
    expect(recordBestTime(storage, 5, 300)).toBeUndefined();
  });

  it("copes with missing or broken storage", () => {
    expect(recordBestTime(undefined, 4, 90)).toBeUndefined();
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => undefined,
    };
    expect(recordBestTime(broken, 4, 90)).toBeUndefined();
  });
});

describe("showResultCard", () => {
  let stage: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '<div id="stage"></div>';
    stage = document.querySelector("#stage") as HTMLElement;
    Element.prototype.animate = vi.fn() as unknown as Element["animate"];
  });

  it("shows time, moves and pieces", () => {
    const card = showResultCard(stage, { seconds: 167, moves: 23, pieces: 16 }, () => undefined);
    expect(card.parentElement).toBe(stage);
    expect(card.textContent).toContain("You did it!");
    expect(card.textContent).toContain("2:47");
    expect(card.textContent).toContain("23");
    expect(card.textContent).toContain("16");
  });

  it("says when it is the first solve, or shows the best time", () => {
    const first = showResultCard(stage, { seconds: 10, moves: 1, pieces: 9 }, () => undefined);
    expect(first.textContent).toContain("First solve at this size!");
    const later = showResultCard(
      stage,
      { seconds: 10, moves: 1, pieces: 9, bestSeconds: 75 },
      () => undefined,
    );
    expect(later.textContent).toContain("Best: 1:15");
  });

  it("starts a new game from Play again", () => {
    const onPlayAgain = vi.fn();
    const card = showResultCard(stage, { seconds: 1, moves: 1, pieces: 9 }, onPlayAgain);
    card.querySelector("button")?.click();
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });

  it("can be dragged out of the way", () => {
    const card = showResultCard(stage, { seconds: 1, moves: 1, pieces: 9 }, () => undefined);
    card.setPointerCapture = vi.fn();
    const at = (type: string, x: number, y: number) =>
      card.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, bubbles: true }));
    const start = { left: card.offsetLeft, top: card.offsetTop };
    at("pointerdown", 100, 100);
    at("pointermove", 160, 70);
    at("pointerup", 160, 70);
    expect(card.style.left).toBe(`${start.left + 60}px`);
    expect(card.style.top).toBe(`${start.top - 30}px`);
    expect(card.classList.contains("dragging")).toBe(false);
  });
});

describe("danceWave", () => {
  it("makes every piece hop, in a wave that starts at the top-left", () => {
    const delays: number[] = [];
    const piece = (row: number, col: number) => {
      const canvas = document.createElement("canvas");
      canvas.animate = vi.fn((_frames, options) => {
        delays.push((options as KeyframeAnimationOptions).delay as number);
        return {} as Animation;
      });
      return { canvas, row, col };
    };
    danceWave([piece(0, 0), piece(0, 1), piece(1, 1)]);
    expect(delays).toEqual([0, 90, 180]);
  });
});
