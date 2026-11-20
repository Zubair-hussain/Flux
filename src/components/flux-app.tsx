"use client";
import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Check,
  CheckCheck,
  ChevronDown,
  Clipboard,
  Code2,
  Download,
  ExternalLink,
  Film,
  Globe2,
  Layers3,
  Link2,
  LoaderCircle,
  MonitorDown,
  Plus,
  Puzzle,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { platforms, qualityLabel, type Quality } from "@/lib/platforms";
import type { Job, VideoInfo } from "@/lib/types";
import { version as cliVersion } from "../../packages/cli/package.json";

async function api<T>(
  url: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    signal,
    ...(body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { cache: "no-store" }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
function PlatformIcon({ id, short }: { id: string; short: string }) {
  if (id === "youtube")
    return (
      <svg viewBox="0 0 28 22" fill="currentColor" aria-hidden="true">
        <rect x="1" y="2" width="26" height="18" rx="6" />
        <path d="m12 7 7 4-7 4Z" fill="#17171f" />
      </svg>
    );
  if (id === "instagram")
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r=".7" fill="currentColor" />
      </svg>
    );
  if (id === "reddit")
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <ellipse cx="12" cy="14" rx="9" ry="6" />
        <path d="m12 8 2-6 5 1M8 16q4 3 8 0" />
        <circle cx="8" cy="12" r="1" fill="currentColor" />
        <circle cx="16" cy="12" r="1" fill="currentColor" />
        <circle cx="20" cy="3" r="2" />
      </svg>
    );
  return <span aria-hidden="true">{short}</span>;
}
export function FluxApp({
  guide,
  publicSite = false,
}: {
  guide?: React.ReactNode;
  /** Hosted website: downloads run on the visitor's computer via the CLI. */
  publicSite?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [quality, setQuality] = useState<Quality>(1080);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tab, setTab] = useState<"video" | "queue">("video");
  const [modal, setModal] = useState<
    "extension" | "agents" | "platforms" | null
  >(null);
  const [notice, setNotice] = useState("");
  const [command, setCommand] = useState("");
  const [cliQuality, setCliQuality] = useState("best");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasActiveJobs = jobs.some(
    (job) => job.status === "queued" || job.status === "downloading",
  );
  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("url");
    if (shared) setUrl(shared);
  }, []);
  useEffect(() => {
    if (publicSite) return;
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let refreshing = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (!mounted || document.hidden || refreshing) return;
      clearTimeout(timer);
      refreshing = true;
      try {
        const data = await api<Job[]>(
          "/api/downloads",
          undefined,
          controller.signal,
        );
        if (mounted) setJobs(data);
      } catch {
        if (mounted)
          setNotice(
            "Cannot reach the local server. Keep Flux running to manage downloads.",
          );
      } finally {
        refreshing = false;
        if (mounted && !document.hidden)
          timer = setTimeout(refresh, hasActiveJobs ? 2000 : 15000);
      }
    };
    const visibilityChanged = () => {
      clearTimeout(timer);
      if (!document.hidden) void refresh();
    };
    void refresh();
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      mounted = false;
      clearTimeout(timer);
      controller.abort();
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [hasActiveJobs, publicSite]);
  useEffect(() => {
    if (!modal) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [modal]);
  function buildCommand() {
    setError("");
    setCommand("");
    let link: URL;
    try {
      link = new URL(url.trim());
    } catch {
      setError("Enter a complete https:// video URL.");
      return;
    }
    const known = platforms.some((p) =>
      p.hosts.some(
        (h) => link.hostname === h || link.hostname.endsWith(`.${h}`),
      ),
    );
    if (link.protocol !== "https:" || !known) {
      setError(
        "This platform is not supported. Choose a platform shown below.",
      );
      return;
    }
    link.hash = "";
    setCommand(`node ./flux.mjs '${link.href.replace(/'/g, "%27")}'`);
  }
  async function copyCommand(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Command copied. Paste it into a terminal to download.");
    } catch {
      setNotice("Select the command and copy it manually.");
    }
  }
  async function inspect(event: React.FormEvent) {
    event.preventDefault();
    if (publicSite) return buildCommand();
    setBusy(true);
    setError("");
    setVideo(null);
    try {
      const data = await api<VideoInfo>("/api/inspect", { url });
      setVideo(data);
      setQuality(data.qualities.at(-1)!);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    if (!video) return;
    setBusy(true);
    setError("");
    try {
      const job = await api<Job>("/api/downloads", { url: video.url, quality });
      setJobs((old) => [job, ...old]);
      setTab("queue");
      setVideo(null);
      setNotice("Download started. You can save the file when it is ready.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function paste() {
    try {
      setUrl(await navigator.clipboard.readText());
      setVideo(null);
      inputRef.current?.focus();
    } catch {
      setError(
        "Clipboard access is unavailable. Paste the link directly into the field.",
      );
    }
  }
  const complete = jobs.filter((j) => j.status === "complete").length;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Flux home">
          <span className="brand-mark">
            <Layers3 size={24} />
          </span>
          flux<span className="brand-period">.</span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          <button
            className={tab === "video" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("video")}
          >
            <MonitorDown size={19} /> Video downloader{" "}
            <span className="nav-spark">✦</span>
          </button>
          {publicSite ? (
            <a
              className="nav-item"
              href="https://github.com/Zubair-hussain/Flux"
              target="_blank"
              rel="noopener"
            >
              <Code2 size={18} /> Source on GitHub
            </a>
          ) : (
            <button
              className={tab === "queue" ? "nav-item active" : "nav-item"}
              onClick={() => setTab("queue")}
            >
              <Download size={18} /> My downloads{" "}
              <span className="count">{jobs.length}</span>
            </button>
          )}
          <button className="nav-item" onClick={() => setModal("platforms")}>
            <Globe2 size={19} /> Supported platforms
          </button>
        </nav>
        <div className="workspace-label tools-label">MAKE IT YOURS</div>
        <button className="nav-item" onClick={() => setModal("extension")}>
          <Puzzle size={19} /> Chrome extension{" "}
          <span className="new-tag">NEW</span>
        </button>
        <button className="nav-item" onClick={() => setModal("agents")}>
          <Code2 size={19} /> For AI agents
        </button>
        <div className="side-bottom">
          <div className="quality-card">
            <div className="mini-stars">
              ✧ <Sparkles size={18} />
            </div>
            <strong>Every pixel matters.</strong>
            <p>
              Original quality.
              <br />
              No compromises.
            </p>
            <span>
              UP TO 8K UHD <span>↗</span>
            </span>
          </div>
          <div className="local-badge">
            <span className="avatar">Y</span>
            <div>
              Your local workspace<small>Private by design</small>
            </div>
            <ShieldCheck size={17} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <span className="slash">/</span>
            {tab === "video" ? "Video downloader" : "My downloads"}
          </div>
          <div className="topbar-right">
            <span className="local-pill">
              <ShieldCheck size={14} /> Local & private
            </span>
            <a
              href="https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md"
              target="_blank"
              rel="noreferrer"
            >
              Platform guide <ExternalLink size={14} />
            </a>
          </div>
        </header>
        <main>
          {tab === "video" ? (
            <>
              <section className="hero">
                <div className="eyebrow">
                  <span className="tiny-star">✦</span> THE INTERNET MOVES. KEEP
                  THE GOOD PARTS.
                </div>
                <h1>
                  Great videos.
                  <br />
                  <span>Yours to keep.</span>
                </h1>
                <p>
                  Your favorite moments, from your favorite platforms.
                  <br />
                  One link. Original quality. All in one place.
                </p>
                <div className="hero-badges">
                  <span>
                    <Check size={14} /> Up to 8K quality
                  </span>
                  <span>
                    <Check size={14} /> No account needed
                  </span>
                  <span>
                    <Check size={14} /> Your files stay local
                  </span>
                </div>
              </section>
              <section className="download-card" aria-label="Download a video">
                <div className="card-top">
                  <div>
                    <span className="card-icon">
                      <Link2 size={18} />
                    </span>
                    <h2>Drop a link. Get the video.</h2>
                  </div>
                  <span className="safe-tag">
                    <ShieldCheck size={14} /> Safe-content filter
                  </span>
                </div>
                <form onSubmit={inspect}>
                  <label className="sr-only" htmlFor="video-url">
                    Video URL
                  </label>
                  <div className="url-field">
                    <Link2 size={20} />
                    <input
                      id="video-url"
                      ref={inputRef}
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setVideo(null);
                        setError("");
                      }}
                      type="url"
                      required
                      placeholder="Paste your video link here…"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="paste-button"
                      onClick={paste}
                    >
                      <Clipboard size={15} /> Paste
                    </button>
                  </div>
                  <div className="form-bottom">
                    <span>
                      <ShieldCheck size={15} /> Public videos only. Always
                      respect creators.
                    </span>
                    <button
                      className="primary-button"
                      disabled={busy}
                      type="submit"
                    >
                      {busy ? (
                        <LoaderCircle className="spin" size={17} />
                      ) : (
                        <Download size={17} />
                      )}{" "}
                      {busy
                        ? "Working…"
                        : publicSite
                          ? "Get download command"
                          : "Find video"}
                    </button>
                  </div>
                </form>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                {publicSite && command && (
                  <div className="video-result cli-result">
                    <p className="cli-intro">
                      First{" "}
                      <a href="/downloads/flux.mjs" download="flux.mjs">
                        download the Flux CLI
                      </a>{" "}
                      and open PowerShell (Windows) or Terminal (macOS/Linux) in
                      that folder. It needs Node.js 22+, yt-dlp and FFmpeg;{" "}
                      <code>node ./flux.mjs doctor</code> checks them. Then run
                      this command to save the video locally.
                    </p>
                    <p className="cli-note">
                      For npm users:{" "}
                      <a
                        href={`/downloads/flux-downloader-${cliVersion}.tgz`}
                        download
                      >
                        download the npm package (.tgz)
                      </a>
                      . Install that file with{" "}
                      <code>
                        npm install -g ./flux-downloader-{cliVersion}.tgz
                      </code>{" "}
                      to use the <code>flux</code> command.
                    </p>
                    <div className="result-actions">
                      <label>
                        Quality
                        <select
                          value={cliQuality}
                          onChange={(e) => setCliQuality(e.target.value)}
                        >
                          <option value="best">Best available</option>
                          <option value="720">720p</option>
                          <option value="1080">1080p</option>
                          <option value="1440">1440p</option>
                          <option value="4k">4K</option>
                          <option value="8k">8K</option>
                        </select>
                      </label>
                    </div>
                    <div className="cli-command">
                      <code>
                        {command}
                        {cliQuality === "best" ? "" : ` -q ${cliQuality}`}
                      </code>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          copyCommand(
                            `${command}${cliQuality === "best" ? "" : ` -q ${cliQuality}`}`,
                          )
                        }
                      >
                        <Clipboard size={16} /> Copy
                      </button>
                    </div>
                    <p className="cli-note">
                      Videos are saved straight to your device; nothing passes
                      through this website. Only download videos you own or have
                      permission to save.
                    </p>
                  </div>
                )}
                {video && (
                  <div className="video-result">
                    <div className="result-title">
                      <Film size={27} />
                      <div>
                        <strong>{video.title}</strong>
                        <p>
                          {video.creator} · {Math.floor(video.duration / 60)}m{" "}
                          {Math.round(video.duration % 60)}s · {video.platform}
                        </p>
                      </div>
                    </div>
                    <div className="result-actions">
                      <label>
                        Source quality
                        <select
                          value={quality}
                          onChange={(e) =>
                            setQuality(Number(e.target.value) as Quality)
                          }
                        >
                          {video.qualities.map((q) => (
                            <option value={q} key={q}>
                              {qualityLabel(q)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="primary-button"
                        onClick={download}
                        disabled={busy}
                      >
                        <Download size={17} /> Download {qualityLabel(quality)}
                      </button>
                    </div>
                  </div>
                )}
              </section>
              <section className="platform-section">
                <div className="section-heading">
                  <h2>All your platforms. One downloader.</h2>
                  <button onClick={() => setModal("platforms")}>
                    View all <Plus size={14} />
                  </button>
                </div>
                <div className="platform-grid">
                  {platforms.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      className="platform-card"
                      onClick={() => {
                        setNotice(
                          `Paste a public ${p.name} video link above to get started.`,
                        );
                        inputRef.current?.focus();
                      }}
                    >
                      <span
                        className={`platform-icon ${p.id}`}
                        style={{ color: p.color }}
                      >
                        <PlatformIcon id={p.id} short={p.short} />
                      </span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
                <p className="platform-footnote">
                  Also works with Facebook and Dailymotion.{" "}
                  <span>More moments, fewer tabs.</span>
                </p>
              </section>
              <section className="features">
                <article>
                  <span className="feature-icon">
                    <Film size={20} />
                  </span>
                  <div>
                    <h3>Quality without the guesswork</h3>
                    <p>
                      From 720p to 8K. Pick the resolution
                      <br className="desktop-break" /> your source actually
                      offers.
                    </p>
                  </div>
                  <span className="feature-watermark">8K</span>
                </article>
                <article>
                  <span className="feature-icon">
                    <ShieldCheck size={21} />
                  </span>
                  <div>
                    <h3>A cleaner kind of downloader</h3>
                    <p>
                      No account required. Sexual and age-
                      <br className="desktop-break" />
                      restricted metadata gets blocked.
                    </p>
                  </div>
                </article>
                <article className="extension-feature">
                  <span className="feature-icon">
                    <Puzzle size={20} />
                  </span>
                  <div>
                    <h3>Less copying. More keeping.</h3>
                    <p>Send a video straight from your browser.</p>
                    <button onClick={() => setModal("extension")}>
                      Get the Chrome extension <ExternalLink size={13} />
                    </button>
                  </div>
                </article>
              </section>
              {guide}
            </>
          ) : (
            <section className="queue-page">
              <div className="eyebrow">YOUR PERSONAL COLLECTION</div>
              <h1>
                My downloads<span>.</span>
              </h1>
              <p>
                {complete} ready to save · {jobs.length} total downloads
              </p>
              <div className="queue-list">
                {jobs.length === 0 ? (
                  <div className="empty-state">
                    <Download size={40} />
                    <h2>A little empty. For now.</h2>
                    <p>Your next favorite video belongs here.</p>
                    <button
                      className="primary-button"
                      onClick={() => setTab("video")}
                    >
                      Find a video
                    </button>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <article className="job" key={job.id}>
                      <span className="job-icon">
                        <Film size={23} />
                      </span>
                      <div>
                        <h2>{job.title}</h2>
                        <p>
                          {job.platform} · {qualityLabel(job.quality)} ·{" "}
                          {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                        {job.error && <p className="job-error">{job.error}</p>}
                      </div>
                      <span className={`status ${job.status}`}>
                        {job.status === "downloading" ||
                        job.status === "queued" ? (
                          <LoaderCircle size={14} className="spin" />
                        ) : job.status === "complete" ? (
                          <CheckCheck size={15} />
                        ) : (
                          <X size={14} />
                        )}{" "}
                        {job.status}
                      </span>
                      {job.status === "complete" && (
                        <a
                          className="save-button"
                          href={`/api/downloads/${job.id}/file`}
                          download
                        >
                          <Download size={16} /> Save file
                        </a>
                      )}
                      {job.status === "failed" && (
                        <button
                          className="save-button"
                          onClick={() => {
                            setTab("video");
                            inputRef.current?.focus();
                          }}
                        >
                          Try another link
                        </button>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <footer>
            <span>
              <span className="footer-logo">✦</span> Made for the moments worth
              keeping.
            </span>
            <span>
              Download responsibly. Respect creators.{" "}
              <span className="footer-dot">·</span> <ShieldCheck size={13} />{" "}
              Local-first MVP
            </span>
          </footer>
        </main>
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="modal-close"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X />
            </button>
            <span className="modal-symbol">
              {modal === "extension" ? (
                <Puzzle size={30} />
              ) : modal === "agents" ? (
                <Code2 size={30} />
              ) : (
                <Globe2 size={30} />
              )}
            </span>
            <h2 id="modal-title">
              {modal === "extension"
                ? "Flux, one click closer."
                : modal === "agents"
                  ? "Meet your agent’s downloader."
                  : "A home for your favorite platforms."}
            </h2>
            {modal === "extension" ? (
              <>
                <p>
                  The included Chrome extension sends the current video to your
                  local Flux workspace. No browsing history is collected.
                </p>
                <ol>
                  <li>
                    Keep Flux running at <code>http://127.0.0.1:3000</code>.
                  </li>
                  <li>
                    Open <code>chrome://extensions</code> and enable Developer
                    mode.
                  </li>
                  <li>
                    Choose “Load unpacked” and select this project’s{" "}
                    <code>extension</code> folder.
                  </li>
                  <li>
                    Open a supported video, click Flux, then “Open in Flux”.
                  </li>
                </ol>
                <p className="muted">
                  Developer installation; this extension is not published to the
                  Chrome Web Store.
                </p>
              </>
            ) : modal === "agents" ? (
              <>
                <p>
                  A stdio MCP server lets Claude, Codex, and compatible clients
                  inspect videos, start downloads, and check their status. The
                  same content policy applies.
                </p>
                <pre>{`{\n  "mcpServers": {\n    "flux": {\n      "command": "npx",\n      "args": ["tsx", "/absolute/path/to/mcp/server.ts"]\n    }\n  }\n}`}</pre>
                <p>
                  Start Flux first with <code>npm run dev</code>. See{" "}
                  <code>docs/AGENTS.md</code> for setup and REST examples.
                </p>
              </>
            ) : (
              <>
                <p>
                  Public, non-DRM videos only. Support depends on source
                  availability and yt-dlp’s current extractors; some platforms
                  require sign-in and are unavailable in this MVP.
                </p>
                <div className="modal-platforms">
                  {platforms.map((p) => (
                    <span key={p.id}>
                      <span style={{ color: p.color }}>{p.short}</span>
                      {p.name}
                    </span>
                  ))}
                </div>
                <p className="muted">
                  4K and 8K appear only when the original source provides them.
                  No upscaling.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
