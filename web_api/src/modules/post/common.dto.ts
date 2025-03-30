export type VideoAssetDto = {
  covers?: MulFormat<ImageInfoDto>;
  cover?: ImageInfoDto;
  formats: MulFormat<VideoInfoDto>;
  origin: VideoInfoDto;
};
export type VideoInfoDto = {
  width?: number | null;
  height?: number | null;
  // bitrate?: number | null;
  // fps?: number | null;
  format?: string | null;
  size?: number | null;

  url: string;
};

export type ImageInfoDto = {
  width?: number | null;
  height?: number | null;
  size?: number;
  url: string;
};
export type ImageAssetDto = {
  formats: MulFormat<ImageInfoDto>;
  origin: ImageInfoDto;
};

export type AudioInfoDto = {
  size?: number | null;
  url: string;
  duration?: number | null;
};

export type AudioAssetDto = {
  covers?: MulFormat<ImageInfoDto>;
  cover?: ImageInfoDto;
  formats: MulFormat<AudioInfoDto>;
  origin: AudioInfoDto;
};

export type MulFormat<T> = { [key: string]: T | undefined };
export enum MediaLevel {
  other = "other",
  origin = "origin",
  thumb = "thumb",
}
