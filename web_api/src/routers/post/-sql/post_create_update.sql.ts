import { TextStructure } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import { checkTypeCopy, CheckTypeError, optional } from "@asla/wokao";
import { textStructChecker } from "../-utils/text_struct.ts";
import { HttpError } from "@/global/errors.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { deleteFrom, update } from "@asla/yoursql";
import { CreatePostParam, UpdatePostConfigParam, UpdatePostContentParam } from "@/dto.ts";
import { QueryRowsResult } from "@asla/pg";
import { setPostToReviewing } from "@/routers/review/mod.ts";

export async function createPost(userId: number, param: CreatePostParam): Promise<{ id: number }> {
  param.content_text_structure = checkTypeCopy(param.content_text_structure, optional(textStructChecker));
  checkCreateContent(param); // 检查文本结构
  const { content_text, group_id, is_hide, media_file, content_text_structure } = param;

  if (media_file) throw new Error("暂不支持 media_file"); //TODO
  let optionBit = 0;

  if (param.is_anonymous) optionBit |= 0b1000_0000;
  if (param.comment_disabled) optionBit |= 0b0100_0000;
  await using t = dbPool.begin();

  const [insert] = await t.query<[QueryRowsResult<{ id: number; group_id: number | null }>, QueryRowsResult]>([
    insertIntoValues("public.post", {
      user_id: userId,
      content_text: content_text ? content_text : null,
      content_text_struct: content_text_structure ? new String(v(JSON.stringify(content_text_structure))) : null,
      group_id,
      publish_time: group_id === undefined ? "now()" : undefined,
      is_hide,
      options: toBit(8, optionBit),
    }).returning(["id", "group_id"]),
    update("user_profile")
      .set({ post_count: "post_count + 1" })
      .where(`user_id=${v(userId)}`),
  ]);
  const row = insert.rows[0];
  if (row.group_id !== null) {
    await t.queryCount(setPostToReviewing(row.id));
  }
  await t.commit();
  return { id: row.id };
}

export async function updatePostContent(
  postId: number,
  userId: number,
  param: Pick<UpdatePostContentParam, "content_text" | "content_text_structure">,
): Promise<number> {
  const struct = checkTypeCopy(param.content_text_structure, optional(textStructChecker, "nullish"));

  let update_content_text: string | undefined;
  let update_content_text_struct: string | undefined;
  if (param.content_text !== undefined) {
    // 需要更新文本内容

    if (param.content_text === null || param.content_text === "") {
      update_content_text_struct = "NULL";
    } else {
      try {
        checkContent(param.content_text, struct);
      } catch (error) {
        throw new HttpError(400, error instanceof Error ? error.message : "Unknown error");
      }
      update_content_text = v(param.content_text);
      update_content_text_struct = struct?.length ? v(JSON.stringify(struct)) : "NULL";
    }
  }
  await using t = dbPool.begin("REPEATABLE READ");

  const sql = update("public.post")
    .set({
      content_text: update_content_text,
      content_text_struct: update_content_text_struct,
      update_time: update_content_text === undefined ? undefined : "now()",
    })
    .where(`id = ${v(postId)} AND user_id = ${v(userId)} AND (NOT is_delete)`)
    .returning(["id", "group_id", "reviewing_id", "review_id"]);
  const [row] = await dbPool.queryRows<{
    id: number;
    group_id: number | null;
    reviewing_id: number | null;
    review_id: number | null;
  }>(sql);
  if (!row) return 0;
  if (row.group_id !== null || row.reviewing_id !== null) {
    await t.queryCount(setPostToReviewing(postId));
  } else if (row.review_id !== null) {
    await t.execute([
      update("public.post")
        .set({ review_id: "null" })
        .where(`id=${v(postId)}`),
      deleteFrom("review").where(`id=${v(row.review_id)}`),
    ]);
  }

  await t.commit();
  return 1;
}

export async function updatePostConfig(postId: number, userId: number, param: UpdatePostConfigParam): Promise<number> {
  const { comment_disabled, is_hide } = param;
  const updateContentSql = await dbPool.queryCount(
    update("public.post")
      .set({
        options: updatePostOption("options", { comment_disabled }), // 设置评论关闭
        is_hide: is_hide === undefined ? undefined : v(is_hide),
      })
      .where(() => {
        return [`user_id=${v(userId)}`, `id=${v(postId)}`, `(NOT is_delete)`];
      }),
  );
  return updateContentSql;
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
function updatePostOption(
  optionsField: string,
  params: Pick<UpdatePostConfigParam, "comment_disabled">,
): string | undefined {
  const bitLen = 8;
  // 最多32 个字段
  const bitOption = ["is_anonymous", "comment_disabled"];
  let expr = optionsField;
  for (let i = 0; i < bitOption.length; i++) {
    const key = bitOption[i] as keyof typeof params;
    if (params[key] === true) {
      // 置1：options | (1 << i)
      expr = `(${expr}::int | ${1 << (bitLen - 1 - i)})::bit(8)`;
    } else if (params[key] === false) {
      // 置0：options & ~(1 << i)
      expr = `(${expr}::int & ~${1 << (bitLen - 1 - i)})::bit(8)`;
    }
    // 未传则不变
  }
  if (expr === optionsField) {
    return undefined; // 没有更新
  }
  return expr;
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
