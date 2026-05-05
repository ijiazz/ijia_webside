import { queryInt } from "@/global/check.ts";
import { ExpectType, InferExpect, optional } from "@asla/wokao";

export const COMMIT_REVIEW_PARAM_SCHEMA = {
  review_id: queryInt,
  is_passed: "boolean",
  remark: optional.string,
} satisfies ExpectType;

export type BECommitReviewParam = InferExpect<typeof COMMIT_REVIEW_PARAM_SCHEMA>;

export function parserReviewId(idRaw: string): { id: number; tz?: number } {
  const index = idRaw.indexOf("-");
  if (index === -1) {
    return { id: parseSafeInt(idRaw) };
  }
  const id = idRaw.slice(0, index);
  const tz = idRaw.slice(index + 1);
  return { id: parseSafeInt(id), tz: parseSafeInt(tz) };
}
function parseSafeInt(input: string) {
  const result = Number.parseInt(input, 10);
  if (Number.isInteger(result)) return result;
  throw new Error(`无法解析整数: ${input}`);
}
