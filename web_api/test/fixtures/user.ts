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
  };
}

let uniqueId = 1;
export const getUniqueEmail = (base: string) => `${base}${uniqueId++}@ijiazz.cn`;

export async function prepareUniqueUser(nickname: string, option?: PrepareUserOption): Promise<UserToken> {
  const email = getUniqueEmail(nickname);
  return prepareUser(email, option);
}
export type UserToken = {
  id: number;
  nickname: string;
  token: string;
  email: string;
  passport?: string;
};

export type PrepareUserOption = {
  password?: string;
};
