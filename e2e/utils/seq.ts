import { dbPool } from "@/db/client.ts";

export async function createSeqId() {
  await dbPool.execute(`CREATE SEQUENCE IF NOT EXISTS e2e_seq START 1 INCREMENT 1`);
}
export async function getSeqIntId(): Promise<number> {
  const { nextval } = await dbPool.queryFirstRow<{ nextval: number }>(`SELECT nextval('e2e_seq')::INT`);
  return nextval;
}
