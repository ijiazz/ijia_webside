import { css } from "@emotion/css";

export const AvatarScreen = css`
  height: 100%;
  user-select: none;

  cursor: move;
`;

export const AvatarItem = css`
  position: relative;
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
  /* opacity: 0.6; */
  /* padding: 1.2px; */

  &-img {
    --glow-color: #12639a;
    box-sizing: border-box;
    border: 1.2px solid;
    border-color: var(--glow-color);
    background: var(--glow-color);
    img {
      width: 100%;
      height: 100%;
      opacity: 0.75;
      object-fit: cover;
      border-radius: 10%;
      overflow: hidden;
    }
    display: none;
  }
  .user-name {
    padding: 2px;
    text-align: center;
    font-size: 10px;
    transition: background-color 100ms linear;
  }

  :hover {
    .user-name {
      height: 100%;
      width: 100%;
      background-color: #0009;
      color: #fff;
      position: absolute;
      top: 0;
      left: 0;
    }
  }

  @keyframes img-display {
    0% {
      width: 0%;
      height: 0%;
    }
    100% {
      width: 100%;
      height: 100%;
    }
  }
  @keyframes img-empty-display {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  &.highlight {
    .avatar-item-img {
      background-color: #00fbff;
      border-color: #00fbff;
      border-width: 3px;
    }
  }
  &.loaded {
    .avatar-item-img {
      height: 100%;
      width: 100%;
      animation: img-display 1s ease forwards;
      margin: auto;
      display: block;
    }
  }
`;
