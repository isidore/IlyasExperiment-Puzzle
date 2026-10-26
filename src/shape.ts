import type { EdgeShape, Edges } from "./puzzle";

/** Path drawing calls, so the canvas and tests can share one shape description. */
export interface PathSink {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
  closePath(): void;
}

/**
 * Trace a jigsaw piece outline clockwise, with its body at (margin, margin)
 * of size width × height. Tabs reach out up to 0.25 × the edge length.
 */
export function tracePiece(path: PathSink, edges: Edges, width: number, height: number, margin: number): void {
  const left = margin, top = margin, right = margin + width, bottom = margin + height;
  path.moveTo(left, top);
  traceEdge(path, left, top, right, top, edges.top);
  traceEdge(path, right, top, right, bottom, edges.right);
  traceEdge(path, right, bottom, left, bottom, edges.bottom);
  traceEdge(path, left, bottom, left, top, edges.left);
  path.closePath();
}

function traceEdge(path: PathSink, x0: number, y0: number, x1: number, y1: number, shape: EdgeShape): void {
  if (shape === 0) {
    path.lineTo(x1, y1);
    return;
  }
  const dx = x1 - x0, dy = y1 - y0;
  // (dy, -dx) points outward for a clockwise outline in screen coordinates
  const at = (along: number, out: number): [number, number] => [
    x0 + dx * along + dy * out * shape,
    y0 + dy * along - dx * out * shape,
  ];
  path.lineTo(...at(0.35, 0));
  path.bezierCurveTo(...at(0.37, 0.08), ...at(0.25, 0.24), ...at(0.5, 0.25));
  path.bezierCurveTo(...at(0.75, 0.24), ...at(0.63, 0.08), ...at(0.65, 0));
  path.lineTo(x1, y1);
}
