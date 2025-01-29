import type { HoFetchOption, FetchSuite, FetchEndpoint, FetchItemCommon } from "./fetch_suite.ts";

export class HoFetch {
  constructor(option: CreateHoFetchOption = {}) {
    const { bodyParser } = option;
    this.#bodyParser = {
      "application/json": function (data, response) {
        return response.json();
      },
      "text/plain": function (data, response) {
        return response.text();
      },
      ...bodyParser,
    };
    this.use(async (request, next) => {
      const hoResponse = await next();
      if (!hoResponse.ok) throw new Error(`http response ${hoResponse.status}`);
      await HoResponse.parserResponseBody(hoResponse);
      return hoResponse;
    });
  }
  async parseBody<T = unknown>(response: Response): Promise<T> {
    if (!response.body) return undefined as T;
    let contentType = response.headers.get("content-type");
    if (contentType) {
      const i = contentType.indexOf(";");
      if (i > 0) contentType = contentType.slice(0, i);
    } else return response.body as T;

    const parser = this.#bodyParser[contentType];
    if (parser) return parser(response.body, response) as any;
    return response.body as T;
  }
  #bodyParser: Record<string, undefined | HttpBodyTransformer<unknown, ReadableStream<Uint8Array>>> = {};
  #middlewareHandlers: MiddlewareHandler[] = [];

  request<Res = unknown>(pathOrUrl: string | URL, init?: HoFetchOption<any, any>): Promise<HoResponse<Res>>;
  async request(requestUrl: string | URL, init: HoFetchOption<any, any> = {}): Promise<HoResponse<any>> {
    let url: URL;
    try {
      url = new URL(requestUrl);
    } catch (error) {
      url = new URL(location.origin);
      url.pathname = requestUrl as string;
    }
    const { body, method = "GET", ...reset } = init;
    const hoRequest: HoRequest & { _init: any } = {
      _init: reset,
      body,
      headers: new Headers(init.headers),
      method,
      url,
    };

    let params = init.params;
    if (params) {
      if (typeof params === "string") url.search = params;
      else if (params instanceof URLSearchParams) url.search = params.toString();
      else url.search = new URLSearchParams(params).toString();
    }

    const iter = this.#middlewareHandlers[Symbol.iterator]();
    return this.#handlerMiddleware(hoRequest, iter);
  }

  #createRequest(hoRequest: HoRequest<any>, init: HoFetchOption<any>): Request {
    let headers: Headers | undefined;
    let body: BodyInit | null | undefined;
    let url = hoRequest.url;

    return new Request(url, { ...init, body, headers });
  }
  #handlerMiddleware(
    hoRequest: HoRequest<any> & { _init: any },
    iter: IterableIterator<MiddlewareHandler>
  ): Promise<HoResponse<any>> {
    const item = iter.next();
    if (item.done) {
      return this.#hoFetch(hoRequest);
    } else {
      const applyMiddleware = item.value;
      return applyMiddleware(hoRequest, (newRequest = hoRequest) => this.#handlerMiddleware(newRequest, iter));
    }
  }
  async #hoFetch(hoRequest: HoRequest<any> & { _init: any }) {
    const request = this.#createRequest(hoRequest, hoRequest._init);
    const response = await fetch(request);
    const hoResponse = new HoResponse(response);
    const contentType = hoResponse.headers.get("content-type");

    if (contentType) {
      const bodyParser = this.#bodyParser[contentType];
      if (bodyParser) hoResponse.useBodyTransform(bodyParser);
    }
    return hoResponse;
  }
  createFetchSuite<T extends object>(prefix?: URL | string): FetchSuite<T> {
    let url: URL;
    if (prefix) {
      if (typeof prefix === "string") {
        let tmp = URL.parse(prefix);
        if (tmp) url = tmp;
        else {
          url = new URL(`${location.origin}`);
          url.pathname = prefix;
        }
      } else prefix = new URL(prefix);
    } else url = new URL(location.origin);
    const fetchApi = this;
    return new Proxy(
      {},
      {
        get(target, p, receiver) {
          if (typeof p !== "string") return undefined;
          const next = new URL(url);
          next.pathname = next.pathname + p;
          return new FetchPathInstanceImpl(fetchApi, next);
        },
      }
    ) as FetchSuite<T>;
  }
  use(handler: MiddlewareHandler) {
    this.#middlewareHandlers.push(handler);
  }
}

export type CreateHoFetchOption = {
  /**
   * 自定义 http body 解析。
   * `fetchResult()` 方法和 `createFetchSuite()` 将根据此配置解析 http body。
   */
  bodyParser?: Record<string, HttpBodyTransformer<ReadableStream<Uint8Array>> | undefined>;
};
type HttpMethod = "post" | "get" | "delete" | "put" | "patch";
type AnyFetchPathInstance = FetchItemCommon & { [key in HttpMethod]: FetchEndpoint<any, any> };

class FetchPathInstanceImpl implements AnyFetchPathInstance {
  constructor(asFetch: HoFetch, url: string | URL) {
    url = new URL(url);
    url.search = "";
    url.hash = "";
    this.#url = url;
    this.#asFetch = asFetch;
  }
  #url: URL;
  #asFetch: HoFetch;

  request<Res = unknown>(option?: HoFetchOption<any, any>): Promise<Res>;
  request(option?: HoFetchOption<any, any>): Promise<any> {
    return this.#asFetch.request(this.#url, option);
  }
  async #methodRequest(option: HoFetchOption<any, any>) {
    const result = await this.#asFetch.request(this.#url, option);
    return result.bodyData;
  }
  get: FetchEndpoint<any, any> = (option) => {
    return this.#methodRequest({ ...option, method: "GET" });
  };
  post: FetchEndpoint<any, any> = (option) => {
    return this.#methodRequest({ ...option, method: "POST" });
  };
  put: FetchEndpoint<any, any> = (option) => {
    return this.#methodRequest({ ...option, method: "PUT" });
  };
  delete: FetchEndpoint<any, any> = (option) => {
    return this.#methodRequest({ ...option, method: "DELETE" });
  };
  patch: FetchEndpoint<any, any> = (option) => {
    return this.#methodRequest({ ...option, method: "PATCH" });
  };
}

export type MiddlewareHandler = (request: HoRequest, next: () => Promise<HoResponse>) => Promise<HoResponse>;

interface HoRequest<T = unknown> {
  headers: Headers;
  url: URL;
  method: string;
  body: T;
}
class HoResponse<T = unknown>
  implements Pick<Response, "redirected" | "clone" | "ok" | "headers" | "status" | "statusText">
{
  constructor(response: Response) {
    this.#raw = response;
    this.ok = response.ok;
    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.#bodyData = this.#raw.body as any;
  }
  #raw: Response;
  static async parserResponseBody<T>(hoResponse: HoResponse<T>): Promise<T> {
    const response = hoResponse.#raw;
    if (response.bodyUsed) return hoResponse.bodyData;

    const transforms = hoResponse.#transformers;
    let data = hoResponse.#raw.body;
    if (!data) return undefined as T;

    for (let i = 0; i < transforms.length; i++) {
      data = await transforms[i](data, response);
    }
    hoResponse.#bodyData = data as T;
    hoResponse.#transformers.length = 0;

    return hoResponse.#bodyData;
  }
  #bodyData: T;
  get bodyData() {
    return this.#bodyData;
  }
  #transformers: ((body: any, res: Response) => any)[] = [];
  useBodyTransform<O>(bodyMidTransformer: HttpBodyTransformer<O, any>): HoResponse<O>;
  useBodyTransform(bodyMidTransformer: HttpBodyTransformer<any>): HoResponse<any> {
    this.#transformers.push(bodyMidTransformer);
    return this;
  }
  get redirected() {
    return this.#raw.redirected;
  }
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;

  clone(): Response {
    return this.#raw.clone();
  }
  #url?: URL;
  get url() {
    return (this.#url ??= new URL(this.#raw.url));
  }
}
export type HttpBodyTransformer<O, I = unknown> = (bodyData: I, response: Response) => Promise<O> | O;
