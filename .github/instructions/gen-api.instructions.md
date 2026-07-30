# 生成 API 语句的 Copilot Instructions

本文件用于指导 GitHub Copilot 如何生成 后端 API 。

## 后端使用的库

- Hono: 后端框架，类似于 Express，但更轻量，支持 Deno 和 Node。
- @asla/yoursql(https://github.com/asnowc/yoursql): SQL 生成工具库，提供链式调用来构建 SQL 语句，支持参数化查询。
- @asla/wokao(https://github.com/asnowc/wokao): 参数校验库，项目在 `web_api/src/common/check.ts` 中封装了统一校验函数并扩展了部分校验类型
- @ijia/school-db：项目内部的数据库相关封装，提供连接池、常量、类型定义等。

## 添加 API 语句的约定

1. 首先在 `web_dto/` 中定义接口，并定义它们的输入输出类型（如果需要），并确保它们被正确导出。
2. 在 `web_api/src/routers/` 下找到对应的路由文件，按照现有的路由组织结构添加新的接口实现。
3. SQL 语句相关
   - 在接口实现中，优先使用 `@asla/yoursql` 来构建 SQL 语句，避免直接拼接字符串或使用模板字符串来构造 SQL。
   - 将 SQL 相关的逻辑封装在 `_sql` 目录下的服务层函数中，保持路由文件的简洁和关注点分离，文件命名以 `.sql.ts` 结尾。
   - 不同接口之间如果无可复用的 SQL 逻辑，避免将它们放在同一个文件中，保持单一职责原则。

4. 补充或更新对应的 Vitest 测试用例，确保新接口的正确性和稳定性。

### 添加路由文件的示例

假设需要添加一个API 端点 `GET /user/profile`：

文件路径必须是 `web_api/src/routers/user/profile.get.ts` 或 `web_api/src/routers/user/profile/.get.ts`。

且 `web_api/src/routers/user` 目录下要有一个 mod.ts 文件，导出 user 目录下要公开的函数、路由、常量。
user 目录一般会有下面的结构：

```
/user/
  - mod.ts
  - profile.get.ts
  - ...
```

mod.ts 文件示例：

```ts
import { HonoContext, createRoute } from "@/common/context.ts";
import { RouteGroup } from "@/lib/route.ts";
import profileRoute from "./profile.get.ts";

const routeGroup = new RouteGroup<HonoContext>();

routeGroup.add(profileRoute);

export default routeGroup;
```

profile.get.ts 文件示例：

```ts
import { checkValue, optionalInt } from "@/common/check.ts";
import { createRoute } from "@/common/context.ts";
import { getUserInfo } from "./-sql/user.service.ts";

export default createRoute({
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

`routeGroup.create(...)` 写法已废弃。新增路由文件应默认导出 `createRoute(...)` 创建的路由对象，再由对应目录入口文件通过 `routeGroup.add(route)` 注册。

-sql 以 "-" 或"\_" 开头是为了遵循 tanstack router 的约定, 以后可能直接文件文件名自动生成路由，表示这个文件或目录不是路由文件

### 参数校验约定

1. 参数校验函数统一定义在 `web_api/src/common/check.ts`，路由中优先从该文件导入 `checkValue`、`checkValueAsync` 以及项目扩展的校验类型。
2. `web_api/src/common/check.ts` 基于 `@asla/wokao` 做了项目封装：校验失败会转换为接口参数错误，并提供 `optionalPositiveInt`、`queryInt`、`optionalInt`、`date` 等常用扩展类型。
3. `@asla/wokao` 的基础 schema 能力（如 `array`、`enumType`、`integer`、`optional`、`ExpectType`）可以按需直接导入；如果项目已有同类封装，优先使用 `web_api/src/common/check.ts` 中的导出。
4. `validateInput` 中使用 `checkValue` 校验同步值（如 path/query 参数），使用 `checkValueAsync` 校验 `req.json()` 等异步输入。
5. 参数校验 schema 如果只在单个路由中使用，直接放在对应路由文件中；只有确实会被多个路由复用时，才抽到单独的 schema 文件或工具文件。
