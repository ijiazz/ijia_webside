import { expect } from "vitest";
import { dbPool } from "@/db/client.ts";

expect.extend({
  async questionHaveTheme(questionId: unknown, ...themes: string[]) {
    const expectDesc = `题目 "${questionId}" 包含主题 ${themes.join(", ")}`;
    if (!Number.isSafeInteger(questionId)) {
      return {
        pass: false,
        message: () => `${expectDesc}, 但提供的 questionId "${questionId}" 不是一个有效的题目 ID，应是一个安全的整数`,
      };
    }

    const res = await dbPool.queryRows<{ id: string }>(
      `SELECT qt.id FROM exam_question_theme_bind AS qt WHERE qt.question_id = ${questionId}`,
    );
    const themeIds = res.map((row) => row.id);
    const set = new Set(themeIds);
    const pass = themes.every((theme) => set.has(theme));
    return {
      pass,
      actual: themeIds.sort(),
      expected: themes.sort(),
      message: () => {
        if (pass) {
          return expectDesc;
        } else {
          const missingThemes = themes.filter((theme) => !set.has(theme));
          return `${expectDesc}，但缺少主题 ${missingThemes.join(", ")}`;
        }
      },
    };
  },
});

interface PostMatchers<R = unknown> {
  questionHaveTheme(...themes: string[]): Promise<Awaited<R>>;
}

declare module "vitest" {
  interface Assertion<T = any> extends PostMatchers<T> {}
  interface AsymmetricMatchersContaining extends PostMatchers {}
}
