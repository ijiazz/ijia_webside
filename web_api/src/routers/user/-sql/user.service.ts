import {
  dclass,
  user_class_bind,
  PUBLIC_CLASS_ROOT_ID,
  user,
  user_platform_bind,
  pla_user,
  user_profile,
  Platform,
} from "@ijia/data/db";
import { dbPool, ExecutableSQL } from "@/db/client.ts";
import { UserBasicDto, UserInfoDto } from "@/dto/user.ts";
import { HttpError } from "@/global/errors.ts";
import { deleteFrom, insertInto, select } from "@asla/yoursql";
import { insertIntoValues, v } from "@/sql/utils.ts";

export function setUserPublicClass(userId: number, classId: number | null): ExecutableSQL {
  return dbPool.createExecutableSQL(
    insertInto(user_class_bind.name, ["class_id", "user_id"]).select(() => {
      return select({ class_id: "id", user_id: v(userId) })
        .from(dclass.name)
        .where([`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`, `id=${v(classId)}`])
        .genSql();
    }),
  );
}
export function deletePublicClassOfUser(userId: number): ExecutableSQL {
  return dbPool.createExecutableSQL(
    deleteFrom(user_class_bind.name).where([
      `user_id=${v(userId)}`,
      "EXISTS " +
        select("*")
          .from(dclass.name)
          .where([`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`, `class.id=user_class_bind.class_id`])
          .toSelect(),
    ]),
  );
}
export async function getUserBasic(userId: number): Promise<UserBasicDto> {
  const users = await dbPool.queryRows(
    select<UserBasicDto>({
      user_id: "id",
      email: "email",
      avatar_url: "'/file/avatar/'||avatar",
      nickname: true,
      is_official: `(SELECT EXISTS ${getUserBindAccount(userId).toSelect()})`,
      primary_class: `(SELECT row_to_json(pub_class) FROM ${getUserPublicClass(userId).toSelect()} AS pub_class)`,
    })
      .from(user.name, { as: "u" })
      .where(`u.id=${v(userId)}`)
      .limit(1),
  );
  if (!users.length) throw new HttpError(404, { message: "用户不存在" });
  const userInfo = users[0];
  return userInfo;
}
export async function getUserProfile(userId: number): Promise<UserInfoDto> {
  const profile = select({ acquaintance_time: true, comment_stat_enabled: true, live_notice: true })
    .from(user_profile.name)
    .where(`user_id=${v(userId)}`);
  const users = await dbPool.queryRows(
    select<UserInfoDto>({
      user_id: "id",
      email: "email",
      avatar_url: "'/file/avatar/'||avatar",
      nickname: true,
      primary_class: `(SELECT row_to_json(pub_class) FROM ${getUserPublicClass(userId).toSelect()} AS pub_class)`,
      bind_accounts: `(SELECT json_agg(row_to_json(accounts)) FROM ${getUserBindAccount(userId).toSelect()} AS accounts)`,
      profile: `(SELECT row_to_json(profile) FROM ${profile.toSelect()} AS profile)`,
    })
      .from(user.name, { as: "u" })
      .where(`u.id=${v(userId)}`)
      .limit(1),
  );
  if (!users.length) throw new HttpError(404, { message: "用户不存在" });
  const userInfo = users[0];
  if (!userInfo.bind_accounts) userInfo.bind_accounts = [];
  userInfo.is_official = userInfo.bind_accounts.length > 0;
  return userInfo;
}
export async function bindPlatformAccount(userId: number, platform: Platform, pla_uid: string, skipCheck?: boolean) {
  const [plaUser] = await dbPool.queryRows(
    select<{ signature?: string }>({ signature: true })
      .from(pla_user.name)
      .where(`platform=${v(platform)} AND pla_uid=${v(pla_uid)}`),
  );
  if (!plaUser) throw new HttpError(400, { message: "平台账号不存在" });
  if (!skipCheck) {
    if (!checkSignatureStudentId(userId, plaUser.signature)) {
      throw new HttpError(403, { message: "审核不通过。没有从账号检测到学号" });
    }
  }
  await using q = dbPool.begin();
  await q.query(deleteFrom(user_platform_bind.name).where(`platform=${v(platform)} AND pla_uid=${v(pla_uid)}`));
  await q.queryCount(insertIntoValues(user_platform_bind.name, { pla_uid, platform, user_id: userId }));
  await q.commit();
}

function getUserPublicClass(userId: number) {
  return select(["bind_class.class_id", "class.class_name"])
    .from(user_class_bind.name, { as: "bind_class" })
    .innerJoin(dclass.name, {
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
    .from(user_platform_bind.name, { as: "bind" })
    .innerJoin(pla_user.name, {
      as: "pla_user",
      on: ["bind.platform=pla_user.platform", `bind.user_id=${v(userId)}`, "bind.pla_uid=pla_user.pla_uid"],
    });
}
export function checkSignatureStudentId(userId: number | string, signature?: string) {
  if (typeof signature !== "string") return false;
  return signature.includes(`IJIA学号：<${userId}>`);
}
