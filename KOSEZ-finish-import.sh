#!/usr/bin/env bash
set -euo pipefail

ZIP="${1:-KOSEZ-Grok-Workspace-Complete-Transfer.zip}"
REPO_REMOTE="${2:-origin}"
TARGET_BRANCH="${3:-main}"
EXPECTED_SHA256="6fbafa0bfa862fe6ebf74dc66523a412e6fb1f3c81fa61d9b8f6b5b8b9c96674"
TMP=".kosez-import-tmp"

[[ -f "$ZIP" ]] || { echo "Missing archive: $ZIP" >&2; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null || { echo "Run from the KOSEZ repository root." >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo "Working tree must be clean." >&2; exit 1; }

actual="$(sha256sum "$ZIP" | awk '{print $1}')"
[[ "$actual" == "$EXPECTED_SHA256" ]] || { echo "SHA-256 mismatch: $actual" >&2; exit 1; }

git fetch "$REPO_REMOTE" "$TARGET_BRANCH"
git switch "$TARGET_BRANCH"
rm -rf "$TMP"
mkdir -p "$TMP"
unzip -q "$ZIP" -d "$TMP"
rm -rf "$TMP/.vercel/output" "$TMP/.tanstack/tmp"
rm -f "$TMP/.grok/preview.log" "$TMP/.grok/status"

if grep -RIlE -- '--?--?--?BEGIN (RSA|OPENSSH|EC|DSA|PRIVATE) KEY--?--?--?|sk-[A-Za-z0-9]{20,}|xai-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}' "$TMP" \
  --exclude='*.png' --exclude='*.jpg' --exclude='*.jpeg' --exclude='*.gif' --exclude='*.webp' \
  --exclude='*.ttf' --exclude='*.otf' --exclude='*.woff' --exclude='*.woff2' --exclude='*.zip'; then
  echo "Potential credential material detected; aborting." >&2
  rm -rf "$TMP"
  exit 1
fi

# Remove the small initialization scaffold created during preparation.
git rm -f README.md IMPORT_MANIFEST.md scripts/import-grok-workspace.sh 2>/dev/null || true
cp -a "$TMP"/. .
rm -rf "$TMP"

git add -A
git diff --stat --cached
git diff --cached --check

git commit -m "feat: import K'Osez BLOSSOM Grok workspace"
git push "$REPO_REMOTE" "$TARGET_BRANCH"

echo "Imported and pushed to $REPO_REMOTE/$TARGET_BRANCH."
