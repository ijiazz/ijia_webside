import type { ExamPublicQuestionStatsResult, GetUserQuestionResult } from "./question/question.ts";
import type {
  CreateQuestionParam,
  CreateQuestionResult,
  GetUserQuestionListParam,
  GetUserQuestionListResult,
  UpdateQuestionParam,
} from "./question/question.dto.ts";

export * from "./question/question.ts";
export * from "./question/question.dto.ts";

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
    response: GetUserQuestionResult;
  };
  /** 获取用户题目列表 */
  "GET /question/list_user": {
    query?: GetUserQuestionListParam;
    response: GetUserQuestionListResult;
  };
  "GET /question/public_stats": {
    response: ExamPublicQuestionStatsResult;
  };

  /** 审核获取题目详情，返回结果与用户获取题目详情相同 */
  "GET /question/review_get/:review_id": {
    params: { review_id: string };
    response: GetUserQuestionResult;
  };
}
