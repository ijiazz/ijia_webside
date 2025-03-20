import { ListDto } from "../dto_common.ts";
import { ClassOption } from "./class.dto.ts";

export interface ClassApi {
  /** 获取公共班级列表 */
  "GET /class/public": {
    response: ListDto<ClassOption>;
  };
}
