# IJIA 学院贡献指南

很高兴你有兴趣为 IJIA学院作出贡献，在提交你的贡献之前，请阅读以下指南。\
下面的一些规范只是建议的，可以不用严格执行。

## 本项目的技术栈

语言： TypeScript\
数据库： PostgreSQL\
后端：Node 或 [Deno](http://deno.com/)(Node 需要 22或以上， Deno需要2以上) + [Hono](https://hono.dev/)\
前端：React + [Ant Design](https://ant.design/index-cn)\
单元测试: [Vitest](http://vitest.dev/)\
E2E测试: [Playwright](https://playwright.dev/)

当然你不需要掌握所有技术。

## 开始

首先你需要安装 Node 和 [pnpm](https://www.pnpm.cn/)。

第一次初始项目时，需要执行一些操作：

1. 初始化子模块
   项目依赖 [@ijia/data](https://github.com/ijiazz/school_db) ，这个包是数据库、和对象存储、缓存相关的封装，通过 git submodules 链接到项目中（在项目的 /deps/ijia-data 位置）。\
   克隆项目时通过 `git clone --recursive git@github.com:ijiazz/ijia_website.git` 进行克隆，或者在克隆仓库到本地后执行 `git submodule update --init --recursive` 初始化子模块。

2. 安装依赖：运行`pnpm install`安装项目所需的依赖到 node_modules 目录下。如果你安装失败或安装太慢，可以更改 npm 镜像源(修改项目根目录下的 .npmrc 文件，在末尾添加
   `registry=https://registry.npmjs.org/` 即可)
3. 构建 `@ijia/data`，运行命令 `pnpm run init-deps`, 每次`@ijia/data` 更新后都需要执行一次。

## 开发与调试

### 前端

见 [/web/README.md](./web/README.md)

### 后端

见 [/web_api/README.md](./web_api/README.md)

### E2E 测试

见 [/e2e/README.md](./e2e/README.md)

## 启动服务

项目前后端分离，涉及 PostgreSQL服务、redis 服务、后端服务，前端服务

如果你使用 docker，直接运行 `docker compose up` 启动服务（仅用于测试， 如果需要用于生产请修改 `docker-compose.yml` 的配置）。

如果你不使用 docker， 需要自行启动 PostgreSQL、Redis服务。

静态资源文件构建后输出在 `/web/dist` 目录下，需要自行部署
后端服务的启动见 [/web_api/README.md](./web_api/README.md)

## Pull Request 指南

从main分支 fork 到你自己的仓库下，在做完修改后发起合并请求。

如果你想添加新功能，提供一个令人信服的理由来添加此功能。理想情况下，您应该首先打开一个 issue。\
如果你添加了新的接口，理想情况下需要添加对应的 API 测试。
如果你修复bug，需要在 PR 中提供详细的错误的描述和复现步骤

当你发起 PR 时，请描述你做了什么修改
你的 PR 可以有多个小的提交。 在合并时会自动将它们压缩成一个提交。

## 关于依赖

如果需要安装依赖，优先考虑 Deno [标准库](https://jsr.io/@std), 是否满足需求，通过 `pnpm dlx jsr add @std/xxx` 安装。
