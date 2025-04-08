export type InfiniteWallOptions = {
  blockHeight?: number;
  blockWidth?: number;
  createElement?: (elements: WallElement[]) => void;
  removeElement?: (elements: WallElement[]) => void;
  onElementUpdate?: (elements: WallElement[]) => void;
};

export class InfiniteWallRender {
  constructor(
    public element: HTMLElement,
    option: InfiniteWallOptions = {},
  ) {
    this.#meta = {
      scrollTop: 0,
      scrollLeft: 0,
      blockHeight: option.blockHeight || 0,
      blockWidth: option.blockWidth || 0,

      xCount: 0,
      yCount: 0,
      screenX: 0,
      screenY: 0,
      realOffsetLeft: 0,
      realOffsetTop: 0,
      realHeightTotal: 0,
      realWidthTotal: 0,
    };
    this.#onElementUpdate = option.onElementUpdate;
    this.#createElement = option.createElement;
    this.#removeElement = option.removeElement;

    this.requestRender();
  }

  #createElement?: (elements: WallElement[]) => void;
  #removeElement?: (elements: WallElement[]) => void;
  // #getOffsetX?: (x: number) => number;
  // #getOffsetY?: (y: number) => number;
  #onElementUpdate?: (elements: WallElement[]) => void;

  #meta: RenderLayout;

  get scrollTop() {
    return this.#meta.scrollTop;
  }
  set scrollTop(value: number) {
    if (value === this.#meta.scrollTop) return;
    this.#meta.scrollTop = value;
    this.requestRender();
  }

  get scrollLeft() {
    return this.#meta.scrollLeft;
  }
  set scrollLeft(value: number) {
    if (value === this.#meta.scrollLeft) return;
    this.#meta.scrollLeft = value;
    this.requestRender();
  }

  get blockHeight() {
    return this.#meta.blockHeight;
  }
  set blockHeight(value: number) {
    if (value === this.#meta.blockHeight) return;
    this.#meta.blockHeight = value;
    this.requestRender();
  }
  get xCount() {
    return this.#meta.xCount;
  }
  get yCount() {
    return this.#meta.yCount;
  }
  get blockWidth() {
    return this.#meta.blockWidth;
  }
  set blockWidth(value: number) {
    this.#meta.blockWidth = value;
    this.requestRender();
  }
  #requesting = false;
  private requestRender() {
    if (this.#requesting) return;
    this.#requesting = true;
    requestAnimationFrame(() => {
      this.render();
      this.#requesting = false;
    });
  }

  private render() {
    const layout = this.#meta;
    calcLayout(layout, layout, this.element.clientWidth, this.element.clientHeight);

    const { blockHeight, blockWidth, xCount, yCount } = layout;

    const limitWidth = (xCount - 1) * blockWidth;
    const limitHeight = (yCount - 1) * blockHeight;

    const totalCount = xCount * yCount;

    const childNodes = this.element.childNodes;
    if (childNodes.length > totalCount) {
      let removeCount = childNodes.length - totalCount;
      const arr = new Array(removeCount);
      for (let i = childNodes.length - 1; i >= totalCount; i--) {
        this.element.removeChild(childNodes[i]);
        arr[i - totalCount] = childNodes[i];
      }
      this.#removeElement?.(arr);
    }

    const total = childNodes.length;

    let item: WallElement;
    let x: number;
    let y: number;
    const changedList: WallElement[] = [];

    for (let i = 0; i < total; i++) {
      item = childNodes[i] as WallElement;

      x = item.wallIdX;
      y = item.wallIdY;

      const position = updatePosition(layout, item, limitWidth, limitHeight);
      if (position.changed) changedList.push(item);
      item.style.transform = `translate(${position.offsetLeft}px, ${position.offsetTop}px)`;
    }

    if (totalCount > total) {
      const newsList: WallElement[] = new Array(totalCount - total);
      for (let i = total; i < totalCount; i++) {
        item = createItem(blockHeight, blockWidth, i);

        x = i % xCount;
        y = Math.floor(i / xCount);
        item.wallIdX = x;
        item.wallIdY = y;
        item.wallX = x;
        item.wallY = y;

        const position = updatePosition(layout, item, limitWidth, limitHeight);
        item.style.transform = `translate(${position.offsetLeft}px, ${position.offsetTop}px)`;
        this.element.appendChild(item);

        newsList[totalCount - i - 1] = item;
        changedList.push(item);
      }
      this.#createElement?.(newsList);
    }
    if (changedList.length > 0) {
      this.#onElementUpdate?.(changedList);
    }
  }
  get elements(): NodeListOf<WallElement> {
    return this.element.childNodes as NodeListOf<WallElement>;
  }
  isHidden(x: number, y: number) {
    const { blockHeight, blockWidth } = this.#meta;
    const { clientHeight: containerHeight, clientWidth: containerWidth } = this.element;

    const scrollLeft = this.#meta.scrollLeft % containerWidth;
    const scrollTop = this.#meta.scrollTop % containerHeight;

    const offsetLeft = x * blockWidth + scrollLeft;
    const offsetTop = y * blockHeight + scrollTop;

    return offsetLeft < 0 || offsetLeft > containerWidth || offsetTop < 0 || offsetTop > containerHeight;
  }
}

function updatePosition(layout: RenderLayout, element: WallData, overWidth: number, overHeight: number) {
  const { blockHeight, blockWidth } = layout;
  let offsetLeft = element.wallIdX * blockWidth + layout.realOffsetLeft;
  let offsetTop = element.wallIdY * blockHeight + layout.realOffsetTop;

  let screenX: number;
  if (offsetLeft > overWidth) {
    // 右边元素移到最左边
    offsetLeft = offsetLeft - overWidth - blockWidth;
    screenX = layout.screenX - 1;
  } else if (offsetLeft < -blockWidth) {
    // 左边元素移到最右边
    offsetLeft = offsetLeft + overWidth + blockWidth;
    screenX = layout.screenX + 1;
  } else {
    screenX = layout.screenX;
  }
  const wallX: number = screenX * layout.xCount + element.wallIdX;

  let screenY: number;
  if (offsetTop > overHeight) {
    offsetTop = offsetTop - overHeight - blockHeight;
    screenY = layout.screenY - 1;
  } else if (offsetTop < -blockHeight) {
    offsetTop = offsetTop + overHeight + blockHeight;
    screenY = layout.screenY + 1;
  } else {
    screenY = layout.screenY;
  }
  const wallY = screenY * layout.yCount + element.wallIdY;

  const changed = element.wallX !== wallX || element.wallY !== wallY;
  if (changed) {
    element.wallX = wallX;
    element.wallY = wallY;
  }

  // style.top = offsetTop + "px";
  // style.left = offsetLeft + "px";

  return {
    offsetLeft,
    offsetTop,
    changed,
  };
}
function createItem(height: number, width: number, id: number): WallElement {
  const node = document.createElement("div") as WallElement;
  node.style.position = "absolute";
  node.style.width = width + "px";
  node.style.height = height + "px";
  node.wallId = id;
  node.wallX = 0;
  node.wallY = 0;
  return node;
}
function calcLayout(input: Readonly<InputData>, output: CalcData, containerWidth: number, containerHeight: number) {
  const { blockHeight, blockWidth, scrollLeft, scrollTop } = input;

  const xCount = 1 + Math.ceil(containerWidth / blockWidth);
  const yCount = 1 + Math.ceil(containerHeight / blockHeight);
  const limitWidth = xCount * blockWidth;
  const limitHeight = yCount * blockHeight;

  output.xCount = xCount;
  output.yCount = yCount;

  output.realWidthTotal = limitWidth;
  output.realHeightTotal = limitHeight;

  output.realOffsetLeft = scrollLeft % limitWidth;
  output.realOffsetTop = scrollTop % limitHeight;
  output.screenX = scrollLeft < 0 ? Math.floor(-scrollLeft / limitWidth) : Math.ceil(-scrollLeft / limitWidth);
  output.screenY = scrollTop < 0 ? Math.floor(-scrollTop / limitHeight) : Math.ceil(-scrollTop / limitHeight);
  return input;
}
type WallData = {
  wallId: number;
  wallX: number;
  wallY: number;
  wallIdX: number;
  wallIdY: number;
};
export type WallElement = HTMLDivElement & WallData;
type InputData = {
  scrollTop: number;
  scrollLeft: number;
  /** 元素高度 */
  blockHeight: number;
  /** 元素宽度 */
  blockWidth: number;
};
type CalcData = {
  /** 容器内 x轴向真实的元素数量 */
  xCount: number;
  /** 容器内 y轴向真实的元素数量 */
  yCount: number;

  /** 容器内元素宽度总和 */
  realWidthTotal: number;
  /** 容器内元素高度总和 */
  realHeightTotal: number;
  realOffsetLeft: number;
  realOffsetTop: number;

  screenX: number;
  screenY: number;
};
type RenderLayout = InputData & CalcData;
