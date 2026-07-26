#!/bin/sh
# Keep the named node_modules volume in sync with package.json / lockfile.
set -e
npm install
exec npm run dev -- --hostname 0.0.0.0 --port 3000
