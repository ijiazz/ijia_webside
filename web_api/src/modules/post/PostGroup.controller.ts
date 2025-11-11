import { Controller, Get, Use } from "@asla/hono-decorator";
import { autoBody } from "@/global/pipe.ts";
import { identity } from "@/global/auth.ts";
import { post_group } from "@ijia/data/db";
import { PostGroupItem, PostGroupResponse } from "./post.dto.ts";
import { select } from "@asla/yoursql";
import { dbPool } from "@ijia/data/dbclient";

@Use(identity)
@autoBody
@Controller({})
class PostGroupController {
  @Get("/post/group/list")
  async getGroupList(): Promise<PostGroupResponse> {
    const list = await select({ group_desc: "description", group_id: "id", group_name: "name" })
      .from(post_group.name)
      .orderBy("public_sort ASC")
      .dataClient(dbPool)
      .queryRows();
    for (const item of list) {
      const t = item as PostGroupItem;
      if (!t.group_desc) continue;
      const spy = t.group_desc.split(/\s*;\s*/);
      t.group_desc = spy[0];
      t.rule_desc = spy[1];
    }

    return { items: list as any, total: list.length };
  }
}
export const postGroupController = new PostGroupController();
