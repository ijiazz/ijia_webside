import { Controller, Get, Use } from "@asla/hono-decorator";
import { autoBody } from "@/global/pipe.ts";
import { rolesGuard } from "@/global/auth.ts";
import { post_group } from "@ijia/data/db";
import { PostGroupResponse } from "./post.dto.ts";

@Use(rolesGuard)
@autoBody
@Controller({})
class PostGroupController {
  @Get("/post/group/list")
  async getGroupList(): Promise<PostGroupResponse> {
    const list = await post_group
      .select({ group_desc: "description", group_id: "id", group_name: "name" })
      .orderBy({ public_sort: true })
      .queryRows();

    return { items: list as any, total: list.length };
  }
}
export const postGroupController = new PostGroupController();
