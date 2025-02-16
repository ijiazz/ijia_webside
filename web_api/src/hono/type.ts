import { SignInfo } from "@/crypto/jwt.ts";
import { Context } from "hono";

type HonoVariables = {
  getUserInfo(): Promise<SignInfo>;
};
export type NestHonoRequest = Context<{ Variables: HonoVariables }>;
