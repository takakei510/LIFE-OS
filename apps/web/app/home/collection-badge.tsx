import type { ReactNode } from "react";
import { categoryPresentation } from "@/components/life-icons/presentation";

const motifs: [string, ReactNode][] = [
  ["日常", <><path d="M22 41c-5-16 5-24 23-23 1 18-7 28-23 23Zm0 0 15-15"/></>],
  ["探索", <><circle cx="32" cy="32" r="16"/><path d="m38 26-3 9-9 3 3-9Z"/></>],
  ["創作", <><path d="m20 42 3-10 18-15 7 8-18 15-10 2ZM35 22l7 8M23 32l7 8"/></>],
  ["育成", <><path d="M21 45V29h8v16m6 0V18h8v27M18 46h28"/></>],
  ["身体", <><path d="M17 27v10m5-15v20m20-20v20m5-15v10M22 32h20"/></>],
  ["内面", <><path d="M32 46S15 35 18 25c3-8 11-7 14-2 3-5 11-6 14 2 3 10-14 21-14 21Z"/></>],
];

/** Collection categories use a neutral frame, never a rarity color. */
export function CollectionBadge({ category }: { category: string }) {
  const motif = motifs.find(([name]) => category.includes(name))?.[1];
  const categoryMotif = categoryPresentation(category).motif;
  const supplied = categoryMotif === "life-growth" || categoryMotif === "life-body";
  return <svg className="homeCollectionBadge" data-icon={supplied ? categoryMotif : undefined} width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <path d="m32 3 25 14.5v29L32 61 7 46.5v-29Z" fill="#152338" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.5"/>
    {supplied ? <svg x="16" y="16" width="32" height="32" viewBox="0 0 24 24"><use href={`#${categoryMotif}`}/></svg> : <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{motif ?? <path d="m32 18 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"/>}</g>}
  </svg>;
}
