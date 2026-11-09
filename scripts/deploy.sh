#!/usr/bin/env bash
# Build the site and publish it to the gh-pages branch, which GitHub Pages
# serves as-is. Works from a local machine (npm run deploy) and from the
# deploy workflow, so a deploy does not depend on GitHub Actions.
#
# Only commits already on origin/main are deployed, and only from a clean
# tree: untracked files under public/ or src/ would end up on the site.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

git fetch --quiet origin main
if ! git merge-base --is-ancestor HEAD origin/main; then
  echo "deploy: HEAD is not on origin/main; merge the pull request first." >&2
  exit 1
fi
if ! git diff --quiet HEAD; then
  echo "deploy: there are uncommitted changes; commit or stash them first." >&2
  exit 1
fi
untracked=$(git ls-files --others --exclude-standard -- public src)
if [ -n "$untracked" ]; then
  echo "deploy: untracked files would be published:" >&2
  echo "$untracked" >&2
  exit 1
fi

CI=1 npm run build </dev/null

commit=$(git rev-parse --short HEAD)
out=$(mktemp -d)
trap 'git worktree remove --force "$out" 2>/dev/null || rm -rf "$out"' EXIT

# Check out gh-pages (or start it) in a temporary worktree and replace its
# contents with the build.
if git fetch --quiet origin gh-pages 2>/dev/null; then
  git worktree add --quiet --detach "$out" FETCH_HEAD
else
  git worktree add --quiet --detach "$out"
  git -C "$out" checkout --quiet --orphan gh-pages
fi
git -C "$out" rm -r --quiet --ignore-unmatch .
cp -R dist/. "$out/"
touch "$out/.nojekyll" # serve files as they are, without Jekyll
git -C "$out" add --all

if git -C "$out" diff --cached --quiet; then
  echo "deploy: the site is already up to date."
  exit 0
fi

name=$(git config user.name || echo "github-actions[bot]")
email=$(git config user.email || echo "41898282+github-actions[bot]@users.noreply.github.com")
git -C "$out" -c user.name="$name" -c user.email="$email" \
  commit --quiet -m "Deploy $commit"
git -C "$out" push --quiet origin HEAD:refs/heads/gh-pages
echo "deploy: pushed $commit to gh-pages; GitHub Pages will publish it in a minute."
