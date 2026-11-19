export const platforms = [
  {
    id: "youtube",
    name: "YouTube",
    short: "▶",
    color: "#ff4e59",
    hosts: ["youtube.com", "youtu.be"],
  },
  {
    id: "tiktok",
    name: "TikTok",
    short: "♪",
    color: "#65e7df",
    hosts: ["tiktok.com"],
  },
  {
    id: "instagram",
    name: "Instagram",
    short: "◎",
    color: "#ed82bd",
    hosts: ["instagram.com"],
  },
  {
    id: "reddit",
    name: "Reddit",
    short: "●",
    color: "#ff8053",
    hosts: ["reddit.com", "redd.it"],
  },
  {
    id: "twitter",
    name: "X / Twitter",
    short: "𝕏",
    color: "#e6e6ed",
    hosts: ["x.com", "twitter.com"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    short: "in",
    color: "#6daeff",
    hosts: ["linkedin.com"],
  },
  {
    id: "twitch",
    name: "Twitch",
    short: "▣",
    color: "#b48aff",
    hosts: ["twitch.tv", "clips.twitch.tv"],
  },
  {
    id: "vimeo",
    name: "Vimeo",
    short: "v",
    color: "#71cbf7",
    hosts: ["vimeo.com"],
  },
  {
    id: "facebook",
    name: "Facebook",
    short: "f",
    color: "#7ca6ff",
    hosts: ["facebook.com", "fb.watch"],
  },
  {
    id: "dailymotion",
    name: "Dailymotion",
    short: "d",
    color: "#a7a9ff",
    hosts: ["dailymotion.com", "dai.ly"],
  },
] as const;
export type Quality = 720 | 1080 | 1440 | 2160 | 4320;
export const qualities: Quality[] = [720, 1080, 1440, 2160, 4320];
export function qualityLabel(height: number) {
  return height === 4320 ? "8K" : height === 2160 ? "4K" : `${height}p`;
}
