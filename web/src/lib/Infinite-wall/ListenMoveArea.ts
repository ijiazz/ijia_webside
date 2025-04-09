export class ListenMoveArea {
  constructor(public move: (this: ListenMoveArea, dx: number, dy: number) => void) {}
  private startX = 0;
  private startY = 0;
  onTargetStart(x: number, y: number) {
    window.addEventListener("mousemove", this.#onMove);
    window.addEventListener("mouseup", this.#onEnd);
    window.addEventListener("blur", this.#onEnd);
    this.startX = x;
    this.startY = y;
  }
  #onMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    const dx = clientX - this.startX;
    const dy = clientY - this.startY;
    this.move(dx, dy);
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
