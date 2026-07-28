## 说明

定义接口时，需要同步更新接口 DTO，以便前端能够获得接口类型提示与生成 API 文档。共享类型位于 `/web_dto`，后端接口类型由
`/web_api/src/dto.ts` 导出。\
在 `/web_dto` 目录下运行 `deno task genApiDoc` 可以生成 API 文档。

如果需要新增模块，需要 `/web_api/src/bootstrap/hono_app.ts` 文件下注册到 hono

## 环境准备

首先启动 Postgresql 和 redis 服务 检查 .env 相关环境变量，确保数据库连接信息正确

## 启动

web api 服务只需要运行 `/web_api/src/main.ts` 文件即可启动服务，在 `/web_api/.env`
文件里配置环境变量。`/web_api/config.jsonc`是后端的一些配置

在 `/web_api` 目录下运行 `deno task start` 启动后端服务。

## 调试

debug 已经配置了使用 Deno 进行 debug 的 vscode 模板，点击 vscode 调试面板运行 `run web api` 即可启动调试

## 开发

### 数据库和 Redis操作

因为需要 [using](https://github.com/tc39/proposal-using-enforcement) 语法，所以重新实现了连接池和客户端实例

[如何查询 SQL 语句](../docs/查询SQL语句.md)\
[如何操作 Redis](../docs/查询SQL语句.md)

## 类型检查

在 `/web_api` 目录下运行：

```sh
deno task check-type
```

## 测试

测试框架使用 [vitest](https://cn.vitest.dev/)

运行：

```sh
deno task test
```

将启动测试。

测试需要连接数据库，在运行测试前需要先启动 PostgreSql 服务和 Redis 服务， 然后配置环境变量 PG_URL 和
REDIS_URL，或者，直接修改 `vitest.config.ts` 来配置环境变量。 用于测试的角色需要拥有创建数据库的权限
测试运行时会创建数据库，在测试结束后删除
