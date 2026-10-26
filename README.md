# Jigsaw Puzzle

**[▶ Try it out](https://isidore.github.io/IlyasExperiment-Puzzle/)**

[![Build and Test](https://github.com/isidore/IlyasExperiment-Puzzle/actions/workflows/ci.yml/badge.svg)](https://github.com/isidore/IlyasExperiment-Puzzle/actions/workflows/ci.yml)

A small browser jigsaw puzzle in TypeScript. Drag pieces onto the board: they snap to the grid, swap with loose pieces, and lock when they're in the right spot.

## Develop

```sh
npm install
./run.sh           # start the app and open it in your browser
./build_and_test.sh  # unit tests + production build (same as CI)
```

- `src/puzzle.ts`: the pure puzzle model (pieces, edges, snapping, solved state), unit-tested in `tests/puzzle.test.ts`
- `src/shape.ts`: traces jigsaw piece outlines (tabs and holes)
- `src/picture.ts`: the generated picture
- `src/main.ts`: DOM rendering and dragging
