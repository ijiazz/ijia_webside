import { Get } from "@/hono-decorator/src/Router.ts";
import { dclass, PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { ListDto } from "../dto_common.ts";
import { autoBody } from "@/global/pipe.ts";

@autoBody
export class ClassController {
  @Get("/class/public")
  async getPublicClass(): Promise<ListDto<ClassOption>> {
    const items = await dclass
      .select<ClassOption>({ class_id: "id", class_name: true })
      .where(`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`)
      .queryRows();

    return {
      items: items,
      total: items.length,
    };
  }
}
type ClassOption = { class_id: number; class_name: string };
export const classController = new ClassController();
