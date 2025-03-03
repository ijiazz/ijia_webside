export type CaptchaOption = {
  /** 有效时间. 单位秒 */
  survivalTime: number;
};

export type ImageCaptchaQuestion = CaptchaOption & {
  sessionId: string;
  imageUrlList: string[];
};

export type ImageCaptchaReply = {
  sessionId: string;
  selectedIndex: number[];
};
export type EmailCaptchaReply = {
  sessionId: string;
  code: string;
};
export type EmailCaptchaQuestion = CaptchaOption & {
  sessionId: string;
};
export type VerificationCodeResult = {};
