// Révélation de texte épurée, rendue côté serveur (visible sans JS) ; words = mot par mot
import { Fragment } from "react";
export function R({ as: Tag = "p", words = false, d = 0, className = "", children, ...p }) {
  const style = { "--d": d + "s" };
  if (words && typeof children === "string")
    return <Tag className={`rv w ${className}`} style={style} {...p}>{children.split(" ").map((w, i) => <Fragment key={i}><span style={{ "--i": i }}><span>{w}</span></span>{" "}</Fragment>)}</Tag>;
  return <Tag className={`rv ${className}`} style={style} {...p}>{children}</Tag>;
}
