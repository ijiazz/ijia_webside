export interface BlobLike {
  readonly type: string;
  stream(): unknown;
}
