import { describe, expect, it } from "vitest";
import type { Edges } from "../src/puzzle";
import { type PathSink, tracePiece } from "../src/shape";

type Point = [number, number];

/** Records every point the outline passes through (curve control points included). */
function trace(edges: Edges, width = 100, height = 100, margin = 30) {
  const points: Point[] = [];
  const calls: string[] = [];
  const sink: PathSink = {
    moveTo: (x, y) => {
      calls.push("moveTo");
      points.push([x, y]);
    },
    lineTo: (x, y) => {
      calls.push("lineTo");
      points.push([x, y]);
    },
    bezierCurveTo: (c1x, c1y, c2x, c2y, x, y) => {
      calls.push("bezierCurveTo");
      points.push([c1x, c1y], [c2x, c2y], [x, y]);
    },
    closePath: () => calls.push("closePath"),
  };
  tracePiece(sink, edges, width, height, margin);
  return { points, calls };
}

const flat: Edges = { top: 0, right: 0, bottom: 0, left: 0 };

describe("tracePiece", () => {
  it("traces a flat-edged piece as a plain rectangle", () => {
    const { points, calls } = trace(flat);
    expect(calls).toEqual(["moveTo", "lineTo", "lineTo", "lineTo", "lineTo", "closePath"]);
    expect(points).toEqual([
      [30, 30],
      [130, 30],
      [130, 130],
      [30, 130],
      [30, 30],
    ]);
  });

  it("draws two curves for every tab or hole", () => {
    const { calls } = trace({ top: 1, right: -1, bottom: 1, left: -1 });
    expect(calls.filter((c) => c === "bezierCurveTo")).toHaveLength(8);
  });

  it("pushes a tab outward, beyond the piece body", () => {
    const top = trace({ ...flat, top: 1 }).points;
    expect(Math.min(...top.map(([, y]) => y))).toBe(5); // 30 - 0.25 × 100
    const right = trace({ ...flat, right: 1 }).points;
    expect(Math.max(...right.map(([x]) => x))).toBe(155);
  });

  it("cuts a hole inward, into the piece body", () => {
    const { points } = trace({ ...flat, top: -1 });
    expect(Math.min(...points.map(([, y]) => y))).toBe(30);
    const deepest = Math.max(...points.filter(([, y]) => y < 100).map(([, y]) => y));
    expect(deepest).toBeCloseTo(55); // hole tip: 0.25 × 100 below the top edge
  });

  it("keeps everything inside the margin", () => {
    const { points } = trace({ top: 1, right: 1, bottom: 1, left: 1 });
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(160);
      expect(y).toBeLessThanOrEqual(160);
    }
  });

  it("ends where it started", () => {
    const { points } = trace({ top: 1, right: -1, bottom: -1, left: 1 });
    expect(points.at(-1)).toEqual(points[0]);
  });
});
