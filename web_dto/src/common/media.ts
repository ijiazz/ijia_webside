export enum MediaType {
  video = "video",
  audio = "audio",
  image = "image",
}
export enum MediaLevel {
  other = "other",
  origin = "origin",
  thumb = "thumb",
}
export enum ImageLevel {
  other = "other",
  origin = "origin",
  thumb = "thumb",
}

type AssetMediaBase<T> = {
  covers?: MulFormat<AssetImage>;
  cover?: AssetImage;
  formats: MulFormat<T>;
  origin: T;
};

export type AssetMediaInfoDto<Meta extends {} | void = void> = {
  size?: number;
  url: string;
  meta: Meta;
};

export type AssetVideo = AssetMediaInfoDto<void>; //TODO
export type AssetImage = AssetMediaInfoDto<void>; //TODO
export type AssetAudio = AssetMediaInfoDto<void>; //TODO

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
