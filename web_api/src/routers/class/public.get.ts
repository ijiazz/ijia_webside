import routeGroup from "./_route.ts";
import { PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { select } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/class/public",
  async handler() {
    const items = await dbPool.queryRows(
      select<ClassOption>({ class_id: "id", class_name: true, description: true })
        .from("public.class")
        .where(`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`),
    );

    return {
      items: items,
      total: items.length,
    };
  },
});

type ClassOption = { class_id: number; class_name: string; description?: string | null };
