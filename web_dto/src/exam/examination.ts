import type {
  ExaminationAnswerParam,
  ExaminationInfoResult,
  ExaminationQuestionResult,
  ExaminationRecordResult,
  ExaminationResultResult,
} from "./examination/examination.dto.ts";
export * from "./examination/examination.dto.ts";

export interface ExaminationAPI {
  /** 获取考试信息 */
  "GET /examination/:exam_id/info": {
    response: ExaminationInfoResult;
  };
  /** 开始作答下一题 */
  "POST /examination/:exam_id/next": {
    response: ExaminationQuestionResult;
  };
  /** 提交答案 */
  "POST /examination/:exam_id/answer": {
    body: ExaminationAnswerParam;
  };
  /** 交卷 */
  "POST /examination/:exam_id/submit": {};

  /** 查看作答记录 */
  "GET /examination/:exam_id/record": {
    response: ExaminationRecordResult;
  };

  /** 获取考试结果 */
  "GET /examination/:exam_id/result": {
    response: ExaminationResultResult;
  };
}
