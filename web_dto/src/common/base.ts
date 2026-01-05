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
  before_cursor?: C | null;
  next_cursor?: C | null;
};

export interface GetListOption {
  number?: number;
  offset?: number;
}
