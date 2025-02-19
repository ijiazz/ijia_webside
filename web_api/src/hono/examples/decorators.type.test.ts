import { ControllerDecorator, EndpointDecorator } from "../decorators.ts";

declare const endpointDecorator: EndpointDecorator;

//@ts-expect-error EndpointDecorator 只能装饰函数
@endpointDecorator
class EndpointDecoratorTest {
  @endpointDecorator
  method(ctx: number): string {
    return "abc";
  }
  @endpointDecorator
  async asyncMethod(ctx: number): Promise<string> {
    return "abc";
  }

  @endpointDecorator
  method2 = () => {};

  //@ts-expect-error EndpointDecorator 只能装饰函数
  @endpointDecorator
  attr1 = 9;

  //@ts-expect-error EndpointDecorator 不能装饰访问器
  @endpointDecorator
  get getter(): any {
    return;
  }
  //@ts-expect-error EndpointDecorator 不能装饰访问器
  @endpointDecorator
  set setter(value: any) {}

  //@ts-expect-error EndpointDecorator 不能装饰访问器
  @endpointDecorator
  accessor abc: any;
}

declare const controllerDecorator: ControllerDecorator;

@controllerDecorator
class ControllerDecoratorTest {
  //@ts-expect-error ControllerDecorator 只能装饰类
  @controllerDecorator
  attr1: any;

  //@ts-expect-error ControllerDecorator 只能装饰类
  @controllerDecorator
  get getter(): any {
    return;
  }
  //@ts-expect-error ControllerDecorator 只能装饰类
  @controllerDecorator
  set setter(value: any) {}

  //@ts-expect-error ControllerDecorator 只能装饰类
  @controllerDecorator
  accessor abc: any;
}
