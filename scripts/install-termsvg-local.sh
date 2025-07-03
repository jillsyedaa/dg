#!/usr/bin/env bash

function get_termsvg() {
  local DIST=""
  local EXT=""
  local FILENAME=""
  local KERNEL=""
  local MACHINE=""
  local TMP_DIR=""
  local URL=""
  local TAG=""
  local VER=""
  local INSTALL_PATH="$HOME/.local/bin"

  # 获取最新版本 tag
  TAG=$(curl -sL https://api.github.com/repos/mrmarble/termsvg/releases \
        | grep tag_name | head -n1 | cut -d'"' -f4)

  if [ -n "${TAG}" ]; then
    URL="https://github.com/MrMarble/termsvg/releases/download/${TAG}"
    VER="${TAG:1}"
  else
    echo "ERROR! Could not retrieve the current termsvg version number."
    exit 1
  fi

  # 获取系统内核与架构
  KERNEL=$(uname -s)
  MACHINE=$(uname -m)

  if [ "${KERNEL}" == "Linux" ]; then
    EXT="tar.gz"
    case "${MACHINE}" in
      i386) DIST="linux-386" ;;
      x86_64) DIST="linux-amd64" ;;
      armv6l) DIST="linux-armv6" ;;
      armv7l) DIST="linux-armv7" ;;
      aarch64) DIST="linux-arm64" ;;
    esac
  elif [ "${KERNEL}" == "Darwin" ]; then
    EXT="zip"
    case "${MACHINE}" in
      x86_64) DIST="darwin-amd64" ;;
      arm64) DIST="darwin-arm64" ;;
    esac
  else
    echo "ERROR! ${KERNEL} is not a supported platform."
    exit 1
  fi

  if [ -z "${DIST}" ]; then
    echo "ERROR! ${MACHINE} is not a supported architecture."
    exit 1
  fi

  FILENAME="termsvg-${VER}-${DIST}.${EXT}"
  echo " - Downloading ${URL}/${FILENAME}"
  TMP_DIR=$(mktemp -d)
  curl -sLo "${TMP_DIR}/${FILENAME}" "${URL}/${FILENAME}"

  echo " - Unpacking ${FILENAME}"
  if [ "${EXT}" == "zip" ]; then
    unzip -qq -o "${TMP_DIR}/${FILENAME}" -d "${TMP_DIR}"
  elif [ "${EXT}" == "tar.gz" ]; then
    tar -xf "${TMP_DIR}/${FILENAME}" -C "${TMP_DIR}"
  else
    echo "ERROR! Unexpected file extension."
    exit 1
  fi

  mkdir -p "${INSTALL_PATH}"
  mv "${TMP_DIR}/termsvg-${VER}-${DIST}/termsvg" "${INSTALL_PATH}/"
  chmod +x "${INSTALL_PATH}/termsvg"

  echo " - Cleaning up"
  rm -rf "${TMP_DIR}"

  echo " - termsvg installed to ${INSTALL_PATH}/termsvg"
  echo " - Version: $(${INSTALL_PATH}/termsvg --version)"

  if [[ ":$PATH:" != *":$INSTALL_PATH:"* ]]; then
    echo ""
    echo "⚠️  Please add the following line to your shell config (~/.bashrc or ~/.zshrc):"
    echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
  fi
}

echo "termsvg user-level install"
get_termsvg
