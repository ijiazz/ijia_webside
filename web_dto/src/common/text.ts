export interface TextStructure {
  /** 字符串索引 */
  index: number;
  /** 基于索引的偏移量 */
  length: number;
  /** 0: 平台用户。 */
  type?: TextStructureType;
  [key: string]: any;
}
export type TextStructureExternalLink = TextStructure & {
  link: string;
};

export enum TextStructureType {
  unknown = -1,
  /** 外部链接 */
  link = 0,
  /** 平台用户 */
  user = 1,
  /** 话题 */
  topic = 2,
}
