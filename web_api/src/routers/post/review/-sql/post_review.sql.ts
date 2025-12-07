import { post, post_comment, post_group, post_review_info } from "@ijia/data/db";
import { PostReviewType, PostReviewDto, PostReviewTarget, PostCommentReviewTarget } from "@/dto/post.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { getPostContentType } from "../../-sql/sql_tool.ts";
import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";

export function getReviewTarget(
  type: PostReviewType.post,
  targetId: number,
): Promise<PostReviewDto<PostReviewTarget> | undefined>;
export function getReviewTarget(
  type: PostReviewType.postComment,
  targetId: number,
): Promise<PostReviewDto<PostCommentReviewTarget> | undefined>;
export function getReviewTarget(
  type: PostReviewType,
  targetId: number,
): Promise<PostReviewDto<PostReviewTarget | PostCommentReviewTarget> | undefined>;
export function getReviewTarget(
  type: PostReviewType,
  targetId: number,
): Promise<PostReviewDto<PostReviewTarget | PostCommentReviewTarget> | undefined> {
  return getReview({ target: { type, targetId } });
}
export async function getReview(
  filter: {
    target?: { type: PostReviewType; targetId: number };
  } = {},
): Promise<PostReviewDto<PostReviewTarget | PostCommentReviewTarget> | undefined> {
  const { target } = filter;
  const reviewingOnly = !target;

  const data1 = await select({
    review_id: "re.type||'-'||re.target_id",
    review_type: "re.type",
    review_info: `CASE WHEN re.is_review_pass IS NULL 
        THEN NULL
        ELSE 
          ${jsonb_build_object({
            is_review_pass: "re.is_review_pass",
            reviewed_time: "re.reviewed_time",
            remark: "re.remark",
            reviewer_id: "re.reviewer_id",
          })}
      END`,
    target: `CASE re.type
        WHEN ${v(PostReviewType.post)} THEN
        ${select(
          jsonb_build_object({
            post_id: "p.id",
            publish_time: "p.publish_time",
            create_time: "p.create_time",
            update_time: "CASE WHEN p.update_time=p.create_time THEN NULL ELSE p.update_time END",
            type: getPostContentType("p.content_type"),
            content_text: "p.content_text",
            content_text_structure: "p.content_text_struct",
            media: "null", //TODO
            group: jsonb_build_object({ group_id: "g.id", group_name: "g.name" }),
          }),
        )
          .from(post.name, { as: "p" })
          .leftJoin(post_group.name, { as: "g", on: "g.id=p.group_id" })
          .where([`re.target_id=p.id`])
          .toSelect()}
        WHEN ${v(PostReviewType.postComment)} THEN
        ${select(
          jsonb_build_object({
            comment_id: "c.id",
            post_id: "c.post_id",
            create_time: "EXTRACT(epoch FROM c.create_time)",
            content_text: "c.content_text",
            content_text_structure: "c.content_text_struct",
            reply_count: "c.reply_count",
            root_comment_id: "c.root_comment_id",
            is_root_reply_count: "c.is_root_reply_count",
          }),
        )
          .from(post_comment.name, { as: "c" })
          .where([`re.target_id=c.id`])
          .toSelect()}
        ELSE NULL
      END`,
  })
    .from(post_review_info.name, { as: "re" })
    .where(() => {
      if (reviewingOnly) {
        return ["re.is_review_pass IS NULL"];
      } else {
        if (target) {
          return [`re.type = ${v(target.type)}`, `re.target_id = ${v(target.targetId)}`];
        } else {
          return "FALSE";
        }
      }
    })
    .orderBy(["re.create_time ASC"])
    .limit(1);
  const data = await dbPool.queryRows(data1);

  return data[0] as PostReviewDto<any> | undefined;
}

export async function commitReview(
  reviewType: PostReviewType,
  targetId: number,
  isPass: boolean,
  reviewerId?: number,
  remark?: string,
): Promise<number> {
  let count: number;
  if (reviewType === PostReviewType.post) {
    const res = await dbPool.queryFirstRow(
      `SELECT post_commit_review_post(${v(targetId)}, ${v(isPass)}, ${v(reviewerId || null)}, ${v(remark || null)}) AS count`,
    ); // check exist
    count = res.count;
  } else {
    const res = await dbPool.queryFirstRow(
      `SELECT post_commit_review_comment(${v(targetId)}, ${v(isPass)}, ${v(reviewerId || null)}, ${v(remark || null)}) AS count`,
    ); // check exist
    count = res.count;
  }

  return count;
}
