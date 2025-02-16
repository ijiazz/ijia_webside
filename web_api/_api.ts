export * from "./src/api.ts";

//@ts-expect-error api 模块不允许引入 DOM 类型 和 NodeJS 类型, 如果这里发生了异常，说明引入了它们
type c = typeof setTimeout;
