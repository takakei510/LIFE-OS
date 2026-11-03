import type { HTMLAttributes } from "react";
import styles from "./neo-ui.module.css";

type NeoCardProps = HTMLAttributes<HTMLElement> & { as?: "section" | "article" | "div"; tone?: "neutral" | "cyan" | "purple" };
export function NeoCard({as: Tag = "section", tone = "neutral", className = "", ...props}: NeoCardProps) {
  return <Tag {...props} className={`${styles.card} ${styles[tone]} ${className}`} />;
}
