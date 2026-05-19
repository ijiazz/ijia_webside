import { Context } from "hono";
import { UserInfo } from "./userInfo.ts";

type HonoVariables = {
  userInfo: UserInfo;
};
export type HonoContext = Context<{ Variables: HonoVariables }>;
