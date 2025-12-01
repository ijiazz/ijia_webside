import { checkValue } from "@/global/check.ts";
import { CheckTypeError, getBasicType, integer, optional, TypeCheckFn } from "@asla/wokao";
import { HttpError } from "@/global/errors.ts";

import routeGroup from "../_route.ts";
import { UpdatePostConfigParam, UpdatePostContentParam } from "@/dto/post.ts";
import { updatePostConfig, updatePostContent } from "../-sql/post_create_update.sql.ts";

export default routeGroup.create({
  method: "PATCH",
  routePath: "/post/content/:postId",
  async validateInput(ctx) {
    const userInfo = ctx.get("userInfo");
    const postId = checkValue(ctx.req.param("postId"), integer.positive);
    const userId = await userInfo.getUserId();
    const json = await ctx.req.json();
    let res: UpdatePostContentParam | UpdatePostConfigParam;
    switch (json.type) {
      case "content":
        res = checkValue(json, {
          type: "string" as any as TypeCheckFn<"content">,
          content_text: optional.string,
          content_text_structure: optional((input) => {
            if (input instanceof Array) return input;
            throw new CheckTypeError("Array", getBasicType(input));
          }, "nullish"),
        });
        break;

      case "config":
        res = checkValue(json, {
          type: "string" as any as TypeCheckFn<"config">,
          is_hide: optional.boolean,
          comment_disabled: optional.boolean,
        });
        break;

      default:
        throw new HttpError(400, `不支持的更新类型 ${json.type}`);
    }

    return { postId, res, userId };
  },
  async handler({ postId, res: params, userId }) {
    let count: number;
    switch (params.type) {
      case "content":
        count = await updatePostContent(postId, userId, params);
        break;

      case "config":
        count = await updatePostConfig(postId, userId, params);
        break;
    }
    if (count === 0) {
      throw new HttpError(404, `ID 为 ${postId} 的帖子不存在`);
    }
  },
});
