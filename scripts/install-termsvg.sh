#!/usr/bin/env bash

# Enable strict mode: script exits immediately if any command fails
set -e
# Enable debug mode: print each command before execution (useful for debugging, comment out when done)
# set -x

# Function: Attempts to add a directory to the user's shell configuration file
# Argument 1: The directory to add to PATH
add_to_path_if_needed() {
  local DIR_TO_ADD="$1"
  local SHELL_CONFIG_FILE=""

  echo " - Attempting to automatically add '${DIR_TO_ADD}' to your \$PATH environment variable..."

  # Determine the current shell and its corresponding configuration file
  if [[ -n "$ZSH_VERSION" ]]; then
    SHELL_CONFIG_FILE="$HOME/.zshrc"
  elif [[ -n "$BASH_VERSION" ]]; then
    SHELL_CONFIG_FILE="$HOME/.bashrc"
    # If .bashrc doesn't exist but .bash_profile does, use .bash_profile
    if [[ ! -f "$SHELL_CONFIG_FILE" && -f "$HOME/.bash_profile" ]]; then
      SHELL_CONFIG_FILE="$HOME/.bash_profile"
    fi
  elif [[ -n "$FISH_VERSION" ]]; then
    echo "Warning: Fish shell configuration is different. Please manually add the following to ~/.config/fish/config.fish:"
    echo "  set -gx PATH \"${DIR_TO_ADD}\" \$PATH"
    return 0 # Fish shell is not handled automatically
  else
    # Try .profile as a general fallback
    SHELL_CONFIG_FILE="$HOME/.profile"
  fi

  if [[ -z "$SHELL_CONFIG_FILE" ]]; then
    echo "Warning: Could not determine your shell configuration file. Please manually add '${DIR_TO_ADD}' to \$PATH."
    return 1
  fi

  echo " - Checking and modifying configuration file: ${SHELL_CONFIG_FILE}"

  # Check if the PATH entry already exists to avoid duplication
  if grep -q "export PATH=.*${DIR_TO_ADD}" "${SHELL_CONFIG_FILE}" 2>/dev/null; then
    echo " - '${DIR_TO_ADD}' already exists in your \$PATH configuration, no need to add again."
  else
    # Add PATH entry
    echo "" >> "${SHELL_CONFIG_FILE}"
    echo "# Added by termsvg install script" >> "${SHELL_CONFIG_FILE}"
    echo "export PATH=\"${DIR_TO_ADD}:\$PATH\"" >> "${SHELL_CONFIG_FILE}"
    echo " - Successfully added '${DIR_TO_ADD}' to '${SHELL_CONFIG_FILE}'."
    echo " - Note: This change will take effect after you run 'source ${SHELL_CONFIG_FILE}' or open a new terminal."
  fi
}


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
  local INSTALL_DIR="" # Installation directory, will be set dynamically based on permissions

  echo "termsvg Installation Script"

  # Set installation directory based on user permissions
  if [ "$(id -u)" -eq 0 ]; then
    INSTALL_DIR="/usr/local/bin"
    echo " - Root permissions detected, installing to ${INSTALL_DIR}"
  else
    INSTALL_DIR="$HOME/.local/bin"
    echo " - Root permissions not detected, installing to ${INSTALL_DIR} (user local directory)"
  fi

  # Get the current released tag_name
  echo " - Fetching latest version information..."
  TAG=$(curl -sL https://api.github.com/repos/mrmarble/termsvg/releases \
        | grep tag_name | head -n1 | cut -d'"' -f4)

  if [ -z "${TAG}" ]; then
    echo "ERROR! Could not retrieve the current termsvg version number. Please check network connection or GitHub API limits."
    exit 1
  fi

  URL="https://github.com/MrMarble/termsvg/releases/download/${TAG}"
  VER="${TAG:1}"
  echo " - Latest version detected: ${TAG}"

  # Get kernel name and machine architecture.
  KERNEL=$(uname -s)
  MACHINE=$(uname -m)

  # Determine the target distribution and file extension
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
  elif [ "${KERNEL}" == "Darwin" ]; then # macOS
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
  TMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'termsvg_tmp') # More compatible mktemp
  if [ -z "${TMP_DIR}" ]; then
      echo "ERROR! Could not create temporary directory."
      exit 1
  fi
  
  # Use -f option for curl to fail on HTTP errors, and check exit status
  # Removed -s (silent) and added -# (progress-bar) to show download progress
  curl -f -# -Lo "${TMP_DIR}/${FILENAME}" "${URL}/${FILENAME}" || {
    echo "ERROR! Failed to download file: ${URL}/${FILENAME}. Please check network connection or URL."
    rm -rf "${TMP_DIR}"
    exit 1
  }

  echo " - Unpacking ${FILENAME} to ${TMP_DIR}"
  if [ "${EXT}" == "zip" ]; then
    unzip -qq -o "${TMP_DIR}/${FILENAME}" -d "${TMP_DIR}" || {
      echo "ERROR! Failed to unpack ZIP file. File might be corrupted or non-existent."
      rm -rf "${TMP_DIR}"
      exit 1
    }
  elif [ "${EXT}" == "tar.gz" ]; then
    tar -xf "${TMP_DIR}/${FILENAME}" --directory "${TMP_DIR}" || {
      echo "ERROR! Failed to unpack TAR.GZ file. File might be corrupted or non-existent."
      rm -rf "${TMP_DIR}"
      exit 1
    }
  else
    echo "ERROR! Unexpected file extension: ${EXT}."
    rm -rf "${TMP_DIR}"
    exit 1
  fi

  echo " - Contents of the unpacked temporary directory:"
  ls -R "${TMP_DIR}" # Print unpacked file structure for debugging

  # Ensure the target installation directory exists
  echo " - Ensuring installation directory ${INSTALL_DIR} exists"
  # Use mkdir -p regardless of root, as it works fine with root permissions too
  mkdir -p "${INSTALL_DIR}" || { echo "ERROR! Could not create ${INSTALL_DIR}. Check permissions."; rm -rf "${TMP_DIR}"; exit 1; }


  # Find the unpacked termsvg executable
  # Use find command to locate a file named "termsvg" with execute permissions
  UNPACKED_TERMSVG_PATH=$(find "${TMP_DIR}" -name "termsvg" -type f -perm +111 | head -n 1) # +111 checks for any execute permission

  if [ -z "${UNPACKED_TERMSVG_PATH}" ]; then
      echo "ERROR! Could not find 'termsvg' executable in the unpacked files."
      echo "Please check the 'ls -R' output above to confirm the actual location of 'termsvg'."
      rm -rf "${TMP_DIR}"
      exit 1
  fi

  echo " - Found termsvg executable at: ${UNPACKED_TERMSVG_PATH}"
  echo " - Placing termsvg in ${INSTALL_DIR}"
  # Use mv and chmod regardless of root, as they work fine with root permissions too
  mv "${UNPACKED_TERMSVG_PATH}" "${INSTALL_DIR}/termsvg" || {
    echo "ERROR! Could not move termsvg to ${INSTALL_DIR}."
    rm -rf "${TMP_DIR}"
    exit 1
  }
  chmod +x "${INSTALL_DIR}/termsvg" || {
    echo "ERROR! Could not set execute permissions."
    rm -rf "${TMP_DIR}"
    exit 1
  }


  echo " - Cleaning up temporary files"
  rm -rf "${TMP_DIR}"

  echo -en " - "
  # Execute termsvg --version from its new location
  "${INSTALL_DIR}/termsvg" --version || {
    echo "ERROR! Could not run installed termsvg. Please check installation."
    exit 1
  }

  echo ""
  echo "Installation complete!"
  if [ "$(id -u)" -ne 0 ]; then
    echo "Since you ran as a non-root user, 'termsvg' has been installed to '${INSTALL_DIR}'."
    # Call the new function to automatically add to PATH
    add_to_path_if_needed "${INSTALL_DIR}"
    echo "Please note: This change will take effect after you run 'source ~/.bashrc' (or your respective file) or open a new terminal."
  else
    echo "Since you ran as a root user, 'termsvg' has been installed to '${INSTALL_DIR}'."
    echo "This directory is usually already in your \$PATH, and you can use 'termsvg' directly."
  fi

  # New: Print the final installation path for Node.js scripts to capture
  echo "TERMSVG_INSTALL_PATH=${INSTALL_DIR}"

}

# Removed the initial root check, as it's now handled inside the function
# if [ "$(id -u)" -ne 0 ]; then
#   echo "ERROR! You must run this script as root."
#   exit 1
# fi

get_termsvg
