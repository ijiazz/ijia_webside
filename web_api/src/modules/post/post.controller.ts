import { Controller, Delete, Get, Patch, Post, Put, ToArguments, Use } from "@asla/hono-decorator";
import { autoBody } from "@/global/pipe.ts";
import { identity } from "@/global/auth.ts";
import {
  CreatePostParam,
  GetPostListParam,
  PostResponse,
  UpdatePostConfigParam,
  UpdatePostContentParam,
} from "./post.dto.ts";
import {
  createPost,
  deletePost,
  getPostList,
  getUserDateCount,
  updatePostConfig,
  updatePostContent,
} from "./sql/post.ts";
import { cancelPostLike, setPostLike } from "./sql/post_like.ts";
import { checkValue, checkValueAsync } from "@/global/check.ts";
import { CheckTypeError, getBasicType, integer, optional, TypeCheckFn } from "@asla/wokao";
import { HonoContext } from "@/hono/type.ts";
import { HttpError } from "@/global/errors.ts";
import { appConfig } from "@/config.ts";
import { reportPost } from "./sql/report.ts";

@Use(identity)
@autoBody
@Controller({})
class PostController {
  @ToArguments(async (c: HonoContext) => {
    const userInfo = c.get("userInfo");
    const uId = await userInfo.getUserId();
    const res = await checkValueAsync(c.req.json(), {
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
    return [uId, res];
  })
  @Put("/post/content")
  async create(userId: number, params: CreatePostParam): Promise<{ id: number }> {
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
  }

  @ToArguments(async (c: HonoContext) => {
    const userInfo = c.get("userInfo");
    const postId = checkValue(c.req.param("postId"), integer.positive);
    const userId = await userInfo.getUserId();
    const json = await c.req.json();
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

    return [postId, res, userId];
  })
  @Patch("/post/content/:postId")
  async update(postId: number, params: UpdatePostContentParam | UpdatePostConfigParam, userId: number) {
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
  }

  @ToArguments(async (c: HonoContext) => {
    const userInfo = c.get("userInfo");
    const postId = checkValue(c.req.param("postId"), integer.positive);
    const userId = await userInfo.getUserId();
    return [postId, userId];
  })
  @Delete("/post/content/:postId")
  async delete(postId: number, userId: number) {
    const count = await deletePost(postId, userId);
    if (count === 0) {
      throw new HttpError(404, "帖子不存在或已被删除");
    }
  }

  @ToArguments(async (c: HonoContext) => {
    const userInfo = c.get("userInfo");
    const userId = await userInfo.getUserId().catch(() => undefined);
    const queries = c.req.query();
    const res = checkValue(queries, {
      cursor: optional.string,
      self: optional((value) => value === "true"),
      number: optional(integer({ acceptString: true, min: 1, max: 100 })),
      userId: optional(integer.positive),
      post_id: optional(integer.positive),

      group_id: optional(integer({ acceptString: true })),
    });
    return [res, userId];
  })
  @Get("/post/list")
  async getPublicList(params: GetPostListParam, currentUserId?: number): Promise<PostResponse> {
    if (params.self && typeof currentUserId !== "number") return { needLogin: true, has_more: false, items: [] };
    return getPostList(params, { currentUserId });
  }

  @ToArguments(async (c: HonoContext) => {
    const userInfo = c.get("userInfo");
    const userId = await userInfo.getUserId();
    const postId = checkValue(c.req.param("postId"), integer.positive);
    const isCancel = c.req.query("isCancel") === "true";
    return [userId, postId, isCancel];
  })
  @Post("/post/like/:postId")
  async likePost(userId: number, postId: number, isCancel?: boolean): Promise<{ success: boolean }> {
    let count: number;
    if (isCancel) {
      count = await cancelPostLike(postId, userId);
    } else {
      count = await setPostLike(postId, userId);
    }
    return { success: count > 0 };
  }
  @ToArguments(async (c: HonoContext) => {
    const userInfo = c.get("userInfo");
    const userId = await userInfo.getUserId();
    const postId = checkValue(c.req.param("postId"), integer.positive);
    const data = await checkValueAsync(c.req.json(), {
      reason: optional.string,
    });
    return [userId, postId, data];
  })
  @Post("/post/report/:postId")
  async reportPost(userId: number, postId: number, data: { reason?: string }): Promise<{ success: boolean }> {
    const count = await reportPost(postId, userId, data.reason);
    return { success: count > 0 };
  }
}

export const postController = new PostController();
