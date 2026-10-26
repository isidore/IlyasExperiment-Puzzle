// Pure jigsaw model: no DOM. Coordinates are in "world" units.

/** Edge shape: 0 = flat border, 1 = tab sticking out, -1 = hole cut in. */
export type EdgeShape = -1 | 0 | 1;

export interface Edges {
  top: EdgeShape;
  right: EdgeShape;
  bottom: EdgeShape;
  left: EdgeShape;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Piece {
  row: number;
  col: number;
  x: number;
  y: number;
  locked: boolean;
  edges: Edges;
}

export type Random = () => number;

export class Puzzle {
  readonly pieces: Piece[] = [];
  readonly pieceWidth: number;
  readonly pieceHeight: number;

  constructor(
    readonly size: number,
    readonly board: Rect,
    tray: Rect,
    random: Random = Math.random,
  ) {
    this.pieceWidth = board.width / size;
    this.pieceHeight = board.height / size;
    const right = randomEdges(size, size - 1, random); // right[r][c]: edge between (r,c) and (r,c+1)
    const down = randomEdges(size - 1, size, random); // down[r][c]: edge between (r,c) and (r+1,c)
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        this.pieces.push({
          row,
          col,
          x: tray.x + random() * Math.max(0, tray.width - this.pieceWidth),
          y: tray.y + random() * Math.max(0, tray.height - this.pieceHeight),
          locked: false,
          edges: {
            top: row > 0 ? opposite(down[row - 1][col]) : 0,
            right: col < size - 1 ? right[row][col] : 0,
            bottom: row < size - 1 ? down[row][col] : 0,
            left: col > 0 ? opposite(right[row][col - 1]) : 0,
          },
        });
      }
    }
  }

  /** Where a piece belongs on the board. */
  home(piece: Piece): { x: number; y: number } {
    return this.cellPosition(piece.row, piece.col);
  }

  cellPosition(row: number, col: number): { x: number; y: number } {
    return { x: this.board.x + col * this.pieceWidth, y: this.board.y + row * this.pieceHeight };
  }

  /** The board cell nearest to (x, y), or undefined when off the board. */
  cellAt(x: number, y: number): { row: number; col: number } | undefined {
    const col = Math.round((x - this.board.x) / this.pieceWidth);
    const row = Math.round((y - this.board.y) / this.pieceHeight);
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) return undefined;
    return { row, col };
  }

  /**
   * Drop a piece at (x, y), having picked it up at `from`.
   * Over the board it snaps to the nearest cell: a loose piece already there swaps
   * back to `from`; a locked piece there sends the dropped piece back instead.
   * Any piece that ends up in its home cell locks.
   */
  drop(piece: Piece, x: number, y: number, from: { x: number; y: number }): void {
    if (piece.locked) return;
    const cell = this.cellAt(x, y);
    if (!cell) {
      piece.x = x;
      piece.y = y;
    } else {
      const target = this.cellPosition(cell.row, cell.col);
      const occupant = this.pieces.find((p) => p !== piece && p.x === target.x && p.y === target.y);
      if (occupant?.locked) {
        piece.x = from.x;
        piece.y = from.y;
      } else {
        if (occupant) {
          occupant.x = from.x;
          occupant.y = from.y;
        }
        piece.x = target.x;
        piece.y = target.y;
      }
    }
    for (const p of this.pieces) {
      const home = this.home(p);
      if (p.x === home.x && p.y === home.y) p.locked = true;
    }
  }

  placedCount(): number {
    return this.pieces.filter((p) => p.locked).length;
  }

  isSolved(): boolean {
    return this.placedCount() === this.pieces.length;
  }
}

function opposite(shape: EdgeShape): EdgeShape {
  return -shape as EdgeShape;
}

function randomEdges(rows: number, cols: number, random: Random): EdgeShape[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): EdgeShape => (random() < 0.5 ? 1 : -1)),
  );
}
