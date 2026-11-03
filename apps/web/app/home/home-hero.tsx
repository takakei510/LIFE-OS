"use client";

import { useState } from "react";

/** Decorative landscape, not a location or a fabricated player memory. */
function QuietLandscape() {
  return <svg className="homeLandscape" viewBox="0 0 900 400" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <path fill="#13253A" d="M0 0h900v400H0z"/>
    <circle cx="714" cy="88" r="38" fill="#A8BBD2" fillOpacity=".65"/>
    <g fill="#A8BBD2" fillOpacity=".55"><circle cx="402" cy="56" r="1.5"/><circle cx="556" cy="98" r="1"/><circle cx="822" cy="42" r="1.5"/><circle cx="624" cy="32" r="1"/></g>
    <path fill="#243A50" d="m260 267 190-164 100 87 84-65 169 150 97-82v207H0V283l133-56Z"/>
    <path fill="#53687C" d="m396 150 54-47 57 50-38-10-19 9-18-15Z"/>
    <path fill="#1B3043" d="m0 298 164-95 158 101 174-90 187 88 217-61v159H0Z"/>
    <path fill="#233D50" d="M0 329c157-28 268 36 417 3s276-17 483 10v58H0Z"/>
    <path stroke="#7CE1FF" strokeOpacity=".2" d="M566 355h211M496 367h241M592 380h194"/>
    <path fill="#102331" d="m0 400 0-75 109 38 65-21 160 58Zm900 0v-91l-125 54-71 37Z"/>
    <g fill="#102331"><path d="m828 188-26 85h14l-25 60h77l-24-60h12Z"/><path d="m873 218-20 65h11l-21 50h61l-19-50h10Z"/></g>
  </svg>;
}

export function HomeHero() {
  const [font, setFont] = useState<"noto" | "dela" | "train">("noto");
  return <section className="homeHero" aria-labelledby="home-heading">
    <QuietLandscape/>
    <div className="homeHeroCopy">
      <p className="homeKicker">THE WORLD IS YOUR PLAYGROUND</p>
      <h1 id="home-heading" data-font={font}>世界に触れた記録</h1>
      <p className="homeHeroLead">新しい体験が、<br className="homeMobileBreak"/>あなたの物語になる。</p>
      <p className="homeHeroNote">競わず、急がず。気になる世界へ。</p>
    </div>
    <details className="homeFontCompare">
      <summary>見出しフォントを比較</summary>
      <fieldset><legend>メイン見出し</legend>
        <label><input type="radio" name="home-heading-font" value="noto" checked={font === "noto"} onChange={() => setFont("noto")}/>Noto Sans JP</label>
        <label><input type="radio" name="home-heading-font" value="dela" checked={font === "dela"} onChange={() => setFont("dela")}/>Dela Gothic One</label>
        <label><input type="radio" name="home-heading-font" value="train" checked={font === "train"} onChange={() => setFont("train")}/>Train One</label>
      </fieldset>
    </details>
  </section>;
}
