import { Role } from "@/middleware/auth.ts";
import { ReviewTargetType } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";

export function checkPermission(type: string, roles: Set<Role>): boolean {
  if (roles.has(Role.Root) || roles.has(Role.Admin)) {
    return true;
  }
  switch (type) {
    case ReviewTargetType.post_comment:
    case ReviewTargetType.post:
      return roles.has(Role.PostReviewer);

    default:
      throw new HttpError(400, "未知的审核类型");
  }
}
