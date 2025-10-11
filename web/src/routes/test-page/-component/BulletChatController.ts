export class BulletChatController<T extends { text: string }> {
  constructor(private readonly dom: HTMLElement) {}
  onBeforeAppend: (item: HTMLElement, data: T, info: RenderOption) => void = () => {};
  onBeforeRemove: (item: HTMLElement) => void = () => {};
  addItem(data: T, y: number, speed?: number) {
    const div = document.createElement("div");
    this.onBeforeAppend(div, data, { y, speed: speed || 5 });
    this.dom.appendChild(div);

    this.liveMap.set(div, { offset: 0, isPaused: false });
  }
  private liveMap = new Map<HTMLElement, BulletData>();
  private speed = 1;
  render() {
    const container = this.dom;
    const containerWidth = container.clientWidth;
    if (containerWidth === 0) return;

    for (const [element, data] of this.liveMap) {
      if (data.isPaused) continue;
      data.offset -= this.speed;
      if (-data.offset >= containerWidth + element.clientWidth) {
        this.onBeforeRemove(element);
        element.remove();
        this.liveMap.delete(element);
        continue;
      }

      element.style.transform = `translateX(${data.offset}px)`;
    }
  }
  #onRender = () => {
    this.render();
    this.#requestId = requestAnimationFrame(this.#onRender);
  };
  #requestId: number | null = null;
  start() {
    if (this.#requestId !== null) return;
    this.#onRender();
  }
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
}
export type RenderOption = {
  y: number;
  speed: number;
};
type BulletData = {
  offset: number;
  isPaused: boolean;
};
