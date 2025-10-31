#!/bin/sh
set -eu

# Collect metadata
DATETIME_TZ=$(date '+%Y-%m-%d %H:%M:%S %Z')
FILENAME_TS=$(date '+%Y-%m-%d_%H-%M-%S')

if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPO_ROOT=$(git rev-parse --show-toplevel)
  REPO_NAME=$(basename "$REPO_ROOT")
  GIT_BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD)
  GIT_COMMIT=$(git rev-parse HEAD)
  GIT_AUTHOR_NAME=$(git config user.name 2>/dev/null || echo "")
  GIT_AUTHOR_EMAIL=$(git config user.email 2>/dev/null || echo "")
else
  REPO_ROOT=""
  REPO_NAME=""
  GIT_BRANCH=""
  GIT_COMMIT=""
  GIT_AUTHOR_NAME=""
  GIT_AUTHOR_EMAIL=""
fi

# Print similar to the individual command outputs
echo "Current Date/Time (TZ): $DATETIME_TZ"
[ -n "$GIT_COMMIT" ] && echo "Current Git Commit Hash: $GIT_COMMIT"
[ -n "$GIT_BRANCH" ] && echo "Current Branch Name: $GIT_BRANCH"
[ -n "$REPO_NAME" ] && echo "Repository Name: $REPO_NAME"
[ -n "$GIT_AUTHOR_NAME" ] && echo "Author Name: $GIT_AUTHOR_NAME"
[ -n "$GIT_AUTHOR_EMAIL" ] && echo "Author Email: $GIT_AUTHOR_EMAIL"
echo "Timestamp For Filename: $FILENAME_TS"