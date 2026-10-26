#!/bin/sh
# Run the unit tests with coverage. Prints a summary and writes an HTML report to coverage/index.html.
set -e
cd "$(dirname "$0")"
npx vitest run --coverage --coverage.include='src/**' --coverage.reporter=text --coverage.reporter=html
echo "HTML report: coverage/index.html"
