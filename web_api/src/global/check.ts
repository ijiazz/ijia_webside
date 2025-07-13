import {
  checkTypeCopy,
  getCheckTypeErrorReason,
  ExpectType,
  InferExpect,
  TypeCheckOption,
  optional,
  integer,
  TypeCheckFn,
  CheckTypeError,
  stringMatch,
} from "@asla/wokao";
import { HttpParamsCheckError } from "./errors.ts";

export function checkValue<T extends ExpectType>(
  input: unknown,
  expectType: T,
  option?: TypeCheckOption,
): InferExpect<T> {
  try {
    return checkTypeCopy(input, expectType, { ...option, policy: "pass" });
  } catch (error) {
    throw new HttpParamsCheckError(getCheckTypeErrorReason(error));
  }
}
export function checkValueAsync<T extends ExpectType>(
  input: Promise<unknown>,
  expectType: T,
  option?: TypeCheckOption,
): Promise<InferExpect<T>> {
  return input.then((data) => checkValue(data, expectType, option));
}

export const emailChecker = stringMatch(/^[^@]+@.+?\..+$/);
export const optionalPositiveInt = optional(integer.positive);
/** 断言目标是一个整数，且可以转换字符串 */
export const queryInt = integer({ acceptString: true });

/** 断言目标是一个可选的整数，且可以转换字符串 */
export const optionalInt = optional(queryInt);
export const date: TypeCheckFn<Date> = function (input: unknown) {
  switch (typeof input) {
    case "string":
      return new Date(input);
    case "number":
      return new Date(input);

    default:
      throw new CheckTypeError("string|number", typeof input);
  }
};
