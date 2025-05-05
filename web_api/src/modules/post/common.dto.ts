import type { AudioMediaFile, ImageFileMeta, VideoFileMeta } from "@ijia/data/db";

type AssetMediaBase<T> = {
  covers?: MulFormat<AssetImage>;
  cover?: AssetImage;
  formats: MulFormat<T>;
  origin: T;
};

export type AssetMediaInfoDto<Meta extends {} = Record<string, any>> = {
  size: number;
  url: string;
  meta: Meta;
};

export type AssetVideo = AssetMediaInfoDto<VideoFileMeta>;
export type AssetImage = AssetMediaInfoDto<ImageFileMeta>;
export type AssetAudio = AssetMediaInfoDto<AudioMediaFile>;

export type AssetVideoDetail = AssetMediaBase<AssetVideo> & {
  type: AssetMediaType.video;
};
export type AssetAudioDetail = AssetMediaBase<AssetAudio> & {
  type: AssetMediaType.audio;
};
export type AssetImageDetail = AssetMediaBase<AssetImage> & {
  type: AssetMediaType.image;
};

export type AssetMediaDto = AssetVideoDetail | AssetAudioDetail | AssetImageDetail;

export type MulFormat<T> = { [key: string]: T | undefined };
export enum MediaLevel {
  other = "other",
  origin = "origin",
  thumb = "thumb",
}
export enum AssetMediaType {
  video = "video",
  audio = "audio",
  image = "image",
}
