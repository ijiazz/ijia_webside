import { getCheckerServer } from "@/services/douyin.ts";
import { getSubscribeLiveEmails, sendEmailMany } from "./notice_user_email.ts";
import { log, LogLevel } from "@ijia/data/db";
import { appConfig } from "@/config.ts";
import { getEmailSender } from "../email.ts";
import { toErrorStr } from "evlib";
type LiveStatus = 0 | 1 | undefined;
class UserLive {
  #onTick?: () => Promise<LiveStatus>;
  constructor(option: { onTick?: () => Promise<0 | 1>; noLiveInternal: number; liveInternal: number }) {
    if (option.onTick) this.#onTick = option.onTick;
    this.noLiveInternal = option.noLiveInternal;
    this.liveInternal = option.liveInternal;
    this.#waitTime = this.noLiveInternal;
  }
  #id: any;
  private readonly noLiveInternal: number;
  private readonly liveInternal: number;
  #waitTime: number;
  start(onTick?: () => Promise<LiveStatus>) {
    if (onTick) this.#onTick = onTick;
    else if (!this.#onTick) throw new Error("onTick is required");
    if (this.#id !== undefined) return;

    this.#onCheck();
  }
  stop() {
    if (this.#id === undefined) return;
    clearInterval(this.#id);
    this.#id = undefined;
  }
  private live_status: LiveStatus;
  #onCheck = async () => {
    let live_status: LiveStatus;
    try {
      live_status = await this.#onTick!();
    } catch (error) {
      this.onError(error);
      return;
    }
    if (typeof live_status === "number") {
      if (this.live_status === undefined) {
        this.live_status = live_status;
      } else if (live_status !== this.live_status) {
        this.live_status = live_status;

        if (live_status === 1) {
          this.#waitTime = this.liveInternal;
        } else {
          this.#waitTime = this.noLiveInternal;
        }
        await this.onChange(live_status);
      }
    }
    if (this.#waitTime < 1000) {
      throw new Error("轮询间隔时间过短");
    }
    this.#id = setTimeout(this.#onCheck, this.#waitTime);
  };
  onError(err: any) {
    console.error("直播状态轮询请求异常, 已停止轮询", err);
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
    console.log("开启直播监控");
    return super.start(() => this.onTick());
  }
  private async onTick(): Promise<LiveStatus> {
    const checkServer = getCheckerServer();
    try {
      return await checkServer.userIsLive(this.uid);
    } catch (error) {
      await log
        .insert({ info: { error: toErrorStr(error) }, name: "直播轮询", level: LogLevel.error })
        .query()
        .catch((e) => {
          console.error("直播状态轮询请求异常, 且无法写入日志", e);
        });
    }
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
const pollingMinute = appConfig.live_watch.pollingMinute;
export const watchIjia = new IjiaWatch("MS4wLjABAAAA0AiK9Q4FlkTxKHo-b6Vi1ckA2Ybq-WNgJ-b5xXlULtI", pollingMinute);

// 通知订阅直播通知的人
async function sendLiveNotificationEmails() {
  const startTime = Date.now();
  let failedTotal = 0;
  const sender = getEmailSender();
  const content = genNoticeContent();
  const res = await sendEmailMany(getSubscribeLiveEmails(), (info) => {
    return sender
      .sendEmail({
        targetEmail: info.name ? { address: info.email, name: info.name } : info.email,
        title: "IJIA 学院开课通知",
        text: content,
      })
      .catch((e) => {
        failedTotal++;
        throw e;
      });
  });
  const useTime = Date.now() - startTime;

  try {
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
  } catch (error) {
    console.error("添直播通知邮件通知日志失败", error);
  }
}

function genNoticeContent() {
  //TODO 个性化 html 提示，
  const date = new Date();
  const h = date.getUTCHours() + 8; // 北京时间
  const m = date.getUTCMinutes();
  const time = h.toString().padStart(2, "0") + ":" + m.toString().padStart(2, "0");

  const cancelLink = "https://iijazz.cn/profile/center";
  return `IJIA 学院开课了(${time})，快去直播间学习吧！争取成为IJIA高手！\n 如果你不希望接收这类通知，请前往 ${cancelLink} 取消通知`;
}
console.log(genNoticeContent());
