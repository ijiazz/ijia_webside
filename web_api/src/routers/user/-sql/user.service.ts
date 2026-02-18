import { PUBLIC_CLASS_ROOT_ID, Platform } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import { User, UserConfig } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { deleteFrom, insertInto, select } from "@asla/yoursql";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { ExecutableSQL } from "@asla/pg";
import { jsonb_build_object } from "@/global/sql_util.ts";

export function setUserPublicClass(userId: number, classId: number | null): ExecutableSQL {
  return dbPool.createExecutableSQL(
    insertInto("user_class_bind", ["class_id", "user_id"]).select(() => {
      return select({ class_id: "id", user_id: v(userId) })
        .from("public.class")
        .where([`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`, `id=${v(classId)}`])
        .genSql();
    }),
  );
}
export function deletePublicClassOfUser(userId: number): ExecutableSQL {
  return dbPool.createExecutableSQL(
    deleteFrom("user_class_bind").where([
      `user_id=${v(userId)}`,
      "EXISTS " +
        select("*")
          .from("public.class")
          .where([`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`, `class.id=user_class_bind.class_id`])
          .toSelect(),
    ]),
  );
}
/** 这是公开的，每个用户都能获取 */
export async function getUserInfo(userId: number): Promise<User> {
  const users = await dbPool.queryRows(
    select<User>({
      user_id: "id",
      avatar_url: "'/file/avatar/'||avatar",
      nickname: "COALESCE(nickname, id::TEXT)",
      is_official: `(SELECT EXISTS ${getUserBindAccount(userId).toSelect()})`,
      primary_class: `(SELECT row_to_json(pub_class) FROM ${getUserPublicClass(userId).toSelect()} AS pub_class)`,
      profile: select(
        jsonb_build_object({
          acquaintance_time: "p.acquaintance_time",
        }),
      )
        .from("user_profile", { as: "p" })
        .where(`user_id=${v(userId)}`)
        .toSelect(),
    })
      .from("public.user", { as: "u" })
      .where(`u.id=${v(userId)}`)
      .limit(1),
  );
  if (!users.length) throw new HttpError(404, { message: "用户不存在" });
  const userInfo = users[0];
  return userInfo;
}
export async function getUserConfig(userId: number): Promise<UserConfig> {
  const users = await dbPool.queryRows(
    select<UserConfig>({
      user_id: "id",
      email: "email",
      bind_accounts: `(SELECT json_agg(row_to_json(accounts)) FROM ${getUserBindAccount(userId).toSelect()} AS accounts)`,
      profile: select(
        jsonb_build_object({
          acquaintance_time: "p.acquaintance_time",
          comment_stat_enabled: "p.comment_stat_enabled",
          live_notice: "p.live_notice",
        }),
      )
        .from("user_profile", { as: "p" })
        .where(`user_id=${v(userId)}`)
        .toSelect(),
    })
      .from("public.user", { as: "u" })
      .where(`u.id=${v(userId)}`)
      .limit(1),
  );
  if (!users.length) throw new HttpError(404, { message: "用户不存在" });
  const userInfo = users[0];
  if (!userInfo.bind_accounts) userInfo.bind_accounts = [];

  return userInfo;
}
export async function bindPlatformAccount(userId: number, platform: Platform, pla_uid: string, skipCheck?: boolean) {
  const [plaUser] = await dbPool.queryRows(
    select<{ signature?: string }>({ signature: true })
      .from("pla_user")
      .where(`platform=${v(platform)} AND pla_uid=${v(pla_uid)}`),
  );
  if (!plaUser) throw new HttpError(400, { message: "平台账号不存在" });
  if (!skipCheck) {
    if (!checkSignatureStudentId(userId, plaUser.signature)) {
      throw new HttpError(403, { message: "审核不通过。没有从账号检测到学号" });
    }
  }
  await using q = dbPool.begin();
  await q.query(deleteFrom("user_platform_bind").where(`platform=${v(platform)} AND pla_uid=${v(pla_uid)}`));
  await q.queryCount(insertIntoValues("user_platform_bind", { pla_uid, platform, user_id: userId }));
  await q.commit();
}

function getUserPublicClass(userId: number) {
  return select(["bind_class.class_id", "class.class_name"])
    .from("user_class_bind", { as: "bind_class" })
    .innerJoin("public.class", {
      as: "class",
      on: [
        `bind_class.user_id=${v(userId)}`,
        "bind_class.class_id=class.id",
        `class.parent_class_id=${PUBLIC_CLASS_ROOT_ID}`,
      ],
    })
    .limit(1);
}
function getUserBindAccount(userId: number) {
  return select({
    platform: "bind.platform",
    pla_uid: "bind.pla_uid",
    user_id: "bind.user_id",
    user_name: "pla_user.user_name",
    avatar_url: "'/file/avatar/'||pla_user.avatar",
    create_time: "bind.create_time",
    key: "bind.platform||'-'||bind.pla_uid",
  })
    .from("user_platform_bind", { as: "bind" })
    .innerJoin("pla_user", {
      as: "pla_user",
      on: ["bind.platform=pla_user.platform", `bind.user_id=${v(userId)}`, "bind.pla_uid=pla_user.pla_uid"],
    });
}
export function checkSignatureStudentId(userId: number | string, signature?: string) {
  if (typeof signature !== "string") return false;
  return signature.includes(`IJIA学号：<${userId}>`);
}
