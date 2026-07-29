import { Context } from "hono";
import { UserInfo } from "./userInfo.ts";
import { Route } from "@/lib/route.ts";

type HonoVariables = {
  userInfo: UserInfo;
};
export type HonoContext = Context<{ Variables: HonoVariables }>;

export const createRoute = Route.createFactory<HonoContext>();
