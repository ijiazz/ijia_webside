import { checkType, ExpectType, InferExpect, TypeCheckOptions } from "evlib/validator";
import { HttpParamsCheckError } from "./errors.ts";

export function checkValue<T extends ExpectType>(
  input: unknown,
  expectType: T,
  option?: TypeCheckOptions,
): InferExpect<T> {
  const { value, error } = checkType(input, expectType, { ...option, policy: "delete" });
  if (error) throw new HttpParamsCheckError(error);
  return value;
}
export function checkValueAsync<T extends ExpectType>(
  input: Promise<unknown>,
  expectType: T,
  option?: TypeCheckOptions,
): Promise<InferExpect<T>> {
  return input.then((data) => checkValue(data, expectType, option));
}
