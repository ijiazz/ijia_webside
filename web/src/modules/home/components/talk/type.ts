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
  text: string;
  text_struct?: CaptionStruct;
  audio_url?: string;
  video_url?: string;
  image_url?: string;
};
export type Question<T = string> = Caption & {
  id: T;
  answers: Answer<T>[];
};
export type Answer<T> = {
  text: string;
  value: T;
};

type QuestionData = Caption & {
  id: string;
};
type AnswerData = {
  question_id: string;
  id: string;
  text: string;
};
