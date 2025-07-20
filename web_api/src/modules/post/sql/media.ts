import { DbPlaAssetMedia } from "@ijia/data/db";
import { AssetMediaDto } from "../common.dto.ts";
import { getBucket } from "@ijia/data/oss";
import { PostAssetType } from "../post.dto.ts";

const prefix = "/file/" + getBucket().PLA_POST_MEDIA + "/";
export function assetMediaToDto(item: DbPlaAssetMedia): AssetMediaDto["origin"] {
  const filename = item.file_id + (item.ext ? "." + item.ext : "");
  return {
    url: prefix + filename + "?" + item.hash_type + "=" + item.hash,
    size: item.size!,
    meta: item.meta as any,
  };
}
export function getPostAssetsType(type: string | number): PostAssetType {
  if (typeof type === "string") type = parseInt(type, 2);
  if (!Number.isInteger(type)) throw new Error("type 不是有效的 bit:" + type);
  return {
    hasText: (type & 0b0001) != 0,
    hasImage: (type & 0b0010) != 0,
    hasAudio: (type & 0b0100) != 0,
    hasVideo: (type & 0b1000) != 0,
  };
}
