import { ListDto } from "../dto_common.ts";
import { GetAssetListParam, AssetItemDto } from "./asset.dto.ts";

export interface ClassApi {
  /** 获取公共班级列表 */
  "GET /live/asset": {
    response: ListDto<AssetItemDto>;
    query: GetAssetListParam;
  };
}
