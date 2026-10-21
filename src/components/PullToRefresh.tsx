"use client";

import { useEffect, useRef, useState } from "react";

/** Hur långt man drar (px) innan sidan laddas om när man släpper. */
const THRESHOLD = 70;
const MAX_PULL = 110;

/**
 * Safari har "dra ner för att ladda om" först från iOS 15, och en app som är installerad
 * på hemskärmen har det aldrig. Där lägger vi till en egen. Övriga webbläsare har sin egen,
 * så då gör vi ingenting.
 */
function needsOwnPullToRefresh(): boolean {
  const ua = navigator.userAgent;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const major = Number((ua.match(/OS (\d+)_\d+.* like Mac OS X/) ?? ua.match(/Version\/(\d+)/) ?? [])[1]);
  return standalone || (ios && major > 0 && major < 15);
}

export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [reloading, setReloading] = useState(false);
  const pullRef = useRef(0);

  useEffect(() => {
    if (!needsOwnPullToRefresh()) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const set = (value: number) => {
      pullRef.current = value;
      setPull(value);
    };
    const onStart = (e: TouchEvent) => {
      // Bara när sidan redan är högst upp, och inte i en öppen dialog.
      tracking = window.scrollY <= 0 && e.touches.length === 1 && !document.querySelector(".overlay");
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      // Sidledes drag (t.ex. måltidsraden på mobil) räknas inte.
      if (dy <= 0 || Math.abs(dx) > dy) return set(0);
      set(Math.min(dy * 0.5, MAX_PULL));
    };
    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (pullRef.current >= THRESHOLD) {
        setReloading(true);
        window.location.reload();
      } else {
        set(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  if (pull === 0 && !reloading) return null;
  const ready = pull >= THRESHOLD || reloading;
  return (
    <div
      className={`pull-refresh ${ready ? "is-ready" : ""} ${reloading ? "is-reloading" : ""}`}
      style={{ transform: `translate(-50%, ${reloading ? THRESHOLD : pull}px)` }}
      aria-hidden
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${pull * 3}deg)` }}>
        <path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path d="M20 4v5h-5" />
      </svg>
    </div>
  );
}
