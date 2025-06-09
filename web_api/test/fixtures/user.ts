import { signLoginJwt } from "@/global/jwt.ts";
import { createUser } from "@/modules/passport/sql/signup.ts";

export async function prepareUser(nickname: string): Promise<UserToken> {
  const email = nickname + "@ijiazz.cn";
  const id = await createUser(email, { nickname: nickname });
  const token = await signLoginJwt(id, 60 * 100);
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
