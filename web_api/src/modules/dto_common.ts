import { TextStructure } from "@ijia/data/db";

export type Option<T> = {
  label: string;
  value: T;
};
export type ListDto<T> = {
  items: T[];
  total: number;
};

export type CursorListDto<T, C> = {
  items: T[];
  has_more: boolean;
  before_cursor?: C | null;
  next_cursor?: C | null;
};

export interface GetListOption {
  number?: number;
  offset?: number;
}

export type TextStructureExternalLink = TextStructure & {
  link: string;
};
