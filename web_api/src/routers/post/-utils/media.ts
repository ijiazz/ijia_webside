import { getBucket } from "@ijia/data/oss";
import { PostAssetType, AssetMediaDto } from "@/dto.ts";

const prefix = "/file/" + getBucket().PLA_POST_MEDIA + "/";
export function assetMediaToDto(item: { filename?: string }): AssetMediaDto["origin"] {
  //TODO 补充类型

  return {
    url: item.filename ? prefix + item.filename : "",
    size: 0,
    meta: {},
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
