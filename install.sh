#!/bin/sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect platform
PLATFORM="unknown"
ARCH="unknown"

case "$(uname -s)" in
    Darwin*)  
        PLATFORM="darwin"
        case "$(uname -m)" in
            arm64)  ARCH="arm64" ;;
            x86_64) ARCH="x64" ;;
        esac
        ;;
    Linux*)   
        PLATFORM="linux"
        case "$(uname -m)" in
            x86_64) ARCH="x64" ;;
        esac
        ;;
    MINGW*|MSYS*|CYGWIN*) 
        PLATFORM="windows"
        ARCH="x64"
        ;;
esac

if [ "$PLATFORM" = "unknown" ] || [ "$ARCH" = "unknown" ]; then
    echo "${RED}Error: Unsupported platform $(uname -s) $(uname -m)${NC}"
    exit 1
fi

# Set installation directory
if [ "$PLATFORM" = "windows" ]; then
    INSTALL_DIR="$HOME/AppData/Local/dg"
    BIN_DIR="$HOME/AppData/Local/dg"
else
    INSTALL_DIR="/usr/local/lib/dg"
    BIN_DIR="/usr/local/bin"
fi

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"

# Download URL (replace with your actual release URL pattern)
BINARY_NAME="dg-${PLATFORM}-${ARCH}"
DOWNLOAD_URL="https://github.com/DeepGuide-Ai/dg/releases/latest/download/${BINARY_NAME}"

echo "${BLUE}Installing DeepGuide CLI...${NC}"
echo "Platform: $PLATFORM"
echo "Architecture: $ARCH"

# Download binary
echo "${BLUE}Downloading latest version...${NC}"
if command -v curl > /dev/null 2>&1; then
    curl -fsSL "$DOWNLOAD_URL" -o "$INSTALL_DIR/$BINARY_NAME"
elif command -v wget > /dev/null 2>&1; then
    wget -q "$DOWNLOAD_URL" -O "$INSTALL_DIR/$BINARY_NAME"
else
    echo "${RED}Error: curl or wget is required${NC}"
    exit 1
fi

# Make binary executable
chmod +x "$INSTALL_DIR/$BINARY_NAME"

# Create symlink
ln -sf "$INSTALL_DIR/$BINARY_NAME" "$BIN_DIR/dg"

echo "${GREEN}✓ DeepGuide CLI installed successfully!${NC}"
echo
echo "You can now run 'dg --help' to get started"
echo "Run 'dg doctor' to verify your installation" 