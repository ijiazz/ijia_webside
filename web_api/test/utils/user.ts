import { Role } from "@/middleware/auth.ts";
import { signAccessToken } from "@/global/jwt.ts";
import { newTestUser } from "@ijia/data/testlib";

export async function prepareUniqueUser(nickname: string, option: PrepareUserOption = {}): Promise<UserToken> {
  const info = await newTestUser(nickname, option);
  const { token } = await signAccessToken(info.id, { survivalSeconds: 60 * 100 * 60 });
  return {
    ...info,
    token,
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
  roles?: Set<Role> | Role[]; // 角色
};
