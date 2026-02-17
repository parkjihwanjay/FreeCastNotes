#!/bin/bash
# =============================================================================
# bundle-app.sh — Builds FreeCastNotes.app bundle
# =============================================================================
# Usage: ./scripts/bundle-app.sh [debug|release]
# Default: release
# =============================================================================

set -euo pipefail

CONFIG="${1:-release}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SWIFT_APP="$PROJECT_ROOT/swift-app"
RESOURCES="$SWIFT_APP/Resources"
BUILD_DIR="$SWIFT_APP/.build/$CONFIG"
BINARY="$BUILD_DIR/FreeCastNotes"

# Output location
APP_NAME="FreeCastNotes.app"
OUTPUT_DIR="$PROJECT_ROOT/build"
APP_BUNDLE="$OUTPUT_DIR/$APP_NAME"

echo "Building FreeCastNotes.app ($CONFIG)..."

# 1. Build frontend
echo "  Building frontend..."
cd "$PROJECT_ROOT"
npx tsc --noEmit
npx vite build

# 2. Build Swift
echo "  Building Swift ($CONFIG)..."
cd "$SWIFT_APP"
if [ "$CONFIG" = "release" ]; then
    swift build -c release
else
    swift build
fi

# Verify binary exists
if [ ! -f "$BINARY" ]; then
    echo "ERROR: Binary not found at $BINARY"
    exit 1
fi

# 3. Create .app bundle structure
echo "  Creating .app bundle..."
rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# 4. Copy binary
cp "$BINARY" "$APP_BUNDLE/Contents/MacOS/FreeCastNotes"

# 5. Copy Info.plist
cp "$SWIFT_APP/Info.plist" "$APP_BUNDLE/Contents/Info.plist"

# 6. Copy frontend dist
cp -r "$PROJECT_ROOT/dist" "$APP_BUNDLE/Contents/Resources/dist"

# 7. Copy app icon (.icns)
if [ -f "$RESOURCES/icon.icns" ]; then
    cp "$RESOURCES/icon.icns" "$APP_BUNDLE/Contents/Resources/AppIcon.icns"
fi

# 8. Copy menu bar icon
if [ -f "$RESOURCES/tray-icon.png" ]; then
    cp "$RESOURCES/tray-icon.png" "$APP_BUNDLE/Contents/Resources/tray-icon.png"
fi
if [ -f "$RESOURCES/tray-icon@2x.png" ]; then
    cp "$RESOURCES/tray-icon@2x.png" "$APP_BUNDLE/Contents/Resources/tray-icon@2x.png"
fi
if [ -f "$RESOURCES/tray-icon@1x.png" ]; then
    cp "$RESOURCES/tray-icon@1x.png" "$APP_BUNDLE/Contents/Resources/tray-icon@1x.png"
fi

echo ""
echo "FreeCastNotes.app built successfully!"
echo "  Location: $APP_BUNDLE"
echo ""
echo "To install:"
echo "  cp -r \"$APP_BUNDLE\" /Applications/"
echo ""
echo "To run:"
echo "  open \"$APP_BUNDLE\""
