#!/usr/bin/env bash
set -euo pipefail

if [ -x "$(dirname "$0")/vendor/bin/sail" ]; then
  exec "$(dirname "$0")/vendor/bin/sail" "$@"
fi

if [ -f "$(dirname "$0")/artisan" ]; then
  exec php artisan sail "$@"
fi

echo "Sail is not available in this project yet. Run composer install first." >&2
exit 1
