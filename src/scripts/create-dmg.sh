#!/bin/bash
# =============================================================================
# create-dmg.sh — Creates FreeCastNotes.dmg for distribution
# =============================================================================
# Creates a compressed DMG with drag-to-Applications install experience
# =============================================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP_BUNDLE="$PROJECT_ROOT/build/FreeCastNotes.app"
OUTPUT_DIR="$PROJECT_ROOT/build"
DMG_NAME="FreeCastNotes"
DMG_PATH="$OUTPUT_DIR/$DMG_NAME.dmg"
STAGING_DIR="$OUTPUT_DIR/dmg-staging"

# Verify .app exists
if [ ! -d "$APP_BUNDLE" ]; then
    echo "ERROR: FreeCastNotes.app not found. Run 'make bundle' first."
    exit 1
fi

echo "Creating FreeCastNotes.dmg..."

# Clean up previous
rm -rf "$STAGING_DIR" "$DMG_PATH"

# Create staging directory with app + Applications symlink
mkdir -p "$STAGING_DIR"
cp -r "$APP_BUNDLE" "$STAGING_DIR/"
ln -s /Applications "$STAGING_DIR/Applications"

# Create compressed DMG directly
hdiutil create \
    -srcfolder "$STAGING_DIR" \
    -volname "$DMG_NAME" \
    -fs HFS+ \
    -format UDZO \
    -imagekey zlib-level=9 \
    "$DMG_PATH" \
    -quiet

# Clean up staging
rm -rf "$STAGING_DIR"

# Show result
DMG_ACTUAL_SIZE=$(du -h "$DMG_PATH" | awk '{print $1}')
echo ""
echo "FreeCastNotes.dmg created successfully!"
echo "  Location: $DMG_PATH"
echo "  Size:     $DMG_ACTUAL_SIZE"
echo ""
echo "To install: open the DMG and drag FreeCastNotes to Applications"
echo "To share:   upload to GitHub Releases"
