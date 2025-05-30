import { HTTPException } from "hono/http-exception";
import { ContentfulStatusCode } from "hono/utils/http-status";

export type HttpErrorOption = {
  message: string;
  code?: string | number;
  cause?: any;
};
export class HttpError extends HTTPException {
  constructor(httpStatus: ContentfulStatusCode, message: string);
  constructor(httpStatus: ContentfulStatusCode, option: HttpErrorOption);
  constructor(httpStatus: ContentfulStatusCode, option: HttpErrorOption | string) {
    if (typeof option === "string") option = { message: option };
    super(httpStatus, { message: option.message, cause: option.cause, res: Response.json(option) });
    this.code = option.code;
  }
  code?: string | number;
}
export class HttpCaptchaError extends HttpError {
  constructor() {
    super(418, { message: "验证码错误", code: "CAPTCHA_ERROR" });
  }
}
export class HttpParamsCheckError extends HttpError {
  constructor(cause: any) {
    super(400, { message: "参数校验不通过", code: "PARAMS_CHECK_ERROR", cause });
  }
}
export class RequiredLoginError extends HttpError {
  constructor(message: string = "需要登录") {
    super(401, { code: "REQUIRED_LOGIN", message });
  }
}
