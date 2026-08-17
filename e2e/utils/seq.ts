import { dbPool } from "@/db/client.ts";

export async function getSeqIntId(): Promise<number> {
  const { nextval } = await dbPool.queryFirstRow<{ nextval: number }>(`SELECT nextval('e2e_seq')::INT`);
  return nextval;
}
