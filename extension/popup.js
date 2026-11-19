const hosts = [
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "instagram.com",
  "reddit.com",
  "redd.it",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "twitch.tv",
  "vimeo.com",
  "facebook.com",
  "fb.watch",
  "dailymotion.com",
  "dai.ly",
];
const source = document.getElementById("source");
const button = document.getElementById("open");
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  try {
    const url = new URL(tabs[0]?.url || "");
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !hosts.some(
        (host) => url.hostname === host || url.hostname.endsWith("." + host),
      )
    )
      throw new Error("Open a video on a supported platform first.");
    source.textContent = url.hostname;
    button.disabled = false;
    button.addEventListener("click", () => {
      chrome.tabs.create({
        url: "http://127.0.0.1:3000/?url=" + encodeURIComponent(url.href),
      });
    });
  } catch {
    source.textContent =
      "Open a public video on YouTube, TikTok, Instagram, Reddit, X, LinkedIn, Twitch, Vimeo, Facebook, or Dailymotion.";
  }
});
