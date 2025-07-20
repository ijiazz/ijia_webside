export function parserTimestampCursor(cursorStr: string): TzIdCursor {
  const [timestampStr, idStr] = cursorStr.split("-");
  if (!timestampStr || !idStr) throw new Error("cursor 格式错误");
  const timestamp = +timestampStr;
  if (!Number.isFinite(timestamp)) throw new Error("cursor 格式错误");

  const id = +idStr;
  if (!Number.isInteger(id)) throw new Error("cursor 格式错误");

  return { timestamp: timestamp, id: id };
}
export function toTimestampCursor(cursor: TzIdCursor): string {
  return `${cursor.timestamp}-${cursor.id}`;
}
export type TzIdCursor = {
  /** timestamp */
  timestamp: number;
  id: number;
};
