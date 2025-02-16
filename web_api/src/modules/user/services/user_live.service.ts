const NO_LIVE_INTERNAL = 1000 * 60;
const LIVE_INTERNAL = 1000 * 60 * 5;
export class UserLive {
  constructor(private onTick: () => Promise<0 | 1>) {}
  #id: any;
  #waitTime = NO_LIVE_INTERNAL;
  start() {
    if (this.#id !== undefined) return;
    this.#onCheck();
  }
  stop() {
    if (this.#id === undefined) return;
    clearInterval(this.#id);
    this.#id = undefined;
  }
  private live_status: 0 | 1 = 1;
  #onCheck = async () => {
    let live_status: 0 | 1;
    try {
      live_status = await this.onTick();
    } catch (error) {
      this.onError(error);
      return;
    }
    if (live_status !== this.live_status) {
      this.live_status = live_status;
      if (live_status === 1) {
        this.#waitTime = LIVE_INTERNAL;
      } else {
        this.#waitTime = NO_LIVE_INTERNAL;
      }
      await this.onChange(live_status);
    }
    this.#id = setTimeout(this.#onCheck, this.#waitTime);
  };
  onError(err: any) {}
  onChange(status: 0 | 1): void | Promise<void> {}
}
