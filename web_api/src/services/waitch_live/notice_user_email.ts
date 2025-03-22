import { user_profile, user, log } from "@ijia/data/db";
import { dbPool } from "@ijia/data/yoursql";
import { PromiseConcurrency } from "evlib/async";
import { getEmailSender } from "@/services/email.ts";

export async function noticeBatch(list: WatchInfo[], title: string, text: string) {
  const sender = getEmailSender();
  await sender.sendEmail({ targetEmail: list.map((v) => v.email), title, text: text });
}

/**
 * 发送多个邮件，这个函数带有并发控制
 */
export async function sendEmailMany(iter: AsyncIterable<WatchInfo[]>, send: (items: WatchInfo[]) => Promise<void>) {
  let total = 0;
  const concurrency = new PromiseConcurrency({ concurrency: 5 });
  for await (const items of iter) {
    total += items.length;
    await concurrency.push(send(items));
  }
  await concurrency.onClear();
  return {
    total,
    sendFailedCount: concurrency.failedTotal,
  };
}

export type WatchInfo = {
  email: string;
  domain: string;
  user_id: number;
};

export async function* getSubscribeLiveEmails(): AsyncGenerator<WatchInfo[], void, void> {
  const sql = user_profile
    .fromAs("profile")
    .innerJoin(user, "u", "profile.user_id=u.id")
    .select<WatchInfo>({ user_id: "u.id::INT", email: "u.email", domain: "split_part(u.email,'@',2)" })
    .where(["profile.live_notice", "NOT u.is_deleted"])
    .orderBy("domain");
  await using cursor = await dbPool.cursor<WatchInfo>(sql, { defaultSize: 100 });
  let rows = await cursor.read();
  while (rows.length) {
    const group = Object.groupBy(rows, (v) => v.domain);
    for (const items of Object.values(group)) {
      if (!items?.length) continue;
      yield items!;
    }
    rows = await cursor.read();
  }
}
