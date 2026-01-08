import type { ListDto } from "./common.ts";

export interface ClassApi {
  /** 获取公共班级列表 */
  "GET /class/public": {
    response: ListDto<ClassOption>;
  };
}

export type ClassOption = { class_id: number; class_name: string; description?: string | null };
