import { getCheckerServer } from "@/services/douyin.ts";

const NO_LIVE_INTERNAL = 1000 * 60;
const LIVE_INTERNAL = 1000 * 60 * 5;
class UserLive {
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

export class IjiaWatch extends UserLive {
  readonly uid = "MS4wLjABAAAA0AiK9Q4FlkTxKHo-b6Vi1ckA2Ybq-WNgJ-b5xXlULtI";
  constructor() {
    const checkServer = getCheckerServer();
    super(() => checkServer.userIsLive(this.uid));
  }
  override onChange(status: 0 | 1): void | Promise<void> {
    if (status) {
    } else {
    }
  }
  override onError(err: any): void {
    console.error(err);
  }
}
