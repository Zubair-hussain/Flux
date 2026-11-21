"use client";
import { useCallback, useEffect, useRef } from "react";

type Widget = {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  execute(id: string): void;
  reset(id: string): void;
  remove(id: string): void;
};
declare global {
  interface Window {
    turnstile?: Widget;
  }
}

const scriptSrc =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const unavailable =
  "Verification could not load. Disable blockers for this page and retry, or use the command line.";

/**
 * Cloudflare Turnstile with one token per request. The widget stays invisible
 * unless Cloudflare needs the visitor to prove they are human.
 */
export function useTurnstile(siteKey?: string) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const pending = useRef<
    { resolve: (token: string) => void; reject: (e: Error) => void } | undefined
  >(undefined);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !box.current || !window.turnstile || widget.current)
        return;
      widget.current = window.turnstile.render(box.current, {
        sitekey: siteKey,
        execution: "execute",
        appearance: "interaction-only",
        callback: (token: string) => pending.current?.resolve(token),
        "error-callback": () => pending.current?.reject(new Error(unavailable)),
        "timeout-callback": () =>
          pending.current?.reject(
            new Error("Verification timed out. Please try again."),
          ),
      });
    };
    if (window.turnstile) mount();
    else {
      let script = document.querySelector<HTMLScriptElement>(
        `script[src="${scriptSrc}"]`,
      );
      if (!script) {
        script = document.createElement("script");
        script.src = scriptSrc;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
    }
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = undefined;
    };
  }, [siteKey]);

  /** A fresh single-use token, or "" when Turnstile is not configured. */
  const getToken = useCallback(() => {
    if (!siteKey) return Promise.resolve("");
    return new Promise<string>((resolve, reject) => {
      const id = widget.current;
      if (!id || !window.turnstile) return reject(new Error(unavailable));
      const timer = setTimeout(
        () => reject(new Error("Verification timed out. Please try again.")),
        60_000,
      );
      pending.current = {
        resolve: (token) => {
          clearTimeout(timer);
          resolve(token);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      };
      window.turnstile.reset(id);
      window.turnstile.execute(id);
    });
  }, [siteKey]);

  return { box, getToken, enabled: Boolean(siteKey) };
}
