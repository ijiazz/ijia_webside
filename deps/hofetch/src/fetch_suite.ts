type HttpMethod = "post" | "get" | "delete" | "put" | "patch";

export type FetchPath = {
  [key in HttpMethod]: FetchEndpoint;
} & FetchItemCommon;
/** 推断 api 套件 */
export type InferFetchSuite<T extends object> = UnionToIntersection<ObjectValueOf<MapApiKey<T>>>;

type MapApiKey<T extends object> = {
  [key in keyof T as key extends `${string} ${string}` ? key : never]: key extends `${infer Method} ${infer Path}`
    ? {
        [P in Path]: InferFetchPath<T[key], Lowercase<Method>>;
      }
    : never;
};
type ObjectValueOf<T extends object> = T[keyof T];

type ToUnionOfFunction<T> = T extends any ? (x: T) => any : never;
type UnionToIntersection<T> = ToUnionOfFunction<T> extends (x: infer P) => any ? P : never;

/** 推断api组 */
export type InferFetchPath<T, Method extends string> = {
  [key in Method]: T extends {
    response?: any;
    params?: object;
    body?: any;
  }
    ? FetchEndpoint<T["response"], T["params"], T["body"]>
    : never;
} & FetchItemCommon;

export interface FetchItemCommon {
  request<Res = unknown>(option?: HoFetchOption<any, any>): Promise<Res>;
}

export type URLParamsInit = ConstructorParameters<typeof URLSearchParams>[0];

export type FetchEndpoint<Res = unknown, Param = any, Body = any> =
  {} extends HoFetchOption<Param, Body>
    ? (option?: HoFetchOption<Param, Body>) => Promise<Res>
    : (option: HoFetchOption<Param, Body>) => Promise<Res>;

type HoFetchParams<Param = any, Body = any> = (undefined extends Param ? { params?: Param } : { params: Param }) &
  (undefined extends Body ? { body?: Body } : { body: Body });

export type HoFetchOption<Param = any, Body = any> = Pick<
  RequestInit,
  | "cache"
  | "credentials"
  | "integrity"
  | "headers"
  | "mode"
  | "priority"
  | "redirect"
  | "referrer"
  | "referrerPolicy"
  | "signal"
  | "method"
> &
  HoFetchParams<Param, Body>;
