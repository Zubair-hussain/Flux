# Contributing to Flux

Thanks for helping. Bug reports, platform fixes, docs and translations are all welcome.

## Set up

Use Node.js 24 (matching `.nvmrc`, CI, and Docker), Python 3.11 or newer,
and FFmpeg on your PATH. With nvm installed, run `nvm install` and `nvm use`
from the repository root. On Windows, select Node 24 using your Node version
manager before running the commands below.

```bash
git clone https://github.com/Zubair-hussain/Flux.git
cd Flux
npm ci
python -m pip install -U "yt-dlp[default,curl-cffi]"
npm run dev            # web app on http://127.0.0.1:3000
npm run build:cli      # CLI → packages/cli/dist/flux.mjs
```

The default branch is `_prod`. Open pull requests against it.

The local app needs no cloud credentials. For hosted downloads, follow the
[Firebase and Render setup guide](docs/FIREBASE-RENDER.md). Store credentials
in hosting secrets or ignored local environment files. Keep generated build
folders such as `.next` out of commits; rebuild them from source.

## Before you open a pull request

```bash
npm run typecheck
npm test               # unit tests with coverage thresholds
npm run test:e2e       # Playwright, desktop and mobile
npm run format:check
```

CI also runs the [Sightline](https://github.com/Zubair-hussain/Sightline) SEO and security audit on every pull request.

## Ground rules

- Keep the safeguards in [LEGAL.md](LEGAL.md). Pull requests that add DRM circumvention, cookie or account import, paywall bypass, or adult-content support will be closed.
- Tests must mock video platforms. Never commit real downloaded media.
- Use conventional commit messages (`feat:`, `fix:`, `docs:`, `ci:`).
- Commit each changed file separately, with a message describing its actual change.
- By contributing, you agree that your work is released under the [MIT License](LICENSE) and that you follow the [code of conduct](CODE_OF_CONDUCT.md).
