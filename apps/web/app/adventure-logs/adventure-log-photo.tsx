"use client";

import { useState } from "react";
import type { AdventureLogMedia } from "@/lib/notion/types";
import "./adventure-log-photo.css";

function Photo({ src, name, count, compact }: { src: string; name: string; count: number; compact: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`adventurePhoto${compact ? " adventurePhoto--compact" : ""}`}>
      {failed ? <span className="adventurePhotoFallback">📸<span>写真を読み込めませんでした。<br />ページを再読み込みすると再取得できます。</span></span> : <img src={src} alt={name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
      {count > 1 ? <span className="adventurePhotoCount">写真 {count}枚</span> : null}
    </span>
  );
}

export function AdventureLogPhoto({ media, compact = false }: { media: AdventureLogMedia[]; compact?: boolean }) {
  const images = media.filter((item) => item.mediaType === "image");
  const first = images.find((item) => item.displayUrl);
  if (!first?.displayUrl) return null;
  return <Photo key={first.displayUrl} src={first.displayUrl} name={first.name} count={images.length} compact={compact} />;
}
