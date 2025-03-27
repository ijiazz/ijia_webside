export interface VideoInfoDto {
  url: string;
}
export interface AudioInfoDto {
  url: string;
}
export interface ImageInfoDto {
  //   width: number;
  //   height: number;
  url: string;
}
export interface UserSampleInfo {
  user_name: string;
  user_id: string;
}
export interface MulFormat<T> {
  origin: T;
  thumb?: T;
}
