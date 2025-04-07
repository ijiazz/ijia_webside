import React, { ReactNode } from "react";
import { AvatarScreen } from "../avatar.tsx";

import styled from "@emotion/styled";

export function Screen(props: {
  text?: ReactNode;
  head?: ReactNode;
  avatar?: ReactNode;

  showMask?: boolean;
  children?: ReactNode;
}) {
  const { children, showMask = false, avatar, head = <div />, text } = props;
  return (
    <ScreenCSS className="screen">
      <AvatarScreen />
      <div className="screen-top-mask" style={{ display: showMask ? undefined : "none" }}>
        {head}
        <div className="center">
          <div className="god-avatar">{avatar}</div>
          {text}
        </div>
        {children}
      </div>
    </ScreenCSS>
  );
}

const ScreenCSS = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
  .god-avatar {
    display: flex;
  }

  .screen {
    &-top-mask {
      pointer-events: none;
      position: absolute;
      backdrop-filter: blur(0.5px);
      top: 0;
      display: flex;
      gap: 14px;
      flex-direction: column;
      width: 100%;
      justify-content: space-around;
      align-items: center;
      height: 100%;
      background-color: #00000030;
      /* mask: radial-gradient(#fff, #fff, #fff0); */
      color: #fff;

      .center {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 24px;
      }
      .flash-text {
        font-size: 40px;
        font-weight: 600;
      }
    }
  }
`;

export function ScreenAvatar(props: { children?: ReactNode; src?: string }) {
  const { children, src } = props;
  return (
    <AvatarCSS>
      <img src={src} />
      {children}
    </AvatarCSS>
  );
}
const AvatarCSS = styled.div`
  display: flex;
  gap: 8px;
  flex-direction: column;
  align-items: center;
  /* opacity: 0.8; */
  img {
    width: 100px;
    height: 100px;
  }
  overflow: hidden;
  border-radius: 50%;

  --glow-color: #fff6bd;
  border: 3px solid var(--glow-color);
  filter: brightness(1.4);
  box-shadow:
    4px 4px 28px 3px var(--glow-color),
    4px 4px 28px 3px var(--glow-color);
`;
