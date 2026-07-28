# IJIA 学院贡献指南

很高兴你有兴趣为 IJIA学院作出贡献，在提交你的贡献之前，请阅读以下指南。\
下面的一些规范只是建议的，可以不用严格执行。

## 本项目的技术栈

语言： TypeScript\
数据库： PostgreSQL\
运行时：[Deno](https://deno.com/) 2+\
后端：[Hono](https://hono.dev/)\
前端：React + [Ant Design](https://ant.design/index-cn)\
单元测试: [Vitest](http://vitest.dev/)\
E2E测试: [Playwright](https://playwright.dev/)

当然你不需要掌握所有技术。

## 开始

首先你需要安装 [Deno](https://deno.com/) 2.9 或以上版本。

然后在项目根目录运行：

```sh
deno task setup
```

这会为根目录、`web_dto`、`web_api`、`web`、`e2e` 安装 Deno 依赖。

提交前建议运行：

```sh
deno task check-fmt
deno task check-type
```

## 开发与调试

### 前端

见 [/web/README.md](./web/README.md)

### 后端

见 [/web_api/README.md](./web_api/README.md)

### E2E 测试

见 [/e2e/README.md](./e2e/README.md)

## 启动服务

项目前后端分离，涉及 PostgreSQL服务、redis 服务、后端服务，前端服务

如果你使用 docker，直接运行 `docker compose up` 启动服务（仅用于测试，
如果需要用于生产请修改 `docker-compose.yml` 的配置）。

如果你不使用 docker， 需要自行启动 PostgreSQL、Redis服务。

静态资源文件构建后输出在 `/web/dist` 目录下，需要自行部署 后端服务的启动见
[/web_api/README.md](./web_api/README.md)

## Pull Request 指南

从main分支 fork 到你自己的仓库下，在做完修改后发起合并请求。

如果你想添加新功能，提供一个令人信服的理由来添加此功能。理想情况下，您应该首先打开一个
issue。\
如果你添加了新的接口，理想情况下需要添加对应的 API 测试。 如果你修复bug，需要在
PR 中提供详细的错误的描述和复现步骤

当你发起 PR 时，请描述你做了什么修改 你的 PR 可以有多个小的提交。
在合并时会自动将它们压缩成一个提交。

## 关于依赖

如果需要新增依赖，优先考虑 Deno [标准库](https://jsr.io/@std) 和 JSR
包。确认依赖后，在对应子项目的 `deno.json` 或 `deno.jsonc` 中维护
`imports`，然后运行 `deno install` 更新依赖。
