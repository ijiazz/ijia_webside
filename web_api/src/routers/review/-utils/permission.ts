import { Role, UserInfo } from "@/middleware/auth.ts";
import { ReviewTargetType } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";

export function checkPermission(type: string, userInfo: UserInfo): Promise<boolean> {
  switch (type) {
    case ReviewTargetType.post_comment:
    case ReviewTargetType.post:
      return userInfo.hasRolePermission(new Set<Role>([Role.Admin, Role.PostReviewer]));
    case ReviewTargetType.exam_question:
      return userInfo.hasRolePermission(new Set<Role>([Role.Admin]));
    default:
      throw new HttpError(400, "未知的审核类型");
  }
}
