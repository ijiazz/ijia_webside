import { UserInfo } from "@/global/auth.ts";
import { Context } from "hono";

type HonoVariables = {
  userInfo: UserInfo;
};
export type HonoContext = Context<{ Variables: HonoVariables }>;
