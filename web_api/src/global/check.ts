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
