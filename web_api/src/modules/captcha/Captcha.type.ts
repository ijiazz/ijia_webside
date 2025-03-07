export type CaptchaOption = {
  /** 有效时间. 单位秒 */
  survivalTime: number;
};

export type ImageCaptchaQuestion = CaptchaOption & {
  title: string;
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
  title: string;
  sessionId: string;
};
export type VerificationCodeResult = {};
