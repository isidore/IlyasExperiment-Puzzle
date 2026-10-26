/** The element matching `selector`; throws if the page is missing it. */
export function element<T extends Element>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Missing element ${selector}`);
  return found;
}

/** A canvas's 2D context; throws if the browser cannot provide one. */
export function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const g = canvas.getContext("2d");
  if (!g) throw new Error("2D canvas is not supported");
  return g;
}
