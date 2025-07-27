import { post, post_group } from "@ijia/data/db";
import { PostItemDto } from "../post.dto.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { getPostContentType } from "./sql_tool.ts";

export async function getReview(): Promise<PostItemDto | undefined> {
  const qSql = post
    .fromAs("p")
    .leftJoin(post_group, "g", "g.id=p.group_id")
    .select({
      post_id: "p.id",
      author: `NULL`,
      publish_time: "p.publish_time",
      create_time: "p.create_time",
      update_time: "CASE WHEN p.update_time=p.create_time THEN NULL ELSE p.update_time END",
      type: getPostContentType("p.content_type"),
      content_text: "p.content_text",
      content_text_structure: "p.content_text_struct",
      ip_location: "NULL",
      media: "null", //TODO
      group: jsonb_build_object({ group_id: "g.id", group_name: "g.name" }),
    })
    .where(() => {
      const where: string[] = [`NOT p.is_delete`, "p.is_reviewing"];
      return where;
    })
    .orderBy(["p.dislike_count", "p.create_time"])
    .limit(1);

  const items = await qSql.queryRows();

  return items[0] as PostItemDto | undefined;
}
