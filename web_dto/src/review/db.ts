import type { TextStructure } from "../common.ts";
export enum ReviewDisplayItemType {
  text = "text",
  media = "media",
  /** 考试题目 */
  exam_question = "exam_question",
  /** 公共评论 */
  comment = "comment",
}
//TODO: 从 school-db 中导入 重导出
export enum ReviewTargetType {
  /** 帖子 */
  post = "post",
  /** 考试题目 */
  exam_question = "question",
  /** 评论 */
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
