## 说明

`@asla/hono-decorator` 是封装的基于 Hono的 ECMA 装饰器库。类似 nestjs。仓库地址 https://github.com/asnowc/hono-decorator

定义接口时，需要更新 `/web_api/src/modules/api.ts` 文件， 已便前端能够获得接口的类型提示与生成 API 文档\
在 `/web_api` 目录下运行`pnpm genApiDoc` 可以生成 api 文档，输出在 `/web_api/docs/api` 目录下

如果需要新增接口 Controller，需要 `/web_api/src/modules/serve.ts` 文件下注册到 hono

## 环境准备

首先启动 Postgresql 和 redis 服务
检查 .env 相关环境变量，确保数据库连接信息正确

## 启动

web api 服务只需要运行 `/web_api/src/main.ts` 文件即可启动服务，在 `/web_api/.env` 文件里配置环境变量。`/web_api/config.jsonc`是后端的一些配置

如果你使用 Deno 作为后端运行时，可以直接在 `/web_api` 目录下运行`deno task start`或 `deno run -A --env src/main.ts` 启动后端服务\
如果你使用 Node 作为后端运行时，则需要编译后，在 `/web_api` 运行`pnpm run start`或 `node --env-file=.env dist/main.js`启动后端服务

## 调试

debug 已经配置了使用 Deno 进行 debug 的 vscode 模板，点击 vscode 调试面板运行 `run web api` 即可启动调试

## 编译

在 `/web_api` 目录下运行 `pnpm build` ，这将编译 ts文件输出到 `/web_api/dist` 目录

## 测试

测试框架使用 [vitest](https://cn.vitest.dev/)

运行 `pnpm test` 将启动测试

测试需要连接数据库，在运行测试前需要先启动 PostgreSql 服务和 Redis 服务， 然后配置环境变量 PG_URL 和 REDIS_URL，或者，直接修改
`vitest.config.ts` 来配置环境变量。 用于测试的角色需要拥有创建数据库的权限 测试运行时会创建数据库，在测试结束后删除
