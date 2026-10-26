# Jigsaw Puzzle

A small browser jigsaw puzzle in TypeScript. Drag pieces onto the board: they snap to the grid, swap with loose pieces, and lock when they're in the right spot.

## Develop

```sh
npm install
npm run dev        # local dev server
./build_and_test.sh  # unit tests + production build (same as CI)
```

- `src/puzzle.ts`: the pure puzzle model (pieces, edges, snapping, solved state), unit-tested in `src/puzzle.test.ts`
- `src/shape.ts`: traces jigsaw piece outlines (tabs and holes)
- `src/picture.ts`: the generated picture
- `src/main.ts`: DOM rendering and dragging
