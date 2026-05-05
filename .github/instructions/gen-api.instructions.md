# 生成 API 语句的 Copilot Instructions

本文件用于指导 GitHub Copilot 如何生成 后端 API 。

## 后端使用的库

- Hono: 后端框架，类似于 Express，但更轻量，支持 Deno 和 Node。
- @asla/yoursql(https://github.com/asnowc/yoursql): SQL 生成工具库，提供链式调用来构建 SQL 语句，支持参数化查询。
- @asla/wokao(https://github.com/asnowc/wokao): 参数校验库
- @ijia/data：项目内部的数据库相关封装，提供连接池、常量、类型定义等。

## 添加 API 语句的约定

1. 首先在 `web_dto/` 中定义接口，并定义它们的输入输出类型（如果需要），并确保它们被正确导出。
2. 在 `web_api/src/routers/` 下找到对应的路由文件，按照现有的路由组织结构添加新的接口实现。
3. 在接口实现中，优先使用 `@asla/yoursql` 来构建 SQL 语句，避免直接拼接字符串或使用模板字符串来构造 SQL。
4. 补充或更新对应的 Vitest 测试用例，确保新接口的正确性和稳定性。

### 添加路由文件的示例

假设需要添加一个API 端点 `GET /user/profile`：

文件路径必须是 `web_api/src/routers/user/profile.get.ts` 或 `web_api/src/routers/user/profile/.get.ts`。

且 `web_api/src/routers/user` 目录下要有一个 mod.ts 文件，导出 user 目录下要公开的函数、路由、常量。
user 目录一般会有下面的结构：

```
/user/
  - mod.ts
  - _route.ts
  - profile.get.ts
  - ...
```

mod.ts 文件示例：

```ts
export { default } from "./_route.ts";
export * from "./profile.get.ts";
```

\_route.ts 文件示例：

```ts
import { HonoContext } from "@/global/context.ts";
import { RouteGroup } from "@/lib/route.ts";

const routeGroup = new RouteGroup<HonoContext>();
export default routeGroup;
```

profile.get.ts 文件示例：

```ts
import { checkValue, optionalInt } from "@/global/check.ts";
import { getUserInfo } from "./-sql/user.service.ts";
import routeGroup from "./_route.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/user",
  async validateInput(ctx) {
    const { req } = ctx;
    const userId = checkValue(req.query("userId"), optionalInt);
    if (userId !== undefined) {
      return userId;
    }
    const srcUserId = await ctx.get("userInfo").getUserId();
    return srcUserId;
  },
  async handler(userId: number) {
    return getUserInfo(userId);
  },
});
```

-sql 以 "-" 或"\_" 开头是为了遵循 tanstack router 的约定, 以后可能直接文件文件名自动生成路由，表示这个文件或目录不是路由文件
