import type { TextStructure } from "../common.ts";
export enum ReviewDisplayItemType {
  text = "text",
  media = "media",
  /** 考试题目 */
  exam_question = "exam_question",
  /** 公共评论 */
  comment = "comment",
}
export enum ReviewTargetType {
  /** 帖子 */
  post = "post",
  /** 帖子评论 */
  post_comment = "post_comment",
  /** 考试题目 */
  exam_question = "question",
  /** 公共评论 */
  comment = "comment",
}

export type ReviewDisplayItemText = {
  label: string;
  old?: {
    text: string;
    testStructure?: TextStructure[];
  };
  new?: {
    text: string;
    testStructure?: TextStructure[];
  };
  type: ReviewDisplayItemType.text;
};
export type ReviewDisplayItemMedia = {
  label: string;
  new?: {
    filename: string;
    mediaType: string;
  };
  old?: {
    filename: string;
    mediaType: string;
  };
  type: ReviewDisplayItemType.media;
};

export type ReviewDisplayItem = ReviewDisplayItemText | ReviewDisplayItemMedia;
