"use client";

import { useEffect, useRef } from "react";
import { useT } from "./OrderProvider";

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

/** Produktfilmen i ett fönster ovanpå sidan. Kan visas i helskärm. Stängs med Esc eller tryck utanför. */
export function VideoDialog({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const v = t.login;
  const videoRef = useRef<FullscreenVideo>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // iPad och iPhone har bara helskärm för själva videon (webkitEnterFullscreen).
  const fullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) video.requestFullscreen().catch(() => video.webkitEnterFullscreen?.());
    else video.webkitEnterFullscreen?.();
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="video-title" onClick={onClose}>
      <div className="video-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="video-dialog-head">
          <h2 id="video-title">{v.videoTitle}</h2>
          <button className="btn btn-ghost btn-small" onClick={onClose}>{v.videoClose}</button>
        </div>
        <video
          ref={videoRef}
          className="video-dialog-player"
          poster="/video/produktvideo-poster.jpg"
          controls
          autoPlay
          playsInline
          preload="metadata"
        >
          {/* MP4 (H.264 Main) spelas på iPad och de flesta webbläsare, WebM är reserv där H.264 saknas. */}
          <source src="/video/produktvideo.mp4" type='video/mp4; codecs="avc1.4D4020"' />
          <source src="/video/produktvideo.webm" type="video/webm" />
        </video>
        <div className="video-dialog-foot">
          <p className="muted">{v.videoHint}</p>
          <button className="btn btn-primary btn-small" onClick={fullscreen}>⛶ {v.videoFullscreen}</button>
        </div>
      </div>
    </div>
  );
}
