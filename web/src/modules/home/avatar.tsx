import { useHoFetch } from "@/hooks/http.ts";
import { useWindowResize } from "@/hooks/window.ts";
import styled from "@emotion/styled";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { animate, JSAnimation } from "animejs";
import { InfiniteWall, ListenMoveArea } from "@/lib/Infinite-wall/mod.ts";
import { useAsync } from "@/hooks/async.ts";

type AvatarItem = {
  key: string;
  url: string;
  name: string;
};
export type AvatarListProps = {
  image_width?: number;
  image_height?: number;
};
const IS_DEV = true; //import.meta.env?.DEV;

export function AvatarScreen(props: AvatarListProps) {
  const { image_width = 50, image_height = image_width } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<AvatarItem[]>();
  const { api, http } = useHoFetch();

  const { result: data } = useAsync(async () => {
    const num = 500;
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
  const animationCtrlRef = useRef<JSAnimation>(null);
  const wallRef = useRef<InfiniteWall>(null);
  useEffect(() => {
    const wall = new InfiniteWall(ref.current!, {
      blockHeight: 50,
      blockWidth: 50,
      createElement(element) {
        element.className = "avatar-item";
        const container = document.createElement("div");
        container.className = "avatar-item-container";
        const img = document.createElement("img");
        img.className = "avatar-item-img";
        img.draggable = false;
        img.ondragstart = (e) => e.preventDefault();

        if (IS_DEV) {
          const devIndex = document.createElement("div");
          devIndex.className = "avatar-item-dev-index";
          container.appendChild(devIndex);
        }
      },
    });
    wallRef.current = wall;
  }, []);

  const basePosition = useRef({ top: 0, left: 0 });
  const area = useMemo(
    () =>
      new ListenMoveArea((dx, dy) => {
        const dom = ref.current!;
        dom.scrollTop = basePosition.current.top - dy;
        dom.scrollLeft = basePosition.current.left - dx;
      }),
    [],
  );
  useEffect(() => {
    if (IS_DEV) return;
    const animation = animate(ref.current!, {
      scrollLeft: [
        { to: image_width, duration: 3000 },
        { to: 0, duration: 3000 },
      ],
      scrollTop: [
        { to: image_height, duration: 4000 },
        { to: 0, duration: 4000 },
      ],
      ease: "inOut", // ease applied between each keyframes if no ease defined
      loop: true,
    });
    animationCtrlRef.current = animation;
    return () => {
      animation.revert();
      area.dispose();
    };
  }, [area, image_height, image_width]);
  useEffect(() => {
    const element = ref.current!;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animationCtrlRef.current?.play();
          console.log("播放头像大屏动画");
        } else {
          animationCtrlRef.current?.pause();
          console.log("暂停头像大屏动画");
        }
      });
    });
    observer.observe(element);
  }, []);

  return (
    <AvatarScreenCSS>
      <AvatarListCSS
        onMouseDown={(e) => {
          basePosition.current = {
            left: ref.current!.scrollLeft,
            top: ref.current!.scrollTop,
          };
          area.onTargetStart(e.clientX, e.clientY);
          animationCtrlRef.current?.pause();
        }}
        onMouseUp={(e) => {
          area.onTargetEnd();
          animationCtrlRef.current?.play();
        }}
        ref={ref}
      ></AvatarListCSS>
    </AvatarScreenCSS>
  );
}
const AvatarScreenCSS = styled.div`
  height: 100%;
`;
const AvatarListCSS = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;
  /* background: linear-gradient(to bottom right, #141c64, #00a6d4, #000a68); */
  user-select: none;

  .avatar-item {
    transition: all 100ms linear;
    position: relative;
    box-sizing: border-box;
    border: 1.2px solid #0000;
    opacity: 0.6;
    cursor: move;
    /* padding: 1.2px; */

    border-color: #000;
    :hover {
      border-color: rgb(104, 116, 255);
      opacity: 1;
      filter: brightness(1.5);
    }
    &-container {
      border-radius: 10%;
      overflow: hidden;
    }
    &-img {
      display: block;
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
    &-dev-index {
      position: absolute;
      top: 0;
      background-color: #fff;
      border-radius: 4px;
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
