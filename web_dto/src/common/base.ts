export type Option<T> = {
  label: string;
  value: T;
};
export type ListDto<T> = {
  items: T[];
  total: number;
};

export type InfiniteListDto<T> = {
  items: T[];
  has_more: boolean;
};

export type CursorListDto<T, C> = InfiniteListDto<T> & {
  cursor_prev?: C | null;
  cursor_next?: C | null;
};

export interface GetListOption {
  number?: number;
  offset?: number;
}
export enum ReviewStatus {
  pending = "pending",
  passed = "passed",
  rejected = "rejected",
}
