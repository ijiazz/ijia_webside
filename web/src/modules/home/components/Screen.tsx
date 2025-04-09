import React, { ReactNode, useMemo, useRef, useState } from "react";
import { useHoFetch } from "@/hooks/http.ts";
import styled from "@emotion/styled";
import { InfiniteWallRender } from "@/lib/Infinite-wall/mod.ts";
import { InfiniteWall } from "@/lib/Infinite-wall/react.tsx";
import { useAsync } from "@/hooks/async.ts";
import { useShakeAnimation } from "./shake_animation.ts";
import classNames from "classnames";
import { getCurrentUserId } from "@/common/user.ts";

type AvatarItem = {
  key: string;
  url: string;
  userId: number;
  name: string;
};
type AvatarListProps = {
  text?: ReactNode;
  head?: ReactNode;
  avatar?: ReactNode;

  showMask?: boolean;
  children?: ReactNode;
};

export function Screen(props: AvatarListProps) {
  const { children, showMask = true, avatar, head = <div />, text } = props;

  const { api, http } = useHoFetch();
  const rows = 20;
  const columns = 20;
  const limit = rows * columns;
  const { result: data } = useAsync(
    async () => {
      const { items, total } = await api["/live/screen/avatar"].get({ query: { number: limit } });
      const list: AvatarItem[] = new Array(limit);
      for (let i = 0; i < limit; i++) {
        list[i] = {
          key: `${i}`,
          name: items[i]?.name,
          url: items[i]?.avatar_url,
          userId: 23456,
        };
      }
      const currentUserId = getCurrentUserId();
      return { userId: currentUserId, list };
    },
    { autoRunArgs: [] },
  );
  const avatarList = data.value?.list;
  const currentUserId = data.value?.userId;

  const wallRef = useRef<InfiniteWallRender>(null);
  const ref = useRef<HTMLDivElement>(null);
  const godAvatarRef = useRef<HTMLDivElement>(null);
  /** 镜头抖动 */
  const animationCtrl = useShakeAnimation({
    autoPlay: true,
    targetRef: godAvatarRef,
    heightRange: 50,
    widthRange: 50,
    onFrameUpdate: (offsetX: number, offsetY: number) => {
      const wall = wallRef.current!;
      wall.scrollLeft = areaRef.current.baseX + offsetX;
      wall.scrollTop = areaRef.current.baseY + offsetY;
    },
  });
  const areaRef = useRef<{ baseX: number; baseY: number; isPlay: boolean }>({
    baseX: 0,
    baseY: 0,
    isPlay: animationCtrl.isPlay,
  });

  return (
    <ScreenCSS className="screen">
      <AvatarScreenCSS
        ref={ref}
        onDragStartCapture={(e) => e.preventDefault()}
        onMouseDown={() => {
          const wall = wallRef.current!;
          const meta = areaRef.current;
          meta.baseX = wall.scrollLeft;
          meta.baseY = wall.scrollTop;
          if (animationCtrl.isPlay) {
            animationCtrl.stop();
            meta.isPlay = true;
          }
        }}
        onMouseUp={() => {
          const wall = wallRef.current!;
          const meta = areaRef.current;
          meta.baseX = wall.scrollLeft;
          meta.baseY = wall.scrollTop;
          if (meta.isPlay) {
            animationCtrl.play();
          }
        }}
      >
        <InfiniteWall
          blockHeight={60}
          blockWidth={60}
          ref={wallRef}
          deps={[data]}
          renderItem={(element, wall) => {
            let px: number = element.wallX;
            let py: number = element.wallY;
            if (avatarList && avatarList.length >= limit) {
              px %= columns;
              py %= rows;
            }
            const index = Math.abs(py) * columns + Math.abs(px) + 1;

            const item = avatarList?.[index];
            const isActive = currentUserId !== undefined && item?.userId === currentUserId;

            return <Image className="avatar-item" imgClassName="avatar-item-img" active={isActive} item={item}></Image>;
          }}
        ></InfiniteWall>
      </AvatarScreenCSS>
      <div className="screen-top-mask" style={{ display: showMask ? undefined : "none" }}>
        {head}
        <div className="center">
          <div className="god-avatar" ref={godAvatarRef}>
            {avatar}
          </div>
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

const AvatarScreenCSS = styled.div`
  height: 100%;
  background: linear-gradient(to bottom right, #141c64, #00a6d4, #000a68);
  user-select: none;

  cursor: move;
  .avatar-item {
    position: relative;
    height: 100%;
    transition: opacity 100ms linear;
    box-sizing: border-box;
    opacity: 0.6;
    padding: 1.2px;
    border-radius: 10%;
    overflow: hidden;

    :hover {
      opacity: 1;
    }
    .highlight {
      opacity: 1;
      filter: brightness(1.3);
    }

    &-img {
      display: block;
      object-fit: cover;
      width: 0%;
      height: 0%;
    }
    &-img.loaded {
      animation: img-display 1s ease forwards;
      margin: auto;
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
  }

  animation: gradient-x 10s ease infinite;
  background-size: 300%;
  @keyframes gradient-x {
    0% {
      background-position-x: 0%;
    }
    50% {
      background-position-x: 100%;
    }
    100% {
      background-position-x: 0%;
    }
  }
`;
function Image(props: { active?: boolean; item?: AvatarItem; className?: string; imgClassName?: string }) {
  const { item, className, imgClassName, active } = props;
  const [loading, setLoading] = useState(true);
  useMemo(() => setLoading(true), [item]);
  return (
    <div className={classNames(className, { loaded: !loading, highlight: active })}>
      <img
        className={classNames(imgClassName, { loaded: !loading })}
        src={item?.url}
        onLoad={() => {
          setLoading(false);
        }}
        style={{ display: loading ? "none" : undefined }}
      ></img>
      <div className="user-name">{item?.name}</div>
    </div>
  );
}

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
