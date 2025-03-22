import { getCheckerServer } from "@/services/douyin.ts";
import { getSubscribeLiveEmails, noticeBatch, sendEmailMany } from "./notice_user_email.ts";
import { log, LogLevel } from "@ijia/data/db";
import { appConfig, ENV } from "@/config.ts";

class UserLive {
  private onTick?: () => Promise<0 | 1>;
  constructor(option: { onTick?: () => Promise<0 | 1>; noLiveInternal: number; liveInternal: number }) {
    if (option.onTick) this.onTick = option.onTick;
    this.noLiveInternal = option.noLiveInternal;
    this.liveInternal = option.liveInternal;
    this.#waitTime = this.liveInternal;
  }
  #id: any;
  private readonly noLiveInternal: number;
  private readonly liveInternal: number;
  #waitTime: number;
  start(onTick?: () => Promise<0 | 1>) {
    console.log("开启直播监控");
    if (onTick) this.onTick = onTick;
    else if (!this.onTick) throw new Error("onTick is required");
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
      live_status = await this.onTick!();
    } catch (error) {
      this.onError(error);
      return;
    }
    if (live_status !== this.live_status) {
      this.live_status = live_status;
      if (live_status === 1) {
        this.#waitTime = this.liveInternal;
      } else {
        this.#waitTime = this.noLiveInternal;
      }
      await this.onChange(live_status);
    }
    this.#id = setTimeout(this.#onCheck, this.#waitTime);
  };
  onError(err: any) {
    console.error("直播状态轮询请求异常", err);
  }
  /** 直播状态发送变化 */
  onChange(status: 0 | 1): void | Promise<void> {}
}

export class IjiaWatch extends UserLive {
  constructor(
    readonly uid: string,
    pollingMinute: number,
  ) {
    const noLiveInternal = Math.floor(pollingMinute) * 60 * 1000;
    const liveInternal: number = noLiveInternal * 3;
    super({ noLiveInternal, liveInternal });
  }
  override start(): void {
    const checkServer = getCheckerServer();
    return super.start(() => checkServer.userIsLive(this.uid));
  }
  private isSending = false;
  override onChange(status: 0 | 1): void | Promise<void> {
    if (status) {
      if (this.isSending) return;
      this.isSending = true;
      return sendLiveNotificationEmails().finally(() => {
        this.isSending = false;
      });
    } else {
    }
  }
}
const pollingMinute = appConfig.watch.pollingMinute;
export const watchIjia = new IjiaWatch("MS4wLjABAAAA0AiK9Q4FlkTxKHo-b6Vi1ckA2Ybq-WNgJ-b5xXlULtI", pollingMinute);
if (pollingMinute >= 1 && ENV.CHECK_SERVER) watchIjia.start();

function genNoticeContent() {
  //TODO html 提示，并给出取消通知的地址
  return `IJIA 学院开课了，快去直播间学习吧！争取成为IJIA高手！`;
}
// 通知订阅直播通知的人
async function sendLiveNotificationEmails() {
  const startTime = Date.now();
  let failedTotal = 0;
  const res = await sendEmailMany(getSubscribeLiveEmails(), async (items) => {
    return noticeBatch(items, "IJIA 学院开课通知", genNoticeContent()).catch((e) => {
      failedTotal += items.length;
      throw e;
    });
  });
  const useTime = Date.now() - startTime;

  await log
    .insert({
      info: {
        总发送用户数: res.total,
        发送总耗时: useTime,
        发送失败次数: res.sendFailedCount,
        发送失败人数: failedTotal,
      },
      level: LogLevel.log,
      name: "发送直播通知邮件",
    })
    .queryCount();
}
