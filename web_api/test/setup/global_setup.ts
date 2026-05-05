import { TestProject } from "vitest/node";

import { createInitIjiaDb } from "@ijia/data/testlib";
import { DB_CONNECT_INFO } from "#test/utils/db.ts";

const PUBLIC_DB_NAME = "test_ijia_public";
export async function setup(project: TestProject) {
  await createInitIjiaDb(DB_CONNECT_INFO, PUBLIC_DB_NAME, { dropIfExists: true, test: true });
}

export function teardown() {}
