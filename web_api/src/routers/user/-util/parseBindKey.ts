import { HttpError } from "@/global/errors.ts";

export function parserBinKey(bindKey: string) {
  const idx = bindKey.indexOf("-");
  if (idx === -1 || idx === 0 || idx === bindKey.length - 1) throw new HttpError(400, { message: "bindKey 格式错误" });
  const platform = bindKey.slice(0, idx);
  const pla_uid = bindKey.slice(idx + 1);

  return { platform, pla_uid };
}
