import { ImgVerificationReply, ImgVerificationQuestion, EmailVerificationReply } from "./VerificationCode.type.ts";

//TODO 图片验证码服务
class VerificationCodeController {
  async imageRefresh(session_id: string): Promise<string> {
    throw new Error("未实现");
  }
  async imageCreateSession(): Promise<ImgVerificationQuestion> {
    throw new Error("未实现");
  }
  async imageVerify(reply: ImgVerificationReply): Promise<boolean> {
    throw new Error("未实现");
  }
  async imageGet(imageId: string): Promise<ReadableStream<Uint8Array>> {
    throw new Error("未实现");
  }

  async emailCreateSession(config: { email: string; content: string; prefix: string }): Promise<string> {
    throw new Error("未实现");
  }
  async emailVerify(reply: EmailVerificationReply): Promise<boolean> {
    throw new Error("未实现");
  }
}

export const verificationCode = new VerificationCodeController();
