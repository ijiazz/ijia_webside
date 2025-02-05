export * from "../../web_api/api.ts";

//@ts-expect-error 原则上，不能引入 NodeJs 相关的类型，如果这里报错了，说明被引入了
type t = NodeJS.Timeout;
