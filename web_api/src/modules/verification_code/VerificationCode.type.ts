export type VerificationOption = {
  /** 有效时间. 单位秒 */
  survivalTime: number;
};

export type ImgVerificationQuestion = VerificationOption & {
  imageIdList: string[];
};

export type ImgVerificationReply = {
  session_id: string;
  selectedImageId: string[];
};
export type EmailVerificationReply = {
  session_id: string;
  code: string;
};

export type VerificationCodeResult = {};
