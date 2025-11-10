#!/usr/bin/env bash

set -euo pipefail

echo "Running pre-install hook..."
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

# Ensure clean build
echo "Cleaning up any existing native folders..."
rm -rf ios android

echo "Pre-install hook completed successfully"
