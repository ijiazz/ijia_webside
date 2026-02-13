import { createPost } from "../-sql/post_create_update.sql.ts";
import { CheckTypeError, getBasicType, integer, optional } from "@asla/wokao";
import { getUserDateCount } from "../-sql/post_create.sql.ts";

import routeGroup from "../_route.ts";
import { checkValueAsync } from "@/global/check.ts";
import { appConfig } from "@/config.ts";
import { HttpError } from "@/global/errors.ts";

export default routeGroup.create({
  method: "PUT",
  routePath: "/post/entity",
  async validateInput(ctx) {
    const { req } = ctx;
    const userInfo = ctx.get("userInfo");
    const uId = userInfo.getUserId();
    const res = checkValueAsync(req.json(), {
      content_text: optional.string,
      content_text_structure: optional((input) => {
        if (input instanceof Array) return input;
        throw new CheckTypeError("Array", getBasicType(input));
      }),
      group_id: optional(integer()),
      is_hide: optional.boolean,
      is_anonymous: optional.boolean,
      comment_disabled: optional.boolean,
    });
    return Promise.all([uId, res]);
  },
  async handler([userId, params]) {
    const maximumDailyCount = appConfig.post?.maximumDailyCount ?? 50;
    if (maximumDailyCount <= 0) throw new HttpError(403, "服务器已关闭新增帖子");
    const count = await getUserDateCount(userId);
    if (count >= maximumDailyCount) throw new HttpError(403, `每日发布数量已达上限${count}个，请明天再试`);
    try {
      return await createPost(userId, params);
    } catch (error) {
      if (error instanceof CheckTypeError) throw new HttpError(400, error.message);
      throw error;
    }
  },
});
