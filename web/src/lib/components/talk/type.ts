export type CaptionSegment = {
  length?: number;
  time?: number;
};
export type CaptionStruct = {
  pause_ms: number;
  speed: number;
  segments: CaptionSegment[];
};
export type Caption = {
  target?: string;
  text: string;
  text_struct?: CaptionStruct;
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
