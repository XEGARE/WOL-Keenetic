#!/bin/sh

set -eu

REPO_URL="https://github.com/XEGARE/WOL-Keenetic.git"
APP_DIR="/opt/WOL-Keenetic"
INIT_DIR="/opt/etc/init.d"
INIT_SCRIPT="$INIT_DIR/S55wol"
CONFIG_FILE="$APP_DIR/config.json"
LOG_FILE="$APP_DIR/log.txt"
PID_DIR="/opt/var/run"

DEFAULT_PORT="5555"

say() {
  echo "[WOL-Keenetic] $*"
}

fail() {
  echo "[WOL-Keenetic] ERROR: $*" >&2
  exit 1
}

exists() {
  command -v "$1" >/dev/null 2>&1
}

validate_mac() {
  echo "$1" | grep -Eiq '^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$'
}

validate_ip() {
  IP="$1"
  echo "$IP" | grep -Eq '^([0-9]{1,3}\.){3}[0-9]{1,3}$' || return 1

  OLDIFS="$IFS"
  IFS=.
  set -- $IP
  IFS="$OLDIFS"

  for octet in "$@"; do
    [ "$octet" -ge 0 ] 2>/dev/null || return 1
    [ "$octet" -le 255 ] 2>/dev/null || return 1
  done

  return 0
}

ask_nonempty() {
  PROMPT="$1"
  VALUE=""
  while [ -z "$VALUE" ]; do
    printf "%s" "$PROMPT" > /dev/tty
    read VALUE < /dev/tty
    VALUE=$(echo "$VALUE" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  done
  echo "$VALUE"
}

ask_default() {
  PROMPT="$1"
  DEF="$2"
  VALUE=""
  printf "%s" "$PROMPT" > /dev/tty
  read VALUE < /dev/tty
  VALUE=$(echo "$VALUE" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  if [ -z "$VALUE" ]; then
    VALUE="$DEF"
  fi
  echo "$VALUE"
}

ask_mac() {
  while :; do
    VALUE=$(ask_nonempty "Enter the target device MAC address (example AA:BB:CC:DD:EE:FF): ")
    if validate_mac "$VALUE"; then
      echo "$VALUE"
      return 0
    fi
    echo "Invalid MAC address. Please try again."
  done
}

ask_ip() {
  while :; do
    VALUE=$(ask_nonempty "Enter the target device local IP address (example 192.168.1.100): ")
    if validate_ip "$VALUE"; then
      echo "$VALUE"
      return 0
    fi
    echo "Invalid IP address. Please try again."
  done
}

ask_port() {
  while :; do
    VALUE=$(ask_default "Enter the service port [${DEFAULT_PORT}]: " "$DEFAULT_PORT")
    echo "$VALUE" | grep -Eq '^[0-9]+$' || {
      echo "Port must be a number."
      continue
    }
    [ "$VALUE" -ge 1 ] 2>/dev/null || {
      echo "Port must be between 1 and 65535."
      continue
    }
    [ "$VALUE" -le 65535 ] 2>/dev/null || {
      echo "Port must be between 1 and 65535."
      continue
    }
    echo "$VALUE"
    return 0
  done
}

ensure_entware() {
  [ -d /opt ] || fail "/opt was not found. Please install Entware first."
  exists opkg || fail "opkg was not found. Entware is not installed or not active."
}

install_packages() {
  say "Installing required packages..."
  opkg install ca-certificates git git-http node node-npm || fail "Failed to install required packages via opkg."
}

deploy_repo() {
  TMP_DIR="/tmp/WOL-Keenetic.$$"

  rm -rf "$TMP_DIR"
  mkdir -p "$TMP_DIR"

  say "Cloning repository..."
  git clone "$REPO_URL" "$TMP_DIR" || fail "Failed to clone repository."

  [ -d "$TMP_DIR/WOL-Keenetic" ] || fail "Directory WOL-Keenetic was not found in repository."
  [ -f "$TMP_DIR/WOL-Keenetic/package.json" ] || fail "package.json was not found in repository."
  [ -f "$TMP_DIR/WOL-Keenetic/app.js" ] || fail "app.js was not found in repository."
  [ -f "$TMP_DIR/etc/init.d/S55wol" ] || fail "S55wol was not found in repository."

  say "Deploying application files..."
  rm -rf "$APP_DIR"
  mkdir -p "$(dirname "$APP_DIR")"
  cp -R "$TMP_DIR/WOL-Keenetic" "$APP_DIR" || fail "Failed to copy application files."

  say "Deploying init.d service..."
  mkdir -p "$INIT_DIR"
  cp "$TMP_DIR/etc/init.d/S55wol" "$INIT_SCRIPT" || fail "Failed to copy init script."
  chmod +x "$INIT_SCRIPT"

  rm -rf "$TMP_DIR"
}

write_config() {
  PORT="$1"
  MAC="$2"
  IP="$3"
  SECRET="$4"

  say "Creating config.json..."
  cat > "$CONFIG_FILE" <<EOF
{ "port": $PORT, "macAddress": "$MAC", "ipAddress": "$IP", "secret": "$SECRET" }
EOF
}

install_npm() {
  say "Installing npm dependencies..."
  cd "$APP_DIR"
  npm i --omit=dev || npm i || fail "npm install failed."
}

start_service() {
  say "Restarting service..."
  "$INIT_SCRIPT" stop >/dev/null 2>&1 || true
  "$INIT_SCRIPT" start || {
    say "Service failed to start. Check the log:"
    echo "cat $LOG_FILE"
    exit 1
  }
}

show_result() {
  PORT="$1"
  SECRET="$2"

  echo
  echo "========================================"
  echo "Installation completed"
  echo "========================================"
  echo "Config file: $CONFIG_FILE"
  echo "Log file:    $LOG_FILE"
  echo
  echo "Service commands:"
  echo "  $INIT_SCRIPT start"
  echo "  $INIT_SCRIPT stop"
  echo "  $INIT_SCRIPT restart"
  echo "  $INIT_SCRIPT status"
  echo
  echo "Launch URL:"
  echo "  http://<ROUTER-DOMAIN-OR-IP>:$PORT/launch/$SECRET"
  echo
  echo "Status URL:"
  echo "  http://<ROUTER-DOMAIN-OR-IP>:$PORT/status/$SECRET"
  echo
  echo "For any device:"
  echo "  http://<ROUTER-DOMAIN-OR-IP>:$PORT/launch/$SECRET?mac=<mac>&address=<ip>"
  echo "  http://<ROUTER-DOMAIN-OR-IP>:$PORT/status/$SECRET?address=<ip>"
  echo "========================================"
}

main() {
  clear 2>/dev/null || true
  echo "========================================"
  echo " WOL-Keenetic interactive installer"
  echo "========================================"
  echo

  ensure_entware

  MAC_ADDRESS=$(ask_mac)
  IP_ADDRESS=$(ask_ip)
  SECRET=$(ask_nonempty "Enter the access secret: ")
  PORT=$(ask_port)

  echo
  echo "Please confirm your settings:"
  echo "  MAC:    $MAC_ADDRESS"
  echo "  IP:     $IP_ADDRESS"
  echo "  SECRET: $SECRET"
  echo "  PORT:   $PORT"
  echo

  CONFIRM=$(ask_default "Continue installation? [Y/n]: " "Y")
  case "$CONFIRM" in
    n|N|no|NO|No)
      echo "Installation cancelled."
      exit 0
      ;;
  esac

  install_packages
  deploy_repo
  write_config "$PORT" "$MAC_ADDRESS" "$IP_ADDRESS" "$SECRET"
  install_npm
  touch "$LOG_FILE"
  start_service
  show_result "$PORT" "$SECRET"
}

main "$@"