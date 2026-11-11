# 05 - Environment and deployment

(Last synced {{STAMP}}.)

## The original machine (A2DEV2011)

- Windows 11 Pro. Project folder: `D:\AI\GuideApp\ai-ml-quick-path-source-2026-11-04`. Sibling folders in `D:\AI\GuideApp\`: `deploy` (the deployed static site), `migration` (this pack and the exe).
- Node.js 22 (via nvm for Windows). Microsoft Edge and Google Chrome installed. Playwright's own Chromium download is blocked by a certificate error, so tests use installed browsers: `--channel=msedge` or `--channel=chrome`.
- **Not installed:** Python (so `npm run extract:code`, `npm run test:examples` and the Python demos cannot run) and the .NET SDK (C# was never compiled). There is **no git repository** (the project came as a zip).
- The shell used by Claude Code strips backslashes inside heredocs and `node -e` strings. When a regex or Windows path breaks, write the script with the editor tool or read it from a file. Use `[0-9]` instead of `\d` in one-liners.
- Windows path separators matter in test code (`/^lessons[\\/]/`).

## Deployment on the original machine

`powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1` (run elevated). It:

1. runs `npm run build`;
2. removes any leftovers of the old exe host (AIGuide.exe, site/, logs/);
3. mirrors `dist/` into `D:\AI\GuideApp\deploy` with robocopy (keeps the generated web.config);
4. generates `web.config` (security headers read from `dist/_headers`, `hiddenSegments` for `_headers` and `staticwebapp.config.json`, custom 404 using `<error statusCode="404" path="404.html" responseMode="File" />` with a **relative** path; an absolute path gave HTTP 500.19 and ExecuteURL returned 200);
5. creates the IIS app pool and site "AIGuide" if missing, binding `http/*:8091:`, grants `IIS AppPool\AIGuide` read access;
6. smoke-tests: home 200, CSP header present, a lesson page contains diagrams, a missing page returns 404.

Site URL on this machine: http://localhost:8091/ and, from the network, http://A2DEV2011:8091/. (Port 8081 gave a 503 for an unknown reason; 8091 works.)

## Public hosting (owner's plan)

`dist/` (or the deploy folder) is a complete static site. Set `SITE_URL=https://your-domain npm run build` to also emit `sitemap.xml` and canonical URLs. It runs on Netlify, Cloudflare Pages, GitHub Pages (project pages need a path-safe check: links are relative so it works), Azure Static Web Apps (`staticwebapp.config.json`), or any web server. See DEPLOYMENT.md in the project root for host-specific notes.

## Setting up the NEW machine

1. Install Node.js 18+ (22 recommended) and Git. Optional: Python 3.10+ with `numpy pandas scikit-learn`, and the .NET SDK (8 or later).
2. Unzip `source-snapshot.zip`, `cd` into the folder, run `npm install`.
3. Run `npm run build`, `npm run test:static`. For browser tests: `npx playwright install chromium` then `npm run test:e2e` (on a machine with internet this download works). If you use installed browsers: `node tests/e2e.mjs --channel=chrome`.
4. Initialise git and push to GitHub (suggested: private repository first). Add a `.gitignore` containing `node_modules/`, `dist/`, `release/`, `qa/screenshots/`.
5. With Python available, run `npm run test:examples` and `npm run extract:code`. With the .NET SDK, compile the C# samples (see 07-open-items-and-next-steps.md).
6. `scripts/deploy.ps1` is IIS-specific; skip it on the new machine unless it is also Windows with IIS.

## Things that are machine-specific and must not be copied blindly

- Paths in `scripts/deploy.ps1` (`D:\AI\GuideApp\deploy`, site name `AIGuide`, port 8091).
- The Playwright channel flags (`--channel=msedge`).
- `migration-sync.mjs` writes to `..\migration` by default (beside the project); on the new machine pass `--out <folder>` if the layout differs.

## Secrets

There are none in the project and there must never be any. API keys in examples are read from environment variables or .NET user secrets only.
