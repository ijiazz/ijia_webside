import { expect, beforeEach } from "vitest";
import { test, Context } from "../fixtures/hono.ts";
import { dclass } from "@ijia/data/db";
import { applyController } from "@/hono-decorator/src/apply.ts";

import { classController } from "@/modules/class/class.controller.ts";

beforeEach<Context>(async ({ hono, hoFetch, ijiaDbPool }) => {
  applyController(hono, classController);
});

test("获取公共班级", async function ({ api }) {
  const created = await dclass
    .insert([
      { class_name: "1", is_public: true },
      { class_name: "2", is_public: true },
      { class_name: "3", is_public: false },
      { class_name: "4", is_public: null },
    ])
    .returning("*")
    .queryRows()
    .then((res) => res.map((item) => item.id));

  const classes = await api["/class/public"].get();
  expect(classes.total).toBe(2);
  expect(classes.items.map((item) => item.class_id)).toEqual(created.slice(0, 2));
});
