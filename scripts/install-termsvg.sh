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
  local INSTALL_DIR="$HOME/.local/bin" # New: Define the user-specific installation directory

  # Get the current released tag_name
  TAG=$(curl -sL https://api.github.com/repos/mrmarble/termsvg/releases \
        | grep tag_name | head -n1 | cut -d'"' -f4)

  if [ -n "${TAG}" ]; then
    URL="https://github.com/MrMarble/termsvg/releases/download/${TAG}"
    VER="${TAG:1}"
  else
    echo "ERROR! Could not retrieve the current termsvg version number."
    exit 1
  fi

  # Get kernel name and machine architecture.
  KERNEL=$(uname -s)
  MACHINE=$(uname -m)

  # Determine the target distribution
  if [ "${KERNEL}" == "Linux" ]; then
    EXT="tar.gz"
    if [ "${MACHINE}" == "i386" ]; then
      DIST="linux-386"
    elif [ "${MACHINE}" == "x86_64" ]; then
      DIST="linux-amd64"
    elif [ "${MACHINE}" == "armv6l" ]; then
      DIST="linux-armv6"
    elif [ "${MACHINE}" == "armv7l" ]; then
      DIST="linux-armv7"
    elif [ "${MACHINE}" == "aarch64" ]; then
      DIST="linux-arm64"
    fi
  elif [ "${KERNEL}" == "Darwin" ]; then
    EXT="zip"
    if [ "${MACHINE}" == "x86_64" ]; then
      DIST="darwin-amd64"
    elif [ "${MACHINE}" == "arm64" ]; then
      DIST="darwin-arm64"
    fi
  elif [ "${KERNEL}" == "FreeBSD" ]; then
    EXT="tar.gz"
    if [ "${MACHINE}" == "i386" ]; then
      DIST="freebsd-386"
    elif [ "${MACHINE}" == "x86_64" ]; then
      DIST="freebsd-amd64"
    elif [ "${MACHINE}" == "armv6l" ]; then
      DIST="freebsd-armv6"
    elif [ "${MACHINE}" == "armv7l" ]; then
      DIST="freebsd-armv7"
    fi
  else
    echo "ERROR! ${KERNEL} is not a supported platform."
    exit 1
  fi

  # Was a known distribution detected?
  if [ -z "${DIST}" ]; then
    echo "ERROR! ${MACHINE} is not a supported architecture."
    exit 1
  fi

  # Derive the filename
  FILENAME="termsvg-${VER}-${DIST}.${EXT}"

  echo " - Downloading ${URL}/${FILENAME}"
  TMP_DIR=$(mktemp --directory)
  curl -sLo "${TMP_DIR}/${FILENAME}" "${URL}/${FILENAME}"

  echo " - Unpacking ${FILENAME}"
  if [ "${EXT}" == "zip" ]; then
    unzip -qq -o "${TMP_DIR}/${FILENAME}" -d "${TMP_DIR}"
  elif [ "${EXT}" == "tar.gz" ]; then
    tar -xf "${TMP_DIR}/${FILENAME}" --directory "${TMP_DIR}"
  else
    echo "ERROR! Unexpected file extension."
    exit 1
  fi

  # --- MODIFICATION START ---

  # Create the target installation directory if it doesn't exist
  echo " - Ensuring installation directory ${INSTALL_DIR} exists"
  mkdir -p "${INSTALL_DIR}" || { echo "ERROR! Could not create ${INSTALL_DIR}. Check permissions."; rm -rf "${TMP_DIR}"; exit 1; }

  echo " - Placing termsvg in ${INSTALL_DIR}"
  mv "${TMP_DIR}/termsvg-${VER}-${DIST}/termsvg" "${INSTALL_DIR}/" || { echo "ERROR! Could not move termsvg to ${INSTALL_DIR}."; rm -rf "${TMP_DIR}"; exit 1; }
  chmod +x "${INSTALL_DIR}/termsvg" || { echo "ERROR! Could not set execute permissions."; rm -rf "${TMP_DIR}"; exit 1; }

  echo " - Cleaning up"
  rm -rf "${TMP_DIR}"
  echo -en " - "
  "${INSTALL_DIR}/termsvg" --version # Execute termsvg from its new location

  # --- MODIFICATION END ---

  echo ""
  echo "Installation complete!"
  echo "To use 'termsvg' directly, ensure '${INSTALL_DIR}' is in your \$PATH."
  echo "You can add it by adding the following line to your shell configuration file (e.g., ~/.bashrc, ~/.zshrc):"
  echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
  echo "After adding, run 'source ~/.bashrc' (or your respective file) or open a new terminal."

}

echo "termsvg scripted install"

# Removed the root check, as we are no longer installing to a system directory
# if [ "$(id -u)" -ne 0 ]; then
#   echo "ERROR! You must run this script as root."
#   exit 1
# fi

get_termsvg