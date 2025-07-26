import { Controller, Get, Use } from "@asla/hono-decorator";
import { autoBody } from "@/global/pipe.ts";
import { identity } from "@/global/auth.ts";
import { post_group } from "@ijia/data/db";
import { PostGroupItem, PostGroupResponse } from "./post.dto.ts";

@Use(identity)
@autoBody
@Controller({})
class PostGroupController {
  @Get("/post/group/list")
  async getGroupList(): Promise<PostGroupResponse> {
    const list = await post_group
      .select({ group_desc: "description", group_id: "id", group_name: "name" })
      .orderBy({ public_sort: true })
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
/* 

快来表白佳佳吧🥰，可以是想和她说的话、小作文。不要吝啬表达，你的碎碎念念她很愿意听
;
这里只能是和佳佳有关的内容哦！不要发布消极的内容！

网盘资源：

可以是各种网盘的外链如线下见面会的拍照。
网盘资源必须是和佳佳有关的内容。

如果网盘包含佳佳的短剧，应获得短剧授权，希望大家注意版权意识。

*/