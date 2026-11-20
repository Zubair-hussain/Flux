"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Requests one ad for the preceding <ins class="adsbygoogle"> element. */
export function AdPush() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blocked by an ad blocker or consent choice; the reserved space stays empty.
    }
  }, []);
  return null;
}
