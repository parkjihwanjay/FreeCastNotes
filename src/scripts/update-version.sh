#!/bin/bash
# Update version in Info.plist

VERSION="$1"
PLIST="swift-app/Info.plist"

if [ -z "$VERSION" ]; then
    echo "Error: Version required"
    exit 1
fi

# Update CFBundleVersion
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $VERSION" "$PLIST" 2>/dev/null || \
    sed -i '' "s/<key>CFBundleVersion<\/key>/,/<\/string>/s/<string>.*<\/string>/<string>$VERSION<\/string>/" "$PLIST"

# Update CFBundleShortVersionString
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" "$PLIST" 2>/dev/null || \
    sed -i '' "s/<key>CFBundleShortVersionString<\/key>/,/<\/string>/s/<string>.*<\/string>/<string>$VERSION<\/string>/" "$PLIST"

echo "Version updated to $VERSION"
