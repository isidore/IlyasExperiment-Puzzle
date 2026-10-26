import { describe, expect, it } from "vitest";
import { Puzzle } from "./puzzle";

const board = { x: 0, y: 0, width: 400, height: 400 };
const tray = { x: 450, y: 0, width: 300, height: 400 };

function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function newPuzzle(size = 4) {
  return new Puzzle(size, board, tray, seeded());
}

describe("Puzzle", () => {
  it("creates size × size pieces, all loose in the tray", () => {
    const puzzle = newPuzzle(4);
    expect(puzzle.pieces).toHaveLength(16);
    for (const p of puzzle.pieces) {
      expect(p.locked).toBe(false);
      expect(p.x).toBeGreaterThanOrEqual(tray.x);
    }
  });

  it("gives border pieces flat outer edges", () => {
    const puzzle = newPuzzle(3);
    for (const p of puzzle.pieces) {
      if (p.row === 0) expect(p.edges.top).toBe(0);
      if (p.row === 2) expect(p.edges.bottom).toBe(0);
      if (p.col === 0) expect(p.edges.left).toBe(0);
      if (p.col === 2) expect(p.edges.right).toBe(0);
    }
  });

  it("makes neighbouring edges fit: a tab meets a hole", () => {
    const puzzle = newPuzzle(4);
    const at = (r: number, c: number) => puzzle.pieces.find((p) => p.row === r && p.col === c)!;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (c < 3) {
          expect(at(r, c).edges.right).not.toBe(0);
          expect(at(r, c).edges.right).toBe(-at(r, c + 1).edges.left);
        }
        if (r < 3) {
          expect(at(r, c).edges.bottom).not.toBe(0);
          expect(at(r, c).edges.bottom).toBe(-at(r + 1, c).edges.top);
        }
      }
    }
  });

  it("snaps a piece dropped near its home cell and locks it", () => {
    const puzzle = newPuzzle(4);
    const piece = puzzle.pieces[5]; // row 1, col 1 → home (100, 100)
    const from = { x: piece.x, y: piece.y };
    puzzle.drop(piece, 108, 93, from);
    expect([piece.x, piece.y]).toEqual([100, 100]);
    expect(piece.locked).toBe(true);
    expect(puzzle.placedCount()).toBe(1);
  });

  it("snaps a piece dropped on the wrong cell to the grid without locking", () => {
    const puzzle = newPuzzle(4);
    const piece = puzzle.pieces[0]; // home (0, 0)
    puzzle.drop(piece, 205, 297, { x: piece.x, y: piece.y });
    expect([piece.x, piece.y]).toEqual([200, 300]);
    expect(piece.locked).toBe(false);
  });

  it("leaves a piece where it was dropped when off the board", () => {
    const puzzle = newPuzzle(4);
    const piece = puzzle.pieces[0];
    puzzle.drop(piece, 600, 50, { x: piece.x, y: piece.y });
    expect([piece.x, piece.y]).toEqual([600, 50]);
  });

  it("swaps with a loose piece already in the cell", () => {
    const puzzle = newPuzzle(4);
    const [a, b] = puzzle.pieces; // homes (0,0) and (100,0)
    puzzle.drop(a, 300, 300, { x: a.x, y: a.y });
    const bStart = { x: b.x, y: b.y };
    puzzle.drop(b, 300, 300, bStart);
    expect([b.x, b.y]).toEqual([300, 300]);
    expect([a.x, a.y]).toEqual([bStart.x, bStart.y]);
  });

  it("swapping can lock the displaced piece when it lands home", () => {
    const puzzle = newPuzzle(4);
    const [a, b] = puzzle.pieces; // homes (0,0) and (100,0)
    puzzle.drop(a, 100, 0, { x: a.x, y: a.y }); // a sits in b's cell
    puzzle.drop(b, 100, 0, { x: 0, y: 0 }); // b picked up from a's home
    expect(a.locked).toBe(true);
    expect(b.locked).toBe(true);
  });

  it("sends a piece back when the cell holds a locked piece", () => {
    const puzzle = newPuzzle(4);
    const [a, b] = puzzle.pieces;
    puzzle.drop(a, 0, 0, { x: a.x, y: a.y });
    const bStart = { x: b.x, y: b.y };
    puzzle.drop(b, 0, 0, bStart);
    expect([b.x, b.y]).toEqual([bStart.x, bStart.y]);
    expect([a.x, a.y]).toEqual([0, 0]);
  });

  it("does not move locked pieces", () => {
    const puzzle = newPuzzle(4);
    const a = puzzle.pieces[0];
    puzzle.drop(a, 0, 0, { x: a.x, y: a.y });
    puzzle.drop(a, 300, 300, { x: 0, y: 0 });
    expect([a.x, a.y]).toEqual([0, 0]);
  });

  it("is solved once every piece is home", () => {
    const puzzle = newPuzzle(3);
    expect(puzzle.isSolved()).toBe(false);
    for (const p of puzzle.pieces) {
      const home = puzzle.home(p);
      puzzle.drop(p, home.x, home.y, { x: p.x, y: p.y });
    }
    expect(puzzle.isSolved()).toBe(true);
  });
});
