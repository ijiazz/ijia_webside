export const RECORD_SITE = "https://record.ijiazz.cn";

const FILE_ORIGIN = location.origin;

export function getFileURL(uri: string) {
  return new URL("/file/" + uri, FILE_ORIGIN).href;
}
