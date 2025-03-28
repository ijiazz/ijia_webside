export interface VideoInfoDto {
  url: string;
}
export interface AudioInfoDto {
  url: string;
}
export interface ImageInfoDto {
  width: number | null;
  height: number | null;
  url: string;
}
export interface AssetUserInfo {
  user_name: string;
  user_id: string;
  avatar_url: string;
  ip_location: string | null;
  home_page?: string;
}
export interface MulFormat<T> {
  origin: T;
  thumb?: T;
}
