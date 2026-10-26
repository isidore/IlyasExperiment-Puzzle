#!/bin/sh
# Start the jigsaw in a local dev server and open it in the browser.
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
npm run dev -- --open
