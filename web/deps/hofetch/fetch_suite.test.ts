import { FetchSuite } from "./fetch_suite.ts";
declare const api: FetchSuite<ApiSuite>;
function type() {
  api["base/r1"].delete(undefined);
  api["base/r1"].request();
  api["base/r1"].delete({});

  api["base/r1"].get({ params: { acc: 1 } });
  //@ts-expect-error 参数不正确，需要 acc
  api["base/r1"].get({});
  //@ts-expect-error 参数不正确，需要 传入参数
  api["base/r1"].get();

  //@ts-expect-error 没有定义 unknown 方法
  api["base/r1"].unknown;

  //@ts-expect-error 没有定义 cc
  api["cc"];
}
export type ApiSuite = {
  /** 属性 */
  "base/r1": {
    get: {
      /** 响应值 */
      response: undefined;
      params: {
        /** 77 */
        acc: number;
      };
    };
    delete: {
      response: "ccc";
    };
    unknown: {};
    post: {
      yy: "";
    };
  };
  "base/r2": {};
};
