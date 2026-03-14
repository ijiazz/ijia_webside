import type { ExamUserQuestion } from "./exam/question.dto.ts";
import type {
  CreateQuestionParam,
  CreateQuestionResult,
  GetUserQuestionListParam,
  GetUserQuestionListResult,
  UpdateQuestionParam,
} from "./exam/question.ts";
import type {
  QuestionCommitReviewParam,
  GetQuestionReviewNextResult,
  QuestionCommitReviewResult,
} from "./exam/review.dto.ts";

export * from "./exam/question.ts";
export * from "./exam/question.dto.ts";
export * from "./exam/review.dto.ts";

export interface QuestionAPI {
  /**
   * 创建题目
   */
  "PUT /question/entity": {
    body: CreateQuestionParam;
    response: CreateQuestionResult;
  };
  /** 删除题目 */
  "DELETE /question/entity/:question_id": {
    params: { question_id: string };
  };
  /** 更新题目 */
  "PATCH /question/entity/:question_id": {
    params: { question_id: string };
    body: UpdateQuestionParam;
  };
  /** 获取题目 */
  "GET /question/entity/:question_id": {
    params: { question_id: string };
    response: {
      item: ExamUserQuestion;
    };
  };
  /** 获取用户题目列表 */
  "GET /question/list_user": {
    query: GetUserQuestionListParam;
    response: GetUserQuestionListResult;
  };
  "GET /question/public_stats": {
    response: {
      reviewing_count: number;
      total_count: number;
    };
  };
}

export interface QuestionReviewAPI {
  "POST /question/review/entity/:review_id/commit": {
    params: { review_id: string };
    body: QuestionCommitReviewParam;
    response: QuestionCommitReviewResult;
  };
  /** 获取下一个待审核题目 */
  "GET /question/review/next": {
    response: GetQuestionReviewNextResult;
  };
}
