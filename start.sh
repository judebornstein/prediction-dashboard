#!/bin/bash
# Prediction Dashboard Launcher
# Starts the Node.js server and opens the dashboard in the browser

DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER="$DIR/server.js"

if [ ! -f "$SERVER" ]; then
  echo "Error: server.js not found in $DIR"
  exit 1
fi

PORT=3000
echo "Starting Prediction Dashboard on http://localhost:$PORT ..."

# Open browser after a short delay to let the server start
(sleep 1 && case "$(uname)" in
  Darwin)  open "http://localhost:$PORT" ;;
  Linux)   xdg-open "http://localhost:$PORT" 2>/dev/null || sensible-browser "http://localhost:$PORT" ;;
  MINGW*|MSYS*|CYGWIN*)  start "http://localhost:$PORT" ;;
esac) &

node "$SERVER"
