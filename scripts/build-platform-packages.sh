#!/bin/bash

# Build script for DeepGuide platform packages
# Downloads asciinema binaries and prepares platform packages for publishing

set -e

ASCIINEMA_VERSION="2.4.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES_DIR="$SCRIPT_DIR/../platform-packages"

echo "🏗️  Building DeepGuide platform packages"
echo "   asciinema version: $ASCIINEMA_VERSION"
echo "   packages directory: $PACKAGES_DIR"

# Download asciinema binaries for each platform
PLATFORMS="darwin-arm64:asciinema-2.4.0-aarch64-apple-darwin darwin-x64:asciinema-2.4.0-x86_64-apple-darwin linux-x64:asciinema-2.4.0-x86_64-unknown-linux-gnu"

for platform_pair in $PLATFORMS; do
    platform=$(echo "$platform_pair" | cut -d: -f1)
    binary_name=$(echo "$platform_pair" | cut -d: -f2)
    
    echo "📦 Processing platform: $platform"
    
    PACKAGE_DIR="$PACKAGES_DIR/dg-$platform"
    BIN_DIR="$PACKAGE_DIR/bin"
    BINARY_NAME="$binary_name"
    
    # Create bin directory
    mkdir -p "$BIN_DIR"
    
    # Download binary if it doesn't exist
    if [ ! -f "$BIN_DIR/asciinema" ]; then
        echo "⬇️  Downloading $BINARY_NAME..."
        
        # GitHub releases URL
        DOWNLOAD_URL="https://github.com/asciinema/asciinema/releases/download/v$ASCIINEMA_VERSION/$BINARY_NAME"
        
        echo "   URL: $DOWNLOAD_URL"
        
        # Download with curl
        if command -v curl >/dev/null; then
            curl -L "$DOWNLOAD_URL" -o "$BIN_DIR/asciinema"
        elif command -v wget >/dev/null; then
            wget "$DOWNLOAD_URL" -O "$BIN_DIR/asciinema"
        else
            echo "❌ Error: curl or wget required to download binaries"
            exit 1
        fi
        
        # Make executable
        chmod +x "$BIN_DIR/asciinema"
        
        echo "✅ Downloaded and installed: $BIN_DIR/asciinema"
    else
        echo "✅ Binary already exists: $BIN_DIR/asciinema"
    fi
    
    # Verify binary
    if [ -x "$BIN_DIR/asciinema" ]; then
        echo "🧪 Testing binary..."
        "$BIN_DIR/asciinema" --version || echo "⚠️  Warning: Binary test failed"
    fi
    
    # Copy shared files (README, COPYING, etc.)
    if [ -f "$PACKAGES_DIR/dg-darwin-arm64/README.md" ]; then
        # Update README for this platform
        sed "s/darwin-arm64/$platform/g; s/Apple Silicon/$([ "$platform" = "darwin-x64" ] && echo "Intel" || echo "glibc")/g" \
            "$PACKAGES_DIR/dg-darwin-arm64/README.md" > "$PACKAGE_DIR/README.md.tmp"
        mv "$PACKAGE_DIR/README.md.tmp" "$PACKAGE_DIR/README.md"
    fi
    
    # Copy GPL compliance files if they don't exist
    for file in COPYING SOURCE_OFFER.md; do
        if [ -f "$PACKAGES_DIR/dg-darwin-arm64/$file" ] && [ ! -f "$PACKAGE_DIR/$file" ]; then
            cp "$PACKAGES_DIR/dg-darwin-arm64/$file" "$PACKAGE_DIR/$file"
        fi
    done
    
    echo "✅ Platform package ready: @deepguide-ai/dg-$platform"
    echo ""
done

echo "🎉 All platform packages built successfully!"
echo ""
echo "Next steps:"
echo "  1. Test packages: cd platform-packages/dg-darwin-arm64 && npm pack"
echo "  2. Publish packages: npm publish platform-packages/dg-*/package.json"
echo "  3. Update main package version and publish" 