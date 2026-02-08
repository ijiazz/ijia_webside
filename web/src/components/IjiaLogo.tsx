import { CSSProperties } from "react";
import ijia_logo_256 from "@/assets/ijia-logo-256.png";

export function IjiaLogo(props: { className?: string; style?: CSSProperties; size?: 64 | 32 | 16 | number }) {
  return (
    <img
      src={ijia_logo_256}
      style={{ width: "1em", ...props.style, fontSize: props.size ?? 32 }}
      className={props.className}
    />
  );
}
