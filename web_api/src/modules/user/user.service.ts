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
import v, { ChainInsert, dbPool, Selection } from "@ijia/data/yoursql";
import { UserBasicDto, UserProfileDto } from "./user.dto.ts";
import { HttpError } from "@/global/errors.ts";

export function setUserPublicClass(userId: number, classId: number | null): ChainInsert<{}> {
  const exists = dclass
    .select({ class_id: "id", user_id: v(userId) })
    .where([`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`, `id=${v(classId)}`]);
  return user_class_bind.insert("class_id, user_id", exists.toString());
}
export function deletePublicClassOfUser(userId: number) {
  return user_class_bind.delete({
    where: [
      `user_id=${v(userId)}`,
      "EXISTS " +
        Selection.from(dclass)
          .select("*")
          .where([`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`, `class.id=user_class_bind.class_id`])
          .toSelect(),
    ],
  });
}
export async function getUserBasic(userId: number): Promise<UserBasicDto> {
  const users = await user
    .fromAs("u")
    .select<UserBasicDto>({
      user_id: "id",
      avatar_url: "avatar",
      nickname: true,
      is_official: `(SELECT EXISTS ${getUserBindAccount(userId).toSelect()})`,
      primary_class: `(SELECT row_to_json(pub_class) FROM ${getUserPublicClass(userId).toSelect()} AS pub_class)`,
    })
    .where(`u.id=${v(userId)}`)
    .limit(1)
    .queryRows();
  if (!users.length) throw new HttpError(404, { message: "用户不存在" });
  const userInfo = users[0];
  return userInfo;
}
export async function getUserProfile(userId: number): Promise<UserProfileDto> {
  const profile = user_profile.select(["live_notice AS live"]).where(`user_id=${v(userId)}`);
  const users = await user
    .fromAs("u")
    .select<UserProfileDto>({
      user_id: "id",
      avatar_url: "'/file/avatar/'||avatar",
      nickname: true,
      primary_class: `(SELECT row_to_json(pub_class) FROM ${getUserPublicClass(userId).toSelect()} AS pub_class)`,
      bind_accounts: `(SELECT json_agg(row_to_json(accounts)) FROM ${getUserBindAccount(userId).toSelect()} AS accounts)`,
      notice_setting: `(SELECT row_to_json(profile) FROM ${profile.toSelect()} AS profile)`,
    })
    .where(`u.id=${v(userId)}`)
    .limit(1)
    .queryRows();
  if (!users.length) throw new HttpError(404, { message: "用户不存在" });
  const userInfo = users[0];
  if (!userInfo.bind_accounts) userInfo.bind_accounts = [];
  userInfo.is_official = userInfo.bind_accounts.length > 0;
  return userInfo;
}
export async function bindPlatformAccount(userId: number, platform: Platform, pla_uid: string, skipCheck?: boolean) {
  const [plaUser] = await pla_user
    .select<{ signature?: string }>({ signature: true })
    .where(`platform=${v(platform)} AND pla_uid=${v(pla_uid)}`)
    .queryRows();
  if (!plaUser) throw new HttpError(400, { message: "平台账号不存在" });
  if (!skipCheck) {
    if (!checkSignatureStudentId(userId, plaUser.signature)) {
      throw new HttpError(403, { message: "审核不通过。没有从账号检测到学号" });
    }
  }
  await using q = dbPool.begin();
  await q.query(user_platform_bind.delete({ where: `platform=${v(platform)} AND pla_uid=${v(pla_uid)}` }));
  await q.queryCount(user_platform_bind.insert([{ pla_uid, platform, user_id: userId }]));
  await q.commit();
}

function getUserPublicClass(userId: number) {
  return user_class_bind
    .fromAs("bind_class")
    .innerJoin(dclass, "class", [
      `bind_class.user_id=${v(userId)}`,
      "bind_class.class_id=class.id",
      `class.parent_class_id=${PUBLIC_CLASS_ROOT_ID}`,
    ])
    .select(["bind_class.class_id", "class.class_name"])
    .limit(1);
}
function getUserBindAccount(userId: number) {
  return user_platform_bind
    .fromAs("bind")
    .innerJoin(pla_user, "pla_user", [
      "bind.platform=pla_user.platform",
      `bind.user_id=${v(userId)}`,
      "bind.pla_uid=pla_user.pla_uid",
    ])
    .select({
      platform: "bind.platform",
      pla_uid: "bind.pla_uid",
      user_id: "bind.user_id",
      user_name: "pla_user.user_name",
      avatar_url: "'/file/avatar/'||pla_user.avatar",
      create_time: "bind.create_time",
      key: "bind.platform||'-'||bind.pla_uid",
    });
}
export function checkSignatureStudentId(userId: number | string, signature?: string) {
  if (typeof signature !== "string") return false;
  return signature.includes(`IJIA学号：<${userId}>`);
}
