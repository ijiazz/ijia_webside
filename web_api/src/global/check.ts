import { checkType, ExpectType, InferExpect, TypeCheckOptions } from "evlib";
import { HTTPException } from "hono/http-exception";

export function checkValue<T extends ExpectType>(
  input: unknown,
  expectType: T,
  option?: TypeCheckOptions,
): InferExpect<T> {
  const { value, error } = checkType(input, expectType, option);
  if (error) throw new HTTPException(400, { cause: error, res: Response.json(error) });
  return value;
}
