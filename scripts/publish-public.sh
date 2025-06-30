#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting public package publishing process...${NC}"

# Check if logged in to npm
if ! npm whoami >/dev/null 2>&1; then
    echo -e "${RED}Not logged in to npm. Please run 'npm login' first.${NC}"
    exit 1
fi

# Ensure we're in a clean state
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}Working directory is not clean. Please commit or stash changes.${NC}"
    exit 1
fi

# Build the project
echo -e "${YELLOW}Building project...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed${NC}"
    exit 1
fi

# Run tests if they exist
if grep -q "\"test\":" package.json; then
    echo -e "${YELLOW}Running tests...${NC}"
    npm test
    if [ $? -ne 0 ]; then
        echo -e "${RED}Tests failed${NC}"
        exit 1
    fi
fi

# Update version based on argument
VERSION_TYPE=${1:-patch}
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}Invalid version type. Use: patch, minor, or major${NC}"
    exit 1
fi

# Update package version
echo -e "${YELLOW}Updating version ($VERSION_TYPE)...${NC}"
npm version $VERSION_TYPE

# Configure for public publishing
echo -e "${YELLOW}Configuring for public publishing...${NC}"
npm config set access public

# Publish package
echo -e "${YELLOW}Publishing package...${NC}"
npm publish --access public

# Push changes to git
echo -e "${YELLOW}Pushing to git...${NC}"
git push --follow-tags

echo -e "${GREEN}Successfully published package!${NC}"
echo -e "${GREEN}Don't forget to create a GitHub release for the new version.${NC}" 