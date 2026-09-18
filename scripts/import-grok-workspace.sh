#!/usr/bin/env bash
set -euo pipefail

ARCHIVE="${1:-grok-workspace.zip}"
TARGET_BRANCH="${2:-grok-workspace-import}"
TMP_DIR=".grok-workspace-import-tmp"
EXPECTED_SHA256="6fbafa0bfa862fe6ebf74dc66523a412e6fb1f3c81fa61d9b8f6b5b8b9c96674"

if [[ ! -f "$ARCHIVE" ]]; then
  echo "Archive not found: $ARCHIVE" >&2
  exit 1
fi
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run this from the KOSEZ repository root." >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit/stash changes before importing." >&2
  exit 1
fi

ACTUAL_SHA256="$(sha256sum "$ARCHIVE" | awk '{print $1}')"
if [[ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]]; then
  echo "Checksum mismatch." >&2
  echo "Expected: $EXPECTED_SHA256" >&2
  echo "Actual:   $ACTUAL_SHA256" >&2
  exit 1
fi

git fetch origin "$TARGET_BRANCH" >/dev/null 2>&1 || true
git switch "$TARGET_BRANCH"

rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
unzip -q "$ARCHIVE" -d "$TMP_DIR"

rm -rf "$TMP_DIR/.vercel/output" "$TMP_DIR/.tanstack/tmp"
rm -f "$TMP_DIR/.grok/preview.log" "$TMP_DIR/.grok/status"

# Refuse to import common credential material.
if grep -RIlE -- '--?--?--?BEGIN (RSA|OPENSSH|EC|DSA|PRIVATE) KEY--?--?--?|sk-[A-Za-z0-9]{20,}|xai-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}' "$TMP_DIR" \
  --exclude='*.png' --exclude='*.jpg' --exclude='*.jpeg' --exclude='*.gif' --exclude='*.webp' \
  --exclude='*.ttf' --exclude='*.otf' --exclude='*.woff' --exclude='*.woff2' --exclude='*.zip'; then
  echo "Potential credential material detected. Import aborted." >&2
  exit 1
fi

# Preserve the workspace's original root layout.
cp -a "$TMP_DIR"/. .

git add -A
git status --short

echo
echo "Import prepared from verified archive: $ACTUAL_SHA256"
read -r -p "Commit and push the staged workspace to $TARGET_BRANCH? [y/N] " answer
if [[ "${answer,,}" != "y" ]]; then
  echo "Import staged but not committed."
  rm -rf "$TMP_DIR"
  exit 0
fi

git commit -m "feat: import K'Osez BLOSSOM Grok workspace"
git push -u origin "$TARGET_BRANCH"

rm -rf "$TMP_DIR"
echo "Workspace import pushed to $TARGET_BRANCH."
