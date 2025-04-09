import { TextStructure } from "@ijia/data/db";

export type Option<T> = {
  label: string;
  value: T;
};
export type ListDto<T> = {
  items: T[];
  total: number;
};
export interface GetListOption {
  number?: number;
  offset?: number;
}

export type TextStructureExternalLink = TextStructure & {
  link: string;
};
