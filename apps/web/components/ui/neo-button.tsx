import Link from "next/link";
import type { ComponentProps } from "react";
import styles from "./neo-ui.module.css";

type Variant = "primary" | "secondary" | "ghost";
export function NeoButton({variant = "primary", className = "", type = "button", ...props}: ComponentProps<"button"> & {variant?: Variant}) {
  return <button {...props} type={type} className={`${styles.button} ${styles[variant]} ${className}`} />;
}
/** Navigation stays a link; mutation controls use NeoButton with explicit type=submit. */
export function NeoLink({variant = "primary", className = "", ...props}: ComponentProps<typeof Link> & {variant?: Variant}) {
  return <Link {...props} className={`${styles.button} ${styles[variant]} ${className}`} />;
}
