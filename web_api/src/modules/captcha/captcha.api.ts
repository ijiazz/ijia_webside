import { ImageCaptchaQuestion } from "./captcha.dto.ts";

export interface CaptchaApi {
  /** 创建或刷新验证码会话 */
  "POST /captcha/image": {
    response: ImageCaptchaQuestion;
    query?: {
      sessionId?: string;
    };
  };
  /** 获取图像验证码文件流 */
  "GET /captcha/image/:url": {};
}
