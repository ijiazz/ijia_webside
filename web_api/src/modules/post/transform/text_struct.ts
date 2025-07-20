import { integer, TypeCheckFn, CheckTypeError, getBasicType, checkTypeCopy } from "@asla/wokao";
import { TextStructure, TextStructureType } from "@ijia/data/db";

export const textStructChecker: TypeCheckFn<TextStructure[] | null> = (input, option) => {
  if (!(input instanceof Array)) {
    throw new CheckTypeError("Array", getBasicType(input));
  }
  const list = new Array<TextStructure>(input.length);
  let lastOffset = 0;
  let item: TextStructure;
  for (let i = 0; i < input.length; i++) {
    item = input[i];
    switch (item.type) {
      case TextStructureType.user: {
        try {
          item = checkTypeCopy(
            item,
            {
              type: integer(),
              index: integer(lastOffset),
              length: integer(1),
              user_id: strUserId,
            },
            { policy: "pass" },
          );
        } catch (error) {
          if (error instanceof CheckTypeError) {
            throw new CheckTypeError({ [i]: error.reason || error.message });
          }
          throw error;
        }
        lastOffset = item.index + item.length;
        list[i] = item;
        break;
      }

      default: {
        throw new CheckTypeError({ [i]: { type: "未知类型" } });
      }
    }
  }
  if (list.length === 0) return null;
  return list;
};
const strUserId: TypeCheckFn<string> = (input) => {
  if (typeof input === "number") {
    if (Number.isInteger(input)) return input.toString();
    throw new CheckTypeError("整数字符串或整数", input.toString());
  }
  if (typeof input === "string") {
    if (/[0-9]/.test(input)) return input;
    throw new CheckTypeError("整数字符串或整数", input);
  }
  throw new CheckTypeError("整数字符串或整数", typeof input);
};
