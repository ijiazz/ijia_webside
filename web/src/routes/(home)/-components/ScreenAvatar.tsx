import styled from "@emotion/styled";
import React from "react";
import a1028 from "../-img/1028.png";

export function ScreenAvatar(props: { src?: string; onTrigger?: () => void }) {
  const { src, onTrigger } = props;
  return (
    <AvatarCSS onDoubleClick={onTrigger}>
      <div className="avatar">
        <img src={src} />
      </div>
      {/* <img className="avatar-font" src={a1028} /> */}
    </AvatarCSS>
  );
}
const AvatarCSS = styled.div`
  position: relative;
  .avatar {
    cursor: pointer;
    pointer-events: all;

    display: flex;
    gap: 8px;
    width: 100px;
    height: 100px;
    flex-direction: column;
    align-items: center;
    /* opacity: 0.8; */
    img {
      width: 100%;
      height: 1000%;
      object-fit: cover;
    }
    overflow: hidden;
    border-radius: 50%;

    --glow-color: #fff6bd;
    border: 3px solid var(--glow-color);
    filter: brightness(1.4);
    box-shadow:
      4px 4px 28px 3px var(--glow-color),
      4px 4px 28px 3px var(--glow-color);
  }
  .avatar-font {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%) scale(0.45);
  }
`;
