#### 环境准备

首先运行 Postgresql 服务
检查 .env 相关环境变量，确保数据库连接信息正确

#### 开发

如果是 Deno, 直接运行 `deno task start` 启动 api 服务
如果是 Node, 先运行 `pnpm run build` 编译，然后运行 `pnpm run start` 启动 api 服务

#### 调试

debug 已经配置了使用 Deno 进行 debug 的vscode 模板，点击 vscode 调试面板运行 `run web api` 即可启动调试

#### 测试

TODO
