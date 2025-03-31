import { DbAssetAudio, DbAssetImage, DbAssetVideo } from "@ijia/data/db";
import { AudioInfoDto, ImageInfoDto, VideoInfoDto } from "../common.dto.ts";
import { getBucket } from "@ijia/data/oss";
import { PostAssetType } from "../post.dto.ts";

export function audioToDto(item: DbAssetAudio): AudioInfoDto {
  return {
    url: "/file/" + getBucket().ASSET_AUDIO + "/" + item.uri,
    duration: item.duration,
    size: item.size,
  };
}
export function videoToDto(item: DbAssetVideo): VideoInfoDto {
  return {
    url: "/file/" + getBucket().ASSET_VIDEO + "/" + item.uri,
    format: item.format,
    height: item.height,
    width: item.width,
    size: item.size,
  };
}
export function imageToDto(item: DbAssetImage): ImageInfoDto {
  return {
    url: "/file/" + getBucket().ASSET_IMAGES + "/" + item.uri,
    height: item.height,
    width: item.width,
  };
}
export function getPostAssetsType(typeBit: string): PostAssetType {
  const type = parseInt(typeBit, 2);
  return {
    hasText: (type & 0b0001) != 0,
    hasImage: (type & 0b0010) != 0,
    hasAudio: (type & 0b0100) != 0,
    hasVideo: (type & 0b1000) != 0,
  };
}
