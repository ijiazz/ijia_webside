import type { ExamQuestionGlobalStat, ExamQuestionCreateParam, ExamQuestionUpdatesParam } from "./question/dto.ts";
export * from "./question/dto.ts";

export interface LiveApi {
  "GET /question/stat": {
    response: ExamQuestionGlobalStat;
  };
  "GET /question": {
    question:{

    }
  };
  /** 创建题目 */
  "PUT /question/entity": {};
  /** 用户移除题目 */
  "POST /question/entity/:questionId/remove": {};
  /** 更新题目 */
  "PATCH /question/entity/:questionId": {};
}
