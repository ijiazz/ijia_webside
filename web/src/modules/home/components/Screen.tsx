import React, { ReactNode, useRef, useState } from "react";
import { useHoFetch } from "@/hooks/http.ts";
import styled from "@emotion/styled";
import { InfiniteWallRender } from "@/lib/Infinite-wall/mod.ts";
import { InfiniteWall } from "@/lib/Infinite-wall/react.tsx";
import { useAsync } from "@/hooks/async.ts";
import { useShakeAnimation } from "./shake_animation.ts";
import { PlusSquareOutlined, UserOutlined } from "@ant-design/icons";

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

type AvatarItem = {
  key: string;
  url: string;
  name: string;
};
type AvatarListProps = {
  image_width?: number;
  image_height?: number;
};

function AvatarScreen(props: AvatarListProps) {
  const { image_width = 50, image_height = image_width } = props;

  const { api, http } = useHoFetch();

  const { result: data } = useAsync(async () => {
    const num = 400;
    const { items, total } = await api["/live/screen/avatar"].get({ query: { number: num } });
    const list: AvatarItem[] = new Array(num);
    for (let i = 0; i < num; i++) {
      list[i] = {
        key: "" + i,
        name: "" + i,
        url: "",
      };
    }
    return list;
  });
  const wallRef = useRef<InfiniteWallRender>(null);
  const ref = useRef<HTMLDivElement>(null);
  /** 镜头抖动 */
  const animationCtrl = useShakeAnimation({
    autoPlay: false,
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
    <AvatarScreenCSS
      ref={ref}
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
        ref={wallRef}
        renderItem={(element, wall) => {
          const x = element.wallX;
          const y = element.wallY;
          const src = "";
          return (
            <Image
              fallback={<UserOutlined className="avatar-item-empty" />}
              className="avatar-item"
              imgClassName="avatar-item-img"
              src={src}
            ></Image>
          );
        }}
      ></InfiniteWall>
    </AvatarScreenCSS>
  );
}
function useFlowLoad(list: string[], width: number, height: number) {
  const [data, setData] = useState<number[][]>([]);

  return {
    getSrc(x: number, y: number): string | undefined {
      x = x % width;
      y = y % height;
      let row = data[y];
      if (!row) {
        row = [];
        data[y] = row;

        return;
      }
      let path = row[x];
      if (!path) {
      }
    },
  };
}

const AvatarScreenCSS = styled.div`
  height: 100%;
  background: linear-gradient(to bottom right, #141c64, #00a6d4, #000a68);
  user-select: none;

  cursor: move;
  .avatar-item {
    height: 100%;
    /* transition:
      border-color 100ms linear,
      opacity 100ms linear; */
    box-sizing: border-box;
    border: 1.2px solid #0000;
    opacity: 0.6;
    padding: 1.2px;
    border-radius: 10%;
    overflow: hidden;

    :hover {
      border-color: rgb(104, 116, 255);
      opacity: 1;
      filter: brightness(1.5);
    }

    &-img {
      display: block;
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
    &-empty {
      border-radius: 10%;
      box-sizing: border-box;
      border: 2px solid #000;
      width: 100%;
      height: 100%;
      svg {
        width: 100%;
        height: 100%;
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
function Image(props: { src?: string; fallback?: ReactNode; className?: string; imgClassName?: string }) {
  const { fallback, src, className, imgClassName } = props;
  const [loading, setLoading] = useState(true);
  return (
    <div className={className}>
      <img
        className={imgClassName}
        src={src}
        onLoad={() => setLoading(false)}
        style={{ display: loading ? "none" : undefined }}
      ></img>
      {loading && fallback}
    </div>
  );
}
