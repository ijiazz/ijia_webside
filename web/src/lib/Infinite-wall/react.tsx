import { InfiniteWallRender, WallElement } from "./layout.ts";
import React, { ReactNode, useEffect, useMemo, useReducer, useRef } from "react";
import { ListenMoveArea } from "./ListenMoveArea.ts";
import { createPortal } from "react-dom";

export type InfiniteWallProps = InfiniteWallConfig & {
  className?: string;
  style?: React.CSSProperties;
  renderItem?: (element: WallElement, wall: InfiniteWallRender) => ReactNode;
};
export function InfiniteWall(props: InfiniteWallProps) {
  const { className, style, ...reset } = props;

  const ref = useRef<HTMLDivElement>(null);
  /** 无限滚动 */
  const { list, wallRef } = useInfiniteWall({
    containerRef: ref,
    ...reset,
  });
  /** 鼠标拖拽 */
  const area = useMemo((): ListenMoveArea & ScrollMeta => {
    const area = new ListenMoveArea(function (dx, dy) {
      const dom = wallRef.current!;
      dom.scrollTop = area.baseY + dy;
      dom.scrollLeft = area.baseX + dx;
    }) as ListenMoveArea & ScrollMeta;
    area.baseX = 0;
    area.baseY = 0;
    return area;
  }, []);
  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", overflow: "hidden", ...style }}
      ref={ref}
      onMouseDown={(e) => {
        area.onTargetStart(e.clientX, e.clientY);
        const wall = wallRef.current!;
        area.baseX = wall.scrollLeft;
        area.baseY = wall.scrollTop;
      }}
      onMouseUp={(e) => {
        area.onTargetEnd();
      }}
    >
      {list}
    </div>
  );
}
export type InfiniteWallConfig = {
  /** 元素的类名。暂不能动态更新 */
  itemClassName?: string;
  /** 方块高度 */
  blockHeight?: number;
  /** 方块宽度 */
  blockWidth?: number;
  renderItem?: (node: WallElement, wall: InfiniteWallRender) => ReactNode;
  ref?: React.RefObject<InfiniteWallRender | null | undefined>;
};
type ScrollMeta = {
  baseX: number;
  baseY: number;
};
export function useInfiniteWall(
  config: InfiniteWallConfig & {
    containerRef: React.RefObject<HTMLDivElement | null | undefined>;
  },
) {
  const { containerRef, blockWidth = 50, blockHeight = blockWidth, itemClassName = "" } = config;
  const wallRef = useRef<InfiniteWallRender>(null);
  const renderRef = useRef<InfiniteWallConfig>(config);
  renderRef.current = config;

  const [list, updateList] = useReducer((): ReactNode[] => {
    const { renderItem = devRender } = renderRef.current;

    const wall = wallRef.current!;
    const elements = wall.elements;
    const news = new Array(elements.length);
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const reactNode = createPortal(renderItem(element, wall), element, i);
      news[i] = reactNode;
    }
    return news;
  }, []);
  useEffect(() => {
    const dom = containerRef.current;
    if (!dom) return;

    const wall = new InfiniteWallRender(dom, {
      blockHeight,
      blockWidth,
      onElementUpdate(elements) {
        updateList();
      },
      createElement(elements) {
        if (itemClassName) {
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            element.className = itemClassName;
          }
        }
      },
    });
    if (config.ref) config.ref.current = wall;
    wallRef.current = wall;
  }, [containerRef]);
  useMemo(() => {
    if (!wallRef.current) return;
    const wall = wallRef.current;
    wall.blockHeight = blockHeight;
    wall.blockWidth = blockWidth;
  }, [blockHeight, blockWidth]);

  return { list, wallRef: wallRef };
}
function devRender(element: WallElement, wall: InfiniteWallRender) {
  const showText = element.wallIdX === 0 || element.wallIdY === 0;
  return (
    <div
      style={{
        border: "1px solid #000",
        height: "100%",
        width: "100%",
        padding: 2,
        boxSizing: "border-box",
      }}
    >
      {element.wallX}
      <br />
      <div style={{ textAlign: "right" }}>{element.wallY}</div>
    </div>
  );
}
