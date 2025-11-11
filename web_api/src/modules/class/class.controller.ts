import { Get } from "@asla/hono-decorator";
import { dclass, PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { ListDto } from "../dto_common.ts";
import { autoBody } from "@/global/pipe.ts";
import { select } from "@asla/yoursql";
import { dbPool } from "@ijia/data/dbclient";

@autoBody
export class ClassController {
  @Get("/class/public")
  async getPublicClass(): Promise<ListDto<ClassOption>> {
    const items = await select<ClassOption>({ class_id: "id", class_name: true, description: true })
      .from(dclass.name)
      .where(`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`)
      .dataClient(dbPool)
      .queryRows();

    return {
      items: items,
      total: items.length,
    };
  }
}
type ClassOption = { class_id: number; class_name: string; description?: string | null };
export const classController = new ClassController();
