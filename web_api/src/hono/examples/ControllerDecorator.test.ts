import { bodyLimit } from "hono/body-limit";
import { ControllerDecorator, Controller, Get, Use } from "../decorators.ts";

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

declare const customControllerDecorator: ControllerDecorator<new () => Test1>;

@customControllerDecorator
class Test1 {
  constructor() {}
  method() {}
}

//@ts-expect-error
@customControllerDecorator
class Test2 {
  constructor() {}
}

/**
 * Add `/animal/eat`, `/animal/speak`
 */
@Use(bodyLimit({ maxSize: 1024 }))
@Controller({ basePath: "/animal" })
class Animal {
  constructor() {}
  @Get("/eat")
  eat() {
    return "Animal eat";
  }
  @Get("/speak")
  speak() {
    return "Animal speak";
  }
}

/**
 * 不会应用 Animal 的路由和中间件
 * Add `/fly`
 */
class Bird extends Animal {
  @Get("/fly")
  fly() {
    return "Bird fly";
  }
}
/**
 * 继承中间件和路由
 * Add `/animal/sleep`, `/animal/eat`, `/animal/speak`
 */
@Controller({ extends: true })
class Dog extends Animal {
  @Get("/sleep")
  sleep() {
    return "Dog sleep";
  }
}

/**
 * 继承中间件和路由，并修改一些设定
 * Add `/run`, `/eat`, `/speak`
 * Get `/eat` will response `Cat eat`
 * Get `/speak` will response `Cat speak`
 */
@Controller({ extends: true, basePath: "" })
class Cat extends Animal {
  @Get("/run")
  run() {
    return "Cat run";
  }
  override eat() {
    return "Cat eat";
  }
  @Get("/speak")
  catSpeak() {
    return "Cat speak";
  }
}
