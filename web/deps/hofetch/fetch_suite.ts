type HttpMethod = "post" | "get" | "delete" | "put" | "patch";

export type FetchSuite<T extends object> = {
  [key in keyof T]: T extends Record<string, any> ? FetchPath<T[key]> : never;
};

export type FetchPath<T extends object> = {
  [key in keyof T as key extends HttpMethod ? key : never]: T[key] extends {
    response: any;
    params?: object;
    body?: any;
  }
    ? FetchEndpoint<T[key]["response"], T[key]["params"], T[key]["body"]>
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
