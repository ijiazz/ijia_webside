export type InfiniteWallOptions = {
  blockHeight?: number;
  blockWidth?: number;
  createElement?: (element: HTMLElement) => void;
  remoteElement?: (element: HTMLElement) => void;
  onElementVisible?: (element: HTMLElement, x: number, y: number) => void;
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
    };
    this.#onElementVisible = option.onElementVisible;
    this.#createElement = option.createElement;
    this.#remoteElement = option.remoteElement;
    console.log(this.#meta);

    this.render();
  }

  #createElement?: (element: HTMLElement) => void;
  #remoteElement?: (element: HTMLElement) => void;
  #onElementVisible?: (element: HTMLElement, x: number, y: number) => void;
  #changed = true;
  #meta: Meta;

  get scrollTop() {
    return this.#meta.scrollTop;
  }
  set scrollTop(value: number) {
    if (value === this.#meta.scrollTop) return;
    this.#meta.scrollTop = value;
    this.#changed = true;
  }

  get scrollLeft() {
    return this.#meta.scrollLeft;
  }
  set scrollLeft(value: number) {
    if (value === this.#meta.scrollLeft) return;
    this.#meta.scrollLeft = value;
    this.#changed = true;
  }

  get blockHeight() {
    return this.#meta.blockHeight;
  }
  set blockHeight(value: number) {
    if (value === this.#meta.blockHeight) return;
    this.#meta.blockHeight = value;
    this.#changed = true;
  }

  get blockWidth() {
    return this.#meta.blockWidth;
  }
  set blockWidth(value: number) {
    this.#meta.blockWidth = value;
    this.#changed = true;
  }

  render() {
    if (!this.#changed) return;
    const { blockHeight, blockWidth, scrollLeft, scrollTop } = this.#meta;

    const xCount = 1 + Math.floor(this.element.clientWidth / blockWidth);
    const yCount = 1 + Math.floor(this.element.clientHeight / blockHeight);
    const totalCount = xCount * yCount;

    const childNodes = this.element.childNodes;
    if (childNodes.length > totalCount) {
      for (let i = childNodes.length - 1; i >= totalCount; i++) {
        this.#remoteElement?.(childNodes[i] as HTMLElement);
        this.element.removeChild(childNodes[i]);
      }
    }

    const total = childNodes.length;

    let item: HTMLElement;
    let x: number;
    let y: number;

    let offsetLeft: number;
    let offsetTop: number;
    for (let i = 0; i < total; i++) {
      item = childNodes[i] as HTMLElement;

      x = i % xCount;
      y = Math.floor(i / xCount);

      offsetLeft = x * blockWidth;
      offsetTop = y * blockHeight;
      item.style.translate = `translate(${offsetLeft}px, ${offsetTop}px)`;
    }
    for (let i = total; i < totalCount; i++) {
      item = createItem(blockHeight, blockWidth);
      this.#createElement?.(item);

      x = i % xCount;
      y = Math.floor(i / xCount);
      offsetLeft = x * blockWidth;
      offsetTop = y * blockHeight;

      item.style.left = offsetLeft + "px";
      item.style.top = offsetTop + "px";

      this.element.appendChild(item);
    }
    this.#changed = false;
  }
}

function createItem(height: number, width: number) {
  const node = document.createElement("div");
  node.style.position = "absolute";
  node.style.width = width + "px";
  node.style.height = height + "px";
  return node;
}
type Meta = {
  scrollTop: number;
  scrollLeft: number;
  blockHeight: number;
  blockWidth: number;
};
