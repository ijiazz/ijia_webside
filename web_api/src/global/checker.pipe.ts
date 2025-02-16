import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { checkType, ExpectType, InferExpect, TypeCheckOptions } from "evlib";

export function validator<T extends ExpectType>(
  expect: T,
  options?: TypeCheckOptions,
): PipeTransform<unknown, InferExpect<T>> {
  return new ExpectTypePipe(expect, options);
}

export class ExpectTypePipe<T extends ExpectType> implements PipeTransform<unknown, InferExpect<T>> {
  constructor(
    private readonly expect: T,
    private readonly options?: TypeCheckOptions,
  ) {}
  transform(input: unknown, metadata: ArgumentMetadata): InferExpect<T> {
    const { value, error } = checkType(input, this.expect, this.options);
    if (error) throw new BadRequestException(error);
    return value;
  }
}
