# Flux download server (hosted mode): Node + Python + yt-dlp + FFmpeg.
#   docker build -t flux .
#   docker run -p 3000:3000 -e FLUX_ALLOWED_ORIGINS=https://your-website flux
# See docs/HOSTED-SERVER.md.
FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*
RUN pip3 install --no-cache-dir --break-system-packages "yt-dlp[default,curl-cffi]"

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .

# Page modes and security headers are decided at build time.
ARG SITE_URL=http://localhost:3000
ARG SEO_INDEXABLE=false
ARG NEXT_PUBLIC_FLUX_API=
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=
ENV FLUX_HOSTED=true \
    SITE_URL=${SITE_URL} \
    SEO_INDEXABLE=${SEO_INDEXABLE} \
    NEXT_PUBLIC_FLUX_API=${NEXT_PUBLIC_FLUX_API} \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
RUN npm run build

# Limits for a public server; override at run time with -e.
# Set TURNSTILE_SECRET_KEY at run time (never in the image) to require the bot check.
ENV NODE_ENV=production \
    PYTHON_PATH=python3 \
    FLUX_MAX_FILESIZE=1G \
    FLUX_MAX_DURATION=1800 \
    FLUX_MAX_HEIGHT=1080 \
    FLUX_MAX_CONCURRENT=3 \
    FLUX_RETENTION_HOURS=1 \
    FLUX_RATE_INSPECT=30 \
    FLUX_RATE_DOWNLOAD=8

RUN mkdir -p downloads && chown -R node:node downloads .next
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD curl -fsS "http://127.0.0.1:${PORT:-3000}/api/health" || exit 1
# Render supplies PORT at runtime; local Docker runs default to port 3000.
CMD ["sh", "-c", "exec node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port \"${PORT:-3000}\""]
