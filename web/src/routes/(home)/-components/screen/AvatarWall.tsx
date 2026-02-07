import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import { useAsync } from "@/hooks/async.ts";
import { useShakeAnimation } from "../shake_animation.ts";
import classNames from "classnames";
import { api } from "@/request/client.ts";
import { ScreenEffects, useScreenEffects, useScreenMin } from "./screenEffects.tsx";
import { InfiniteWall, InfiniteWallRender } from "@uifx/infinite-wall/react";

function moveWallBlockToCenter(wall: InfiniteWallRender, x: number, y: number) {
  const offsetY = Math.floor(((wall.realXBrickCount - 1 - x) * wall.brickHeight) / 2);
  const offsetX = Math.floor(((wall.realYBrickCount - 1 - y) * wall.brickWidth) / 2);

  wall.scrollLeft = offsetX;
  wall.scrollTop = offsetY;
}

type AvatarItem = {
  key: string;
  url: string;
  userId: number;
  name: string;
};
function useAvatarWallData() {
  const { data } = useAsync(
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
      if (items.length < limit) {
        columns = Math.ceil(Math.sqrt(items.length));
        rows = columns;
      }

      const repeat = items.length >= limit;

      return {
        userId: undefined, // 先不处理这个用户 ID
        list,
        total,
        rows,
        columns,
        limit,
        repeat,
      };
    },
    { autoRunArgs: [] },
  );
  return data;
}

type AvatarWallProps = {
  /** 传入一个元素的ref,当这个元素离开屏幕后停止播放动画 */
  godAvatarRef: React.RefObject<HTMLDivElement | null>;
  effects?: ScreenEffects;
};
export function AvatarWall(props: AvatarWallProps) {
  const { godAvatarRef } = props;
  const wallRef = useRef<InfiniteWallRender>(null);

  const effects = useScreenEffects();

  const disabledShake = effects.birthday;

  /** 镜头抖动 */
  const animationCtrl = useShakeAnimation({
    autoPlay: !disabledShake,
    onFrameUpdate: (offsetX: number, offsetY: number) => {
      const wall = wallRef.current!;
      wall.scrollLeft = areaRef.current.baseX + offsetX;
      wall.scrollTop = areaRef.current.baseY + offsetY;
    },
  });

  useEffect(() => {
    const element = godAvatarRef.current;
    if (!element) return;
    animationCtrl.targetRef(element);
  }, [godAvatarRef]);

  const areaRef = useRef<{ baseX: number; baseY: number; isPlay: boolean }>({
    baseX: 0,
    baseY: 0,
    isPlay: animationCtrl.isPlay,
  });
  const data = useAvatarWallData();

  useEffect(() => {
    if (!data) return;
    const { list, userId: currentUserId, columns, rows, repeat } = data;
    const wall = wallRef.current;
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
  }, [data]);

  const blockSize = useScreenMin() ? 54 : 60;
  return (
    <AvatarScreenCSS>
      <InfiniteWall
        brickHeight={blockSize}
        brickWidth={blockSize}
        onDragStartCapture={(e) => e.preventDefault()}
        onMoveStart={() => {
          const wall = wallRef.current!;
          const meta = areaRef.current;
          meta.baseX = wall.scrollLeft;
          meta.baseY = wall.scrollTop;

          if (!disabledShake && animationCtrl.isPlay) {
            animationCtrl.stop();
            meta.isPlay = true;
          }
        }}
        onMoveEnd={() => {
          const wall = wallRef.current!;
          const meta = areaRef.current;
          meta.baseX = wall.scrollLeft;
          meta.baseY = wall.scrollTop;

          if (!disabledShake && meta.isPlay) {
            animationCtrl.play();
          }
        }}
        draggable
        ref={wallRef}
        deps={[data]}
        renderItem={(element, wall) => {
          if (!data) return <></>;
          let px: number = element.brickX;
          let py: number = element.brickY;
          let item: AvatarItem | undefined;
          let isActive = false;

          if (!data.repeat) {
            if (px >= data.columns || px < 0 || py >= data.rows || py < 0) {
              return <></>;
            }
          }
          py = py % data.rows;
          px = px % data.columns;

          if (py < 0) py = py + data.rows;
          if (px < 0) px = px + data.columns;

          const index = py * data.columns + px;

          item = data.list[index];
          isActive = data.userId !== undefined && item?.userId === data.userId;

          return (
            <Image
              className="avatar-item"
              imgClassName="avatar-item-img"
              active={isActive}
              item={item}
              id={element.brickX + "-" + element.brickY}
            />
          );
        }}
      />
    </AvatarScreenCSS>
  );
}

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
