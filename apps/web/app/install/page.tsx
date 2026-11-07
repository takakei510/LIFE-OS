import type { Metadata } from "next";
import { NeoLink } from "@/components/ui/neo-button";

export const metadata: Metadata = {
  title: "ホーム画面に追加 | Life OS",
  description: "Life OSをスマートフォンのホーム画面から開く方法。",
};

export default function InstallPage() {
  return (
    <main>
      <header className="pageHeader compactHero">
        <p className="eyebrow">LIFE OS WEB APP</p>
        <h1>ホーム画面に追加</h1>
        <p className="lead">いつものLife OSを、スマートフォンのアイコンから開けます。</p>
      </header>

      <section className="panel" aria-labelledby="install-ios">
        <h2 id="install-ios">iPhone · Safari</h2>
        <ol>
          <li>SafariでLife OSのホームを開きます。</li>
          <li>共有メニューを開き、「ホーム画面に追加」を選びます。</li>
          <li>「Webアプリとして開く」が表示されたらオンにして、「追加」を押します。</li>
        </ol>
      </section>

      <section className="panel" aria-labelledby="install-android">
        <h2 id="install-android">Android · Chrome</h2>
        <ol>
          <li>ChromeでLife OSのホームを開きます。</li>
          <li>右上のメニューから「アプリをインストール」または「ホーム画面に追加」を選びます。</li>
          <li>画面の案内に沿って追加します。</li>
        </ol>
      </section>

      <p className="muted">チャットなどのアプリ内ブラウザーで開いている場合は、SafariまたはChromeで開き直してください。起動時にログイン画面が出たら、いつものアカウントでログインします。</p>
      <NeoLink href="/">Life OSのホームへ</NeoLink>
    </main>
  );
}
