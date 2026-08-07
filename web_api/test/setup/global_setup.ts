import { TestProject } from "vitest/node";

import { initPublicDB } from "./utils/db.ts";

export async function setup(project: TestProject) {
  await initPublicDB();
}

export function teardown() {}
