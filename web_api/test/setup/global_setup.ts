import { TestProject } from "vitest/node";

import { initPublicDB } from "./utils/db.ts";

export async function setup(project: TestProject) {
  try {
    await initPublicDB();
  } catch (error) {
    console.error("初始化公共数据库失败", error);
    throw error;
  }
}

export function teardown() {}
