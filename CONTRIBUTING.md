# Contributing to Flux

Thanks for helping. Bug reports, platform fixes, docs and translations are all welcome.

## Set up

```bash
git clone https://github.com/Zubair-hussain/Flux.git
cd Flux
npm install
python -m pip install -U "yt-dlp[default,curl-cffi]"
npm run dev            # web app on http://127.0.0.1:3000
npm run build:cli      # CLI → packages/cli/dist/flux.mjs
```

The default branch is `_prod`. Open pull requests against it.

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
- By contributing, you agree that your work is released under the [MIT License](LICENSE) and that you follow the [code of conduct](CODE_OF_CONDUCT.md).
