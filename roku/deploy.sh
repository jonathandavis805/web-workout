#!/usr/bin/env bash
# Builds the Gruuve Roku channel and sideloads it onto a Roku in developer mode.
set -euo pipefail

: "${SERVER_URL:?Set SERVER_URL to the Gruuve server the TV talks to, e.g. https://gruuve.bookrecs.dev}"
WEB_URL="${WEB_URL:-$SERVER_URL}"

here="$(cd "$(dirname "$0")" && pwd)"
build="$here/build"
rm -rf "$build"
mkdir -p "$build/app"
cp -R "$here/source" "$here/components" "$here/images" "$here/sounds" "$build/app/"
sed -e "s|__SERVER_URL__|${SERVER_URL%/}|" -e "s|__WEB_URL__|${WEB_URL%/}|" "$here/manifest" > "$build/app/manifest"
(cd "$build/app" && zip -qr "$build/gruuve.zip" .)
echo "Built $build/gruuve.zip"

if [ -z "${ROKU_IP:-}" ]; then
  echo "ROKU_IP not set; skipping sideload."
  exit 0
fi
: "${ROKU_DEV_PASSWORD:?Set ROKU_DEV_PASSWORD to the password you chose when enabling developer mode}"

curl -sS --fail --digest --user "rokudev:$ROKU_DEV_PASSWORD" \
  -F "mysubmit=Install" -F "archive=@$build/gruuve.zip" \
  "http://$ROKU_IP/plugin_install" \
  | grep -oE "Install Success|Install Failure[^<]*|Identical to previous version[^<]*" | sort -u
