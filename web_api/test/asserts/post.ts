import { expect } from "vitest";
import { ReviewStatus } from "@ijia/data/db";
import { getCommentReviewStatus, getPostReviewStatus } from "#test/utils/post.ts";

expect.extend({
  async postReviewStatusIs(postId: number, status: ReviewStatus | null) {
    const info = await getPostReviewStatus(postId);
    if (info === null) {
      return {
        pass: false,
        message: () => `帖子 "${postId}" 不存在`,
      };
    }
    if (info.status === status) {
      const expectPass = REVIEW_PASSED[status!];
      return {
        pass: expectPass === info.is_review_pass,
        message: () => `预期 is_review_pass 为${expectPass}，但实际为 ${info.is_review_pass}`,
        actual: info.is_review_pass,
        expected: expectPass,
      };
    }

    const expectMsg = `预期帖子 "${postId}" 的审核状态为 ${status}`;

    return {
      pass: false,
      message: () => `${expectMsg}，但实际为 ${info.status}`,
      actual: info.status,
      expected: status,
    };
  },
  async postCommentReviewStatusIs(commentId: number, status: ReviewStatus | null) {
    const info = await getCommentReviewStatus(commentId);
    if (info === null) {
      return {
        pass: false,
        message: () => `评论 "${commentId}" 不存在`,
      };
    }

    if (info.status === status) {
      const expectPass = REVIEW_PASSED[status!];
      return {
        pass: expectPass === info.is_review_pass,
        message: () => `预期 is_review_pass 为${expectPass}，但实际为 ${info.is_review_pass}`,
        actual: info.is_review_pass,
        expected: expectPass,
      };
    }

    const expectMsg = `预期评论 "${commentId}" 的审核状态为 ${status}`;
    return {
      pass: false,
      message: () => `${expectMsg}，但实际为 ${info.status}`,
      actual: info.status,
      expected: status,
    };
  },
});
const REVIEW_PASSED = {
  [ReviewStatus.passed]: true,
  [ReviewStatus.rejected]: false,
  [ReviewStatus.pending]: null,
  null: null,
} as const;

interface PostMatchers<R = unknown> {
  postReviewStatusIs: (status: ReviewStatus | null) => Promise<Awaited<R>>;
  postCommentReviewStatusIs: (status: ReviewStatus | null) => Promise<Awaited<R>>;
}

declare module "vitest" {
  interface Assertion<T = any> extends PostMatchers<T> {}
  interface AsymmetricMatchersContaining extends PostMatchers {}
}
