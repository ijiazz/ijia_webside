import { optional, integer, enumType, checkTypeCopy } from "@asla/wokao";
import { checkValue, emailChecker } from "@/global/check.ts";
import { imageCaptchaReplyChecker } from "@/routers/captcha/mod.ts";

export function checkUserParam(unsafeParam: unknown) {
  return checkValue(unsafeParam, {
    user: (value) => {
      if (typeof value !== "object" || value === null) {
        throw new Error("用户标识不合法");
      }
      const target = checkTypeCopy((value as any).type, enumType<"userId" | "email">(["userId", "email"]));
      switch (target) {
        case "email": {
          return checkTypeCopy((value as { email: string }).email, emailChecker);
        }
        case "userId": {
          return checkTypeCopy((value as { userId: string }).userId, integer());
        }
        default:
          throw new Error("用户标识不合法");
      }
    },
    password: optional.string,
    passwordNoHash: optional.boolean,
    captcha: optional(imageCaptchaReplyChecker()),
  });
}
