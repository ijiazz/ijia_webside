import { HTTPException } from "hono/http-exception";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class HttpError extends HTTPException {
  constructor(
    httpStatus: ContentfulStatusCode,
    option: {
      message: string;
      code?: string | number;
      cause?: any;
    },
  ) {
    super(httpStatus, { message: option.message, cause: option.cause, res: Response.json(option) });
    this.code = option.code;
  }
  code?: string | number;
}
export class HttpCaptchaError extends HttpError {
  constructor() {
    super(403, { message: "验证码错误", code: "CAPTCHA_ERROR" });
  }
}
export class HttpParamsCheckError extends HttpError {
  constructor(cause: any) {
    super(400, { message: "参数校验不通过", code: "PARAMS_CHECK_ERROR", cause });
  }
}
