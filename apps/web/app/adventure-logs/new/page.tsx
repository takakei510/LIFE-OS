import { randomUUID } from "node:crypto";
import Link from "next/link";

import { AdventureLogForm } from "./adventure-log-form";
import "./new-adventure-log.css";

export default function NewAdventureLogPage() {
  return (
    <main>
      <nav className="pageNav" aria-label="Primary navigation">
        <Link href="/">HOME</Link>
        <Link href="/achievements">ACHIEVEMENTS</Link>
        <Link href="/quests">QUESTS</Link>
        <Link href="/titles">TITLES</Link>
        <Link href="/status">STATUS</Link>
      </nav>

      <section className="newAdventureLogHero">
        <p className="eyebrow">NEW ADVENTURE LOG</p>
        <h1>この冒険から、何を持ち帰る？</h1>
        <p>証拠ではありません。残したい一言や場所だけを、任意で保存できます。</p>
      </section>

      <AdventureLogForm requestId={randomUUID()} />
    </main>
  );
}
