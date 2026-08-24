import { Role, UserInfo } from "@/common/userInfo.ts";
import { ReviewTargetType } from "@/dto.ts";
import { HttpError } from "@/common/errors.ts";

export function checkPermission(type: string, userInfo: UserInfo): Promise<boolean> {
  switch (type) {
    case ReviewTargetType.comment:
    case ReviewTargetType.post:
      return userInfo.hasRolePermission(new Set<Role>([Role.Admin, Role.PostReviewer]));
    case ReviewTargetType.exam_question:
      return userInfo.hasRolePermission(new Set<Role>([Role.Admin]));
    default:
      throw new HttpError(400, "未知的审核类型");
  }
}
