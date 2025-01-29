import { Command, createCommand } from "commander";
import { getAssetList, getCommentList, getCommentReplyByCid, getUserList } from "@ijia/data/query";
import { getDbPool } from "@ijia/data/yoursql";
const cmd = createCommand("app");
cmd.option("--sql", "输出 SQL 文本");

cmd
  .command("user")
  .argument("[params]", "URL参数", initParams)
  .action(async function (params: Record<string, any>, option: {}, cmd: Command) {
    await using client = getDbPool();
    const sql = cmd.parent?.getOptionValue("sql");
    const result = await getUserList(client, {
      ...params,
      catchSql: sql ? console.log : undefined,
    });
    if (result.length === 1) console.log(result[1]);
    else {
      console.table(result);
    }
  });
cmd
  .command("published")
  .argument("[params]", "URL参数", initParams)
  .action(async function (params: Record<string, any>, option: {}, cmd: Command) {
    await using client = getDbPool();
    const sql = cmd.parent?.getOptionValue("sql");
    const result = await getAssetList(client, {
      ...params,
      catchSql: sql ? console.log : undefined,
    });
    if (result.length === 1) {
      console.log(result[0]);
    } else {
      console.table(
        result.map((item) => ({
          user: item.author.user_name,
          stat: item.stat,
          text: maxStr(item.content_text, 50),
          date: item.publish_time?.toLocaleString(),
          id: item.asset_id,
        })),
      );
    }
  });

cmd
  .command("comment")
  .argument("[params]", "URL参数", initParams)
  .action(async function (param: Record<string, any>, option: {}, cmd: Command) {
    await using client = getDbPool();
    const sql = cmd.parent?.getOptionValue("sql");

    const catchSql = sql ? console.log : undefined;
    if (param.root_comment_id) {
      const result = await getCommentReplyByCid(client, { ...param, catchSql });
      if (result.length === 1) console.log(result[0]);
      else {
        console.table(
          result.map((item) => ({
            user: maxStr(item.user.user_name, 15),
            date: item.publish_time.toLocaleString(),
            a_like: item.author_like,
            type: item.comment_type,
            text: maxStr(item.content_text, 30),
            id: item.comment_id,
            rUser: maxStr(item.replyUserName ?? "", 15),
            rCid: item.parentId,
          })),
        );
      }
    } else {
      const result = await getCommentList(client, { ...param, catchSql });
      if (result.length === 1) console.log(result[0]);
      else {
        console.table(
          result.map((item) => ({
            user: item.user.user_name,
            date: item.publish_time.toLocaleString(),
            a_like: item.author_like,
            replyNum: item.reply_total,
            type: item.comment_type,
            text: maxStr(item.content_text, 30),
            id: item.comment_id,
          })),
        );
      }
    }
  });

function maxStr(str: string, max: number) {
  let len = 0;
  return str.length > max ? str.slice(0, max) + "..." : str;
}
await cmd.parseAsync(process.argv);

function initParams(params: string | undefined) {
  let p = new URLSearchParams(params);
  return Object.fromEntries(p);
}
