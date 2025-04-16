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

function moveWallBlockToCenter(wall: InfiniteWallRender, x: number, y: number) {
  const offsetY = Math.floor(((wall.yCount - 1 - x) * wall.blockHeight) / 2);
  const offsetX = Math.floor(((wall.xCount - 1 - y) * wall.blockWidth) / 2);

  wall.scrollLeft = offsetX;
  wall.scrollTop = offsetY;
}
export function Screen(props: AvatarListProps) {
  const { children, showMask = true, avatar, head = <div />, text } = props;

  const { api, http } = useHoFetch();
  const { result: data } = useAsync(
    async () => {
      let rows = 20;
      let columns = 20;
      const limit = rows * columns;
      const { items, total } = await api["/live/screen/avatar"].get({ query: { number: limit } });
      const list: AvatarItem[] = items.map((item) => ({
        key: `${item.id}`,
        url: item.avatar_url,
        userId: item.id,
        name: item.name,
      }));
      const currentUserId = getCurrentUserId();
      if (items.length < limit) {
        columns = Math.ceil(Math.sqrt(items.length));
        rows = columns;
      }

      const wall = wallRef.current;

      const repeat = items.length >= limit;
      if (wall) {
        if (currentUserId) {
          const index = list.findIndex((item) => item.userId === currentUserId);
          // 如果头像墙存在当前用户，把它移动到中间
          if (index >= 0) {
            const x = index % columns;
            const y = Math.floor(index / columns);
            moveWallBlockToCenter(wall, x, y);
          }
        } else {
          if (!repeat) {
            // 如果数量不够，则移动方块到中间
            moveWallBlockToCenter(wall, columns, rows);
          }
        }
        areaRef.current.baseX = wall.scrollLeft;
        areaRef.current.baseY = wall.scrollTop;
      }

      return { userId: currentUserId, list, total, rows, columns, limit, repeat };
    },
    { autoRunArgs: [] },
  );
  const res = data.value;

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
          itemClassName="wall-block-item"
          renderItem={(element, wall) => {
            if (!res) return <></>;
            let px: number = element.wallX;
            let py: number = element.wallY;
            let item: AvatarItem | undefined;
            let isActive = false;

            if (!res.repeat) {
              if (px >= res.columns || px < 0 || py >= res.rows || py < 0) {
                return <></>;
              }
            }
            py = py % res.rows;
            px = px % res.columns;

            if (py < 0) py = py + res.rows;
            if (px < 0) px = px + res.columns;

            const index = py * res.columns + px;

            item = res.list[index];
            isActive = res.userId !== undefined && item.userId === res.userId;

            return (
              <Image
                className="avatar-item"
                imgClassName="avatar-item-img"
                active={isActive}
                item={item}
                id={element.wallX + "-" + element.wallY}
              ></Image>
            );
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
  background: url("/main/home.webp");
  background-color: #d4f5ff;
  background-blend-mode: multiply;
  background-size: cover;
  background-position: center;

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
  user-select: none;

  cursor: move;

  .avatar-item {
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
  }
  .avatar-item.highlight {
    .avatar-item-img {
      background-color: #00fbff;
      border-color: #00fbff;
      border-width: 3px;
    }
  }
  .avatar-item.loaded {
    .avatar-item-img {
      height: 100%;
      width: 100%;
      animation: img-display 1s ease forwards;
      margin: auto;
      display: block;
    }
  }
`;
function Image(props: { active?: boolean; item?: AvatarItem; className?: string; imgClassName?: string; id?: string }) {
  const { item, className, imgClassName, active, id } = props;
  const [loading, setLoading] = useState(true);
  useMemo(() => setLoading(true), [item?.url]);
  return (
    <div className={classNames(className, { loaded: !loading, highlight: active })}>
      <div className={imgClassName}>
        <img
          src={item?.url}
          onLoad={() => {
            setLoading(false);
          }}
        ></img>
      </div>
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
