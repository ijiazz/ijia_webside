import React, { PropsWithChildren } from "react";
import { Outlet } from "react-router";

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
        }}
      >
        <video
          poster="/main/bg-login.webp"
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
      <div style={{ position: "relative", height: "100%", overflow: "auto" }}>
        <Outlet />
      </div>
    </div>
  );
}
