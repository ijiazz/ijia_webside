import { getBucket } from "@ijia/data/oss";
import { AssetMediaDto } from "@/dto.ts";

const prefix = "/file/" + getBucket().PLA_POST_MEDIA + "/";
export function assetMediaToDto(item: { filename?: string }): AssetMediaDto["origin"] {
  //TODO 补充类型

  return {
    url: item.filename ? prefix + item.filename : "",
    size: 0,
    meta: {},
  };
}
