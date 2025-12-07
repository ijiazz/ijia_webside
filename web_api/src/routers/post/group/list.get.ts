import { post_group } from "@ijia/data/db";
import { select } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";
import routeGroup from "../_route.ts";
import { PostGroupItem } from "@/dto/post.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/post/group/list",
  async validateInput(ctx) {},
  async handler() {
    const list = await dbPool.queryRows(
      select({ group_desc: "description", group_id: "id", group_name: "name" })
        .from(post_group.name)
        .orderBy("public_sort ASC"),
    );
    for (const item of list) {
      const t = item as PostGroupItem;
      if (!t.group_desc) continue;
      const spy = t.group_desc.split(/\s*;\s*/);
      t.group_desc = spy[0];
      t.rule_desc = spy[1];
    }

    return { items: list as any, total: list.length };
  },
});
