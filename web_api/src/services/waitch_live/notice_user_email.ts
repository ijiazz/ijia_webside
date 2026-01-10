import { select } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";
import { PromiseConcurrency } from "evlib/async";

/**
 * 发送多个邮件，这个函数带有并发控制
 */
export async function sendEmailMany(iter: AsyncIterable<WatchInfo>, send: (items: WatchInfo) => Promise<void>) {
  let total = 0;
  const concurrency = new PromiseConcurrency({ concurrency: 10 });
  for await (const info of iter) {
    total++;
    await concurrency.push(send(info));
  }
  await concurrency.onClear();
  return {
    total,
    sendFailedCount: concurrency.failedTotal,
  };
}

export type WatchInfo = {
  name?: string | null;
  email: string;
  domain: string;
  user_id: number;
};

export async function* getSubscribeLiveEmails(): AsyncGenerator<WatchInfo, void, void> {
  const sql = select<WatchInfo>({
    name: "u.nickname",
    user_id: "u.id::INT",
    email: "u.email",
    domain: "split_part(u.email,'@',2)",
  })
    .from("user_profile", { as: "profile" })
    .innerJoin("public.user", { as: "u", on: "profile.user_id=u.id" })
    .where(["profile.live_notice", "NOT u.is_deleted"])
    .orderBy("domain");
  await using cursor = await dbPool.cursor<WatchInfo>(sql, { defaultSize: 100 });
  let rows = await cursor.read();
  while (rows.length) {
    const group = Object.groupBy(rows, (v) => v.domain);
    for (const items of Object.values(group)) {
      if (!items?.length) continue;
      yield* items!;
    }
    rows = await cursor.read();
  }
}
