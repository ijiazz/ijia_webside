import { TestProject } from "vitest/node";

import { createInitIjiaDb, PUBLIC_CONNECT_INFO } from "#test/utils/db.ts";

export async function setup(project: TestProject) {
  await createInitIjiaDb(PUBLIC_CONNECT_INFO.database);
}

export function teardown() {}
