import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { checkType, ExpectType, InferExpect } from "evlib";

export function validator<T extends ExpectType>(expect: T): PipeTransform<unknown, InferExpect<T>> {
  return new ExpectTypePipe(expect);
}

export class ExpectTypePipe<T extends ExpectType> implements PipeTransform<unknown, InferExpect<T>> {
  constructor(readonly expect: T) {}
  transform(input: unknown, metadata: ArgumentMetadata): InferExpect<T> {
    const { value, error } = checkType(input, this.expect);
    if (error) throw new BadRequestException(error);
    return value;
  }
}
