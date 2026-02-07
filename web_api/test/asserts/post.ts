import { expect } from "vitest";
import { ReviewStatus } from "@ijia/data/db";
import { getPostReviewStatus } from "#test/utils/post.ts";
import { select, v } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";

expect.extend({
  async postReviewStatusIs(postId: number, status: ReviewStatus | null) {
    const info = await getPostReviewStatus(postId);

    if (status === null) {
      return {
        pass: info === null,
        message: () => `预期帖子 "${postId}" 不存在审核任务， 实际存在`,
        actual: info,
        expected: "不存在审核任务",
      };
    }

    const expectMsg = `预期帖子 "${postId}" 的审核状态为 ${status}`;
    if (!info) {
      const [post] = await dbPool.queryRows(
        select([`review_id`, "reviewing_id"])
          .from("post")
          .where(`id=${v(postId)}`),
      );
      return {
        pass: false,
        expected: status,
        message: () => `${expectMsg}，实际不存在审核任务`,
        actual: {
          ...post,
        },
      };
    }
    return {
      pass: info?.status === status,
      message: () => `${expectMsg}，但实际为 ${info.status}`,
      actual: info?.status,
      expected: status,
    };
  },
});

interface PostMatchers<R = unknown> {
  postReviewStatusIs: (status: ReviewStatus | null) => Promise<Awaited<R>>;
  postCommentReviewStatusIs: (status: ReviewStatus | null) => Promise<Awaited<R>>;
}

declare module "vitest" {
  interface Assertion<T = any> extends PostMatchers<T> {}
  interface AsymmetricMatchersContaining extends PostMatchers {}
}
