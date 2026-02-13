import type { TextStructure } from "../common.ts";
export enum ReviewDisplayItemType {
  text = "text",
  media = "media",
}
export enum ReviewTargetType {
  post = "post",
  post_comment = "post_comment",
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
