export class BulletChatController<T extends { text: string }> {
  constructor(private readonly dom: HTMLElement) {}
  renderItem: (item: HTMLElement, data: T, info: RenderOption) => void = () => {};
  addItem(data: T, y: number, speed?: number) {
    const div = document.createElement("div");
    this.renderItem(div, data, { y, speed: speed || 5 });
    this.dom.appendChild(div);
    this.dom.addEventListener("animationend", onAnimationEnd);
    this.dom.addEventListener("animationcancel", onAnimationEnd);
  }
}
export type RenderOption = {
  y: number;
  speed: number;
};

function onAnimationEnd(e: AnimationEvent) {
  e.stopPropagation();
  e.stopImmediatePropagation();

  e.target && (e.target as HTMLElement).remove();
}
