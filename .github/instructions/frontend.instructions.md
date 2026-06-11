---
description: "用于生成 crawler 项目前端代码。Use when: 编写 React 组件、页面路由、请求封装、前端表单、TanStack Router 页面、Ant Design 界面、web/src 或 web_dto 下的 TypeScript 代码。"
applyTo: "web/src/**/*.{ts,tsx,css},web_dto/src/**/*.ts"
---

# 生成前端代码的 Copilot Instructions

本文件用于指导 GitHub Copilot 在本仓库中生成前端相关代码。

## 前端技术栈

- UI 框架使用 React 19。
- 组件库使用 Ant Design v6 。
- 路由使用 `@tanstack/react-router`。
- 请求层使用 `@asla/hofetch`，统一从 `web/src/request/client.ts` 导出的 `api` 发起请求。
- UI 组件优先使用 `antd`，不要重复造基础控件，不要使用已废弃的 API。
- 前后端共享类型优先从  `web_dto/` 获取，不要在前端重新声明一套重复类型。

## 通用约定

1. 优先沿用现有目录结构，在 `web/src/routes/`、`web/src/components/`、`web/src/request/`、`web/src/provider/`
   下添加代码，不要随意创建平行体系。
2. 所有本地导入都使用 `@/` 别名，并保留 `.ts` 或 `.tsx` 后缀，例如 `@/request/client.ts`。
3. 新增页面、组件、表单时，先参考同目录已有实现，保持命名、导出方式和文件组织一致。
4. 能复用现有 DTO、枚举、请求方法时必须复用，避免重复定义类型、接口路径、平台枚举或错误结构。
5. 生成代码时默认使用 TypeScript 严格类型，不要滥用 `any`，仅在现有封装确实无法表达时再局部放宽。
6. 除非现有文件已经这样做，否则不要引入 Node.js 专属 API 或类型。
7. 尽量写小而明确的函数和组件，避免把请求、表单、展示、状态机全部堆进一个超大组件。

## 请求层约定

1. 页面或组件内不要内联重复的 `queryKey`、`queryFn` 和轮询配置；列表、详情、状态这类 React Query 查询配置优先封装到
   `web/src/request/*.ts` 中。
2. 请求封装优先导出 `getXxxQueryOption()` 这类工厂函数，页面组件只负责调用 `useQuery`、`useMutation` 和消费结果。
3. 需要手动刷新缓存时，优先复用请求封装返回的 `queryKey`，不要在组件里再次手写一份等价 key。

## React 组件约定

1. 函数组件优先使用命名导出，和现有代码保持一致。
2. 组件 Props 需要显式定义类型，并使用 `type XxxProps = { ... }`。

## 路由与页面约定

1. 新增页面时优先放在 `web/src/routes/` 下，并遵循当前 TanStack Router 的文件路由结构。
2. 页面级逻辑放在路由文件或该路由的 `-components/` 目录中；可复用的通用组件再放入 `web/src/components/`。

## 类型与共享模型约定

1. 前后端共享的枚举、任务类型、平台类型优先复用 `web_dto/` 导出的定义。
2. 不要在前端复制一份后端实体结构；缺少类型时优先补充共享定义。
3. 如果接口返回结构已经在共享层定义，前端只做窄化和组合，不重写同义类型。

## 修改现有代码时的要求

1. 以最小改动完成目标，不要顺手重构无关模块。
2. 保留现有命名风格、缩进、导入顺序和组件组织方式。
3. 如果当前文件使用了某种模式，例如 `useMutation + antd Form`，优先在该模式上扩展，而不是切换到另一套写法。
4. 若需要新增公共能力，先确认是否已经在 `components/`、`request/`、`utils/`、`provider/` 中存在相似实现。

生成前端代码时，优先保证与当前仓库现有实现风格一致，其次再考虑抽象和扩展性。
