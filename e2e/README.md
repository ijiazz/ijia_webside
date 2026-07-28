## 在本地运行 E2E

E2E 直接依赖 PostgreSQL 服务和 Web 服。在 playwright.config.ts 中配置它们的地址。

完整地运行测试时，可以直接在项目根目录下运行 `docker compose up` 启动 E2E 所需的服务。然后在 `/e2e` 目录下运行：

```sh
deno task e2e:local
```

这会启动 E2E 测试窗口。或者你可以安装 Playwright 相关的插件。

首次运行前如需安装浏览器，可以在 `/e2e` 目录下运行：

```sh
deno x playwright install chromium webkit firefox
```

如果你要在 e2e 测试是调试后端服务。你可以配置访问地址以使用 vite 开发服务和 debug api。

需要注意，在测试过程中会清除数据库。

类型检查：

```sh
deno task check-type
```

### 在前端插入定位器

**使用自定义属性**

```tsx
function Component() {
  return <div e2e-loader="xxx" />;
}
```

```ts
await page.locator(`[e2e-loader="xxx"]`).click();
```

**使用无障碍**

```tsx
function Component() {
  return <button aria-label="xxx"></button>;
}
```

```ts
await page.getByRole("button", { name: "xxx" }).click();
```
