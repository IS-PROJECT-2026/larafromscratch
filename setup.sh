#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

SHELL_RC="$HOME/.bashrc"
HOOK_START="# >>> larafromscratch sail helper >>>"
NON_INTERACTIVE=0

log() {
  printf "[setup] %s\n" "$1"
}

warn() {
  printf "[setup][warn] %s\n" "$1"
}

err() {
  printf "[setup][error] %s\n" "$1" >&2
}

SUDO=""

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --non-interactive|-y)
        NON_INTERACTIVE=1
        ;;
      --help|-h)
        cat <<'EOF'
Usage: ./setup.sh [options]

Options:
  --non-interactive, -y  Run without prompts (requires passwordless sudo if not root)
  --help, -h             Show this help
EOF
        exit 0
        ;;
      *)
        err "Unknown option: $1"
        exit 1
        ;;
    esac
    shift
  done
}

setup_sudo() {
  if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    if [ "$NON_INTERACTIVE" -eq 1 ]; then
      if ! sudo -n true >/dev/null 2>&1; then
        err "--non-interactive requires passwordless sudo (or run as root)."
        exit 1
      fi
      SUDO="sudo -n"
    else
      SUDO="sudo"
    fi
    return
  fi

  err "sudo is required for system package installation."
  exit 1
}

detect_os() {
  if [ -f /etc/os-release ]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    echo "${ID:-unknown}"
    return
  fi

  echo "unknown"
}

install_base_packages() {
  setup_sudo
  log "Installing base system packages"
  $SUDO apt-get update
  $SUDO apt-get install -y ca-certificates curl gnupg lsb-release unzip git
}

install_php_and_composer() {
  setup_sudo

  if ! command -v php >/dev/null 2>&1; then
    log "Installing PHP"
    $SUDO apt-get install -y php-cli php-mbstring php-xml php-curl php-zip php-mysql sqlite3
  else
    log "PHP already installed"
  fi

  if ! command -v composer >/dev/null 2>&1; then
    log "Installing Composer"
    $SUDO apt-get install -y composer
  else
    log "Composer already installed"
  fi
}

install_node() {
  setup_sudo

  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    log "Installing Node.js and npm"
    $SUDO apt-get install -y nodejs npm
  else
    log "Node.js and npm already installed"
  fi
}

install_docker() {
  setup_sudo

  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    log "Docker and Docker Compose already installed"
    return
  fi

  log "Installing Docker and Docker Compose"
  $SUDO apt-get remove -y docker.io docker-doc docker-compose podman-docker containerd runc >/dev/null 2>&1 || true
  $SUDO install -m 0755 -d /etc/apt/keyrings
  local distro
  distro="$(. /etc/os-release && echo "$ID")"

  curl -fsSL "https://download.docker.com/linux/${distro}/gpg" | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  $SUDO chmod a+r /etc/apt/keyrings/docker.gpg

  local arch codename
  arch="$(dpkg --print-architecture)"
  codename="$(. /etc/os-release && echo "$VERSION_CODENAME")"
  echo "deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${distro} ${codename} stable" | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null

  $SUDO apt-get update
  $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  local current_user
  current_user="$(id -un)"

  if ! id -nG "$current_user" | grep -q '\bdocker\b'; then
    log "Adding ${current_user} to docker group"
    $SUDO usermod -aG docker "$current_user"
    warn "You may need to log out and back in for docker group changes to apply."
  fi
}

install_prerequisites() {
  local os_id
  os_id="$(detect_os)"

  case "$os_id" in
    ubuntu|debian)
      install_base_packages
      install_php_and_composer
      install_node
      install_docker
      ;;
    *)
      err "Automatic prerequisite install is currently supported on Ubuntu/Debian only."
      err "Install PHP, Composer, Node.js/npm, Docker, and Docker Compose manually, then rerun setup.sh."
      exit 1
      ;;
  esac
}

ensure_shell_helper() {
  touch "$SHELL_RC"

  if grep -Fq "$HOOK_START" "$SHELL_RC"; then
    log "Sail shell helper already configured in $SHELL_RC"
    return
  fi

  cat >> "$SHELL_RC" <<'EOF'

# >>> larafromscratch sail helper >>>
sail() {
  if [ -x ./sail ]; then
    ./sail "$@"
    return $?
  fi

  if [ -x ./vendor/bin/sail ]; then
    ./vendor/bin/sail "$@"
    return $?
  fi

  if [ -f artisan ]; then
    php artisan sail "$@"
    return $?
  fi

  echo "No Sail project found in $(pwd)."
  return 1
}
# <<< larafromscratch sail helper <<<
EOF

  log "Added Sail helper to $SHELL_RC"
}

parse_args "$@"

if [ "$NON_INTERACTIVE" -eq 1 ]; then
  export DEBIAN_FRONTEND=noninteractive
  log "Running in non-interactive mode"
fi

install_prerequisites

if ! command -v docker >/dev/null 2>&1; then
  err "docker is still unavailable after setup."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  err "docker compose is still unavailable after setup."
  exit 1
fi

log "Installing PHP dependencies"
composer install

if [ ! -f .env ]; then
  log "Creating .env from .env.example"
  cp .env.example .env
else
  log ".env already exists"
fi

log "Ensuring project Sail wrapper is executable"
chmod +x ./sail

ensure_shell_helper

log "Installing frontend dependencies"
npm install

log "Starting Sail services"
./sail up -d

if ! grep -Eq '^APP_KEY=base64:' .env; then
  log "Generating APP_KEY"
  ./sail artisan key:generate --force
else
  log "APP_KEY already present"
fi

log "Running pending migrations"
./sail artisan migrate --graceful --ansi

log "Setup complete"
log "Use ./sail immediately in this shell (example: ./sail up -d)"
log "To use plain 'sail', open a new terminal (or run: source ~/.bashrc)"
log "Start frontend dev server with: npm run dev"
