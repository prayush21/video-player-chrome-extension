# Releasing

## Everyday flow

1. Branch off `main`, make changes, open a PR. CI runs typecheck, unit tests,
   build, and `npm run verify`, and attaches a zip you can load unpacked.
2. Before merging anything user-facing, test the PR's zip in Chrome
   (`chrome://extensions` → Developer mode → Load unpacked on the unzipped folder),
   including an **update over the previous version** so saved My List data survives.
3. Merge to `main`.

## Cutting a release

First add the release's notes to `CHANGELOG.md` (move items from **Unreleased**
under a new `## [X.Y.Z]` heading) and merge that to `main`. Then:

```bash
git checkout main && git pull
npm version minor        # or patch / major: bumps package.json + public/manifest.json, commits, tags vX.Y.Z
git push --follow-tags
```

The `Release` workflow then:

- checks the tag matches `public/manifest.json`,
- re-runs every check and builds `release/netflix-like-player-X.Y.Z.zip`,
- creates a GitHub Release with the zip and auto-generated notes,
- uploads the zip to the Chrome Web Store as a **draft** (once secrets are set).
  You still click **Submit for review** in the dashboard.

## Trusted testers (pre-release)

Before the first public rollout of a user-facing release, publish it to
**Trusted testers** only: in the Web Store dashboard set Distribution →
Visibility to *Trusted testers* (add tester emails under Test accounts), submit,
and install from the store on a real profile that has the previous version, to
confirm the update keeps My List data. Switch visibility to *Public* when happy.

## Staged rollout

In the Chrome Web Store dashboard, open Package → Publish and choose a
percentage rollout rather than 100%.

1. Start at about 10%.
2. Watch the reviews and support inbox for a day or two.
3. Raise the percentage (50%, then 100%).

A rollout can be paused at any time. Versions can't be rolled back to an older
version number (see Rolling back), so a bad release needs a fix released as a
higher version.

## Branch protection

Manual GitHub UI steps (Settings → Branches → Add branch ruleset / protection rule for `main`):

- Require a pull request before merging.
- Require status checks to pass: the `check` and `e2e` CI jobs.
- Require branches to be up to date before merging.
- Block force pushes (and deletion of `main`).

## Permissions

`scripts/permissions.lock.json` records the manifest's permissions, host
permissions and content-script matches. `npm run verify` fails if they change.
Adding a permission makes Chrome disable the extension for existing users until
they accept the new warning, and usually means a slower review, so it should be
a deliberate choice:

```bash
npm run permissions:update   # builds, then rewrites the lock; commit it
```

Also update the Web Store listing's permission justifications and `PRIVACY_POLICY.md`.

## Chrome Web Store upload secrets (one-time)

Follow https://github.com/fregante/chrome-webstore-upload-keys to create an OAuth
client and refresh token, then add these repository secrets
(Settings → Secrets and variables → Actions):

- `CWS_EXTENSION_ID`
- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`

## Rolling back

The Web Store can't go back to an older version number. To roll back, check out the
last good tag, bump to a *higher* version, and release that.
