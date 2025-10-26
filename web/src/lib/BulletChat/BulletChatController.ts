export class BulletChatController<T extends { text: string }> {
  constructor(readonly dom: HTMLElement) {}
  onBeforeAppend: (this: BulletChatController<T>, item: HTMLElement, data: T) => void = () => {};
  onBeforeRemove: (this: BulletChatController<T>, item: HTMLElement) => void = () => {};

  /** 添加弹幕到容器，Y 轴取值不与已经存在的弹幕重叠，如果空间不足则等待，添加成功后 promise 被解决 */
  async addItemAsync(data: T, speed?: number) {
    const height = this.dom.clientHeight;
    const div = this.appendItemDom(data);
    const itemHeight = div.clientHeight;
    let y: number;
    if (height > itemHeight) {
      while (true) {
        const availableYSet = this.findY(height, itemHeight);
        if (availableYSet.length === 0) {
          await new Promise((resolve, reject) => setTimeout(resolve, 100));
          continue;
        }
        const randomY = Math.round(Math.random() * (availableYSet.length - 1));
        y = availableYSet[randomY];
        if (y === undefined) debugger;
        break;
      }
    } else {
      y = 0;
    }
    if (y !== undefined) {
      this.pushRenderQueue(y, div, speed);
    } else {
      console.error("BulletChatController.addItem error");
    }
  }
  /** 获取所有可用的 Y 轴位置 */
  private findY(containerHeight: number, itemHeight: number): number[] {
    const set: number[] = [];

    const inStart = Array.from(this.renderResult.inStart.entries()).sort((a, b) => a[1].y - b[1].y);

    // const inStart = Array.from(this.renderResult.inStart).sort((a, b) => a.y - b.y);

    let startIndex = 0;
    let y = 0;
    out: while (y < containerHeight - itemHeight) {
      for (let i = startIndex; i < inStart.length; i++) {
        const item = inStart[i];
        const element = item[1];
        if (y + itemHeight < element.y) {
          break;
        } else if (y > element.y + element.height) {
          continue;
        } else {
          y += itemHeight;
          continue out;
        }
      }
      set.push(y);
      y += itemHeight;
    }

    return set;
  }
  private appendItemDom(data: T) {
    const div = document.createElement("div");
    this.onBeforeAppend(div, data);
    this.dom.appendChild(div);
    return div;
  }
  private pushRenderQueue(y: number, div: HTMLDivElement, speed: number = this.renderOption.defaultSpeed) {
    div.style.top = `${y}px`;

    this.liveMap.set(div, {
      offset: 0,
      isPaused: false,
      speed,
      width: div.clientWidth,
      height: div.clientHeight,
      y,
    });
  }
  addItem(data: T, y: number, speed?: number) {
    const div = this.appendItemDom(data);
    this.pushRenderQueue(y, div, speed);
  }

  /** 正在滚动中的弹幕集合 */
  private liveMap = new Map<HTMLElement, BulletData>();

  private renderResult: {
    inStart: Map<HTMLElement, BulletData>;
  } = { inStart: new Map() };

  private renderOption = {
    safeOffset: 280,
    /** 弹幕默认速度。单位： 像素/秒 */
    defaultSpeed: 60,
  };

  /** 执行渲染 */
  private render(context: RenderContext, offsetMs: number) {
    if (context.containerHeight === 0 || context.containerWidth === 0) return;
    const { safeOffset } = this.renderOption;
    /** 未完全移出视口的弹幕 */
    const inStart = new Map<HTMLElement, BulletData>();
    const offsets = offsetMs / 1000;
    let nextOffset: number;
    for (const [element, data] of this.liveMap) {
      nextOffset = data.offset - data.speed * offsets;
      data.height = element.clientHeight;
      data.width = element.clientWidth;

      if (data.offset > -(data.width + safeOffset)) {
        inStart.set(element, data);
      }
      if (data.isPaused) continue;
      data.offset = nextOffset;

      if (-nextOffset >= context.containerWidth + data.width) {
        this.onBeforeRemove(element);
        element.remove();
        this.liveMap.delete(element);
        inStart.delete(element);
        continue;
      }

      element.style.transform = `translateX(${Math.fround(nextOffset)}px)`;
    }
    this.renderResult = {
      inStart,
    };
  }
  private genRenderContext(): RenderContext {
    const container = this.dom;
    return {
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight,
      itemHeight: 30,
    };
  }

  #onRender = () => {
    const context = this.genRenderContext();
    const offsetTime = this.#lastRenderTime;
    this.#lastRenderTime = Date.now();
    this.render(context, offsetTime === 0 ? 0 : this.#lastRenderTime - offsetTime);
    this.#requestId = requestAnimationFrame(this.#onRender);
  };
  #lastRenderTime = 0;
  #requestId: number | null = null;
  /** 开始渲染 */
  start() {
    if (this.#requestId !== null) return;
    this.#onRender();
  }
  /** 清空所有弹幕，并停止渲染 */
  clear() {
    if (this.#requestId === null) return;
    cancelAnimationFrame(this.#requestId);
    this.#requestId = null;
    for (const [element] of this.liveMap) {
      this.onBeforeRemove(element);
      element.remove();
    }
    this.liveMap.clear();
  }

  pausedItem(item: HTMLElement) {
    const data = this.liveMap.get(item);
    if (!data) return;
    data.isPaused = true;
  }
  resumeItem(item: HTMLElement) {
    const data = this.liveMap.get(item);
    if (!data) return;
    data.isPaused = false;
  }
  genRandomY() {
    return Math.floor(Math.random() * this.dom.clientHeight - 100);
  }
}
export type RenderOption = {
  y: number;
  speed: number;
};
type BulletData = {
  /** Y轴位置 */
  readonly y: number;
  /** 弹幕偏移量，0 为起始位置，负数向左移动 */
  offset: number;
  /** 弹幕暂停状态 */
  isPaused: boolean;
  /** 弹幕速度 */
  speed: number;
  /** 弹幕宽度 */
  width: number;
  /** 弹幕高度 */
  height: number;
};

type RenderContext = {
  containerWidth: number;
  containerHeight: number;
  itemHeight: number;
};
type LineData = {};
