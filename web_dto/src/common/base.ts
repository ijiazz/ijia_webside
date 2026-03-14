export type Option<T> = {
  label: string;
  value: T;
};
/** @deprecated 改用 ListResult */
export type ListDto<T> = ListResult<T>;
export type ListResult<T> = {
  items: T[];
  total: number;
};

export type InfiniteListResult<T> = {
  items: T[];
  has_more: boolean;
};
/** @deprecated 改用 CursorList */
export type CursorListDto<T, C> = CursorListResult<T, C>;
export type CursorListResult<T, C> = {
  items: T[];
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
