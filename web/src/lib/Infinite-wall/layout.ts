export type InfiniteWallOptions = {
  blockHeight?: number;
  blockWidth?: number;
  createElement?: (element: HTMLElement, x: number, y: number) => void;
  removeElement?: (element: HTMLElement) => void;
  onElementVisible?: (element: HTMLElement, x: number, y: number) => void;
  /** x 轴错位偏移 */
  getOffsetX?: (x: number) => number;
  /** y 轴错位偏移 */
  getOffsetY?: (y: number) => number;
};

export class InfiniteWall {
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
      scrollOffsetLeft: 0,
      scrollOffsetTop: 0,
      containerWidth: 0,
      containerHeight: 0,
    };
    this.#onElementVisible = option.onElementVisible;
    this.#createElement = option.createElement;
    this.#removeElement = option.removeElement;

    this.#getOffsetX = option.getOffsetX ?? ((x) => x * 10);
    this.#getOffsetY = option.getOffsetY;

    this.requestRender();
  }

  #createElement?: (element: HTMLElement, x: number, y: number) => void;
  #removeElement?: (element: HTMLElement) => void;
  #getOffsetX?: (x: number) => number;
  #getOffsetY?: (y: number) => number;
  #onElementVisible?: (element: HTMLElement, x: number, y: number) => void;

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
  private layout() {
    const { blockHeight, blockWidth } = this.#meta;
    const { clientWidth: containerWidth, clientHeight: containerHeight } = this.element;

    const scrollLeft = this.#meta.scrollLeft % containerWidth;
    const scrollTop = this.#meta.scrollTop % containerHeight;
    const xCount = 1 + Math.ceil(containerWidth / blockWidth);
    const yCount = 1 + Math.ceil(containerHeight / blockHeight);

    const data = this.#meta;
    data.xCount = xCount;
    data.yCount = yCount;
    data.scrollOffsetLeft = scrollLeft;
    data.scrollOffsetTop = scrollTop;

    return data;
  }
  private render() {
    const layout = this.layout();
    const { blockHeight, blockWidth, xCount, yCount } = layout;

    const overWidth = (xCount - 1) * blockWidth;
    const overHeight = (yCount - 1) * blockHeight;

    const totalCount = xCount * yCount;

    const childNodes = this.element.childNodes;
    if (childNodes.length > totalCount) {
      for (let i = childNodes.length - 1; i >= totalCount; i--) {
        this.element.removeChild(childNodes[i]);
        this.#removeElement?.(childNodes[i] as HTMLElement);
      }
    }

    const total = childNodes.length;

    let item: HTMLElement;
    let x: number;
    let y: number;

    for (let i = 0; i < total; i++) {
      item = childNodes[i] as HTMLElement;

      x = i % xCount;
      y = Math.floor(i / xCount);

      updatePosition(layout, item.style, x, y, overWidth, overHeight);
    }

    for (let i = total; i < totalCount; i++) {
      item = createItem(blockHeight, blockWidth);
      x = i % xCount;
      y = Math.floor(i / xCount);

      this.#createElement?.(item, x, y);

      updatePosition(layout, item.style, x, y, overWidth, overHeight);
      this.element.appendChild(item);
    }
  }

  isVisible(x: number, y: number) {
    const { blockHeight, blockWidth } = this.#meta;
    const { clientWidth: containerWidth, clientHeight: containerHeight } = this.element;

    const scrollLeft = this.#meta.scrollLeft % containerWidth;
    const scrollTop = this.#meta.scrollTop % containerHeight;

    const offsetLeft = x * blockWidth + scrollLeft;
    const offsetTop = y * blockHeight + scrollTop;

    return offsetLeft >= 0 && offsetLeft <= containerWidth && offsetTop >= 0 && offsetTop <= containerHeight;
  }
}
function updatePosition(
  layout: RenderLayout,
  style: CSSStyleDeclaration,
  x: number,
  y: number,
  overWidth: number,
  overHeight: number,
) {
  const { scrollOffsetLeft, scrollOffsetTop, containerWidth, containerHeight, blockHeight, blockWidth } = layout;
  let offsetLeft = x * blockWidth + scrollOffsetLeft;
  let offsetTop = y * blockHeight + scrollOffsetTop;

  if (offsetLeft > overWidth) {
    offsetLeft = offsetLeft - overWidth - blockWidth;
  } else if (offsetLeft < -blockWidth) {
    offsetLeft = offsetLeft + overWidth + blockWidth;
  }
  if (offsetTop > overHeight) {
    offsetTop = offsetTop - overHeight - blockHeight;
  } else if (offsetTop < -blockHeight) {
    offsetTop = offsetTop + overHeight + blockHeight;
  }
  // const isHidden = offsetLeft < 0 || offsetLeft > containerWidth || offsetTop < 0 || offsetTop > containerHeight;

  style.transform = `translate(${offsetLeft}px, ${offsetTop}px)`;
}
function createItem(height: number, width: number) {
  const node = document.createElement("div");
  node.style.position = "absolute";
  node.style.width = width + "px";
  node.style.height = height + "px";
  return node;
}
type RenderLayout = {
  /** 容器内 x轴向元素数量 */
  xCount: number;
  /** 容器内 y轴向元素数量 */
  yCount: number;
  scrollOffsetLeft: number;
  scrollOffsetTop: number;
  containerWidth: number;
  containerHeight: number;

  scrollTop: number;
  scrollLeft: number;
  /** 元素高度 */
  blockHeight: number;
  /** 元素宽度 */
  blockWidth: number;
};
