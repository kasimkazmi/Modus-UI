#!/usr/bin/env bash
#
# Interactive release for the workspace packages (@modus-ui/cli, @modus-ui/mcp).
#
#     pnpm release
#
# Bumps the version, builds and tests, commits "chore(release): ..." on main,
# tags it <pkg>-v<version> and publishes, either through the Release workflow
# (npm trusted publishing, no token) or from this machine with your npm login.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

bold=$'\033[1m'; dim=$'\033[2m'; red=$'\033[31m'; green=$'\033[32m'; yellow=$'\033[33m'; reset=$'\033[0m'

info() { printf "%s\n" "$*"; }
ok() { printf "%s✔%s %s\n" "$green" "$reset" "$*"; }
warn() { printf "%s!%s %s\n" "$yellow" "$reset" "$*"; }
die() { printf "%s✖ %s%s\n" "$red" "$*" "$reset" >&2; exit 1; }

# confirm "Question" -> returns 0 for yes. Default is no.
confirm() {
  local reply
  read -r -p "$1 [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

pkg_field() { node -p "require('./packages/$1/package.json').$2"; }

# The version on npm, or empty when the package has never been published.
published_version() { npm view "$1" version 2>/dev/null || true; }

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------

info "${bold}Modus UI package release${reset}"
echo

branch=$(git branch --show-current)
[[ "$branch" == "main" ]] || die "Releases are cut from main (you are on '$branch')."
[[ -z "$(git status --porcelain)" ]] || die "Working tree is not clean. Commit or stash first."

git fetch --quiet origin main
[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] ||
  die "main is not in sync with origin/main. Run: git pull"

ok "On main, clean and up to date with origin"

echo
info "${bold}How should it publish?${reset}"
PS3="> "
select how in "GitHub Actions (trusted publishing, recommended)" "This machine (npm login)"; do
  case "$REPLY" in
    1) publish_via="ci"; break ;;
    2)
      publish_via="local"
      npm_user=$(npm whoami 2>/dev/null) || die "Not logged in to npm. Run: npm login"
      ok "npm user: $npm_user"
      break
      ;;
    *) warn "Pick 1 or 2." ;;
  esac
done
echo

# ---------------------------------------------------------------------------
# Choose packages
# ---------------------------------------------------------------------------

info "${bold}Which package?${reset}"
PS3="> "
select choice in "cli" "mcp" "both" "cancel"; do
  case "$choice" in
    cli | mcp) packages=("$choice"); break ;;
    both) packages=("cli" "mcp"); break ;;
    cancel) info "Cancelled."; exit 0 ;;
    *) warn "Pick 1-4." ;;
  esac
done
echo

# ---------------------------------------------------------------------------
# Choose versions
# ---------------------------------------------------------------------------

declare -a names versions
for pkg in "${packages[@]}"; do
  name=$(pkg_field "$pkg" name)
  current=$(pkg_field "$pkg" version)
  remote=$(published_version "$name")

  info "${bold}$name${reset}  local ${current}  ${dim}npm ${remote:-not published}${reset}"

  options=("patch" "minor" "major" "custom")
  # Allow releasing the current version as-is only if npm doesn't have it yet.
  [[ "$remote" != "$current" ]] && options=("keep $current" "${options[@]}")

  PS3="Version bump for $pkg > "
  select bump in "${options[@]}"; do
    [[ -n "$bump" ]] && break
    warn "Pick one of the numbers."
  done

  case "$bump" in
    keep*) next="$current" ;;
    custom)
      read -r -p "New version for $name: " next
      [[ "$next" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]] || die "'$next' is not a semver version."
      ;;
    *) next=$(node -e '
        const [maj, min, pat] = process.argv[1].split("-")[0].split(".").map(Number);
        const bump = process.argv[2];
        console.log(bump === "major" ? `${maj + 1}.0.0` : bump === "minor" ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`);
      ' "$current" "$bump") ;;
  esac

  [[ "$next" == "$remote" ]] && die "$name@$next is already on npm."
  git rev-parse -q --verify "refs/tags/$pkg-v$next" >/dev/null && die "Tag $pkg-v$next already exists."

  names+=("$name")
  versions+=("$next")
  echo
done

# ---------------------------------------------------------------------------
# Build and test
# ---------------------------------------------------------------------------

for i in "${!packages[@]}"; do
  pkg=${packages[$i]}
  info "${bold}Building and testing ${names[$i]}${reset}"
  pnpm --dir "packages/$pkg" build
  pnpm --dir "packages/$pkg" test
  ok "${names[$i]} builds and passes its tests"
  echo
done

# ---------------------------------------------------------------------------
# Confirm
# ---------------------------------------------------------------------------

info "${bold}About to release:${reset}"
for i in "${!packages[@]}"; do
  info "  ${names[$i]}@${versions[$i]}  (tag ${packages[$i]}-v${versions[$i]})"
done
if [[ "$publish_via" == "ci" ]]; then
  info "  Publish: push to origin/main and tags; the Release workflow publishes."
else
  info "  Publish: npm publish from this machine, then push to origin/main and tags."
fi
echo
confirm "Proceed?" || { info "Cancelled. Nothing was changed."; exit 0; }

# ---------------------------------------------------------------------------
# Version, commit, tag
# ---------------------------------------------------------------------------

tags=()
summary=()
for i in "${!packages[@]}"; do
  pkg=${packages[$i]}
  if [[ "$(pkg_field "$pkg" version)" != "${versions[$i]}" ]]; then
    (cd "packages/$pkg" && npm version "${versions[$i]}" --no-git-tag-version >/dev/null)
  fi
  git add "packages/$pkg/package.json"
  tags+=("$pkg-v${versions[$i]}")
  summary+=("${names[$i]}@${versions[$i]}")
done

if ! git diff --cached --quiet; then
  git commit --quiet -m "chore(release): ${summary[*]}"
  ok "Committed version bump"
fi
for tag in "${tags[@]}"; do git tag "$tag"; done
ok "Tagged ${tags[*]}"

# ---------------------------------------------------------------------------
# Publish
# ---------------------------------------------------------------------------

if [[ "$publish_via" == "local" ]]; then
  for i in "${!packages[@]}"; do
    info "Publishing ${names[$i]}@${versions[$i]} (npm may ask for a one-time password)"
    (cd "packages/${packages[$i]}" && npm publish --access public) ||
      die "Publish failed. The commit and tags exist locally only; fix the issue and run: cd packages/${packages[$i]} && npm publish --access public && git push --follow-tags"
    ok "Published ${names[$i]}@${versions[$i]}"
  done
fi

git push --quiet origin main "${tags[@]}"
ok "Pushed main and ${tags[*]}"

echo
if [[ "$publish_via" == "ci" ]]; then
  info "The Release workflow is publishing now: https://github.com/kasimkazmi/Modus-UI/actions/workflows/release.yml"
fi
for i in "${!packages[@]}"; do
  info "  https://www.npmjs.com/package/${names[$i]}"
done
ok "Done."
