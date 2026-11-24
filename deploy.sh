#!/bin/bash
#
# Deploys this app to Vercel: checks (lint, type check), a version bump with a release commit and tag,
# Prisma migrations on the production database, `vercel deploy`, and a check that the deployment answers.
# Asks whether to ship a preview or production. Deploys are made from this working tree, not from GitHub.
#
#   ./deploy.sh [--skip-checks] [--check]
#
# Database migrations are part of a production deploy. Production shows `prisma migrate status` and, on the
# same "yes", runs `prisma migrate deploy` before anything is deployed; if that fails, nothing is deployed.
# The production database (DATABASE_URL, DIRECT_URL) comes from .env.prod, which is not committed.
# `./deploy.sh --check` shows the production migration status and deploys nothing.
#
# Needs: the Vercel CLI signed in to the team below (`vercel whoami`), node, the package manager below, curl.
#
# Production: needs a clean working tree. The version lives in package.json and is asked for here; a release
# commit ("Release vX.Y.Z") and the tag <TAG_PREFIX>vX.Y.Z are made, then pushed to origin once the deploy is
# done. A preview changes nothing in git and needs no version.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Team kasim-kazmi-work-space. Ids are not secrets; change them here if the project moves.
ORG_ID="team_1Ej06ORjitrFR0Rn6AslcRW9"
PROJECT="modus-ui"
PROJECT_ID="prj_UceHr2goil4rfTMJkyPebxh62bCF"
PM="pnpm"
TAG_PREFIX="web-v"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "\n${YELLOW}$1${NC}"; }
ok() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

SKIP_CHECKS=false
CHECK_ONLY=false
PROD_ENV="${PROD_ENV_FILE:-.env.prod}"
for arg in "$@"; do
    case "$arg" in
        --skip-checks) SKIP_CHECKS=true ;;
        --check) CHECK_ONLY=true ;;
        *) fail "Unknown argument: $arg" ;;
    esac
done

# Runs a Prisma command against the production database from $PROD_ENV.
prisma_prod() {
    [ -f "$PROD_ENV" ] || fail "Missing $PROD_ENV: put the production DATABASE_URL and DIRECT_URL in it"
    (set -a && . "./$PROD_ENV" && set +a && npx prisma "$@")
}

# =============================================================================
# --check: the production database, nothing deployed
# =============================================================================
if [ "$CHECK_ONLY" = true ]; then
    step "Production database ($PROD_ENV)"
    prisma_prod migrate status
    exit $?
fi

command -v vercel >/dev/null || fail "Vercel CLI not found: npm install --global vercel@latest"
vercel whoami >/dev/null 2>&1 || fail "Not signed in to Vercel: run 'vercel login'"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
SUBJECT=$(git log -1 --format=%s)
echo -e "${BLUE}Branch: $BRANCH ($SUBJECT)${NC}"

# =============================================================================
# Target
# =============================================================================
echo
echo "Where to?"
echo "  1) preview     (a private URL to check the build)"
echo "  2) production  (the live domain)"
TARGET=""
while [ -z "$TARGET" ]; do
    read -r -p "Choice [1/2]: " CHOICE
    case "$CHOICE" in
        1 | preview) TARGET=preview ;;
        2 | production) TARGET=production ;;
        *) echo -e "${RED}Enter 1 or 2.${NC}" ;;
    esac
done

# =============================================================================
# Version (production only): from package.json, which is the version last released.
# =============================================================================
VERSION=""
RELEASED=false
if [ "$TARGET" = "production" ]; then
    [ -z "$(git status --porcelain --untracked-files=no)" ] || fail "Commit or stash your changes first: production deploys what is committed"
    # Which migrations production is missing (read-only). A wrong address stops the deploy here.
    step "Production database ($PROD_ENV)"
    prisma_prod migrate status || echo -e "${YELLOW}Migrations are pending (listed above) or the database could not be read.${NC}"

    CURRENT=$(node -p "require('./package.json').version")
    IFS=. read -r MAJOR MINOR PATCH <<<"$CURRENT"
    echo
    echo -e "${BLUE}$PROJECT is at v$CURRENT. Which version?${NC}"
    echo "    1) patch  →  v$MAJOR.$MINOR.$((PATCH + 1))   (bug fixes)"
    echo "    2) minor  →  v$MAJOR.$((MINOR + 1)).0   (new features)"
    echo "    3) major  →  v$((MAJOR + 1)).0.0   (breaking changes)"
    echo "    4) keep   →  v$CURRENT   (deploy again without a new release)"
    echo "    or type a version, e.g. 1.2.3"
    read -r -p "  Choice [Enter = v$MAJOR.$MINOR.$((PATCH + 1))]: " CHOICE
    case "$CHOICE" in
        1 | patch | "") VERSION="$MAJOR.$MINOR.$((PATCH + 1))" ;;
        2 | minor) VERSION="$MAJOR.$((MINOR + 1)).0" ;;
        3 | major) VERSION="$((MAJOR + 1)).0.0" ;;
        4 | keep) VERSION="$CURRENT" ;;
        *) VERSION="${CHOICE#v}" ;;
    esac
    [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "Version must look like 1.2.3"
    TAG="$TAG_PREFIX$VERSION"
    # A version that already has a release tag is deployed again without a new release commit.
    if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
        git merge-base --is-ancestor "$TAG" HEAD || fail "$TAG is not part of this branch: pick a new version"
        RELEASED=true
        echo -e "${YELLOW}$TAG is already released: no new release commit.${NC}"
    fi
    echo -e "\n${BLUE}Deploying ${GREEN}$PROJECT v$VERSION${BLUE} from $BRANCH${NC}"
    echo -e "${YELLOW}Pending database migrations are applied to production first, then it deploys.${NC}"
    echo -e "${RED}This deploys to PRODUCTION.${NC}"
    read -r -p "Type 'yes' to continue: " CONFIRM
    [ "$CONFIRM" = "yes" ] || { echo "Cancelled."; exit 0; }
else
    echo -e "\n${BLUE}Deploying ${GREEN}$PROJECT${BLUE} as a preview from $BRANCH${NC}"
    read -r -p "Continue? [y/N]: " CONFIRM
    [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ] || { echo "Cancelled."; exit 0; }
fi

STARTED=$(date +%s)

# =============================================================================
# Checks: lint and type check.
# =============================================================================
step "Checks"
if [ "$SKIP_CHECKS" = true ]; then
    echo "Skipped (--skip-checks)"
else
    $PM install >/dev/null || fail "$PM install failed"
    $PM run lint || fail "Lint failed"
    ok "Lint passed"
    npx tsc --noEmit || fail "Type check failed"
    ok "Types passed"
fi

# =============================================================================
# Production migrations: before the deploy, so the app never runs against a database that lacks its columns.
# =============================================================================
if [ "$TARGET" = "production" ]; then
    step "Database migrations (production)"
    prisma_prod migrate deploy || fail "The migration failed, so nothing was deployed. Fix it and run deploy.sh again."
    ok "Production database is up to date"
fi

# =============================================================================
# Deploy. For production the version is written to package.json first and committed and tagged, so the
# deployment contains it. If the deploy fails, that release commit and tag are taken back.
# =============================================================================
FLAGS=(--yes)
[ "$TARGET" = "production" ] && FLAGS+=(--prod)

MADE_COMMIT=false
MADE_TAG=false
if [ "$TARGET" = "production" ] && [ "$RELEASED" = false ]; then
    if [ "$(node -p "require('./package.json').version")" != "$VERSION" ]; then
        node -e "
            const fs = require('fs');
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            pkg.version = '$VERSION';
            fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        " || fail "Could not set the version"
        git add package.json
        git commit -q -m "Release v$VERSION" || fail "Could not commit the release"
        MADE_COMMIT=true
    fi
    git tag "$TAG" || fail "Could not tag the release"
    MADE_TAG=true
fi

step "Deploying $PROJECT"
# The CLI prints build logs to stderr (shown live) and a JSON report to stdout; the URL is deployment.url.
if OUT=$(VERCEL_ORG_ID="$ORG_ID" VERCEL_PROJECT_ID="$PROJECT_ID" vercel deploy --json "${FLAGS[@]}") && URL=$(printf '%s' "$OUT" | node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(0, "utf8")).deployment.url)'); then
    # A preview may sit behind Vercel's login (401): that still means it is up.
    CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL" || true)
    case "$CODE" in
        2* | 3* | 401) ok "$URL (HTTP $CODE)" ;;
        *) echo -e "${RED}✗ Deployed but answers HTTP $CODE: $URL${NC}"; FAILED=true ;;
    esac
else
    [ "$MADE_TAG" = true ] && git tag -d "$TAG" >/dev/null
    [ "$MADE_COMMIT" = true ] && git reset -q --hard HEAD~1
    fail "Deploy failed"
fi

if [ "$MADE_TAG" = true ]; then
    step "Push release"
    git push -q origin HEAD "$TAG" && ok "Pushed $TAG" ||
        echo -e "${YELLOW}Could not push: run 'git push origin HEAD $TAG'${NC}"
fi

echo -e "\n${BLUE}Done ($TARGET, $(($(date +%s) - STARTED))s)${NC}"
[ "${FAILED:-false}" = false ] || exit 1
