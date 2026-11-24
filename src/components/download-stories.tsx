"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Leaf, Pause, Play } from "lucide-react";

const stories = [
  {
    id: "fox-firefly",
    title: "Fox & the firefly",
    description:
      "A curious fox follows a little light through the moonlit woods.",
  },
  {
    id: "owl-moon",
    title: "Owl’s moonlit flight",
    description: "A little owl leaves its branch for a moonlit adventure.",
  },
  {
    id: "rabbit-carrot",
    title: "A very lucky rabbit",
    description: "One determined rabbit finds the perfect midnight snack.",
  },
  {
    id: "turtle-tide",
    title: "Together to the tide",
    description: "A turtle leads a tiny hatchling toward the gentle sea.",
  },
  {
    id: "otter-shell",
    title: "Otter’s little treasure",
    description: "A floating otter discovers a tiny shell worth keeping.",
  },
  {
    id: "hedgehog-rain",
    title: "A leaf for a rainy day",
    description: "A resourceful hedgehog turns a fallen leaf into an umbrella.",
  },
  {
    id: "whale-bubbles",
    title: "A whale of a little tale",
    description: "A whale and its calf send bubbles toward the stars.",
  },
  {
    id: "deer-butterfly",
    title: "An unexpected friend",
    description: "A shy deer pauses to greet a wandering butterfly.",
  },
  {
    id: "penguin-friends",
    title: "Slide into a friendship",
    description: "A little penguin slides across the ice to meet a friend.",
  },
];

/** Mounted only while a server request or a download is in progress. */
export function DownloadStories({ starting }: { starting: boolean }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(true);
  const [available, setAvailable] = useState(true);
  const video = useRef<HTMLVideoElement>(null);
  const panel = useRef<HTMLElement>(null);
  const story = stories[index];

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPaused(preference.matches);
    const changed = () => setPaused(preference.matches);
    preference.addEventListener("change", changed);
    // Make a new wait feel different, then play the whole collection in order.
    setIndex(Math.floor(Math.random() * stories.length));
    panel.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
    return () => preference.removeEventListener("change", changed);
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let mounted = true;
    const update = () => {
      if (paused || document.hidden) element.pause();
      else
        void element.play().catch((error: DOMException) => {
          if (mounted && error.name !== "AbortError") setPaused(true);
        });
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", update);
    };
  }, [paused, index, available]);

  const next = () => {
    setAvailable(true);
    setIndex((previous) => (previous + 1) % stories.length);
  };

  return (
    <aside
      className="download-stories"
      aria-label="Wildlife stories while you wait"
      ref={panel}
    >
      <div className="stories-heading">
        <div>
          <span className="stories-eyebrow">
            <Leaf size={13} /> A LITTLE WILD, WHILE YOU WAIT
          </span>
          <h2>
            {starting ? "Starting your download…" : "Your video is on its way."}
          </h2>
        </div>
        <span className="stories-silent">SILENT SHORTS</span>
      </div>
      <div className="stories-screen">
        {available ? (
          <video
            key={story.id}
            ref={video}
            src={`/animations/wildlife/${story.id}.webm`}
            poster={`/animations/wildlife/${story.id}.svg`}
            width={768}
            height={432}
            muted
            playsInline
            preload="auto"
            aria-label={story.description}
            onEnded={next}
            onError={() => setAvailable(false)}
          />
        ) : (
          // The waiting panel must never interrupt the actual download.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/animations/wildlife/${story.id}.svg`}
            alt={story.description}
            width={768}
            height={432}
          />
        )}
        <span className="stories-episode">
          {String(index + 1).padStart(2, "0")} / 09
        </span>
      </div>
      <div className="stories-caption">
        <div>
          <h3>{story.title}</h3>
          <p>A small story. We’ll let you know when your file is ready.</p>
        </div>
        <div className="stories-controls">
          {available && (
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-label={
                paused ? "Play wildlife animation" : "Pause wildlife animation"
              }
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
          <button type="button" onClick={next} aria-label="Next wildlife story">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
