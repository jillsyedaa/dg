#!/usr/bin/env bash
set -euo pipefail

INSTALL_BIN="./.dg/bin"
WRAPPER="$INSTALL_BIN/asciinema"
VERSION="2.4.0"

mkdir -p "$INSTALL_BIN"

echo "🚀 Installing asciinema $VERSION..."

# 检查是否已安装且版本匹配
if command -v asciinema >/dev/null 2>&1; then
  INSTALLED_VERSION=$(asciinema --version | awk '{print $2}')
  if [[ "$INSTALLED_VERSION" == "$VERSION" ]]; then
    echo "✅ asciinema $VERSION is already installed globally."
    exit 0
  else
    echo "⚠️ Detected asciinema version $INSTALLED_VERSION (want $VERSION)"
  fi
fi

# 检查是否有 root 权限
HAS_SUDO=0
if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
  HAS_SUDO=1
elif [[ "$(id -u)" -eq 0 ]]; then
  HAS_SUDO=1
fi

# 使用 apt 或 yum 安装（如可用）
if [[ "$HAS_SUDO" -eq 1 ]]; then
  if command -v apt-get >/dev/null 2>&1; then
    echo "📦 Installing via apt..."
    sudo apt-get update -y
    sudo apt-get install -y asciinema
    exit $?
  elif command -v yum >/dev/null 2>&1; then
    echo "📦 Installing via yum..."
    sudo yum install -y asciinema
    exit $?
  else
    echo "⚠️ No supported system package manager found."
  fi
fi

echo "🔒 No root access or no system installer available. Installing locally..."

# 安装 asciinema 到临时目录
TEMP_DIR="$(mktemp -d)"
python3 -m pip install asciinema=="$VERSION" --target "$TEMP_DIR"

# 创建 wrapper（直接执行 Python 模块）
cat > "$WRAPPER" <<EOF
#!/usr/bin/env bash
PYTHONPATH="$TEMP_DIR" exec python3 -m asciinema "\$@"
EOF

chmod +x "$WRAPPER"

# 验证本地 wrapper
if "$WRAPPER" --version | grep -q "$VERSION"; then
  echo "✅ asciinema $VERSION installed locally at $WRAPPER"
  echo "👉 You can run it using: $WRAPPER"
else
  echo "❌ Installation failed: unable to execute $WRAPPER"
  exit 1
fi
