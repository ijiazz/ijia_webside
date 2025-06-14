import { post, post_group, post_like, TextStructure, user } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";
import { CreatePostParam, GetPostListParam, PostItemDto, PostUserInfo, UpdatePostParam } from "../post.dto.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { getPostContentType } from "./sql_tool.ts";
import { CursorListDto } from "@/modules/dto_common.ts";
import { checkTypeCopy, CheckTypeError, optional } from "@asla/wokao";
import { textStructChecker } from "../transform/text_struct.ts";
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
      can_comment: "true",

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
      asset_id: "p.id",
      author: `CASE WHEN (get_bit(p.options, 0)='0' OR u.id=${v(currentUserId)})
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

  const list = await qSql.queryRows();
  list.forEach((item) => {
    const currUser = item.curr_user;
    if (currUser) {
      const weight = currUser.like_weight;
      delete currUser.like_weight; // 删除不需要的字段
      const postItem = currUser as NonNullable<PostItemDto["curr_user"]>;
      if (weight) {
        postItem.is_like = weight > 0; // 是否点赞
        postItem.is_report = weight < 0; // 是否举报
      }
    }
  });
  const firstPublishTime = list.find((item) => item.publish_time);
  const last = list[list.length - 1];
  return {
    items: list as PostItemDto[],
    has_more: list.length >= number,
    before_cursor: firstPublishTime
      ? toTimestampCursor({
          id: +firstPublishTime.asset_id,
          timestamp: firstPublishTime.publish_time ? new Date(firstPublishTime.publish_time).getTime() : null,
        })
      : null,
    next_cursor: last
      ? toTimestampCursor({
          id: +last.asset_id,
          timestamp: last.publish_time ? new Date(last.publish_time).getTime() : null,
        })
      : null,
  };
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

export async function createPost(userId: number, param: CreatePostParam): Promise<{ id: number }> {
  param.content_text_structure = checkTypeCopy(param.content_text_structure, optional(textStructChecker));
  checkCreateContent(param); // 检查文本结构
  const { content_text, group_id, is_hide, media_file, content_text_structure } = param;

  if (media_file) throw new Error("暂不支持 media_file"); //TODO
  const is_anonymous = param.is_anonymous ? 0b1000_0000 : 0;
  const recordSql = post
    .insert({
      user_id: userId,
      content_text: content_text ? content_text : null,
      content_text_struct: content_text_structure ? new String(v(JSON.stringify(content_text_structure))) : null,
      group_id,
      publish_time: group_id === undefined ? "now()" : undefined,
      content_type: toBit(8, 0b0000_0001), //TODO 判断是否有其他类型
      is_hide,
      options: toBit(8, is_anonymous),
      is_reviewing: typeof group_id === "number", // 选择了分组，则需要审核
    })
    .returning<{ id: number }>(["id"]);

  const row = await recordSql.queryFirstRow();

  return row;
}
export async function updatePost(postId: number, userId: number, param: UpdatePostParam) {
  const struct = checkTypeCopy(param.content_text_structure, optional(textStructChecker, "nullish"));

  let update_content_text: string | undefined;
  let update_content_text_struct: string | undefined;
  let contentUpdated = false;
  if (param.content_text !== undefined) {
    // 需要更新文本内容

    if (param.content_text === null || param.content_text === "") {
      update_content_text_struct = "NULL";
    } else {
      checkContent(param.content_text, struct);
      update_content_text = v(param.content_text);
      update_content_text_struct = struct?.length ? v(JSON.stringify(struct)) : "NULL";
    }
    contentUpdated = true;
  }

  type ReviewStatus = {
    is_review_pass: boolean | null;
    is_reviewing: boolean;
    group_id: number | null;
    is_hide: boolean;
    id: number;
  };
  const updateContentSql = await post
    .update({
      content_text: update_content_text,
      content_text_struct: update_content_text_struct,
      update_time: contentUpdated ? "now()" : undefined,
      is_hide: v(param.is_hide),
    })
    .where(() => {
      return [`user_id=${v(userId)}`, `id=${v(postId)}`, `(NOT is_delete)`];
    })
    .returning<ReviewStatus>(["id", "is_review_pass", "is_reviewing", "group_id", "is_hide"]);

  const db = dbPool.begin("REPEATABLE READ");
  const updatedList = await db.queryRows(updateContentSql);
  const item = updatedList[0];
  if (contentUpdated && item) {
    if (item.is_review_pass === true) {
      let update_is_reviewing: string | undefined;
      if (item.group_id) {
        update_is_reviewing = "TRUE"; // 如果有分组，则直接进入审核状态
      } else {
        // 没有分组，不用提交审核
      }
      const sql = post
        .update({
          is_reviewing: update_is_reviewing,
          is_review_pass: "null",
          review_fail_count: "0",
          review_pass_count: "0",
        })
        .where(`id=${v(item.id)}`);

      await db.query(sql);
    } else if (item.is_review_pass === false) {
      // 如果是更新的是审核不通过的帖子，则不用管
    } else {
      // 如果是更新的是审核中的帖子，则不需要更新审核状态，只需要重置审核计数

      const sql = post.update({ review_fail_count: "0", review_pass_count: "0" }).where(`id=${v(item.id)}`);
      await db.query(sql);
    }
  }

  await db.commit();

  return updatedList.length;
}
export async function deletePost(postId: number, userId?: number) {
  const q = post.update({ is_delete: "true" }).where(() => {
    const where = [`id=${v(postId)}`, `(NOT is_delete)`];
    if (userId !== undefined) where.push(`user_id=${v(userId)}`);
    return where;
  });
  return q.queryCount();
}
export async function setPostLike(postId: number, userId: number) {
  const insertRecord = post_like
    .insert("weight, post_id, user_id", () => {
      return post
        .select(["100 as weight", "id AS post_id", `${v(userId)} AS user_id`])
        .where([`id=${v(postId)}`, `(NOT is_delete)`, `(user_id=${v(userId)} OR NOT is_hide)`])
        .toString();
    })
    .onConflict(["post_id", "user_id"])
    .doNotThing()
    .returning("1");

  // 成功插入更新计数
  const updateCount = post
    .update({ like_count: "like_count + 1" })
    .where([`id=${v(postId)}`, `EXISTS (SELECT 1 FROM tmp)`]);

  const count = await dbPool.queryCount(`WITH tmp AS (${insertRecord})\n${updateCount.toString()}`);

  return count;
}

function cancelPostLikeSql(postId: number, userId: number) {
  const deleteRecord = post_like
    .delete({ where: [`post_id=${v(postId)}`, `user_id=${v(userId)}`, "weight>0"] })
    .returning("1");
  // 成功删除则更新计数
  const updateCount = post
    .update({ like_count: "like_count - 1" })
    .where([`id=${v(postId)}`, `EXISTS (SELECT 1 FROM tmp)`]);
  const sql = `WITH tmp AS (${deleteRecord})\n${updateCount.toString()}`;

  return sql;
}
export async function cancelPostLike(postId: number, userId: number) {
  const sql = cancelPostLikeSql(postId, userId);
  return dbPool.queryCount(sql);
}
export async function reportPost(postId: number, userId: number, reason?: string) {
  const cancelLikeSql = cancelPostLikeSql(postId, userId);
  const reviewThreshold = 300;
  const insertRecord = post_like
    .insert("weight, post_id, user_id, reason", () => {
      return post
        .select([
          "-100 as weight", //todo 根据用户获取权重
          "id AS post_id",
          `${v(userId)} AS user_id`,
          `${reason ? v(reason) : "NULL"} AS reason`,
        ])
        .where([`id=${v(postId)}`, `(NOT is_delete)`])
        .toString();
    })
    .returning("1");

  const setReviewing = `(CASE 
  WHEN (is_review_pass IS NULL AND (dislike_count + 100) >=${v(reviewThreshold)}) THEN TRUE 
  ELSE is_reviewing
  END)`;

  // 成功插入更新计数
  const updateCount = post
    .update({
      dislike_count: "dislike_count + 100", //todo 根据用户获取权重
      is_reviewing: setReviewing,
    })
    .where([`id=${v(postId)}`, `EXISTS (SELECT 1 FROM tmp)`]);

  const sql = `WITH tmp AS (${insertRecord})\n${updateCount.toString()}`;

  const [cancel, insert] = await dbPool.multipleQuery([cancelLikeSql, sql].join(";\n"));

  return insert.rowCount;
}

export async function getUserDateCount(userId: number) {
  const { count } = await post
    .select<{ count: number }>({ count: "count(*)::INT" }, "p")
    .where([`user_id=${v(userId)}`, `DATE(p.create_time) = CURRENT_DATE`])
    .queryFirstRow();
  return count;
}

function toBit(bitLen: number, value: string | number) {
  if (typeof value === "number") {
    return new String(`${value}::BIT(${bitLen})`);
  }
  if (!/[01]+/.test(value)) throw new Error("非法输入Bit 类型");
  return new String(`B'${value}'`);
}

function checkContent(contentText: string, struct?: TextStructure[] | null) {
  const textLength = contentText.length;
  if (textLength > 5000) {
    throw new CheckTypeError("内容文本不能超过5000个字符");
  }
  const lastStruct = struct?.[struct.length - 1];
  // struct 应该是排序了的
  if (lastStruct && lastStruct.index + lastStruct.length > textLength) {
    throw new CheckTypeError("文本结构的索引和长度不正确");
  }
}
function checkCreateContent(param: CreatePostParam) {
  if (param.content_text) {
    checkContent(param.content_text, param.content_text_structure);
    if (!param.content_text_structure?.length) {
      param.content_text_structure = null; // 如果文本结构为空，则不需要文本结构
    }
  } else {
    param.content_text = null;
    param.content_text_structure = null;
    throw new HttpError(400, "content_text 不能为空"); // 文本和图片不能同时为空
  }
}
