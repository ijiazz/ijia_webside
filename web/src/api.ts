export * from "../../web_api/src/dto.ts";

// animajs 引入了 nodejs， 现在只能忽略检测
// //@ts-expect-error 原则上，不能引入 NodeJs 相关的类型，如果这里报错了，说明被引入了
// type t = NodeJS.Timeout;

export type HttpError = {
  message: string;
  code?: string;
  cause?: any;
};
