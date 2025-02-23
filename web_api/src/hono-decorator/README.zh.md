## 描述

允许使用 ECMA Decorators 定义路由

ECMA 装饰器，目前处以 Stage 3。在未来，它将成为 JavaScript 语法标准。而现在，我们可以通过 TypeScript 使用该语法
我们可以利用装饰器和装饰器元数据，实现类似 Nest 的装饰器功能。由于 Stage 3 的装饰器不包括参数装饰器，这里只考虑使用装饰器进行路由定义，不考虑依赖注入。

**一个简单的示例**

```ts
import { Context, Hono } from "hono";
import { Controller, Post, Get, Use, applyController, ToResponse } from "hono/decorators";
import { compress } from "hono/compress";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";

@Use(cors({ origin: "*" }))
@Controller({ basePath: "/api" })
class TestController {
  @Use(compress())
  @Use(bodyLimit({ maxSize: 1024 }))
  @Post("/test1")
  method1(ctx: Context) {
    return ctx.json({ ok: 1 });
  }

  @Get("/test2")
  method2 = () => {};

  @ToResponse((data, ctx) => {
    data.body; // string
    data.title; // string

    //@ts-expect-error Field "content" does not exist
    data.content;

    return ctx.html(
      `<html>
        <head>
          <title>${data.title}</title>
        </head>
        <body>
        ${data.body}
        </body>
      </html>`,
    );
  })
  @Get("/test3")
  method3(ctx: Context) {
    return {
      title: "123",
      body: "abc",
    };
  }
}
const hono = new Hono();
applyController(hono, new TestController());
applyController(hono, userController); //
// Apply more...

await hono.request("/api/test3");
```

## API 设计

在应用装饰器后，实际上只是给这个类添加元数据，在调用 `applyController()` 时，通过读取这个类的元数据，然后根据元数据设置路由、中间件。

### 端点装饰器

```ts
export type EndpointDecoratorTarget = (...args: any[]) => any;
/**
 * @typeParam T Constrains the type of decoration target
 */
export type EndpointDecorator<T extends EndpointDecoratorTarget = EndpointDecoratorTarget> = (
  input: T | undefined,
  context: ClassMethodDecoratorContext<unknown, T> | ClassFieldDecoratorContext<unknown, T>,
) => void;

export declare function Endpoint(path: string, method?: string): EndpointDecorator;

export function Post(path: string): EndpointDecorator {
  return Endpoint(path, "POST");
}
export function Get(path: string): EndpointDecorator {
  return Endpoint(path, "GET");
}

// The same is true of other common methods such as Patch and Put
```

端点装饰器是所有装饰器的基础，在应用其他装饰器前，必须应用端点装饰器，且一个方法或属性只能应用一个端点装饰器

```ts
class Test {
  @Get("/test1")
  @Use() // Throw: Before applying the middleware decorator, you must apply the endpoint decorator
  method1() {}

  @Get("/test2") // Throw: The route cannot be configured twice
  @Get("/test1")
  method2() {}
}
```

### 控制器装饰器

```ts
export type ControllerDecoratorTarget = new (...args: any[]) => any;

/**
 * @typeParam T Constrains the type of decoration target
 */
export type ControllerDecorator<T extends ControllerDecoratorTarget = ControllerDecoratorTarget> = (
  input: T,
  context: ClassDecoratorContext<T>,
) => void;

export type ControllerOption = {
  /** Inherit the decorator from the parent class */
  extends?: boolean;
  basePath?: string;
};

export declare function Controller(option: ControllerOption): ControllerDecorator;
```

控制器装饰器可以定义一组路由的一些行为，例如应用中间件等

### 中间件装饰器

```ts
export type MiddlewareDecoratorTarget = ControllerDecoratorTarget | EndpointDecoratorTarget;
export type MiddlewareDecorator<T extends MiddlewareDecoratorTarget = MiddlewareDecoratorTarget> = (
  input: unknown,
  context: ClassDecoratorContext | ClassMethodDecoratorContext | ClassFieldDecoratorContext,
) => void;
```

中间件装饰器可以装饰器在类、方法或属性，请求经过中间件的顺序由外到内（与装饰器调用的顺序相反，这样可以更直观感受请求到路由处理程序的过程）

```ts
@Use(A)
@Use(B)
@Use(C)
class Controller {
  @Use(D)
  @Use(E)
  @Use(F)
  @Get("/test")
  method() {}
}
```

请求经过的顺序： A>B>C>D>E>F > method() >F>E>D>C>B>A

### 转换装饰器

```ts
export declare function ToResponse<T>(
  handler: Transformer<T>,
): EndpointDecorator<(...args: any[]) => T | Promise<Awaited<T>>>;
export declare function ToArguments<T extends any[]>(handler: PipeInHandler<T>): EndpointDecorator<(...data: T) => any>;
```

转换装饰器可以将 Hono 的 Context 对象转换为控制器方法所需的参数，也可以将控制器方法返回的对象转换为 Response 对象

```ts
class Controller {
  @Get("/test1")
  method1(ctx: Context) {} //If the ToArguments decorator is not applied, the first argument is passed to Context

  @ToArguments(function (ctx: Context) {
    //The returned type is the same as the parameter for method2
    // If types are inconsistent, typescript prompts an exception
    return [1, "abc"];
  })

  //The type of data is the same as that returned by method2
  // If types are inconsistent, typescript prompts an exception
  @ToResponse((data, ctx: Context) => {
    data.body; // string
    data.title; // string

    //@ts-expect-error content not exist
    data.content;

    return ctx.text("ok");
  })
  @Get("/test2")
  method2(size: number, id: string) {
    return {
      title: "123",
      body: "abc",
    };
  }
}
```

### 自定义装饰器

我们可以基于上面提到的装饰器，自定义具体职责的装饰器，例如，设置变量、参数校验、权限校验等。
一个权限校验的示例

```ts
function Roles(...roles: string[]): EndpointDecorator<(...data: T) => any> {
  return Use(async function (ctx: Context, next) {
    // Judgment role ...
  });
}

class Controller {
  @Roles("admin", "root")
  @Get("/")
  method() {}
}
```

### 继承

如果子类控制器类声明了
`@Controller({ extends: true })`, 那么子类会继承父类的路由与中间件等配置，否则会忽略父类的一切装饰器

```ts
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
 * Animal routing and middleware will not be applied
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
```

如果调用 `applyController(hono, new Bird())`, 将只添加`/fly` ，且 Animal 上定义的 中间件也不会生效
如果调用 `applyController(hono, new Dog())`, 将只添加 `/animal/sleep`, `/animal/eat`, `/animal/speak`, 其这些请求都会经过 Animal 上应用的 bodyLimit 装饰器

我们也可以在子类修改父类的一下设定

```ts
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
```

这个例子，重写了 basePath、eat() 方法和 /speak 路由

如果调用 `applyController(hono, new Cat())`, 将只添加 `/run`, `/eat`, `/speak`
GET /eat 返回 `Cat eat`
GET /speak 返回 `Cat speak`
