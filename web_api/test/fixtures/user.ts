import { signAccessToken } from "@/global/jwt.ts";
import { createUser } from "@/modules/passport/sql/signup.ts";

export async function prepareUser(nickname: string, option: PrepareUserOption = {}): Promise<UserToken> {
  const email = nickname + "@ijiazz.cn";
  const id = await createUser(email, { nickname: nickname, password: option.password });
  const { token } = await signAccessToken(id, { survivalSeconds: 60 * 100 * 60 });
  return {
    email,
    id,
    token,
    nickname: nickname,
    password: option.password,
  };
}

let uniqueId = 1;

/** 获取唯一名称 */
export function getUniqueName(base: string) {
  return base + uniqueId++;
}
/** 获取全局唯一邮箱，用于公共数据库时创建用户测试 */
export const getUniqueEmail = (base: string) => `${getUniqueName(base)}@ijiazz.cn`;

export async function prepareUniqueUser(nickname: string, option: PrepareUserOption = {}): Promise<UserToken> {
  const email = getUniqueEmail(nickname);
  const id = await createUser(email, { nickname: nickname, password: option.password });
  const { token } = await signAccessToken(id, { survivalSeconds: 60 * 100 * 60 });
  return {
    email,
    id,
    token,
    nickname: nickname,
    password: option.password,
  };
}
export type UserToken = {
  id: number;
  nickname: string;
  token: string;
  email: string;
  password?: string;
};

export type PrepareUserOption = {
  password?: string;
};
