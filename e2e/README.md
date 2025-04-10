## 在本地运行 E2E

E2E 直接依赖 PostgreSQL 服务和 Web 服。在 playwright.config.ts 中配置它们的地址。

完整的运行测试，你看已直接在项目根目录下运行 docker compose up 启动 E2E 所需的服务。然后在 /e2e 目录下，运行 `pnpm e2e:local` 启动E2E测试窗口。或者你可以安装 playwright 相关的插件

如果你要在 e2e 测试是调试后端服务。你可以配置访问地址以使用 vite 开发服务和 debug api。

需要注意，在测试过程中会清除数据库。
