## 说明

`@asla/hofetch` 封装了基于 fetch 的请求库 https://jsr.io/@asla/hofetch。

在 React 组件中调用后端接口的示例

```ts

import { useHoFetch } from "@/hooks/http.ts";
import { useAsync } from "@/hooks/async.ts";
export function Component() {
  const { api } = useHoFetch(); // 基于 @asla/hofetch 封装的 hooks，
  const { result, run } = useAsync(async () => {
    //      const result = await http.fetch("https://abc.com/xx/xx"); // 这可以调用任意接口，但是没有类型提示
    const data = await api["/user/profile"].get(); // 这只能调用本站的接口，能够获得所有接口的类型提示
    return data;
  }, {});
  useEffect(() => {
    run();
  }, [run]);
  return <div></div>
}
```

## 开发

在 `/web` 目录下运行 `pnpm vite` 可以启动开发服务器。

## 构建

在 /web 目录下，运行 `pnpm build` 进行构建，静态资源文件输出在 `/web/dist` 目录下
