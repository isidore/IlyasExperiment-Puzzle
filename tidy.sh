#!/bin/sh
# Format all code with Prettier.
set -e
cd "$(dirname "$0")"
npx prettier --write .
