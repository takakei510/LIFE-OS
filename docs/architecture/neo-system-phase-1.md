# B1 NEO SYSTEM — Phase 1

## Reference and scope

Approved source: [デザインコンセプト比較](https://chatgpt.com/c/6ae9ba5a-3c6c-83ee-a4be-26c5a8598e73), the supplied `1000004708.png` B1 NEO SYSTEM × 実績ツリー mockup, and the Phase 1 approval in [実装専用](https://chatgpt.com/c/6a659d22-7a20-83ee-9234-10269443cafc). The image was inspected before implementation. Its scenic artwork, pixel badges, tree, and sample player statistics are later-phase concepts, not data or assets to copy into the app.

This phase adds the shared vocabulary: calm navy panels, restrained cyan/purple edges, a consistent outline SVG family, self-hosted fonts and responsive navigation. Existing HOME sections and achievement list layout remain in place. Notion repositories, actions, validation, APIs and database data are unchanged. No PR #57 code is included.

## Tokens

`apps/web/app/design-tokens.css` owns colors, surface gradient, radii, spacing, fonts, shadows and interaction timing.

| Role | Value |
| --- | --- |
| Background | `#0B1220` |
| Surface | `#111B2E` |
| Primary | `#00D9F5` |
| Accent | `#A78BFA` |
| Success | `#54E6C7` |
| Legendary | `#FFD166` |

Existing `--bg`, `--panel`, `--panel-strong`, `--text`, `--muted`, `--line`, `--border`, and `--accent` variables remain compatible aliases. Semantic colors are available for later phases; no new achievement or Tier logic is introduced. Noto Sans JP Variable and Space Grotesk Variable are bundled via Fontsource with swap behavior and Unicode subsets, requiring no third-party font requests at runtime or remote downloads during builds. Font licenses remain in the npm packages.

## Components

- `NeoCard`: semantic `section`, `article` or `div`, neutral/cyan/purple treatments. Supply headings or accessible labels as appropriate. No implicit interactivity or fabricated data.
- `NeoButton`: native button attributes and events, defaults to `type="button"`; forms explicitly keep `type="submit"`, disabled and pending behavior.
- `NeoLink`: same button vocabulary with real Next.js navigation semantics. No disabled-link imitation.
- `NeoIcon`: shared currentColor SVG paths. Decorative by default; standalone meaningful icons accept a title. No emoji substitution of database names or player-generated content.
- Existing navigation component: same six routes. Desktop top navigation and mobile six-column bottom navigation, safe-area support, active text/icon/border and `aria-current`. No dead tree or collections routes.

Usage example:

```tsx
<NeoCard tone="purple" aria-labelledby="status-title">
  <h2 id="status-title">Player Status</h2>
  <NeoLink href="/status" variant="secondary">ステータスを見る</NeoLink>
</NeoCard>
```

## Accessibility and responsive behavior

Keyboard focus uses a visible cyan outline; a skip link targets the content wrapper. SVGs do not add redundant announcements beside labels. Main content reserves navigation space. Mobile navigation retains all six destinations in a single row and accounts for safe areas. Common buttons are at least 44px high; mobile form text is 16px to avoid zoom on entry.

`prefers-reduced-motion: reduce` removes decorative animations, transitions and card hover displacement across existing routes, including loading and unlock overlays. State updates still happen immediately. Forced-color mode retains active navigation borders and focus indicators. No autoplay or continuous decorative animation is added.

## Verification and follow-up

Verify TypeScript, production build, Vercel preview and keyboard/navigation/search/form controls without mutating Notion. Permanent fake test records are not needed. Page-specific visual adoption can be expanded in Phase 2; HOME redesign, list redesign, trees, badge artwork and unlock effects are outside this PR. PR #57 remains a separate Draft and may require resolving its small import overlap in the unlock-button file when integrating later.
