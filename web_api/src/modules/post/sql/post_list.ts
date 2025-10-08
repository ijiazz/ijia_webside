import { post, post_group, post_like, user } from "@ijia/data/db";
import v from "@ijia/data/yoursql";
import { GetPostListParam, PostItemDto, PostUserInfo } from "../post.dto.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { getPostContentType } from "./sql_tool.ts";
import { CursorListDto } from "@/modules/dto_common.ts";
import { HttpError } from "@/global/errors.ts";

export async function getPostList(
  params: GetPostListParam = {},
  option: { currentUserId?: number } = {},
): Promise<CursorListDto<PostItemDto, string>> {
  const {
    number = 10,
    cursor: cursorStr,
    userId,
    group_id,
    post_id,
    forward,
    self: isSelf,
    s_content,
    s_author,
  } = params;
  const { currentUserId = null } = option;
  const cursor = cursorStr ? parserTimestampCursor(cursorStr) : null;

  let curr_user: string | undefined;
  if (currentUserId !== null) {
    curr_user = jsonb_build_object({
      can_update: `u.id=${v(currentUserId)}`,
      disabled_comment_reason: `
      CASE 
        WHEN p.is_reviewing THEN '审核中的帖子不能评论' 
        WHEN p.is_review_pass = FALSE THEN '审核不通过的帖子不能评论'
        WHEN get_bit(p.options, 1)='1' AND p.user_id != ${v(currentUserId)} THEN '作者评论已关闭功能' 
        ELSE NULL END`,

      /** like_weight 用量计算 is_like 和 is_report */
      like_weight: `${post_like
        .select("weight")
        .where(["post_id=p.id", `user_id=${v(currentUserId)}`])
        .toSelect()}`,
    });
  } else {
    curr_user = "null";
  }

  const qSql = post
    .fromAs("p")
    .innerJoin(user, "u", "u.id=p.user_id")
    .leftJoin(post_group, "g", "g.id=p.group_id")
    .select({
      post_id: "p.id",

      /**
       * 不是匿名或者是自己的帖子才作者信息
       */
      author: `CASE 
        WHEN (get_bit(p.options, 0)='0' OR u.id=${v(currentUserId)}) 
        THEN ${jsonb_build_object({
          user_name: "u.nickname",
          user_id: "u.id ::TEXT",
          avatar_url: "'/file/avatar/'||u.avatar",
        } satisfies { [key in keyof PostUserInfo]: string })}
        ELSE NULL END`,
      publish_time: "p.publish_time",
      create_time: "p.create_time",
      update_time: "CASE WHEN p.update_time=p.create_time THEN NULL ELSE p.update_time END",
      like_weight: `${post_like
        .select("weight")
        .where(["post_id=p.id", `user_id=${v(currentUserId)}`])
        .toSelect()}`,
      type: getPostContentType("p.content_type"),
      content_text: "p.content_text",
      content_text_structure: "p.content_text_struct",
      ip_location: "null", //TODO
      media: "null", //TODO
      curr_user: curr_user,
      group: jsonb_build_object({ group_id: "g.id", group_name: "g.name" }),
      stat: jsonb_build_object({
        like_total: "p.like_count",
        dislike_total: "ROUND(p.dislike_count::NUMERIC /100, 2)",
        comment_total: "comment_num",
      }),
      config: jsonb_build_object({
        is_anonymous: "get_bit(p.options, 0)::BOOL",
        comment_disabled: "get_bit(p.options, 1)::BOOL",
        self_visible: "p.is_hide",
      }),
      status: jsonb_build_object({ review_pass: "p.is_review_pass", is_reviewing: "p.is_reviewing" }),
    })
    .where(() => {
      const where: string[] = [`NOT p.is_delete`];

      if (currentUserId !== null && isSelf) {
        where.push(`p.user_id=${v(currentUserId)}`);
      } else {
        const exclude = `(p.publish_time IS NULL OR p.is_reviewing OR p.is_review_pass IS FALSE OR p.is_hide)`; // 审核中和审核不通过和已隐藏
        where.push(`(NOT ${exclude})`);
        if (typeof userId === "number") where.push(`p.user_id =${v(userId)}`);
      }
      if (group_id !== undefined) where.push(`p.group_id =${v(group_id)}`);
      if (post_id !== undefined) where.push(`p.id = ${v(post_id)}`);
      if (cursor) {
        const ts = cursor.timestamp;
        if (typeof ts !== "number") {
          if (forward) throw new HttpError(400, "向前的 cursor 必须存在 publish_time 时间戳");
          else where.push(`(p.publish_time IS NULL AND p.id < ${v(cursor.id)})`);
        } else {
          const timestamp = v(ts / 1000);
          if (forward) {
            where.push(
              `(p.publish_time > to_timestamp(${timestamp}) OR (p.publish_time = to_timestamp(${timestamp}) AND p.id > ${v(cursor.id)}))`,
            );
          } else {
            where.push(
              `(p.publish_time < to_timestamp(${timestamp}) OR (p.publish_time = to_timestamp(${timestamp}) AND p.id < ${v(cursor.id)}))`,
            );
          }
        }
      }

      return where;
    })
    .orderBy(forward ? ["p.publish_time ASC NULLS LAST", "p.id ASC"] : ["p.publish_time DESC NULLS FIRST", "p.id DESC"])
    .limit(number);
  /**
   *  使用指针分页
   *  使用 publish_time 和 id 作为指针
   *  因为 publish_time 可能为 null，如果 publish_time 为 null，仅使用 id 作为指针
   */

  const rawList = await qSql.queryRows();
  rawList.forEach((item) => {
    const currUser = item.curr_user;
    if (currUser) {
      const weight = currUser.like_weight;
      delete currUser.like_weight; // 删除不需要的字段
      const postItem = currUser as NonNullable<PostItemDto["curr_user"]>;
      if (weight) {
        postItem.is_like = weight > 0; // 是否点赞
        postItem.is_report = weight < 0; // 是否举报
      }

      const curr_user: NonNullable<PostItemDto["curr_user"]> = currUser;
      curr_user.can_comment = curr_user.disabled_comment_reason === null;
    }
  });
  const list = rawList as PostItemDto[];
  const firstPublishTime = list.find((item) => item.publish_time);
  const last = list[list.length - 1];
  return {
    items: list,
    has_more: list.length >= number,
    before_cursor: firstPublishTime
      ? toTimestampCursor({
          id: +firstPublishTime.post_id,
          timestamp: firstPublishTime.publish_time ? new Date(firstPublishTime.publish_time).getTime() : null,
        })
      : null,
    next_cursor: last
      ? toTimestampCursor({
          id: +last.post_id,
          timestamp: last.publish_time ? new Date(last.publish_time).getTime() : null,
        })
      : null,
  };
}

export async function getUserDateCount(userId: number) {
  const { count } = await post
    .select<{ count: number }>({ count: "count(*)::INT" }, "p")
    .where([`user_id=${v(userId)}`, `DATE(p.create_time) = CURRENT_DATE`])
    .queryFirstRow();
  return count;
}

function parserTimestampCursor(cursorStr: string): PostCursor {
  const [timestampStr, idStr] = cursorStr.split("-");
  if (!timestampStr || !idStr) throw new Error("cursor 格式错误");
  const timestamp = timestampStr === "0" ? null : +timestampStr;
  if (timestampStr !== null && !Number.isInteger(timestamp)) throw new Error("cursor 格式错误");

  const id = +idStr;
  if (!Number.isInteger(id)) throw new Error("cursor 格式错误");
  return { timestamp: timestamp, id: id };
}
function toTimestampCursor(cursor: PostCursor): string {
  return `${cursor.timestamp ?? "0"}-${cursor.id}`;
}
type PostCursor = {
  /** publish_timestamp */
  timestamp?: number | null;
  id: number;
};
