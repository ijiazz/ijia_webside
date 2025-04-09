export type CaptionSegment = {
  className?: string;
  length?: number;
  speed?: number;
  pauseMs?: number;
};
export type Caption = {
  target?: string;
  text: string;

  /** segments 之间暂停的毫秒数 */
  pauseMs?: number;
  /** 默认的播放速度，单位 字符/秒。  */
  speed?: number;
  segments?: (CaptionSegment | number)[];
};
export enum CaptionType {
  MONOLOGUE = "monologue",
  QUESTION = "question",
  ANSWER = "answer",
}
export type Monologue<T = string> = Caption & {
  type: CaptionType.MONOLOGUE;
  id: T;
};
export type Question<T = string> = Caption & {
  type: CaptionType.QUESTION;
  id: T;
  answers: Answer<T>[];
};
export type CaptionTip = Monologue | Question;

export type Answer<T> = {
  text: string;
  value: T;
};

export type Dialogue = {
  branch: Record<string, CaptionTip[]>;
  captions: CaptionTip[];
  background: {
    audio_url?: string;
    video_url?: string;
    image_url?: string;
  };
};
