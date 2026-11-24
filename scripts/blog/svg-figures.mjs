// The blog figures drawn as inline SVG, in Flux's look (dark, violet).
// Inline SVG needs no hosted image file and stays sharp at any size.
// Each figure carries its own text alternative (<title> and <desc>) for screen
// readers and search engines, and unique gradient ids so several can share a page.
const font = "'DM Sans','Segoe UI',system-ui,-apple-system,Arial,sans-serif";
const escape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const frame = ({
  id,
  width,
  height,
  title,
  description,
  body,
}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${id}-t ${id}-d" style="display:block;width:100%;height:auto;border-radius:14px;border:1px solid #2a2b36;font-family:${font};">
  <title id="${id}-t">${escape(title)}</title>
  <desc id="${id}-d">${escape(description)}</desc>
  <defs>
    <linearGradient id="${id}-accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c7b3ff"/><stop offset="1" stop-color="#9873ff"/></linearGradient>
    <linearGradient id="${id}-bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9873ff"/><stop offset="1" stop-color="#c7b3ff"/></linearGradient>
    <radialGradient id="${id}-glow1" cx="0.85" cy="0" r="0.7"><stop offset="0" stop-color="#3a2a66"/><stop offset="1" stop-color="#3a2a66" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-glow2" cx="0" cy="1" r="0.6"><stop offset="0" stop-color="#2a1f4d"/><stop offset="1" stop-color="#2a1f4d" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#101116"/>
  <rect width="${width}" height="${height}" fill="url(#${id}-glow1)"/>
  <rect width="${width}" height="${height}" fill="url(#${id}-glow2)"/>
  ${logo(id)}
  ${body}
</svg>`;

const logo = (id) => `<g>
    <rect x="64" y="52" width="46" height="46" rx="13" fill="url(#${id}-accent)"/>
    <rect x="80" y="68" width="14" height="14" rx="3" fill="none" stroke="#17102b" stroke-width="4" transform="rotate(45 87 75)"/>
    <text x="124" y="87" font-size="34" font-weight="800" fill="#f3f2fa" letter-spacing="-0.5">flux<tspan fill="#ad91ff">.</tspan></text>
  </g>`;

export function heroSvg() {
  const id = "fx-hero";
  // Chips are laid out from the right edge with an even gap, so they never touch.
  const labels = [
    ["720p", false],
    ["1080p", false],
    ["4K", true],
    ["8K", false],
  ];
  const widthOf = (label) => label.length * 14 + 40;
  const gap = 12;
  let x =
    1136 -
    labels.reduce((sum, [label]) => sum + widthOf(label), 0) -
    gap * (labels.length - 1);
  const chips = labels.map(([label, on]) => {
    const chip = [label, x, on];
    x += widthOf(label) + gap;
    return chip;
  });
  return frame({
    id,
    width: 1200,
    height: 630,
    title: "Why a 4K video isn't always 4K",
    description:
      "Flux banner reading: Why a 4K video isn't always 4K, with quality chips for 720p, 1080p, 4K and 8K.",
    body: `
  ${chips
    .map(
      ([label, x, on]) =>
        `<g><rect x="${x}" y="54" width="${label.length * 14 + 40}" height="44" rx="22" fill="${on ? `url(#${id}-accent)` : "#17161f"}" stroke="${on ? "none" : "#3a3247"}"/><text x="${x + (label.length * 14 + 40) / 2}" y="83" font-size="22" font-weight="700" text-anchor="middle" fill="${on ? "#17102b" : "#d9cffa"}">${label}</text></g>`,
    )
    .join("\n  ")}
  <text x="64" y="240" font-size="84" font-weight="800" fill="#f3f2fa" letter-spacing="-3">Why a 4K video isn't</text>
  <text x="64" y="330" font-size="84" font-weight="800" fill="url(#${id}-accent)" letter-spacing="-3">always 4K</text>
  <text x="64" y="410" font-size="30" fill="#c9c5da">How Flux finds the real quality of a video,</text>
  <text x="64" y="452" font-size="30" fill="#c9c5da">with numbers from real tests.</text>
  <text x="64" y="585" font-size="22" fill="#9899ad">By Zubair Hussain · zubairhussain.xyz</text>`,
  });
}

/** Sizes in MB for one Dailymotion sample (estimates listed by the platform, Nov 2026). */
export const sizes = [
  ["720p", 28.2],
  ["1080p", 60.7],
  ["1440p", 136.0],
  ["4K", 216.4],
];

export function chartSvg() {
  const id = "fx-chart";
  const max = Math.max(...sizes.map(([, mb]) => mb));
  const trackX = 206;
  const trackWidth = 758;
  const rows = sizes
    .map(([label, mb], i) => {
      const y = 262 + i * 68;
      const width = Math.max(12, (mb / max) * trackWidth);
      return `<g>
    <text x="64" y="${y + 33}" font-size="32" font-weight="800" fill="#f3f2fa">${label}</text>
    <rect x="${trackX}" y="${y}" width="${trackWidth}" height="46" rx="12" fill="#191a22" stroke="#2a2b36"/>
    <rect x="${trackX}" y="${y}" width="${width.toFixed(1)}" height="46" rx="11" fill="url(#${id}-bar)"/>
    <text x="1136" y="${y + 33}" font-size="30" font-weight="700" text-anchor="end" fill="#d9cffa">~${Math.round(mb)} MB</text>
  </g>`;
    })
    .join("\n  ");
  return frame({
    id,
    width: 1200,
    height: 675,
    title: "File size by quality for one video",
    description: `Bar chart of one Dailymotion video's file size by quality: about ${sizes
      .map(([label, mb]) => `${Math.round(mb)} MB at ${label}`)
      .join(", ")
      .replace(/, ([^,]*)$/, " and $1")}.`,
    body: `
  <text x="64" y="176" font-size="52" font-weight="800" fill="#f3f2fa" letter-spacing="-1.5">Same video, <tspan fill="url(#${id}-accent)">four sizes</tspan></text>
  <text x="64" y="218" font-size="24" fill="#9899ad">4K is about 3.5 times larger than 1080p. One Dailymotion sample, November 2026.</text>
  ${rows}
  <text x="64" y="628" font-size="22" fill="#9899ad">Sizes are estimates listed by the platform · flux.detroonshah.workers.dev</text>`,
  });
}

export function verticalSvg() {
  const id = "fx-vertical";
  return frame({
    id,
    width: 1200,
    height: 675,
    title: "Tall videos count by the short side",
    description:
      "Diagram of a tall phone video measuring 720 pixels wide by 1280 pixels high, labelled as a 720p source because quality is counted by the short side.",
    body: `
  <text x="64" y="178" font-size="52" font-weight="800" fill="#f3f2fa" letter-spacing="-1.5">Tall videos count by</text>
  <text x="64" y="236" font-size="52" font-weight="800" fill="url(#${id}-accent)" letter-spacing="-1.5">the short side</text>
  <text x="64" y="300" font-size="26" fill="#c9c5da">A phone clip measuring 720×1280 is a 720p</text>
  <text x="64" y="336" font-size="26" fill="#c9c5da">source. Calling it "1280p" would promise</text>
  <text x="64" y="372" font-size="26" fill="#c9c5da">detail the video does not have.</text>
  <rect x="740" y="56" width="270" height="480" rx="30" fill="#1d1830" stroke="#9873ff" stroke-width="2"/>
  <text x="875" y="318" font-size="46" font-weight="800" text-anchor="middle" fill="url(#${id}-accent)">720p</text>
  <line x1="740" y1="560" x2="1010" y2="560" stroke="#c7b3ff" stroke-width="3"/>
  <text x="875" y="598" font-size="28" font-weight="800" text-anchor="middle" fill="#c7b3ff">720 px</text>
  <text x="1056" y="296" font-size="26" font-weight="700" text-anchor="middle" fill="#9899ad" transform="rotate(90 1056 296)">1280 px (long side)</text>
  <text x="64" y="628" font-size="22" fill="#9899ad">By Zubair Hussain · zubairhussain.xyz</text>`,
  });
}
