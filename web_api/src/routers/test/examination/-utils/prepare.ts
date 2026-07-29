import { HttpError } from "@/common/errors.ts";
import type { ExpectType } from "@asla/wokao";
import { integer } from "@asla/wokao";

export const PREPARE_BODY_SCHEMA = {
  count: integer.positive,
  userId: integer.positive,
} satisfies ExpectType;

export function throwNotImplemented(): never {
  throw new HttpError(501, { message: "测试接口暂未实现" });
}