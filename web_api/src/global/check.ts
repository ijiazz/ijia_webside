import {
  checkTypeCopy,
  getCheckTypeErrorReason,
  ExpectType,
  InferExpect,
  TypeCheckOption,
  optional,
  integer,
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

export const positiveInt = integer({ acceptString: true, min: 0 });
export const optionalPositiveInt = optional(positiveInt);
