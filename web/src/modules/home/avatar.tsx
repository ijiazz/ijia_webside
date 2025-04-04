import { useHoFetch } from "@/hooks/http.ts";
import { useWindowResize } from "@/hooks/window.ts";
import styled from "@emotion/styled";
import React, { useEffect, useMemo, useRef, useState } from "react";

type AvatarItem = {
  key: string;
  url: string;
  name: string;
};
export type AvatarListProps = {
  image_width?: number;
  image_height?: number;
};
const IS_DEV = false; //import.meta.env?.DEV;

export function AvatarScreen(props: AvatarListProps) {
  const { image_width = 50, image_height = image_width } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<AvatarItem[]>();
  const [{ xCount, yCount }, setCount] = useState({ xCount: 0, yCount: 0 });
  const { api, http } = useHoFetch();

  const calcSize = () => {
    const container = ref.current!;
    const size = calcCount(container.clientWidth, container.clientHeight, image_width, image_height);
    setCount(size);
    return size;
  };
  const windowSize = useWindowResize(calcSize);

  useEffect(() => {
    const size = calcSize();
    const { xCount, yCount } = size;
    setCount({ xCount, yCount });
    const num = xCount * yCount;
    api["/live/screen/avatar"].get({ query: { number: num } }).then(({ items, total }) => {
      const list: AvatarItem[] = new Array(num);
      for (let i = 0; i < num; i++) {
        list[i] = {
          key: items[i]?.id ?? i,
          name: items[i]?.name,
          url: items[i]?.avatar_url,
        };
      }
      setList(list);
    });
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
    return () => area.dispose();
  }, [area]);

  return (
    <AvatarScreenCSS>
      <AvatarListCSS
        onMouseDown={(e) => {
          basePosition.current = {
            left: ref.current!.scrollLeft,
            top: ref.current!.scrollTop,
          };
          area.onTargetStart(e.clientX, e.clientY);
        }}
        onMouseUp={(e) => area.onTargetEnd()}
        imgRowNum={xCount}
        imgColNum={yCount}
        imgWidth={image_width}
        imgHeight={image_height}
        ref={ref}
      >
        {list?.map((item, index) => (
          <div className="avatar-item" key={item.key}>
            <div className="avatar-item-container">
              {item.url ? (
                <img className="avatar-item-img" src={item.url} onDragStart={(e) => e.preventDefault()}></img>
              ) : (
                <div></div>
              )}
              {IS_DEV && <div className="avatar-item-dev-index">{index}</div>}
            </div>
          </div>
        ))}
      </AvatarListCSS>
    </AvatarScreenCSS>
  );
}
const AvatarScreenCSS = styled.div`
  height: 100%;
`;
const AvatarListCSS = styled.div<{ imgRowNum: number; imgColNum: number; imgWidth: number; imgHeight: number }>`
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom right, #141c64, #00a6d4, #000a68);
  user-select: none;

  display: grid;
  grid-template-rows: repeat(${(props) => props.imgColNum}, ${(props) => props.imgHeight + "px"});
  grid-template-columns: repeat(${(props) => props.imgRowNum}, ${(props) => props.imgWidth + "px"});
  place-items: stretch;

  .avatar-item {
    position: relative;
    padding: 1.2px;
    &-container {
      border-radius: 10%;
      overflow: hidden;
    }
    &-img {
      display: block;
      object-fit: cover;
      width: 100%;
      height: 100%;
      opacity: 0.6;
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
function calcCount(containerWith: number, containerHeight: number, image_width: number, image_height: number) {
  return {
    xCount: Math.floor(containerWith / image_width) + 2,
    yCount: Math.floor(containerHeight / image_height) + 2,
  };
}
class ListenMoveArea {
  constructor(public onMove: (dx: number, dy: number) => void) {}
  x = 0;
  y = 0;
  onTargetStart(x: number, y: number) {
    window.addEventListener("mousemove", this.#onMove);
    window.addEventListener("mouseup", this.#onEnd);
    window.addEventListener("blur", this.#onEnd);
    this.x = x;
    this.y = y;
  }
  #onMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    const dx = clientX - this.x;
    const dy = clientY - this.y;
    this.onMove(dx, dy);
  };
  onTargetEnd() {
    this.dispose();
  }
  #onEnd = () => {
    this.dispose();
  };
  dispose() {
    window.removeEventListener("mousemove", this.#onMove);
    window.removeEventListener("mouseup", this.#onEnd);
    window.removeEventListener("blur", this.#onEnd);
  }
}
function move(offsetX: number, offsetY: number, container: HTMLElement, xCount: number) {
  const { clientWidth, clientHeight, children } = container;
  const total = children.length;

  let x: number;
  let y: number;

  for (let i = 0; i < total; i++) {
    x = i % xCount;
    y = Math.floor(i / xCount);
    const item = children[i] as HTMLElement;
    item.style.top;
    // item.appendChild()
  }
}
