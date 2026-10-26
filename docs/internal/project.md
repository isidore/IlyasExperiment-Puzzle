# Jigsaw Puzzle: project notes

Internal record of what this app is and why it is the way it is, so we can revisit and improve it later.

## What it is

A small browser jigsaw puzzle. A generated sunset picture is cut into 3×3 to 6×6 pieces with real
jigsaw shapes (tabs and holes). Pieces start spread out in a tray beside the board. You drag them onto
the board, where they snap to a grid and lock once they are in their home cell.

Built live during the "Ilyas Experiment" session (2026-10-26) by Llewellyn, Ilyas and Claude, starting
from nothing.

## How it plays

- **Drag** any loose piece. You grab the topmost piece whose visible shape is under the pointer, so
  clicks pass through other pieces' transparent margins, and a grabbed piece stays on top.
- **Drop on the board**: the piece snaps to the nearest grid cell.
- **Wrong place is allowed**: a piece can sit in the wrong cell, as long as its shape fits its
  neighbours.
- **Doesn't fit → rejected**: if a tab or hole doesn't match a piece already next to that cell, the
  piece explodes into shards and flies back to where it was picked up.
- **Occupied cell**: a loose piece already there swaps back to where the dropped piece came from. A
  locked piece can't be displaced.
- **Home cell → locks**: a piece in its correct cell locks and can't be moved again.
- **Solved** when every piece is locked.
- Controls: piece count, New puzzle, Peek (a faint guide image) and Show grid.

## Decisions (and why)

| Decision                                                                          | Why                                                                                      |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Jigsaw over the other ideas (binary calculator, Game of Life, …)                  | We wanted something visual. A jigsaw is easy to understand and demo.                     |
| Real tab/hole shapes, not squares                                                 | Squares didn't feel like a puzzle (from mockup v1 → v2).                                 |
| Snap to a grid                                                                    | Free placement felt loose and imprecise.                                                 |
| Swap on an occupied cell                                                          | "It's like you're replacing that piece." Natural, and fast for rearranging.              |
| Reject only on a shape mismatch, not on a wrong picture                           | "You could put together incorrect pieces as long as they fit": like a real puzzle.       |
| Explosion + fly-back on reject                                                    | Clear, playful feedback that the move was refused.                                       |
| Tray laid out on a shuffled grid                                                  | Randomly scattered pieces covered each other and were hard to grab.                      |
| Celebration: "dance" (pieces hop in a wave, then a "You did it!" card with stats) | Chosen from 4 mockups (confetti, seamless/framed, fireworks, dance). We liked the stats. |
| Generated picture, no image files                                                 | No assets to manage. A custom image is a possible future feature.                        |

## Architecture

- `src/puzzle.ts`: **pure model, no DOM.** Pieces, edge shapes, tray layout, `drop()` rules, solved
  state. All game rules live here so they can be unit-tested.
- `src/shape.ts`: traces a piece outline (tabs/holes) onto any path sink (a canvas context).
- `src/picture.ts`: draws the generated picture.
- `src/dom.ts`: small DOM helpers that fail loudly (`element`, `context2d`).
- `src/main.ts`: thin UI layer: renders pieces to canvases, handles dragging, animations, layout.
- `tests/puzzle.test.ts`: unit tests for the model, kept in a separate folder from `src/` on purpose.

Diagrams of this are on Claude's "architecture" page in the live note.

## Tech & tooling

| Tool           | Use                  | Note                                                                |
| -------------- | -------------------- | ------------------------------------------------------------------- |
| TypeScript 7   | language             | strict mode                                                         |
| Vite           | dev server + bundler | `./run.sh`                                                          |
| Vitest         | unit tests           | seeded random for repeatable tests                                  |
| Prettier       | formatting           | `./tidy.sh`                                                         |
| Biome          | linting              | typescript-eslint doesn't support TypeScript 7 yet, so we use Biome |
| GitHub Actions | CI                   | runs `./build_and_test.sh` (format check, lint, tests, build)       |

Scripts: `./run.sh` (play it), `./tidy.sh` (format), `./build_and_test.sh` (everything CI runs).

## Working agreements

- Commit as we go, one commit per change or refactoring, so history reads step by step.
- Logic changes get a test first.
- Mock up options (as pages in the live note) before building anything visual we're unsure about.

## Ideas for later

- Your own image (upload/URL)
- Pieces that join into groups off the board and move together
- Rotation
- Timer, move counter and best times (feeds the celebration stats)
- Deploy to GitHub Pages; approval tests of piece shapes; end-to-end drag tests
