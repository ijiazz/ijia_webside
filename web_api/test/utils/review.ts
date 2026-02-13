import { Api, JWT_TOKEN_KEY } from "../fixtures/hono.ts";
import { CommitReviewParam, ReviewTargetType } from "@/dto.ts";

export async function getReviewNext(api: Api, config: { type: ReviewTargetType; token?: string }) {
  const { type, token } = config;
  return api["/review/next/:type"].get({
    params: {
      type: config.type,
    },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function commitReview(api: Api, config: CommitReviewParam & { type: ReviewTargetType; token?: string }) {
  const { type, token, ...param } = config;
  return api["/review/commit/:type"].post({
    params: {
      type: config.type,
    },
    body: param,
    [JWT_TOKEN_KEY]: token,
  });
}
