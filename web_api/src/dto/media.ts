import { MediaType, ImageFileMeta, VideoFileMeta, AudioFileMeta, DbSysFile } from "@ijia/data/db";

export { MediaType } from "@ijia/data/db";

type AssetMediaBase<T> = {
  covers?: MulFormat<AssetImage>;
  cover?: AssetImage;
  formats: MulFormat<T>;
  origin: T;
};

export type AssetMediaUploadFile = {
  tmp_file_id: string;
  type: MediaType;
};

export type AssetMediaInfoDto<Meta extends {} = Record<string, any>> = {
  size: number;
  url: string;
  meta: Meta;
};

export type AssetVideo = AssetMediaInfoDto<{}>; //TODO
export type AssetImage = AssetMediaInfoDto<{}>; //TODO
export type AssetAudio = AssetMediaInfoDto<{}>; //TODO

export type AssetVideoDetail = AssetMediaBase<AssetVideo> & {
  type: MediaType.video;
};
export type AssetAudioDetail = AssetMediaBase<AssetAudio> & {
  type: MediaType.audio;
};
export type AssetImageDetail = AssetMediaBase<AssetImage> & {
  type: MediaType.image;
};

export type AssetMediaDto = AssetVideoDetail | AssetAudioDetail | AssetImageDetail;

export type MulFormat<T> = { [key: string]: T | undefined };
export enum MediaLevel {
  other = "other",
  origin = "origin",
  thumb = "thumb",
}
// export enum MediaType {
//   video = "video",
//   audio = "audio",
//   image = "image",
// }
