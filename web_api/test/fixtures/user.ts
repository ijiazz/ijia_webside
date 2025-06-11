import { signAccessToken } from "@/global/jwt.ts";
import { createUser } from "@/modules/passport/sql/signup.ts";

export async function prepareUser(nickname: string): Promise<UserToken> {
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
export type UserToken = {
  id: number;
  nickname: string;
  token: string;
  email: string;
  passport?: string;
};
