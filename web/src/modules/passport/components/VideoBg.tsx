import { PropsWithChildren } from "react";

export function VideoBg(props: PropsWithChildren<{ style?: React.CSSProperties; className?: string }>) {
  return (
    <div style={{ height: "100%", position: "relative" }} className={props.className}>
      <div
        style={{
          position: "absolute",
          height: "100%",
          top: 0,
          left: 0,
          overflow: "hidden",
          zIndex: -1,
        }}
      >
        <video
          style={{
            height: "100%",
            width: "100vw",
            objectFit: "cover",
          }}
          muted
          autoPlay
          loop
        >
          <source src="/main/bg-login.mp4" type="video/mp4" />
        </video>
      </div>
      <div style={{ position: "relative", height: "100%", overflow: "auto" }}>{props.children}</div>
    </div>
  );
}
