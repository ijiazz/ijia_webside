import { checkType, ExpectType, InferExpect, TypeCheckOptions } from "evlib";

export function checkValue<T extends ExpectType>(
  input: unknown,
  expectType: T,
  option?: TypeCheckOptions,
): InferExpect<T> {
  const { value, error } = checkType(input, expectType, option);
  if (error) throw error;
  return value;
}
