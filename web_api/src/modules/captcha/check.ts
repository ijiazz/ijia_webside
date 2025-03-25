import { ExpectType, array } from "@asla/wokao";

export function imageCaptchaReplyChecker() {
  return { sessionId: "string", selectedIndex: array.number } satisfies ExpectType;
}

export function emailCaptchaReplyChecker() {
  return { sessionId: "string", code: "string" } satisfies ExpectType;
}
