import { dclass } from "@ijia/data/db";

class ClassController {
  async getPublicClass(): Promise<{ items: ClassOption[]; total: number }> {
    const items = await dclass
      .select<ClassOption>({ class_id: "id", class_name: "string" })
      .where("is_public = TRUE AND parent_class_id IS NULL")
      .queryRows();

    return {
      items: items,
      total: items.length,
    };
  }
}
type ClassOption = { class_id: number; class_name: string };
export const classController = new ClassController();
