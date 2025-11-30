import { UserInfo } from "@/middleware/auth.ts";
import { Context } from "hono";

type HonoVariables = {
  userInfo: UserInfo;
};
export type HonoContext = Context<{ Variables: HonoVariables }>;
