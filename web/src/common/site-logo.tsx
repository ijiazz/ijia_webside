import { FireOutlined } from "@ant-design/icons";
import { CSSProperties } from "react";

export function IjiaLogo(props: { style?: CSSProperties; size?: 64 | 32 | 16 | number }) {
  return <FireOutlined style={{ ...props.style, fontSize: props.size ?? 32 }} />;
}
