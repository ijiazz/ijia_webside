import { signAccessToken } from "@/global/jwt.ts";
import { createUser } from "@/modules/passport/sql/signup.ts";

export async function prepareUser(nickname: string) {
  const email = nickname + "@ijiazz.cn";
  const id = await createUser(email, { nickname: nickname });
  const { token } = await signAccessToken(id, { survivalSeconds: 60 * 100 * 60 });
  return {
    email,
    id,
    token,
    nickname: nickname,
  };
}
let uniqueId = 1;
export async function prepareUniqueUser(nickname: string): Promise<UserToken> {
  const email = `${nickname}-${uniqueId++}`;
  return prepareUser(email);
}
export type UserToken = {
  id: number;
  nickname: string;
  token: string;
  email: string;
  passport?: string;
};
