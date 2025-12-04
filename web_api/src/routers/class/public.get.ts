import routeGroup from "./_route.ts";
import { dclass, PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { select } from "@asla/yoursql";
import { dbPool } from "@ijia/data/dbclient";

export default routeGroup.create({
  method: "GET",
  routePath: "/class/public",
  async handler() {
    const items = await select<ClassOption>({ class_id: "id", class_name: true, description: true })
      .from(dclass.name)
      .where(`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`)
      .dataClient(dbPool)
      .queryRows();

    return {
      items: items,
      total: items.length,
    };
  },
});

type ClassOption = { class_id: number; class_name: string; description?: string | null };
