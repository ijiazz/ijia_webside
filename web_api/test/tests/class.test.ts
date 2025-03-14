import { expect, beforeEach } from "vitest";
import { test, Context } from "../fixtures/hono.ts";
import { dclass, PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { applyController } from "@/hono-decorator/src/apply.ts";

import { classController } from "@/modules/class/class.controller.ts";

beforeEach<Context>(async ({ hono, hoFetch, ijiaDbPool }) => {
  applyController(hono, classController);
});

test("获取公共班级", async function ({ api }) {
  const created = await dclass
    .insert([
      { class_name: "1", parent_class_id: PUBLIC_CLASS_ROOT_ID },
      { class_name: "2", parent_class_id: PUBLIC_CLASS_ROOT_ID },
      { class_name: "3", parent_class_id: null },
      { class_name: "4", parent_class_id: null },
    ])
    .onConflict("id")
    .doNotThing()
    .returning("*")
    .queryRows()
    .then((res) => res.map((item) => item.id));

  const classes = await api["/class/public"].get();
  expect(classes.total).toBe(2);
  expect(classes.items.map((item) => item.class_id)).toEqual(created.slice(0, 2));
});
